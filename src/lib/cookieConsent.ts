/**
 * First-visit cookie / browser-storage consent helpers.
 *
 * Strictly necessary storage (always allowed):
 * - This consent decision (`CEV.PhanTan:cookie-consent`)
 * - Supabase Auth session tokens (SDK-managed)
 * - `pendingRedirect` / scan-feedback sessionStorage (auth & QR flows)
 * - Offline mutation queue (`CEVPhanTan_offline_queue_*`)
 * - Pending terms-acceptance markers (`CEVPhanTan_pending_terms_acceptance:*`)
 * - Active organization hints (`CEVPhanTan_current_organization`, `CEVPhanTan_current_org`)
 * - Sanitized session cache (`CEVPhanTan_session_data` â€” no street/coords; name allowed)
 * - Admin grant throttle keys (`CEVPhanTan_admin_grants_*`)
 * - In-progress editor draft backups (`pm-checklist-*`, `pm-template-editor-*`)
 *
 * Preference / optional storage (Accept only; cleared on Reject):
 * - `sidebar:state` cookie and UI preference localStorage keys listed below
 *
 * Third-party widgets (hCaptcha, Google Maps) stay available without Accept â€”
 * they are required for bot protection and map surfaces, not advertising.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'CEV.PhanTan:cookie-consent';
export const COOKIE_CONSENT_CHANGED_EVENT = 'CEV.PhanTan:cookie-consent-changed';
export const SIDEBAR_COOKIE_NAME = 'sidebar:state';

export type CookieConsentDecision = 'accepted' | 'rejected';

const OPTIONAL_LOCAL_STORAGE_EXACT = new Set([
  'CEV.PhanTan:equipment-view-mode',
  'CEV.PhanTan:work-orders-view-mode',
  'CEV.PhanTan:alternate-groups-table-column-sizing',
  'CEV.PhanTan:equipment-table-column-sizing:v2',
  'CEV.PhanTan-user-settings',
  'audit-dashboard-grid-v1',
]);

const OPTIONAL_LOCAL_STORAGE_PREFIXES = [
  'CEV.PhanTan:selectedTeamId:',
  'CEV.PhanTan:equipment-table-columns:',
  'CEV.PhanTan:inventory-table-preferences:',
  'CEV.PhanTan-operator-checkin-starter-catalog-expanded:',
  'CEVPhanTan_dashboard_layout_',
  'eqr_work_timer_',
  'CEVPhanTan_export_columns_',
] as const;

export function isCookieConsentDecision(value: unknown): value is CookieConsentDecision {
  return value === 'accepted' || value === 'rejected';
}

/** Prefer globalThis so Vitest node + jsdom harnesses both work. */
function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getCookieConsentDecision(): CookieConsentDecision | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return isCookieConsentDecision(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** @returns true when the decision was persisted successfully. */
export function setCookieConsentDecision(decision: CookieConsentDecision): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision);
    return storage.getItem(COOKIE_CONSENT_STORAGE_KEY) === decision;
  } catch {
    return false;
  }
}

/** Preference cookies / localStorage may be written only after explicit Accept. */
export function isPreferenceStorageAllowed(): boolean {
  return getCookieConsentDecision() === 'accepted';
}

export function getPreferenceLocalStorage(key: string): string | null {
  if (!isPreferenceStorageAllowed()) return null;
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function setPreferenceLocalStorage(key: string, value: string): boolean {
  const storage = getLocalStorage();
  if (!storage || !isPreferenceStorageAllowed()) return false;
  // Only known optional keys may be written â€” keeps Reject cleanup complete.
  if (!isOptionalLocalStorageKey(key)) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    // Quota / privacy mode â€” callers treat false as best-effort failure.
    return false;
  }
}

/** Removes an optional preference key only after Accept (Reject uses clearOptional). */
export function removePreferenceLocalStorage(key: string): void {
  if (!isPreferenceStorageAllowed()) return;
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

function preferenceCookieFlags(): string {
  const secure =
    typeof globalThis.location !== 'undefined' && globalThis.location.protocol === 'https:'
      ? '; Secure'
      : '';
  return `; SameSite=Lax${secure}`;
}

export function setPreferenceCookie(name: string, value: string, maxAgeSeconds: number): boolean {
  if (typeof document === 'undefined' || !isPreferenceStorageAllowed()) return false;
  if (name !== SIDEBAR_COOKIE_NAME) return false;
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}${preferenceCookieFlags()}`;
    return true;
  } catch {
    return false;
  }
}

function clearSidebarPreferenceCookie(): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=; path=/; max-age=0${preferenceCookieFlags()}`;
  } catch {
    // ignore
  }
}

function isOptionalLocalStorageKey(key: string): boolean {
  if (key === COOKIE_CONSENT_STORAGE_KEY) return false;
  if (OPTIONAL_LOCAL_STORAGE_EXACT.has(key)) return true;
  return OPTIONAL_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Remove product-controlled preference storage after Reject. */
export function clearOptionalPreferenceStorage(): void {
  const storage = getLocalStorage();
  if (!storage) return;

  clearSidebarPreferenceCookie();

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && isOptionalLocalStorageKey(key)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Persist Accept/Reject. On Reject, clears optional preference storage only after
 * the decision write succeeds.
 * @returns true when the decision was stored.
 */
export function applyCookieConsentDecision(decision: CookieConsentDecision): boolean {
  const persisted = setCookieConsentDecision(decision);
  if (!persisted) return false;
  if (decision === 'rejected') {
    clearOptionalPreferenceStorage();
  }
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { decision } }),
      );
    }
  } catch {
    // ignore â€” preference rehydrate listeners are best-effort
  }
  return true;
}

