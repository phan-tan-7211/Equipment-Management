import { useI18n } from '@/i18n';
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, AlertTriangle, Info } from "lucide-react";
import { WorkOrderFormData } from '@/features/work-orders/hooks/useWorkOrderForm';
import { useWorkOrderAssignmentOptions } from '@/features/work-orders/hooks/useWorkOrderAssignment';
import { WorkOrderAssigneeSelectItems } from '@/features/work-orders/components/WorkOrderAssigneeSelectItems';
import { logger } from '@/utils/logger';

interface WorkOrderAssignmentProps {
  values: Pick<WorkOrderFormData, 'assigneeId'>;
  errors: Partial<Record<'assigneeId', string>>;
  setValue: <K extends keyof WorkOrderFormData>(field: K, value: WorkOrderFormData[K]) => void;
  organizationId: string;
  equipmentId?: string;
}

export const WorkOrderAssignment: React.FC<WorkOrderAssignmentProps> = ({
  values,
  errors,
  setValue,
  organizationId,
  equipmentId
}) => {
  const { t } = useI18n();
  const { assignmentOptions, isLoading: isLoadingMembers, error: assignmentError, equipmentHasNoTeam, teamName } = useWorkOrderAssignmentOptions(organizationId, equipmentId);
  
  // Debug logging
  React.useEffect(() => {
    logger.debug('[WorkOrderAssignment] Component state:', {
      organizationId,
      equipmentId,
      assignmentOptionsCount: assignmentOptions.length,
      isLoading: isLoadingMembers,
      error: assignmentError,
      equipmentHasNoTeam,
      assignmentOptions: assignmentOptions.slice(0, 3) // First 3 for debugging
    });
  }, [organizationId, equipmentId, assignmentOptions, isLoadingMembers, assignmentError, equipmentHasNoTeam]);

  const handleAssigneeChange = (userId: string) => {
    // "unassigned" is a special value meaning no assignee
    setValue('assigneeId', userId === 'unassigned' ? null : userId);
  };

  // If equipment has no team, show a warning and disable assignment
  const isAssignmentBlocked = equipmentHasNoTeam && equipmentId;

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {t('workOrderForm.assignment')}
        </h3>
        
        {teamName && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-muted-foreground">{t('workOrderForm.team')}</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t('workOrderForm.teamInherited')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{teamName}</span>
            </div>
          </div>
        )}

        {isAssignmentBlocked ? (
          <Alert variant="default" className="border-warning/30 bg-warning/10 dark:border-warning/50 dark:bg-warning/15">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning dark:text-warning">
              {t('workOrderForm.noTeamWarning')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            <Label>{t('workOrderForm.assignee')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('workOrderForm.assignableHint')}
            </p>
            {assignmentError && (
              <p className="text-sm text-destructive">{t('workOrderForm.loadingAssigneesError', { message: assignmentError.message })}</p>
            )}
            <Select
              value={values.assigneeId || 'unassigned'}
              onValueChange={handleAssigneeChange}
              disabled={isLoadingMembers}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingMembers ? t('workOrderForm.loading') : t('workOrderForm.selectAssignee')} />
              </SelectTrigger>
              <SelectContent>
                {/* Unassigned option */}
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{t('workOrderForm.unassigned')}</span>
                  </div>
                </SelectItem>
                
                <WorkOrderAssigneeSelectItems options={assignmentOptions} />
              </SelectContent>
            </Select>
            {errors.assigneeId && (
              <p className="text-sm text-destructive">{errors.assigneeId}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};




