import React from 'react';
import { AlertTriangle, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePersonalOrgMergePreview, useRespondWorkspaceMerge } from '@/features/organization/hooks/useWorkspacePersonalOrgMerge';
import type { WorkspaceMergeRequest } from '@/features/organization/types/workspacePersonalOrgMerge';
import { useI18n } from '@/i18n';

interface WorkspaceMergeRequestsCardProps {
  workspaceOrgId: string;
  requests: WorkspaceMergeRequest[];
}

export const WorkspaceMergeRequestsCard: React.FC<WorkspaceMergeRequestsCardProps> = ({
  workspaceOrgId,
  requests,
}) => {
  const { t, language } = useI18n();
  const { data: preview, isLoading: previewLoading } = usePersonalOrgMergePreview(workspaceOrgId);
  const respondMerge = useRespondWorkspaceMerge();

  if (requests.length === 0) {
    return null;
  }

  const previewItems = [
    { label: t('organizationAdmin.mergeEquipment'), value: preview?.equipment_count ?? 0 },
    { label: t('organizationAdmin.mergeWorkOrders'), value: preview?.work_orders_count ?? 0 },
    { label: t('organizationAdmin.mergeTemplates'), value: preview?.pm_templates_count ?? 0 },
    { label: t('organizationAdmin.mergeRecords'), value: preview?.pm_records_count ?? 0 },
    { label: t('organizationAdmin.mergeInventory'), value: preview?.inventory_items_count ?? 0 },
  ];

  const hasPersonalOrg = preview?.has_personal_org !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('organizationAdmin.mergeTitle')}
        </CardTitle>
        <CardDescription>
          {t('organizationAdmin.mergeDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {requests.map((request) => (
          <div key={request.id} className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">
                  {t('organizationAdmin.requestedBy', { name: request.requested_by_name })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('organizationAdmin.expires', { time: new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(request.expires_at)) })}
                </div>
                {request.request_reason && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t('organizationAdmin.reason', { reason: request.request_reason })}
                  </div>
                )}
              </div>
              <Badge variant="secondary">{t('organizationAdmin.actionRequired')}</Badge>
            </div>

            {!previewLoading && !hasPersonalOrg && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                <span>{t('organizationAdmin.noPersonalOrg')}</span>
              </div>
            )}

            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {t('organizationAdmin.dataToMerge')}
              </div>
              {previewLoading && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('organizationAdmin.loadingPreview')}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {previewItems.map((item) => (
                  <Badge key={item.label} variant="outline">
                    {item.value} {item.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => respondMerge.mutate({ requestId: request.id, accept: true })}
                disabled={respondMerge.isPending || !hasPersonalOrg}
              >
                {t('organizationAdmin.acceptMerge')}
              </Button>
              <Button
                variant="outline"
                onClick={() => respondMerge.mutate({ requestId: request.id, accept: false })}
                disabled={respondMerge.isPending}
              >
                {t('organizationAdmin.decline')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
