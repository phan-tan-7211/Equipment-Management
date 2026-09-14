import { useI18n } from '@/i18n';
import { localizeWorkOrderStatus, localizePmStatus } from '@/features/work-orders/utils/workOrderI18nLabels';
// fallow-ignore-file code-duplication
// Duplication rationale: Requestor status mirrors manager status controls

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Wrench, Clipboard } from 'lucide-react';
import { WorkOrderData, EquipmentData, PermissionLevels, PMData } from '@/features/work-orders/types/workOrderDetails';
import { formatDueDisplay, parseDue } from '@/features/work-orders/calendar';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { getStatusColor } from '@/features/work-orders/utils/workOrderHelpers';
import { getWorkOrderAssignmentDisplay } from '@/features/work-orders/utils/workOrderAssignmentDisplay';

interface WorkOrderDetailsRequestorStatusProps {
  workOrder: WorkOrderData;
  permissionLevels: PermissionLevels;
  equipment?: EquipmentData | null;
  pmData?: PMData | null;
  canViewInternalLabor?: boolean;
}

export const WorkOrderDetailsRequestorStatus: React.FC<WorkOrderDetailsRequestorStatusProps> = ({
  workOrder,
  permissionLevels,
  equipment,
  pmData,
  canViewInternalLabor = false,
}) => {
  const { t } = useI18n();
  const { formatDate, formatDateTime } = useFormatTimestamp();
  const dueLabel = formatDueDisplay(parseDue(workOrder), {
    formatDay: formatDate,
    formatTimed: formatDateTime,
  });

  // Only show for non-managers
  if (permissionLevels.isManager) {
    return null;
  }

  const assignment = getWorkOrderAssignmentDisplay(workOrder);
  const AssignmentIcon = assignment.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('workOrderDetail.workOrderStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('workOrderDetail.currentStatus')}</span>
          <Badge className={getStatusColor(workOrder.status)}>
            {localizeWorkOrderStatus(workOrder.status, t)}
          </Badge>
        </div>

        {/* Assignment Information */}
        <div className="space-y-2">
          <span className="text-sm font-medium">{t(assignment.type === 'user' ? 'workOrderDetail.assignedTo' : 'workOrderDetail.assignment')}:</span>
          <div className="flex items-center gap-2">
            <AssignmentIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{assignment.type === 'unassigned' ? t('workOrderDetail.notYetAssigned') : assignment.name}</span>
          </div>
        </div>

        {/* Timing Information */}
        <div className="space-y-2 pt-2 border-t">
          {dueLabel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('workOrderDetail.due', { date: dueLabel })}</span>
            </div>
          )}

          {workOrder.completed_date && (
            <div className="flex items-center gap-2 text-sm text-success">
              <Clock className="h-4 w-4" />
              <span>{t('workOrderDetail.completed', { date: formatDate(workOrder.completed_date) })}</span>
            </div>
          )}
        </div>

        {/* Progress Information */}
        {workOrder.status === 'in_progress' && (
          <div className="text-sm text-info bg-info/10 p-2 rounded">
            {t('workOrderDetail.workInProgress')}
          </div>
        )}

        {workOrder.status === 'on_hold' && (
          <div className="text-sm text-warning bg-warning/10 p-2 rounded">
            {t('workOrderDetail.workOnHold')}
          </div>
        )}

        {/* Context Details (merged from QuickInfo). Estimated labor hours are
            internal data — only field roles (technician/manager) may see them;
            requestors/viewers only get status and equipment context. */}
        {((workOrder.estimated_hours != null && canViewInternalLabor) ||
          (workOrder.has_pm && pmData) ||
          equipment) && (
          <>
            <Separator />
            <div className="space-y-2">
              {workOrder.estimated_hours != null && canViewInternalLabor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{t('workOrderDetail.estimated', { hours: workOrder.estimated_hours })}</span>
                </div>
              )}

              {workOrder.has_pm && pmData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clipboard className="h-4 w-4" />
                  <span>{t('workOrderDetail.pmStatus', { status: localizePmStatus(pmData.status, t) })}</span>
                </div>
              )}

              {equipment && (
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <Link 
                    to={`/dashboard/equipment/${equipment.id}`}
                    className="text-primary hover:underline"
                  >
                    {equipment.name}
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};



