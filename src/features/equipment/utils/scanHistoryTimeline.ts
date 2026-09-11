import type { EquipmentScan } from '@/features/equipment/services/EquipmentService';
import type {
  ScanFollowUpEvent,
  ScanFollowUpEventType,
} from '@/features/equipment/services/scanFollowUpEventService';

export type ScanHistoryActionDetail =
  | { kind: 'title'; value: string }
  | { kind: 'hours'; value: number }
  | { kind: 'note_image'; imageCount?: number; isPrivate?: boolean };

/**
 * A single action shown under a scan in the Scan History timeline. `eventType`
 * is `null` for the synthetic viewed-scan fallback used when a scan has no
 * recorded follow-up events.
 */
export interface ScanHistoryAction {
  id: string;
  eventType: ScanFollowUpEventType | null;
  detail?: ScanHistoryActionDetail;
  performedByName?: string;
  performedAt: string;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * One scan plus the follow-up actions performed from it. Scans are the timeline
 * spine; actions are nested beneath their parent scan.
 */
export interface ScanHistoryEntry {
  scan: EquipmentScan;
  actions: ScanHistoryAction[];
}

function readString(metadata: unknown, key: string): string | undefined {
  if (metadata && typeof metadata === 'object' && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
}

function readNumber(metadata: unknown, key: string): number | undefined {
  if (metadata && typeof metadata === 'object' && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function readBoolean(metadata: unknown, key: string): boolean | undefined {
  if (metadata && typeof metadata === 'object' && key in metadata) {
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

/**
 * Semantic detail for a follow-up event. Presentation labels are intentionally
 * resolved by the UI so this utility does not lock scan history to English.
 */
export function describeScanFollowUpEvent(
  event: Pick<ScanFollowUpEvent, 'event_type' | 'metadata'>
): { detail?: ScanHistoryActionDetail } {
  const metadata = event.metadata;

  switch (event.event_type as ScanFollowUpEventType) {
    case 'pm_work_order_created':
    case 'generic_work_order_created': {
      const title = readString(metadata, 'title');
      return title ? { detail: { kind: 'title', value: title } } : {};
    }
    case 'working_hours_updated': {
      const hours = readNumber(metadata, 'newHours');
      return hours === undefined ? {} : { detail: { kind: 'hours', value: hours } };
    }
    case 'note_image_added': {
      const imageCount = readNumber(metadata, 'imageCount');
      const isPrivate = readBoolean(metadata, 'isPrivate');
      if (imageCount === undefined && !isPrivate) return {};
      return {
        detail: {
          kind: 'note_image',
          imageCount,
          isPrivate,
        },
      };
    }
    case 'dashboard_opened':
    default:
      return {};
  }
}

function compareDesc(aTime: string, bTime: string, aId: string, bId: string): number {
  const aMs = new Date(aTime).getTime();
  const bMs = new Date(bTime).getTime();
  if (aMs !== bMs) return bMs - aMs;
  return bId.localeCompare(aId);
}

function compareAsc(aTime: string, bTime: string, aId: string, bId: string): number {
  const aMs = new Date(aTime).getTime();
  const bMs = new Date(bTime).getTime();
  if (aMs !== bMs) return aMs - bMs;
  return aId.localeCompare(bId);
}

/**
 * Build the Scan History timeline: scans newest-first, with their follow-up
 * actions nested oldest-to-newest. Scans without follow-up events get a single
 * synthetic viewed-scan action. Follow-up events whose `scan_id` does not
 * match a provided scan are ignored (scans are the spine of the timeline).
 */
export function buildScanHistoryTimeline(
  scans: EquipmentScan[],
  followUps: ScanFollowUpEvent[]
): ScanHistoryEntry[] {
  const eventsByScanId = new Map<string, ScanFollowUpEvent[]>();
  for (const event of followUps) {
    const bucket = eventsByScanId.get(event.scan_id);
    if (bucket) {
      bucket.push(event);
    } else {
      eventsByScanId.set(event.scan_id, [event]);
    }
  }

  const sortedScans = [...scans].sort((a, b) =>
    compareDesc(a.scanned_at, b.scanned_at, a.id, b.id)
  );

  return sortedScans.map((scan) => {
    const events = (eventsByScanId.get(scan.id) ?? []).slice().sort((a, b) =>
      compareAsc(a.performed_at, b.performed_at, a.id, b.id)
    );

    if (events.length === 0) {
      return {
        scan,
        actions: [
          {
            id: `${scan.id}:viewed`,
            eventType: null,
            performedByName: scan.scannedByName,
            performedAt: scan.scanned_at,
          },
        ],
      };
    }

    return {
      scan,
      actions: events.map((event) => {
        const { detail } = describeScanFollowUpEvent(event);
        return {
          id: event.id,
          eventType: event.event_type as ScanFollowUpEventType,
          detail,
          performedByName: event.performedByName,
          performedAt: event.performed_at,
          entityType: event.entity_type,
          entityId: event.entity_id,
        };
      }),
    };
  });
}
