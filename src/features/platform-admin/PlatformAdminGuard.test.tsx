import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformAdminGuard } from './PlatformAdminGuard';
import { usePlatformAdminAccess } from './usePlatformAdminAccess';

vi.mock('./usePlatformAdminAccess', () => ({
  usePlatformAdminAccess: vi.fn(),
}));

function renderGuard() {
  render(
    <MemoryRouter initialEntries={['/platform-admin']}>
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard destination</div>} />
        <Route
          path="/platform-admin"
          element={
            <PlatformAdminGuard>
              <div>Platform tools</div>
            </PlatformAdminGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PlatformAdminGuard', () => {
  beforeEach(() => {
    vi.mocked(usePlatformAdminAccess).mockReset();
  });

  it('renders the protected UI for an active Platform Admin', () => {
    vi.mocked(usePlatformAdminAccess).mockReturnValue({
      isPlatformAdmin: true,
      isLoading: false,
      error: null,
    });
    renderGuard();
    expect(screen.getByText('Platform tools')).toBeInTheDocument();
  });

  it('redirects a non-Platform Admin to the dashboard', () => {
    vi.mocked(usePlatformAdminAccess).mockReturnValue({
      isPlatformAdmin: false,
      isLoading: false,
      error: null,
    });
    renderGuard();
    expect(screen.getByText('Dashboard destination')).toBeInTheDocument();
    expect(screen.queryByText('Platform tools')).not.toBeInTheDocument();
  });
});
