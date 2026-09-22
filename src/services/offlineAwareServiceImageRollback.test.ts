/**
 * P2-02 regression coverage: stageQueueImageRefs() → enqueue() failure window.
 *
 * If staging succeeds but the subsequent OfflineQueueService.enqueue() call
 * throws, the blobs just staged in IndexedDB had no queue item to ever
 * reference them, so normal queue lifecycle cleanup could never reach them —
 * an orphaned blob. offlineAwareService.ts now rolls back exactly the blobs
 * staged by the failed attempt.
 *
 * idb-keyval is mocked (as in offlineBlobStore.test.ts) so the real
 * stageQueueImageRefs / deleteOfflineImageRefs code paths run end to end;
 * only the underlying storage primitive is faked.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { set, get, del } from 'idb-keyval';
import { OfflineAwareWorkOrderService } from './offlineAwareService';
import { OfflineQueueService, OfflineQueuePayloadError } from './offlineQueueService';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(async () => []),
  delMany: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  },
}));

vi.mock('@/features/work-orders/services/workOrderService', () => ({
  WorkOrderService: vi.fn(function WorkOrderServiceMock() {
    return { create: vi.fn() };
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  logger: { error: mockLoggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const USER_ID = 'user-123';
const ORG_ID = 'org-456';

function jpegFile(name = 'snap.jpg') {
  return new File(['x'], name, { type: 'image/jpeg' });
}

function makeCreateData(images: File[] = []) {
  return {
    title: 'Fix pump',
    description: 'Pump is broken',
    equipmentId: 'equip-1',
    priority: 'high' as const,
    images,
  };
}

describe('offlineAwareService — staged image blob rollback on failed enqueue (P2-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    // Simulate offline so createWorkOrder/createEquipmentNote/createWorkOrderNote
    // take the TIER 1 fast path straight into the queue*/stage→enqueue flow
    // under test, without needing to mock a network failure.
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    vi.mocked(set).mockResolvedValue(undefined);
    vi.mocked(del).mockResolvedValue(undefined);
  });

  // ── A: stage succeeds, enqueue throws → newly staged blobs removed ────────
  it('deletes the newly staged blob when enqueue() throws', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);
    vi.spyOn(OfflineQueueService.prototype, 'enqueue').mockImplementation(() => {
      throw new OfflineQueuePayloadError('Queue storage budget exceeded');
    });

    await expect(svc.createWorkOrder(makeCreateData([jpegFile()]))).rejects.toThrow(
      OfflineQueuePayloadError,
    );

    // One blob was staged (idb-keyval `set`), and rollback must delete that
    // same key via `del`.
    expect(set).toHaveBeenCalledTimes(1);
    const stagedKey = vi.mocked(set).mock.calls[0][0];
    expect(del).toHaveBeenCalledWith(stagedKey);
  });

  // ── B: stage succeeds, enqueue succeeds → blobs remain for the queue item ─
  it('does not delete staged blobs when enqueue() succeeds', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);

    const result = await svc.createWorkOrder(makeCreateData([jpegFile()]));

    expect(result.queuedOffline).toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
    expect(del).not.toHaveBeenCalled();

    // The queued item's payload still carries the imageRefs pointing at the
    // blob that was staged — nothing was rolled back out from under it.
    const queueReader = new OfflineQueueService(USER_ID, ORG_ID);
    const items = queueReader.getAll();
    expect(items).toHaveLength(1);
    const payload = items[0].payload as { imageRefs?: Array<{ blobKey: string }> };
    expect(payload.imageRefs).toHaveLength(1);
  });

  // ── C: enqueue succeeds, later processing/sync failure is retryable ──────
  it('leaves staged blobs untouched when a queued item merely fails to sync later', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);
    await svc.createWorkOrder(makeCreateData([jpegFile()]));

    expect(set).toHaveBeenCalledTimes(1);
    vi.mocked(del).mockClear();

    // Simulate a later, unrelated sync/processing failure for the now-queued
    // item (retry with incremented retryCount, staying 'pending') — this
    // must never touch blob storage; only explicit queue-item
    // removal/completion does that.
    const queueReader = new OfflineQueueService(USER_ID, ORG_ID);
    const [item] = queueReader.getAll();
    queueReader.updateStatus(item.id, 'processing');
    queueReader.updateRetry(item.id, item.retryCount + 1, 'network error during sync');

    expect(del).not.toHaveBeenCalled();
    const stillQueued = queueReader.getAll();
    expect(stillQueued).toHaveLength(1);
    expect((stillQueued[0].payload as { imageRefs?: unknown[] }).imageRefs).toHaveLength(1);
  });

  // ── D: enqueue throws AND rollback cleanup also throws ───────────────────
  it('surfaces the original enqueue error even when rollback cleanup itself fails', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);
    vi.spyOn(OfflineQueueService.prototype, 'enqueue').mockImplementation(() => {
      throw new OfflineQueuePayloadError('Queue storage budget exceeded');
    });
    // Rollback cleanup itself fails for every blob.
    vi.mocked(del).mockRejectedValue(new Error('IndexedDB unavailable'));

    await expect(svc.createWorkOrder(makeCreateData([jpegFile()]))).rejects.toThrow(
      'Queue storage budget exceeded',
    );

    // deleteOfflineImageRefs swallows per-blob delete errors internally, so
    // this also proves the rollback attempt did run and did not blow up the
    // call site despite `del` rejecting.
    expect(del).toHaveBeenCalled();
  });

  // ── E: rollback only removes refs newly staged by the failed attempt ─────
  it('does not delete a pre-existing/reused staged ref when a later enqueue in the same batch fails', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);

    // First call succeeds and stages+queues its own blob — this blob must
    // survive regardless of what happens to later, unrelated calls.
    const first = await svc.createWorkOrder(makeCreateData([jpegFile('first.jpg')]));
    expect(first.queuedOffline).toBe(true);
    const firstStagedKey = vi.mocked(set).mock.calls[0][0];
    vi.mocked(del).mockClear();

    // Second call stages a new blob, then its enqueue fails.
    vi.spyOn(OfflineQueueService.prototype, 'enqueue').mockImplementationOnce(() => {
      throw new OfflineQueuePayloadError('Queue storage budget exceeded');
    });
    await expect(
      svc.createWorkOrder(makeCreateData([jpegFile('second.jpg')])),
    ).rejects.toThrow(OfflineQueuePayloadError);

    // Only the second call's blob was deleted; the first call's blob key
    // was never passed to del().
    expect(del).toHaveBeenCalledTimes(1);
    const deletedKey = vi.mocked(del).mock.calls[0][0];
    expect(deletedKey).not.toBe(firstStagedKey);

    const queueReader = new OfflineQueueService(USER_ID, ORG_ID);
    expect(queueReader.getAll()).toHaveLength(1);
  });

  // ── Equipment note / work order note share the same rollback path ────────
  it('rolls back staged blobs for a failed offline equipment note enqueue', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);
    vi.spyOn(OfflineQueueService.prototype, 'enqueue').mockImplementation(() => {
      throw new OfflineQueuePayloadError('Queue storage budget exceeded');
    });

    await expect(
      svc.createEquipmentNote('equip-1', 'Note text', 1, false, undefined, [jpegFile()]),
    ).rejects.toThrow(OfflineQueuePayloadError);

    expect(set).toHaveBeenCalledTimes(1);
    const stagedKey = vi.mocked(set).mock.calls[0][0];
    expect(del).toHaveBeenCalledWith(stagedKey);
  });

  it('rolls back staged blobs for a failed offline work order note enqueue', async () => {
    const svc = new OfflineAwareWorkOrderService(ORG_ID, USER_ID);
    vi.spyOn(OfflineQueueService.prototype, 'enqueue').mockImplementation(() => {
      throw new OfflineQueuePayloadError('Queue storage budget exceeded');
    });

    await expect(
      svc.createWorkOrderNote('wo-1', 'Note text', 1, false, undefined, [jpegFile()]),
    ).rejects.toThrow(OfflineQueuePayloadError);

    expect(set).toHaveBeenCalledTimes(1);
    const stagedKey = vi.mocked(set).mock.calls[0][0];
    expect(del).toHaveBeenCalledWith(stagedKey);
  });
});
