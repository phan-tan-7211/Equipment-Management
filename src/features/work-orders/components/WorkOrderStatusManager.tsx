import { useI18n } from '@/i18n';
import { localizeWorkOrderStatus, localizePmStatus, localizeWorkOrderActionLabel, localizeWorkOrderActionDescription } from '@/features/work-orders/utils/workOrderI18nLabels';
// fallow-ignore-file code-duplication
// Duplication rationale: Status manager shares transition UI with details page
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Play, 
  User, 
  Users, 
  AlertTriangle,
  Clipboard,
  Clock,
  Wrench,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { WorkOrderAssigneeSelectItems } from '@/features/work-orders/components/WorkOrderAssigneeSelectItems';
import { useWorkOrderStatusChangeHandlers } from '@/features/work-orders/hooks/useWorkOrderStatusChangeHandlers';
import { useWorkOrderContextualAssignment, type AssignmentWorkOrderContext } from '@/features/work-orders/hooks/useWorkOrderContextualAssignment';
import {
  getStatusColor,
} from '@/features/work-orders/utils/workOrderHelpers';
import { formatDueDisplay, isDueOverdue, parseDue } from '@/features/work-orders/calendar';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { buildWorkOrderStatusActions } from '@/features/work-orders/utils/buildWorkOrderStatusActions';
import WorkOrderAcceptanceModal from './WorkOrderAcceptanceModal';
import WorkOrderAssigneeDisplay from './WorkOrderAssigneeDisplay';
import ClickableAddress from '@/components/ui/ClickableAddress';
type WorkOrderStatus = 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

type StatusWorkOrder = {
  id: string;
  status: WorkOrderStatus;
  has_pm?: boolean;
  assignee_id?: string | null;
  created_by?: string | null;
  assigneeName?: string | null;
  teamName?: string | null;
  acceptance_date?: string | null;
  completed_date?: string | null;
  // Required for contextual assignment
  organization_id?: string;
  equipment_id?: string;
  equipmentTeamId?: string | null;
};

interface WorkOrderStatusManagerProps {
  workOrder: StatusWorkOrder;
  organizationId: string;
  /** Hide status-change action buttons (mobile sidebar read-only workflow) */
  hideStatusActions?: boolean;
  /** Optional context data previously shown in QuickInfo */
  contextData?: {
    dueDate?: string;
    dueDateHasTime?: boolean;
    estimatedHours?: number;
    equipmentId?: string;
    equipmentName?: string;
    pmStatus?: string;
    formMode?: string;
    team?: {
      id: string;
      name: string;
      description?: string;
      location_address?: string | null;
      location_lat?: number | null;
      location_lng?: number | null;
    } | null;
  };
}

const WorkOrderStatusManager: React.FC<WorkOrderStatusManagerProps> = ({
  workOrder,
  organizationId,
  hideStatusActions = false,
  contextData,
}) => {
  const { t } = useI18n();
  const { formatDate, formatDateTime } = useFormatTimestamp();
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedAssigneeForStart, setSelectedAssigneeForStart] = useState<string>('');
  const {
    updateStatusMutation,
    acceptanceMutation,
    pmData,
    isManager,
    isTechnician,
    canPerformStatusActions,
    canCompleteWorkOrder,
    handleStatusChange,
    handleAcceptanceComplete,
  } = useWorkOrderStatusChangeHandlers(
    workOrder,
    organizationId,
    () => setShowAcceptanceModal(true),
    () => setShowCancelDialog(true),
    () => setShowCompleteDialog(true),
  );

  // Build context for contextual assignment - needed for accepted status
  const assignmentContext: AssignmentWorkOrderContext = {
    id: workOrder.id,
    organization_id: workOrder.organization_id || organizationId,
    equipment_id: workOrder.equipment_id,
    equipmentTeamId: workOrder.equipmentTeamId
  };
  const { assignmentOptions, isLoading: assignmentLoading, equipmentHasNoTeam } = useWorkOrderContextualAssignment(assignmentContext);
  const startAssigneeFieldId = `work-order-start-assignee-${workOrder.id}`;
  const currentAssigneeId = workOrder.assignee_id ?? null;
  const effectiveStartAssigneeId = selectedAssigneeForStart || currentAssigneeId || '';
  const needsStartAssigneeSelection = !currentAssigneeId;

  const handleConfirmCancel = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        workOrderId: workOrder.id,
        status: 'cancelled',
        organizationId
      });
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling work order:', error);
    }
  };

  const handleConfirmComplete = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        workOrderId: workOrder.id,
        status: 'completed',
        organizationId
      });
      setShowCompleteDialog(false);
    } catch (error) {
      console.error('Error completing work order:', error);
    }
  };

  // Handler for assigning and starting work order from accepted status
  const handleAssignAndStart = async () => {
    if (!effectiveStartAssigneeId) return;
    
    try {
      await updateStatusMutation.mutateAsync({
        workOrderId: workOrder.id,
        status: 'in_progress',
        organizationId,
        assigneeId: effectiveStartAssigneeId
      });
      setSelectedAssigneeForStart(''); // Reset after successful update
    } catch (error) {
      console.error('Error assigning and starting work order:', error);
    }
  };

  const statusActions = buildWorkOrderStatusActions({
    status: workOrder.status,
    assigneeId: workOrder.assignee_id,
    canPerformStatusActions: canPerformStatusActions(),
    isManager,
    isTechnician,
    canComplete: canCompleteWorkOrder(),
    onStatusChange: (status) => {
      void handleStatusChange(status);
    },
  }).filter((action) => !(workOrder.status === 'accepted' && action.label === 'Start Work'));

  return (
    <div className="space-y-4">
      {/* Assignment Display */}
      <WorkOrderAssigneeDisplay
        workOrder={workOrder}
        organizationId={organizationId}
        canManageAssignment={isManager}
        showEditControls={workOrder.status !== 'completed' && workOrder.status !== 'cancelled'}
      />

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('workOrderActivity.statusManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('workOrderActivity.currentStatus')}</span>
            <Badge className={getStatusColor(workOrder.status)}>
              {localizeWorkOrderStatus(workOrder.status, t)}
            </Badge>
          </div>

          {/* PM Status Check Warning */}
          {workOrder.has_pm && workOrder.status === 'in_progress' && pmData && pmData.status !== 'completed' && (
            <Alert className="border-warning/30 bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-warning">
                <div className="flex items-center gap-2">
                  <Clipboard className="h-4 w-4" />
                  <span>{t('workOrderActivity.pmCompletionWarning')}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Assignment Info */}
          {workOrder.assigneeName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{t('workOrderActivity.assignedTo', { name: workOrder.assigneeName })}</span>
            </div>
          )}

          {workOrder.teamName && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{t('workOrderActivity.forTeam', { name: workOrder.teamName })}</span>
            </div>
          )}

          {/* Permission Info */}
          {!canPerformStatusActions() && (
            <Alert>
              <AlertDescription>
                {t('workOrderActivity.noStatusPermission')}
              </AlertDescription>
            </Alert>
          )}

          {/* Inline Assignment + Start for Accepted Status */}
          {workOrder.status === 'accepted' && (isManager || isTechnician) && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              {needsStartAssigneeSelection && (
                <div className="space-y-2">
                  <Label htmlFor={startAssigneeFieldId} className="text-sm font-medium">{t('workOrderActivity.assignToStart')}</Label>
                  {equipmentHasNoTeam && (
                    <p className="text-xs text-muted-foreground">
                      {t('workOrderActivity.noEquipmentTeam')}
                    </p>
                  )}
                  <Select
                    value={selectedAssigneeForStart}
                    onValueChange={setSelectedAssigneeForStart}
                    disabled={assignmentLoading || updateStatusMutation.isPending}
                  >
                    <SelectTrigger id={startAssigneeFieldId} className="w-full" aria-label={t('workOrderActivity.selectAssigneeStart')}>
                      <SelectValue placeholder={assignmentLoading ? t('workOrderActivity.loading') : t('workOrderActivity.selectAssignee')} />
                    </SelectTrigger>
                    <SelectContent>
                      <WorkOrderAssigneeSelectItems options={assignmentOptions} />
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleAssignAndStart}
                disabled={!effectiveStartAssigneeId || updateStatusMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? t('workOrderActivity.starting') : t('workOrderActivity.actionStartWork')}
              </Button>
              {needsStartAssigneeSelection && (
                <p className="text-xs text-muted-foreground">
                  {selectedAssigneeForStart 
                    ? t('workOrderActivity.clickStartHint')
                    : t('workOrderActivity.actionAssigneeRequired')}
                </p>
              )}
            </div>
          )}

          {/* Status Actions */}
          {!hideStatusActions && statusActions.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('workOrderActivity.availableActions')}</span>
              <div className="space-y-2">
                {statusActions.map((action, index) => {
                  const IconComponent = action.icon;
                  const isCancelAction = action.label === 'Cancel';
                  return (
                    <div key={index}>
                      <Button
                        variant={action.variant}
                        size="sm"
                        className={`w-full justify-start ${isCancelAction ? 'text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive' : ''}`}
                        onClick={action.action}
                        disabled={updateStatusMutation.isPending || acceptanceMutation.isPending || action.disabled}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {localizeWorkOrderActionLabel(action.label, t)}
                      </Button>
                      <p className="text-xs text-muted-foreground ml-6 mt-1">
                        {localizeWorkOrderActionDescription(action.description, t)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {workOrder.status === 'completed' && (
            <div className="text-sm text-success">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              {t('workOrderActivity.completedSuccess')}
              {workOrder.completed_date && (
                <div className="text-xs text-muted-foreground mt-1">
                  {t('workOrderActivity.completedOn', { date: formatDate(workOrder.completed_date) })}
                </div>
              )}
            </div>
          )}

          {/* Context Details (merged from QuickInfo) */}
          {contextData && (
            <>
              <Separator />
              <div className="space-y-3">
                {contextData.dueDate && (() => {
                  const due = parseDue({
                    dueDate: contextData.dueDate,
                    dueDateHasTime: contextData.dueDateHasTime ?? false,
                  });
                  const dueLabel = formatDueDisplay(due, {
                    formatDay: formatDate,
                    formatTimed: formatDateTime,
                  });
                  const hoursUntilDue = due.kind === 'timed'
                    ? (due.at.epochMs - Date.now()) / (1000 * 60 * 60)
                    : Number.POSITIVE_INFINITY;
                  const isOverdue = isDueOverdue(due, workOrder.status);
                  const isDueSoon = !isOverdue && hoursUntilDue > 0 && hoursUntilDue < 24;
                  return (
                    <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-destructive' : isDueSoon ? 'text-warning' : ''}`}>
                      {isOverdue
                        ? <AlertCircle className="h-4 w-4" />
                        : <Clock className={`h-4 w-4 ${!isDueSoon ? 'text-muted-foreground' : ''}`} />
                      }
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">
                          {contextData.formMode === 'requestor' && workOrder.status === 'submitted' ? t('workOrderActivity.preferredDue') : t('workOrderActivity.due')}
                        </span>
                        <span className={isOverdue || isDueSoon ? '' : 'text-muted-foreground'}>
                          {dueLabel}
                        </span>
                        {isOverdue && (
                          <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                            {t('workOrderActivity.overdue')}
                          </Badge>
                        )}
                        {isDueSoon && (
                          <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                            {t('workOrderActivity.dueSoon')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {contextData.estimatedHours != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{t('workOrderActivity.estimated')}</span>
                      <span className="ml-1.5 text-muted-foreground">{contextData.estimatedHours}h</span>
                    </div>
                  </div>
                )}

                {contextData.pmStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clipboard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{t('workOrderActivity.pmStatus')}</span>
                      <span className="ml-1.5 text-muted-foreground">
                        {localizePmStatus(contextData.pmStatus, t)}
                      </span>
                    </div>
                  </div>
                )}

                {contextData.equipmentId && contextData.equipmentName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{t('workOrderActivity.equipment')}</span>
                      <Link 
                        to={`/dashboard/equipment/${contextData.equipmentId}`}
                        className="ml-1.5 text-primary hover:underline"
                      >
                        {contextData.equipmentName}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Team details */}
                {contextData.team && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{t('workOrderForm.team')}:</span>
                        <Link
                          to={`/dashboard/teams/${contextData.team.id}`}
                          className="ml-1.5 text-primary hover:underline"
                        >
                          {contextData.team.name}
                        </Link>
                      </div>
                    </div>
                    {contextData.team.description && (
                      <p className="text-xs text-muted-foreground pl-6 line-clamp-2">
                        {contextData.team.description}
                      </p>
                    )}
                    {contextData.team.location_address && (
                      <div className="flex items-center gap-2 text-sm pl-6">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {contextData.team.location_lat != null && contextData.team.location_lng != null ? (
                          <ClickableAddress
                            address={contextData.team.location_address}
                            lat={contextData.team.location_lat}
                            lng={contextData.team.location_lng}
                            className="text-xs"
                            showIcon={false}
                          />
                        ) : (
                          <ClickableAddress
                            address={contextData.team.location_address}
                            className="text-xs"
                            showIcon={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <WorkOrderAcceptanceModal
        open={showAcceptanceModal}
        onClose={() => setShowAcceptanceModal(false)}
        workOrder={workOrder}
        organizationId={organizationId}
        onAccept={async (assigneeId) => {
          await handleAcceptanceComplete(assigneeId);
          setShowAcceptanceModal(false);
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('workOrderActivity.cancelTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('workOrderActivity.cancelDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              {t('workOrderActivity.goBack')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={updateStatusMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateStatusMutation.isPending ? t('workOrderActivity.cancelling') : t('workOrderActivity.confirmCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              {t('workOrderActivity.completeTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{t('workOrderActivity.completeQuestion')}</p>
                <p className="text-sm font-medium text-foreground">{t('workOrderActivity.beforeCompleting')}</p>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>{t('workOrderActivity.allHoursLogged')}</li>
                  <li>{t('workOrderActivity.allCostsRecorded')}</li>
                  <li>{t('workOrderActivity.notesPhotosCurrent')}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              {t('workOrderActivity.goBack')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? t('workOrderActivity.completing') : t('workOrderActivity.markComplete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkOrderStatusManager;

