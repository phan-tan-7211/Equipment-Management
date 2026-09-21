import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumePendingGoogleInvitationClaim,
  startPendingGoogleInvitationClaim,
} from './pendingGoogleInvitationClaim';

describe('pendingGoogleInvitationClaim', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('consumes a matching invitation marker only once', () => {
    startPendingGoogleInvitationClaim('invite-token');

    expect(consumePendingGoogleInvitationClaim('invite-token')).toBe(true);
    expect(consumePendingGoogleInvitationClaim('invite-token')).toBe(false);
  });

  it('does not consume a marker for a different invitation', () => {
    startPendingGoogleInvitationClaim('invite-a');

    expect(consumePendingGoogleInvitationClaim('invite-b')).toBe(false);
    expect(consumePendingGoogleInvitationClaim('invite-a')).toBe(true);
  });

  it('rejects an expired marker', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T00:00:00Z'));
    startPendingGoogleInvitationClaim('invite-token');
    vi.setSystemTime(new Date('2026-09-21T00:16:00Z'));

    expect(consumePendingGoogleInvitationClaim('invite-token')).toBe(false);
  });
});
