const STORAGE_KEY = 'pendingGoogleInvitationClaim';
const MAX_AGE_MS = 15 * 60 * 1000;

interface PendingGoogleInvitationClaim {
  token: string;
  startedAt: number;
}

export function startPendingGoogleInvitationClaim(token: string): void {
  const claim: PendingGoogleInvitationClaim = {
    token,
    startedAt: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(claim));
  } catch {
    // OAuth can still proceed; the user can claim manually after returning.
  }
}

export function clearPendingGoogleInvitationClaim(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in hardened browser contexts.
  }
}

export function consumePendingGoogleInvitationClaim(token: string): boolean {
  try {
    const rawClaim = sessionStorage.getItem(STORAGE_KEY);
    if (!rawClaim) return false;

    const claim = JSON.parse(rawClaim) as Partial<PendingGoogleInvitationClaim>;
    const age = Date.now() - Number(claim.startedAt);

    if (claim.token !== token) {
      sessionStorage.removeItem(STORAGE_KEY);
      return false;
    }

    sessionStorage.removeItem(STORAGE_KEY);
    return Number.isFinite(age) && age >= 0 && age <= MAX_AGE_MS;
  } catch {
    clearPendingGoogleInvitationClaim();
    return false;
  }
}
