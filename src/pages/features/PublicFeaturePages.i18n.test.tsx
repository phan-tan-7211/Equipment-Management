import { afterEach, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@vitest-harness/utils/TestProviders';
import { I18nProvider } from '@/i18n';
import GoogleWorkspace from './GoogleWorkspace';

afterEach(() => window.localStorage.removeItem('znteqr-language'));

it('shows the translated hero, navigation and FAQ on a feature page', () => {
  window.localStorage.setItem('znteqr-language', 'vi');
  render(
    <TestProviders>
      <I18nProvider><GoogleWorkspace /></I18nProvider>
    </TestProviders>,
  );

  expect(screen.getByRole('heading', { level: 1, name: 'Đăng nhập SSO và đồng bộ danh bạ Google Workspace cho EquipQR' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Câu hỏi thường gặp' })).toBeInTheDocument();
  expect(screen.getByText('Đồng bộ danh bạ Google')).toBeInTheDocument();
});
