import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamPermissionSettings } from './TeamPermissionSettings';

const rpc = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({ language: 'en' }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const defaults = [
  { team_role: 'manager', permission_key: 'equipment.create', allowed: true, is_default: true },
  { team_role: 'manager', permission_key: 'equipment.update', allowed: true, is_default: true },
  { team_role: 'technician', permission_key: 'equipment.create', allowed: true, is_default: true },
  { team_role: 'technician', permission_key: 'equipment.update', allowed: false, is_default: false },
  { team_role: 'requestor', permission_key: 'equipment.create', allowed: false, is_default: true },
  { team_role: 'requestor', permission_key: 'equipment.update', allowed: false, is_default: true },
  { team_role: 'viewer', permission_key: 'equipment.create', allowed: false, is_default: true },
  { team_role: 'viewer', permission_key: 'equipment.update', allowed: false, is_default: true },
];

function renderSettings(canEdit: boolean) {
  rpc.mockImplementation((name: string) =>
    Promise.resolve(name === 'get_team_permission_settings' ? { data: defaults, error: null } : { data: null, error: null }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TeamPermissionSettings organizationId="org-1" canEdit={canEdit} />
    </QueryClientProvider>,
  );
}

describe('TeamPermissionSettings', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('shows the effective settings and marks changed values', async () => {
    renderSettings(true);

    const managerCreate = await screen.findByRole('checkbox', { name: 'Manager: Create equipment' });
    expect(managerCreate).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Technician: Update equipment' })).not.toBeChecked();
    expect(screen.getAllByText('Changed')).toHaveLength(1);
  });

  it('lets the owner grant a permission to a team role', async () => {
    renderSettings(true);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Requestor: Update equipment' }));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('set_team_permission_override', {
        p_organization_id: 'org-1',
        p_team_role: 'requestor',
        p_permission_key: 'equipment.update',
        p_allowed: true,
      }),
    );
  });

  it('restores defaults for every changed value', async () => {
    renderSettings(true);

    fireEvent.click(await screen.findByRole('button', { name: /Restore defaults/ }));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('set_team_permission_override', {
        p_organization_id: 'org-1',
        p_team_role: 'technician',
        p_permission_key: 'equipment.update',
        p_allowed: null,
      }),
    );
  });

  it('is read-only for admins', async () => {
    renderSettings(false);

    expect(await screen.findByRole('checkbox', { name: 'Manager: Create equipment' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Restore defaults/ })).not.toBeInTheDocument();
    expect(screen.getByText('Only the organization owner can change these settings.')).toBeInTheDocument();
  });
});
