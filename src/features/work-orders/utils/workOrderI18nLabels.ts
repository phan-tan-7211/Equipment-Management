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

const pmStatusKey: Record<string, string> = {
  pending: 'pmPending', in_progress: 'pmInProgress', completed: 'pmCompleted', cancelled: 'pmCancelled',
};

export function localizePmStatus(status: string, t: Translate): string {
  const key = pmStatusKey[status];
  return key ? t(`workOrderOperations.${key}`) : formatStatus(status);
}

const actionLabelKey: Record<string, string> = {
  Accept: 'actionAccept', Cancel: 'actionCancel', 'Start Work': 'actionStartWork',
  'Put on Hold': 'actionPutOnHold', Complete: 'actionComplete', Resume: 'actionResume',
};

const actionDescriptionKey: Record<string, string> = {
  'Accept this work order and proceed with planning': 'actionAcceptHint',
  'Cancel this work order': 'actionCancelHint',
  'Begin working on this order': 'actionStartHint',
  'Select an assignee to enable starting work': 'actionAssigneeRequired',
  'Temporarily pause this work order': 'actionHoldHint',
  'Mark this work order as completed': 'actionCompleteHint',
  'Complete PM checklist first': 'actionPmFirst',
  'Resume work on this order': 'actionResumeHint',
};

export function localizeWorkOrderActionLabel(label: string, t: Translate): string {
  const key = actionLabelKey[label];
  return key ? t(`workOrderActivity.${key}`) : label;
}

export function localizeWorkOrderActionDescription(description: string, t: Translate): string {
  const key = actionDescriptionKey[description];
  return key ? t(`workOrderActivity.${key}`) : description;
}
