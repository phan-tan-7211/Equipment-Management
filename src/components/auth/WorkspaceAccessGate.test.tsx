import React from 'react';
import { render, screen } from '@vitest-harness/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceAccessGate from '@/components/auth/WorkspaceAccessGate';

const signOutMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: signOutMock }),
}));

describe('WorkspaceAccessGate', () => {
  it('shows a retryable resubmission failure without clearing the rejection', () => {
    render(<WorkspaceAccessGate mode="rejected" domain={null} resubmitFailed onResubmit={vi.fn()} />);
    expect(screen.getByText('Could not resubmit your request. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resubmit request/i })).toBeEnabled();
  });
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it('calls signOut when the user chooses Sign out', async () => {
    const user = userEvent.setup();

    render(<WorkspaceAccessGate mode="blocked" domain="claimed.test" />);

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('does not offer self-service organization provisioning', () => {
    render(<WorkspaceAccessGate mode="blocked" domain={null} />);

    expect(screen.getByText('This authenticated account is not authorized for an organization.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create organization|create workspace|become owner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create organization|create workspace|become owner/i })).not.toBeInTheDocument();
  });

  it('shows rejection details and resubmits only when the user chooses to', async () => {
    const user = userEvent.setup();
    const onResubmit = vi.fn();

    render(
      <WorkspaceAccessGate
        mode="rejected"
        domain={null}
        rejectionReason="Organization could not be verified"
        reviewedByName="Platform Reviewer"
        reviewedAt="2026-09-28T08:00:00.000Z"
        onResubmit={onResubmit}
      />,
    );

    expect(screen.getByText('Workspace access request rejected')).toBeInTheDocument();
    expect(screen.getByText(/Organization could not be verified/)).toBeInTheDocument();
    expect(screen.getByText(/Platform Reviewer/)).toBeInTheDocument();
    expect(onResubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /resubmit request/i }));
    expect(onResubmit).toHaveBeenCalledTimes(1);
  });
});
