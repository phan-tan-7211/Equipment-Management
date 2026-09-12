
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, UserMinus, Edit3, Clock } from 'lucide-react';
import WorkOrderAssignmentSelector from './WorkOrderAssignmentSelector';
import type { AssignmentWorkOrderContext } from '@/features/work-orders/hooks/useWorkOrderContextualAssignment';
import { useI18n } from '@/i18n';

interface WorkOrderAssigneeDisplayProps {
  workOrder: AssignmentWorkOrderContext & {
    assigneeName?: string | null;
    assignee?: { name?: string | null } | null;
    assignee_id?: string | null;
    assigneeId?: string | null;
    acceptance_date?: string | null;
    acceptanceDate?: string | null;
  };
  organizationId: string;
  canManageAssignment: boolean;
  showEditControls?: boolean;
}

const WorkOrderAssigneeDisplay: React.FC<WorkOrderAssigneeDisplayProps> = ({
  workOrder,
  organizationId,
  canManageAssignment,
  showEditControls = true
}) => {
  const { language, t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const assigneeId = workOrder.assignee_id ?? workOrder.assigneeId ?? null;
  const acceptanceDate = workOrder.acceptance_date ?? workOrder.acceptanceDate ?? null;

  const getAssignmentDisplay = () => {
    const assigneeName = workOrder.assigneeName || workOrder.assignee?.name;
    
    if (assigneeId && assigneeName) {
      return {
        type: 'user',
        name: assigneeName,
        icon: User,
        color: 'bg-info/20 text-info border-info/30'
      };
    }
    
    return {
      type: 'unassigned',
      name: t('workOrderAssignment.unassigned'),
      icon: UserMinus,
      color: 'bg-muted text-foreground border-border'
    };
  };

  const assignment = getAssignmentDisplay();
  const IconComponent = assignment.icon;

  if (isEditing && canManageAssignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('workOrderAssignment.changeAssignment')}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderAssignmentSelector
            workOrder={workOrder}
            organizationId={organizationId}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {t('workOrderAssignment.assignment')}
          {canManageAssignment && showEditControls && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label={t('workOrderAssignment.editAssignment')}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${assignment.color}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{assignment.name}</div>
            <div className="text-sm text-muted-foreground">
              {t(assignment.type === 'user' ? 'workOrderAssignment.individualAssignee' : 'workOrderAssignment.noOneAssigned')}
            </div>
          </div>
          <Badge className={assignment.color}>
            {t(assignment.type === 'user' ? 'workOrderAssignment.assigned' : 'workOrderAssignment.open')}
          </Badge>
        </div>

        {/* Assignment timing info */}
        {acceptanceDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Clock className="h-4 w-4" />
            <span>
              {t('workOrderAssignment.acceptedOn', { date: new Date(acceptanceDate).toLocaleDateString(language === 'en' ? undefined : language) })}
            </span>
          </div>
        )}

        {/* Quick assignment action for managers */}
        {canManageAssignment && assignment.type === 'unassigned' && showEditControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            {t('workOrderAssignment.assignWorkOrder')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkOrderAssigneeDisplay;

