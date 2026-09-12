import { useI18n } from '@/i18n';
import { localizePmStatus } from '@/features/work-orders/utils/workOrderI18nLabels';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Wrench } from 'lucide-react';
import { PMData, PermissionLevels } from '@/features/work-orders/types/workOrderDetails';
import { usePMTemplates } from '@/features/pm-templates/hooks/usePMTemplates';

interface WorkOrderDetailsPMInfoProps {
  workOrder: { has_pm?: boolean };
  pmData?: (Pick<PMData, 'status' | 'template_id'> & { completed_at?: string | null }) | null;
  permissionLevels: Pick<PermissionLevels, 'isManager'> & { isRequestor?: boolean };
}

export const WorkOrderDetailsPMInfo: React.FC<WorkOrderDetailsPMInfoProps> = ({
  workOrder,
  pmData,
  permissionLevels
}) => {
  const { t } = useI18n();
  const { formatDate } = useFormatTimestamp();
  const { data: allTemplates = [] } = usePMTemplates();
  
  // Find the template name if template_id exists
  const templateName = pmData?.template_id 
    ? allTemplates.find(t => t.id === pmData.template_id)?.name 
    : null;

  if (!workOrder.has_pm || !permissionLevels.isRequestor || permissionLevels.isManager || !pmData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          {t('workOrderOperations.preventativeMaintenance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* PM Template Name */}
          {templateName && (
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">{t('workOrderOperations.template')} </span>
                <span className="text-sm text-muted-foreground">{templateName}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('workOrderOperations.pmStatus')}</span>
            <Badge className={
              pmData.status === 'completed' ? 'bg-success/20 text-success' :
              pmData.status === 'in_progress' ? 'bg-info/20 text-info' :
              'bg-warning/20 text-warning'
            }>
              {localizePmStatus(pmData.status, t)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('workOrderOperations.pmStatusDescription')}
          </p>
          {pmData.status === 'completed' && pmData.completed_at && (
            <p className="text-sm text-success">
              {t('workOrderOperations.pmCompletedOn', { date: formatDate(pmData.completed_at) })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

