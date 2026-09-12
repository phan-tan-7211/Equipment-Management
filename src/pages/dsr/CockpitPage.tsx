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
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('dsr.cockpit')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('dsr.cockpitDescription')}
            </p>
          </div>
        </div>

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
