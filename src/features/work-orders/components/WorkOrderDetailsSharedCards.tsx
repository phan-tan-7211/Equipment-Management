import { useI18n } from '@/i18n';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, History, Users } from 'lucide-react';
import { ORGANIZATION_AUDIT_LOG_PATH } from '@/features/organization/constants/routes';
import CustomerContactActions from '@/features/teams/components/CustomerContactActions';

export function WorkOrderPMChecklistLoadingCard() {
  const { t } = useI18n();
  return (
    <Card className="shadow-elevation-2" role="status" aria-label={t('workOrderDetail.loadingPmChecklist')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          {t('workOrderDetail.loadingPmChecklist')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 bg-muted animate-pulse rounded" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

type WorkOrderAuditLogLinkProps = {
  workOrderId: string;
};

type WorkOrderCustomerContactsCardProps = {
  customerId?: string | null;
  canView: boolean;
};

export function WorkOrderCustomerContactsCard({
  customerId,
  canView,
}: WorkOrderCustomerContactsCardProps) {
  const { t } = useI18n();
  if (!canView || !customerId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('workOrderDetail.customerContacts')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CustomerContactActions
          customerId={customerId}
          emptyLabel={t('workOrderDetail.noQuickBooksContacts')}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Audit data is kept off operational pages (#1122). Owners/admins get a deep
 * link into the dedicated audit log explorer, pre-filtered to this work order.
 */
export function WorkOrderAuditLogLink({ workOrderId }: WorkOrderAuditLogLinkProps) {
  const { t } = useI18n();
  return (
    <Button variant="link" size="sm" asChild className="h-auto px-0 text-xs text-muted-foreground">
      <Link to={`${ORGANIZATION_AUDIT_LOG_PATH}?entityType=work_order&entityId=${workOrderId}`}>
        <History className="mr-1 h-3.5 w-3.5" />
        {t('workOrderDetail.viewAuditHistory')}
      </Link>
    </Button>
  );
}
