import { afterEach, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@vitest-harness/utils/TestProviders';
import { I18nProvider } from '@/i18n';
import PMTemplates from './PMTemplates';
import TeamCollaboration from './TeamCollaboration';

afterEach(() => window.localStorage.removeItem('znteqr-language'));

it('shows Vietnamese PM templates and counts in the additional section', () => {
  window.localStorage.setItem('znteqr-language', 'vi');
  render(<TestProviders><I18nProvider><PMTemplates /></I18nProvider></TestProviders>);

  expect(screen.getByRole('heading', { name: 'Mẫu có sẵn' })).toBeInTheDocument();
  expect(screen.getByText('Bảo dưỡng xe nâng')).toBeInTheDocument();
  expect(screen.getByText(/Bảo dưỡng xe nâng có 103 mục trong 12 nhóm/)).toBeInTheDocument();
});

it('shows Korean team roles in the additional section', () => {
  window.localStorage.setItem('znteqr-language', 'ko');
  render(<TestProviders><I18nProvider><TeamCollaboration /></I18nProvider></TestProviders>);

  expect(screen.getByRole('heading', { name: '역할과 권한' })).toBeInTheDocument();
  expect(screen.getByText('소유자')).toBeInTheDocument();
  expect(screen.getByText('조회자')).toBeInTheDocument();
});
