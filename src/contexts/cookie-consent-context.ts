import { createContext } from 'react';

import type { CookieConsentDecision } from '@/lib/cookieConsent';

export interface CookieConsentContextValue {
  decision: CookieConsentDecision | null;
  needsConsent: boolean;
  canUsePreferences: boolean;
  accept: () => void;
  reject: () => void;
}

/**
 * Kept in its own module (no components, no i18n/toast imports) so the context
 * identity survives Vite HMR. `CookieConsentContext.tsx` exports both a
 * provider and hooks, so Fast Refresh re-executes it on every edit to it or its
 * deps; creating the context there minted a new object each time, leaving the
 * hot-swapped `CookieConsentBanner` reading a context the mounted provider did
 * not supply ("useCookieConsent must be used within CookieConsentProvider").
 */
export const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(
  undefined,
);
