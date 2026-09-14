import type { Language } from '@/i18n/I18nProvider';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

const STORAGE_KEY = 'znteqr-language';

export function resolveRuntimeLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'vi' || saved === 'en' || saved === 'ko') return saved;
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith('vi')) return 'vi';
  if (browserLanguage.startsWith('ko')) return 'ko';
  return 'en';
}

export function getRuntimeFinalHardcodedAuditCopy() {
  return getFinalHardcodedAuditCopy(resolveRuntimeLanguage());
}
