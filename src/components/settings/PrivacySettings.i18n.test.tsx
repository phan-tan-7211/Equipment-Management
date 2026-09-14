import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@vitest-harness/utils/test-utils';
import { I18nProvider } from '@/i18n';
import { EmailPrivacySettings } from './EmailPrivacySettings';
import { SensitivePrivacySettings } from './SensitivePrivacySettings';

const update = vi.fn();
const eq = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update: (...args: unknown[]) => update(...args) }) },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('privacy settings translations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
  });

  it('uses Vietnamese labels while persisting the original email_private field', async () => {
    window.localStorage.setItem('znteqr-language', 'vi');
    render(<I18nProvider><EmailPrivacySettings /></I18nProvider>);

    fireEvent.click(screen.getByRole('switch', { name: 'Ẩn email với thành viên trong tổ chức' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({ email_private: true });
      expect(eq).toHaveBeenCalledWith('id', 'user-1');
    });
  });

  it('uses Korean labels while persisting the original limit_sensitive_pi field', async () => {
    window.localStorage.setItem('znteqr-language', 'ko');
    render(<I18nProvider><SensitivePrivacySettings /></I18nProvider>);

    fireEvent.click(screen.getByRole('switch', { name: '내 스캔에서 GPS 수집 끄기' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({ limit_sensitive_pi: true });
      expect(eq).toHaveBeenCalledWith('id', 'user-1');
    });
  });
});
