import React, { useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserX, Shield, AlertTriangle } from 'lucide-react';
import { useWorkOrderContextualAssignment, type AssignmentWorkOrderContext } from '@/features/work-orders/hooks/useWorkOrderContextualAssignment';
import { useQuickWorkOrderAssignment } from '@/hooks/useQuickWorkOrderAssignment';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useI18n } from '@/i18n';

interface WorkOrderAssignmentHoverProps {
  workOrder: AssignmentWorkOrderContext & {
    status?: import('@/features/work-orders/types/workOrder').WorkOrderStatus;
  };
  children: React.ReactNode;
  disabled?: boolean;
}

export const WorkOrderAssignmentHover: React.FC<WorkOrderAssignmentHoverProps> = ({
  workOrder,
  children,
  disabled = false
}) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { assignmentOptions, isLoading, equipmentHasNoTeam } = useWorkOrderContextualAssignment(workOrder);
  const assignmentMutation = useQuickWorkOrderAssignment();

  const handleAssignment = useCallback(async (assignmentData: { type: 'assign' | 'unassign'; id?: string }) => {
    if (isAssigning) return;
    
    setIsAssigning(true);
    try {
      let assigneeId: string | null = null;

      if (assignmentData.type === 'assign') {
        assigneeId = assignmentData.id ?? null;
      }
      const organizationId = workOrder.organization_id ?? workOrder.organizationId;
      if (!organizationId) {
        toast({
          title: t('workOrderAudit.missingOrganization'),
          description: t('workOrderAudit.missingOrganizationDescription'),
          variant: "destructive",
        });
        return;
      }
      
      await assignmentMutation.mutateAsync({
        workOrderId: workOrder.id,
        assigneeId,
        organizationId,
        currentStatus: workOrder.status,
      });
      
      toast({
        title: t('workOrderAudit.assignmentUpdated'),
        description: assignmentData.type === 'unassign' 
          ? t('workOrderAudit.unassignedSuccess')
          : t('workOrderAudit.assignedSuccess'),
      });
    } catch (error) {
      logger.error('Failed to update assignment', error);
      toast({
        title: t('workOrderAudit.error'),
        description: t('workOrderAudit.assignmentFailed'),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentMutation, isAssigning, toast, workOrder.id, workOrder.organizationId, workOrder.organization_id, workOrder.status]);

  if (disabled) return <>{children}</>;

  // Check if assignment is blocked due to no team
  const isAssignmentBlocked = equipmentHasNoTeam;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="space-y-3">
          <div className="text-sm font-medium">{t('workOrderAudit.quickAssignment')}</div>
          
          {isLoading ? (
            <div className="text-xs text-muted-foreground">{t('workOrderAudit.loadingOptions')}</div>
          ) : isAssignmentBlocked ? (
            <div className="flex items-start gap-2 text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t('workOrderAudit.noTeamAssignment')}</span>
            </div>
          ) : assignmentOptions.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t('workOrderAudit.noAssignees')}</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {t('workOrderAudit.assignable')}
                </div>
                <Select 
                  onValueChange={(value) => {
                    handleAssignment({ type: 'assign', id: value });
                  }}
                  disabled={isAssigning}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t('workOrderAudit.selectAssignee')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentOptions.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        <div className="flex items-center gap-2">
                          {assignee.role === 'owner' || assignee.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span>{assignee.name}</span>
                          {assignee.role && (
                            <span className="text-xs text-muted-foreground">({assignee.role})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignment({ type: 'unassign' })}
                disabled={isAssigning}
                className="w-full h-8"
              >
                <UserX className="h-3 w-3 mr-1" />
                {t('workOrderAudit.unassign')}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

