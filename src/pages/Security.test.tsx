import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@vitest-harness/utils/test-utils';
import { I18nProvider } from '@/i18n/I18nProvider';
import Security from './Security';

vi.mock('@/components/layout/PageBackButton', () => ({
  PageBackButton: () => <button type="button">Back</button>,
}));

describe('Security page translation', () => {
  it.each([
    ['vi', 'Bảo mật', 'Xác thực và kiểm soát truy cập'],
    ['ko', '보안', '인증 및 접근 제어'],
  ])('renders security content in %s while retaining the disclosure address', (language, heading, section) => {
    window.localStorage.setItem('znteqr-language', language);
    try {
      render(<I18nProvider><Security /></I18nProvider>);
      expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(section)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'security@equipqr.app' })).toHaveAttribute(
        'href', 'mailto:security@equipqr.app',
      );
    } finally {
      window.localStorage.removeItem('znteqr-language');
    }
  });
});
