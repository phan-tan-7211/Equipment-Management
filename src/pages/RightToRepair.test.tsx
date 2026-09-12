import { describe, expect, it, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@vitest-harness/utils/test-utils';
import { RightToRepair } from './RightToRepair';
import { I18nProvider } from '@/i18n/I18nProvider';

vi.mock('react-router-dom', async () => {
  const { createReactRouterDomTestMock } = await import(
    '@vitest-harness/utils/react-router-dom-test-mock'
  );
  return createReactRouterDomTestMock();
});

vi.mock('@/components/landing/LandingHeader', () => ({
  default: () => <div data-testid="landing-header">Landing Header</div>,
}));

vi.mock('@/components/layout/LegalFooter', () => ({
  default: () => <div data-testid="legal-footer">Legal Footer</div>,
}));

describe('RightToRepair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['vi', 'Quyền sửa chữa', 'Bạn có thể mang theo hồ sơ của mình'],
    ['ko', '수리할 권리', '기록을 가져갈 수 있습니다'],
  ])('renders the product message in %s while preserving the reviewed legal text', (language, heading, commitment) => {
    window.localStorage.setItem('znteqr-language', language);
    try {
      render(<I18nProvider><RightToRepair /></I18nProvider>);
      expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(commitment)).toBeInTheDocument();
      expect(screen.getByText(/this page is a statement of principles/i)).toBeInTheDocument();
    } finally {
      window.localStorage.removeItem('znteqr-language');
    }
  });

  it('states the public stance and that the page is not a contract', () => {
    render(<RightToRepair />);

    expect(screen.getByRole('heading', { name: 'Right to Repair', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByText(/we will not hold your data hostage/i)).toBeInTheDocument();
    expect(screen.getByText(/this page is a statement of principles/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms-of-service',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy-policy',
    );
  });

  it('renders the three EquipQR commitments', () => {
    render(<RightToRepair />);

    expect(screen.getByText('Your records leave with you')).toBeInTheDocument();
    expect(screen.getByText('We will not hold data hostage')).toBeInTheDocument();
    expect(screen.getByText('We do not lock the machines you service')).toBeInTheDocument();
  });

  it('filters the case atlas and opens a case sheet', async () => {
    const user = userEvent.setup({ delay: null });
    render(<RightToRepair />);

    await user.click(screen.getByRole('radio', { name: 'Agriculture and fleet' }));

    expect(screen.getByText('Farm equipment diagnostic lockout')).toBeInTheDocument();
    expect(screen.queryByText('Insteon cloud outage')).not.toBeInTheDocument();
    expect(screen.getByText('1 case')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Read the case' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Farm equipment diagnostic lockout' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /ftc, nixing the fix/i })).toHaveAttribute(
      'href',
      'https://www.ftc.gov/reports/nixing-fix',
    );
  });
});
