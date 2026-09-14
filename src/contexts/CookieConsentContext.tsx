import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  applyCookieConsentDecision,
  getCookieConsentDecision,
  isCookieConsentDecision,
  isPreferenceStorageAllowed,
  type CookieConsentDecision,
} from '@/lib/cookieConsent';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

interface CookieConsentContextValue {
  decision: CookieConsentDecision | null;
  needsConsent: boolean;
  canUsePreferences: boolean;
  accept: () => void;
  reject: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const [decision, setDecision] = useState<CookieConsentDecision | null>(() =>
    getCookieConsentDecision(),
  );

  useEffect(() => {
    const syncFromStorage = () => {
      setDecision(getCookieConsentDecision());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== COOKIE_CONSENT_STORAGE_KEY) return;
      const next = event.newValue;
      setDecision(isCookieConsentDecision(next) ? next : getCookieConsentDecision());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  const accept = useCallback(() => {
    if (!applyCookieConsentDecision('accepted')) {
      toast.error(copy.cookiePreferenceSaveFailed);
      return;
    }
    setDecision('accepted');
  }, [copy.cookiePreferenceSaveFailed]);

  const reject = useCallback(() => {
    if (!applyCookieConsentDecision('rejected')) {
      toast.error(copy.cookiePreferenceSaveFailed);
      return;
    }
    setDecision('rejected');
  }, [copy.cookiePreferenceSaveFailed]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      decision,
      needsConsent: decision === null,
      canUsePreferences: decision === 'accepted',
      accept,
      reject,
    }),
    [accept, decision, reject],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
};

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

export function useWhenPreferenceStorageAllowed(onAllowed: () => void): void {
  const ctx = useContext(CookieConsentContext);
  const allowed = ctx?.canUsePreferences ?? isPreferenceStorageAllowed();
  const prevAllowed = useRef(allowed);
  const onAllowedRef = useRef(onAllowed);
  onAllowedRef.current = onAllowed;

  useEffect(() => {
    if (!prevAllowed.current && allowed) {
      onAllowedRef.current();
    }
    prevAllowed.current = allowed;
  }, [allowed]);

  useEffect(() => {
    if (ctx) return;
    const onChange = () => {
      const next = isPreferenceStorageAllowed();
      if (!prevAllowed.current && next) {
        onAllowedRef.current();
      }
      prevAllowed.current = next;
    };
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  }, [ctx]);
}
