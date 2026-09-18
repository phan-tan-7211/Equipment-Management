import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SmartLanding from './SmartLanding';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/pages/Landing', () => ({
  __esModule: true,
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

describe('SmartLanding', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseAuth.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('redirects authenticated users to dashboard', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      isLoading: false,
    });

    render(<SmartLanding />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('honors pendingRedirect for authenticated users (#1322)', async () => {
    const pending = '/qr/equipment/abc-123?qr=true';
    sessionStorage.setItem('pendingRedirect', pending);

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      isLoading: false,
    });

    render(<SmartLanding />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(pending, { replace: true });
    });
  });

  it('shows landing page for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<SmartLanding />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders the landing page while auth is loading for a true fresh visitor (#671)', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(<SmartLanding />);

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading instead of marketing content while a persisted auth session resolves', () => {
    localStorage.setItem('sb-test-auth-token', '{"access_token":"cached"}');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(<SmartLanding />);

    expect(screen.getByRole('status', { name: /loading page/i })).toBeInTheDocument();
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

