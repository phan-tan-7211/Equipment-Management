import { formatStatus } from './workOrderHelpers';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const statusKey: Record<string, string> = {
  submitted: 'statusSubmitted', accepted: 'statusAccepted', assigned: 'statusAssigned',
  in_progress: 'statusInProgress', on_hold: 'statusOnHold', completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

export function localizeWorkOrderStatus(status: string, t: Translate): string {
  const key = statusKey[status];
  return key ? t(`workOrderDetail.${key}`) : formatStatus(status);
}

export function localizeWorkOrderPriority(priority: string, t: Translate): string {
  const key = { low: 'priorityLow', medium: 'priorityMedium', high: 'priorityHigh' }[priority];
  return key ? t(`workOrderDetail.${key}`) : priority;
}
