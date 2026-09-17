import { useI18n } from '@/i18n';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import Page from '@/components/layout/Page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useDsrQueue } from '@/features/dsr/hooks/useDsrQueue';
import { DsrQueueRail } from '@/features/dsr/components/DsrQueueRail';
import { DsrAdminAccessGate } from '@/features/dsr/components/DsrAdminAccessGate';
import PageHeader from '@/components/layout/PageHeader';

function DSRCockpitPage() {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { canManageOrganization } = usePermissions();
  const canManageDsr = canManageOrganization();
  const organizationId = canManageDsr ? currentOrganization?.id ?? null : null;
  const queueQuery = useDsrQueue(organizationId);

  return (
    <DsrAdminAccessGate
      hasOrganization={Boolean(currentOrganization)}
      canManageDsr={canManageDsr}
      noOrganizationDescription={t('dsr.cockpitSelectOrg')}
      restrictedDescription={t('dsr.cockpitRestricted')}
    >
    <Page maxWidth="full" padding="workspace">
      <div className="space-y-6">
        <PageHeader
          title={t('dsr.cockpit')}
          description={t('dsr.cockpitDescription')}
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        {queueQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('dsr.queueError')}</AlertTitle>
            <AlertDescription>
              {queueQuery.error instanceof Error ? queueQuery.error.message : t('dsr.queueLoadError')}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <DsrQueueRail requests={queueQuery.data ?? []} />
          <Card>
            <CardHeader>
              <CardTitle>{t('dsr.selectRequest')}</CardTitle>
              <CardDescription>{t('dsr.selectRequestHelp')}</CardDescription>
            </CardHeader>
            <CardContent>
              {(queueQuery.data?.length ?? 0) > 0 ? (
                <Link
                  to={`/dashboard/dsr/${queueQuery.data?.[0]?.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('dsr.openFirst')}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">{t('dsr.noRequests')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
    </DsrAdminAccessGate>
  );
}

export default DSRCockpitPage;
