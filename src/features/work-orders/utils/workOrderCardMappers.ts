import type { WorkOrder, WorkOrderData } from '@/features/work-orders/types/workOrder';
import type { AssignmentWorkOrderContext } from '@/features/work-orders/hooks/useWorkOrderContextualAssignment';

// `WorkOrder` doesn't declare camelCase mirrors of its snake_case DB columns,
// but some callers historically passed camelCase-shaped objects. The `??`
// fallbacks below tolerate both; this type just lets TS see the optional
// camelCase side of that tolerance without changing runtime behavior.
type WorkOrderWithLegacyAliases = WorkOrder & {
  equipmentId?: string;
  organizationId?: string;
  assigneeId?: string | null;
  teamId?: string | null;
  createdDate?: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  completedDate?: string | null;
};

export const mapToWorkOrderData = (workOrder: WorkOrderWithLegacyAliases): WorkOrderData => ({
  id: workOrder.id,
  title: workOrder.title,
  description: workOrder.description,
  equipmentId: workOrder.equipmentId ?? workOrder.equipment_id ?? '',
  organizationId: workOrder.organizationId ?? workOrder.organization_id ?? '',
  priority: workOrder.priority,
  status: workOrder.status,
  assigneeId: workOrder.assigneeId ?? workOrder.assignee_id ?? undefined,
  assigneeName: workOrder.assigneeName,
  teamId: workOrder.teamId ?? workOrder.team_id ?? undefined,
  teamName: workOrder.teamName ?? workOrder.equipmentTeamName,
  createdDate: workOrder.createdDate ?? workOrder.created_date ?? '',
  created_date: workOrder.created_date ?? workOrder.createdDate ?? '',
  dueDate: workOrder.dueDate ?? workOrder.due_date ?? undefined,
  estimatedHours: workOrder.estimatedHours ?? workOrder.estimated_hours ?? undefined,
  completedDate: workOrder.completedDate ?? workOrder.completed_date ?? undefined,
  equipmentName: workOrder.equipmentName,
  equipmentManufacturer: workOrder.equipmentManufacturer,
  equipmentModel: workOrder.equipmentModel,
  equipmentSerialNumber: workOrder.equipmentSerialNumber,
  equipmentWorkingHours: workOrder.equipmentWorkingHours,
  equipmentImageUrl: workOrder.equipmentImageUrl,
  createdByName: workOrder.createdByName,
  createdBy: workOrder.created_by,
});

export const getAssignmentContext = (workOrder: WorkOrderWithLegacyAliases): AssignmentWorkOrderContext => ({
  ...workOrder,
  organization_id: workOrder.organization_id ?? workOrder.organizationId ?? '',
  equipment_id: workOrder.equipment_id ?? workOrder.equipmentId ?? '',
  equipmentTeamId: workOrder.equipmentTeamId ?? workOrder.team_id,
});

export function getAssigneeInitials(assigneeName?: string | null): string {
  if (!assigneeName) return '?';
  const chars = assigneeName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  return chars.slice(0, 2) || '?';
}
