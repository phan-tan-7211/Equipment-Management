// fallow-ignore-file code-duplication
// Duplication rationale: Integrations route shares org hub page shell
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationIntegrationOAuthCallbacks } from '@/features/organization/hooks/useOrganizationIntegrationOAuthCallbacks';
import OrganizationIntegrationsPanel from '@/features/organization/components/OrganizationIntegrationsPanel';
import { OrganizationSubnav } from '@/features/organization/components/OrganizationSubnav';
import RestrictedOrganizationAccess from '@/features/organization/components/RestrictedOrganizationAccess';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Plug } from 'lucide-react';
import { useI18n } from '@/i18n';

const OrganizationIntegrations = () => {
  const { t } = useI18n();
  const { currentOrganization, isLoading } = useOrganization();
  useOrganizationIntegrationOAuthCallbacks();

  const currentUserRole: 'owner' | 'admin' | 'member' =
    currentOrganization?.userRole || 'member';

  if (isLoading || !currentOrganization) {
    return (
      <Page maxWidth="full" padding="workspace">
        <PageHeader
          title={t('organizationHub.integrations')}
          description={t('organizationHub.loading')}
          icon={<Plug className="h-5 w-5" />}
        />
      </Page>
    );
  }

  if (currentUserRole === 'member') {
    return (
      <Page maxWidth="full" padding="workspace">
        <RestrictedOrganizationAccess currentOrganizationName={currentOrganization.name} />
      </Page>
    );
  }

  return (
    <Page maxWidth="full" padding="workspace">
      <div className="space-y-6">
        <OrganizationSubnav />

        <div className="border-b pb-4">
          <PageHeader
            title={t('organizationHub.integrations')}
            description={t('organizationHub.integrationsDescription', { name: currentOrganization.name })}
            icon={<Plug className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardContent className="px-3 py-4 sm:px-6 sm:py-6">
            <OrganizationIntegrationsPanel currentUserRole={currentUserRole} />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default OrganizationIntegrations;
