import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customRender } from '@vitest-harness/utils/renderUtils';
import WorkspaceOnboardingGuard from '@/components/auth/WorkspaceOnboardingGuard';

const mockOnboardingState = vi.hoisted(() => vi.fn());
const mockQueryState = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
}));
const mockOrganizationState = vi.hoisted(() => ({
  organizations: [] as Array<{ id: string }>,
  isLoading: false,
  error: null as string | null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'blocked@claimed.test',
      app_metadata: { provider: 'google', providers: ['google'] },
    },
  }),
}));

vi.mock('@/hooks/useWorkspaceOnboarding', () => ({
  useWorkspaceOnboardingState: () => ({
    data: mockOnboardingState(),
    isLoading: mockQueryState.isLoading,
    isError: mockQueryState.isError,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: () => mockOrganizationState,
}));

describe('WorkspaceOnboardingGuard', () => {
  beforeEach(() => {
    mockOnboardingState.mockReset();
    mockQueryState.isLoading = false;
    mockQueryState.isError = false;
    mockOrganizationState.organizations = [];
    mockOrganizationState.isLoading = false;
    mockOrganizationState.error = null;
  });

  it('blocks unclaimed-domain Google users without organization membership', () => {
    mockOnboardingState.mockReturnValue({
      domain_status: 'unclaimed',
      domain: 'example.com',
      has_workspace_membership: false,
      has_pending_invitation: false,
      has_pending_claim: false,
    });

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Workspace access required')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('blocks consumer Google users without organization membership', () => {
    mockOnboardingState.mockReturnValue({
      domain_status: 'unclaimed',
      domain: 'gmail.com',
      has_workspace_membership: false,
      has_pending_invitation: false,
      has_pending_claim: false,
    });

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Workspace access required')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('blocks claimed-domain users without authorization', () => {
    mockOnboardingState.mockReturnValue({
      domain_status: 'claimed',
      domain: 'claimed.test',
      has_workspace_membership: false,
      has_pending_invitation: false,
      has_pending_claim: false,
    });

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Workspace access required')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('blocks dashboard access when onboarding state query fails', () => {
    mockQueryState.isError = true;
    mockOnboardingState.mockReturnValue(undefined);

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Unable to verify workspace access')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders children when the linked Supabase user has an active organization membership', () => {
    mockOrganizationState.organizations = [{ id: 'existing-org' }];
    mockOnboardingState.mockReturnValue({
      domain_status: 'unclaimed',
      domain: 'example.com',
      has_workspace_membership: false,
      has_other_organization_membership: false,
      has_pending_invitation: false,
      has_pending_claim: false,
    });

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('shows pending state for claimed-domain users with pending claim', () => {
    mockOnboardingState.mockReturnValue({
      domain_status: 'claimed',
      domain: 'claimed.test',
      has_workspace_membership: false,
      has_pending_invitation: false,
      has_pending_claim: true,
    });

    customRender(
      <WorkspaceOnboardingGuard>
        <div>Dashboard content</div>
      </WorkspaceOnboardingGuard>,
    );

    expect(screen.getByText('Workspace access pending')).toBeInTheDocument();
  });
});
