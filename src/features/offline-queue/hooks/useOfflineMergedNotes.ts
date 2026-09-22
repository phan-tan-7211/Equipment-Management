/**
 * Merges server notes with pending offline queue note items so that
 * notes created offline appear in the notes tab with a "Pending sync" badge.
 *
 * Works for both work order notes and equipment notes.
 */

import { useMemo } from 'react';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { useAuth } from '@/hooks/useAuth';
import type {
  OfflineQueueWorkOrderNoteItem,
  OfflineQueueEquipmentNoteItem,
} from '@/services/offlineQueueService';

// ─── Prefix ─────────────────────────────────────────────────────────────────
export const OFFLINE_NOTE_ID_PREFIX = 'offline-note-';

// ─── Generic note shape that covers both WO and equipment notes ─────────────

/**
 * The fields this hook can actually guarantee for a synthesized offline
 * note, whether the caller's real note type is `EquipmentNote` or
 * `WorkOrderNoteListItem` — both already structurally satisfy this shape
 * (each just adds its own required `equipment_id`/`work_order_id`, which are
 * declared optional here since only one applies per `entityType` and it's
 * filled in below). Constraining `T` to this instead of the previous bare
 * `{ id: string }` means the bridge cast at the bottom of this file is
 * between two types the compiler knows are related, not an arbitrary one.
 */
export interface OfflineMergedNoteEntity {
  id: string;
  content: string;
  hours_worked: number;
  machine_hours?: number | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name?: string;
  images?: unknown[];
  equipment_id?: string;
  work_order_id?: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Merge server notes with any pending offline note items for a given entity.
 *
 * @param serverNotes - Notes fetched from the server
 * @param entityType - 'work_order' or 'equipment'
 * @param entityId - The work order or equipment ID to filter queue items by
 */
export function useOfflineMergedNotes<T extends OfflineMergedNoteEntity>(
  serverNotes: T[],
  entityType: 'work_order' | 'equipment',
  entityId: string,
): (T & { _isPendingSync?: boolean })[] {
  const offlineCtx = useOfflineQueueOptional();
  const { user } = useAuth();

  return useMemo(() => {
    if (!offlineCtx || !entityId) return serverNotes;

    const queueType = entityType === 'work_order' ? 'work_order_note' : 'equipment_note';
    const entityKey = entityType === 'work_order' ? 'workOrderId' : 'equipmentId';

    const pendingNotes = offlineCtx.queuedItems.filter(
      (item): item is OfflineQueueWorkOrderNoteItem | OfflineQueueEquipmentNoteItem =>
        item.type === queueType &&
        (item.status === 'pending' || item.status === 'processing') &&
        (item.payload as Record<string, unknown>)[entityKey] === entityId,
    );

    if (pendingNotes.length === 0) return serverNotes;

    const offlineNotes = pendingNotes.map((item) => {
      const payload = item.payload as Record<string, unknown>;
      const now = new Date(item.timestamp).toISOString();

      const note: OfflineMergedNoteEntity & { _isPendingSync: true; _pendingPhotoCount?: number } = {
        id: `${OFFLINE_NOTE_ID_PREFIX}${item.id}`,
        content: (payload.content as string) ?? '',
        hours_worked: (payload.hoursWorked as number) ?? 0,
        machine_hours:
          payload.machineHours !== undefined && payload.machineHours !== null
            ? Number(payload.machineHours as number)
            : null,
        is_private: (payload.isPrivate as boolean) ?? false,
        created_at: now,
        updated_at: now,
        author_id: item.userId,
        author_name: user?.user_metadata?.full_name ?? 'You',
        images: [],
        // Only the id field for the current entityType is populated — a
        // work-order note never carries equipment_id and vice versa.
        ...(entityType === 'work_order'
          ? { work_order_id: entityId }
          : { equipment_id: entityId }),
        _pendingPhotoCount:
          Array.isArray((payload as { imageRefs?: unknown[] }).imageRefs) &&
          (payload as { imageRefs?: unknown[] }).imageRefs!.length > 0
            ? (payload as { imageRefs: unknown[] }).imageRefs.length
            : undefined,
        _isPendingSync: true,
      };

      // `note` is a real, fully-populated OfflineMergedNoteEntity — the
      // bound T is constrained to that same shape, so this narrows rather
      // than bridges two unrelated types; only needed because T may add
      // fields beyond the base that a constructed stand-in can't supply.
      return note as unknown as T & { _isPendingSync?: boolean };
    });

    // Offline notes first (newest at top)
    return [...offlineNotes, ...serverNotes];
  }, [serverNotes, entityType, entityId, user, offlineCtx]);
}
