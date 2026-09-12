
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, UserMinus, Check, X } from 'lucide-react';
import { useWorkOrderContextualAssignment, type AssignmentWorkOrderContext } from '@/features/work-orders/hooks/useWorkOrderContextualAssignment';
import { useQuickWorkOrderAssignment } from '@/hooks/useQuickWorkOrderAssignment';
import { useI18n } from '@/i18n';

const roleKeys: Record<string, string> = {
  owner: 'roleOwner',
  admin: 'roleAdmin',
  manager: 'roleManager',
  technician: 'roleTechnician',
};

interface WorkOrderAssignmentSelectorProps {
  workOrder: AssignmentWorkOrderContext & {
    assignee_id?: string | null;
    assigneeId?: string | null;
    status?: import('@/features/work-orders/types/workOrder').WorkOrderStatus;
  };
  organizationId: string;
  onCancel: () => void;
  disabled?: boolean;
}

const WorkOrderAssignmentSelector: React.FC<WorkOrderAssignmentSelectorProps> = ({
  workOrder,
  organizationId,
  onCancel,
  disabled = false
}) => {
  const { t } = useI18n();
  const [selectedValue, setSelectedValue] = useState<string>('');
  const currentAssigneeId = workOrder.assignee_id ?? workOrder.assigneeId ?? '';
  
  // Use contextual assignment based on equipment team assignment
  const { assignmentOptions, isLoading: optionsLoading, equipmentHasNoTeam } = useWorkOrderContextualAssignment(workOrder);
  const quickAssignmentMutation = useQuickWorkOrderAssignment();

  const handleAssign = () => {
    if (!selectedValue) return;

    if (selectedValue === 'unassign') {
      quickAssignmentMutation.mutate({
        workOrderId: workOrder.id,
        assigneeId: null,
        organizationId,
        currentStatus: workOrder.status,
      }, {
        onSuccess: () => {
          onCancel();
        }
      });
      return;
    }

    const option = assignmentOptions.find(opt => opt.id === selectedValue);
    if (!option) return;

    quickAssignmentMutation.mutate({
      workOrderId: workOrder.id,
      assigneeId: option.id,
      organizationId,
      currentStatus: workOrder.status,
    }, {
      onSuccess: () => {
        onCancel();
      }
    });
  };

  const getCurrentAssignmentValue = () => {
    return currentAssigneeId;
  };

  const isAssignmentChanged = selectedValue && selectedValue !== getCurrentAssignmentValue();

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="work-order-assignment-select" className="text-sm font-medium text-muted-foreground mb-2 block">
          {t('workOrderAssignment.changeAssignment')}
        </label>
        <Select
          value={selectedValue}
          onValueChange={setSelectedValue}
          disabled={disabled || optionsLoading || quickAssignmentMutation.isPending}
        >
          <SelectTrigger id="work-order-assignment-select">
            <SelectValue placeholder={t('workOrderAssignment.selectAssignee')} />
          </SelectTrigger>
          <SelectContent>
            {/* Unassign option */}
            <SelectItem value="unassign">
              <div className="flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-muted-foreground" />
                <span>{t('workOrderAssignment.unassign')}</span>
              </div>
            </SelectItem>

            {/* User options */}
            {assignmentOptions.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t">
                  {t(equipmentHasNoTeam ? 'workOrderAssignment.organizationAdmins' : 'workOrderAssignment.teamMembers')}
                </div>
                {assignmentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span>{option.name}</span>
                              {currentAssigneeId === option.id && (
                            <Badge variant="outline" className="text-xs">{t('workOrderAssignment.current')}</Badge>
                          )}
                        </div>
                        {option.email && (
                          <div className="text-xs text-muted-foreground">{option.email}</div>
                        )}
                      </div>
                      {option.role && (
                        <Badge variant="secondary" className="text-xs">
                          {roleKeys[option.role] ? t(`workOrderAssignment.${roleKeys[option.role]}`) : option.role}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAssign}
          disabled={!isAssignmentChanged || quickAssignmentMutation.isPending}
          size="sm"
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          {t(quickAssignmentMutation.isPending ? 'workOrderAssignment.updating' : 'workOrderAssignment.updateAssignment')}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          disabled={quickAssignmentMutation.isPending}
        >
          <X className="h-4 w-4 mr-1" />
          {t('workOrderAssignment.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default WorkOrderAssignmentSelector;
