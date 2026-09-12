import { localizeWorkOrderStatus } from './workOrderI18nLabels';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const titleKeys: Record<string, string> = {
  accepted: 'accepted', assigned: 'workAssigned', in_progress: 'workStarted',
  completed: 'workCompleted', on_hold: 'workOnHold', cancelled: 'cancelled',
};

export function localizeTimelineTitle(oldStatus: string | null, newStatus: string, t: Translate): string {
  if (!oldStatus) return t('workOrderTimelineNote.created');
  if ((oldStatus === 'completed' || oldStatus === 'cancelled') && newStatus === 'accepted') {
    return t('workOrderTimelineNote.reverted');
  }
  return t(`workOrderTimelineNote.${titleKeys[newStatus] ?? 'statusUpdated'}`);
}

export function localizeTimelineDescription(
  oldStatus: string | null,
  newStatus: string,
  reason: string | undefined,
  t: Translate,
): string {
  if (!oldStatus) return t('workOrderTimelineNote.workSubmitted');
  const description = t('workOrderTimelineNote.statusChanged', {
    from: localizeWorkOrderStatus(oldStatus, t),
    to: localizeWorkOrderStatus(newStatus, t),
  });
  // The reason is user-authored or stored audit data; display it verbatim.
  return reason && reason !== 'Status updated'
    ? t('workOrderTimelineNote.withReason', { description, reason })
    : description;
}

export function localizeCreationDescription(
  status: string,
  createdByName: string | undefined,
  assigneeName: string | undefined,
  t: Translate,
): string {
  const parts = [createdByName
    ? t('workOrderTimelineNote.submittedBy', { name: createdByName })
    : t('workOrderTimelineNote.workSubmitted')];
  if (assigneeName && status === 'assigned') {
    parts.push(t('workOrderTimelineNote.assignedTo', { name: assigneeName }));
  }
  return parts.join(' • ');
}
