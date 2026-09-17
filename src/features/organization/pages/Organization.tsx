// fallow-ignore-file code-duplication
// Duplication rationale: Org settings route shares org hub page shell with members/integrations siblings
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePendingWorkspaceMergeRequests } from '@/features/organization/hooks/useWorkspacePersonalOrgMerge';
import { useOrganizationIntegrationOAuthCallbacks } from '@/features/organization/hooks/useOrganizationIntegrationOAuthCallbacks';
import {
  ORGANIZATION_INTEGRATIONS_PATH,
  ORGANIZATION_MEMBERS_PATH,
} from '@/features/organization/constants/routes';
import { OrganizationSettings } from '@/features/organization/components/OrganizationSettings';
import { OrganizationSubnav } from '@/features/organization/components/OrganizationSubnav';
import RestrictedOrganizationAccess from '@/features/organization/components/RestrictedOrganizationAccess';
import { WorkspaceMergeRequestsCard } from '@/features/organization/components/WorkspaceMergeRequestsCard';
import { usePermissions } from '@/hooks/usePermissions';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useI18n } from '@/i18n';

const Organization = () => {
  const { t } = useI18n();
  const { currentOrganization, isLoading } = useOrganization();
  const navigate = useNavigate();
  const { canManageOrganization } = usePermissions();
  useOrganizationIntegrationOAuthCallbacks();

  useEffect(() => {
    if (window.location.hash === '#integrations') {
      navigate(ORGANIZATION_INTEGRATIONS_PATH, { replace: true });
      return;
    }
    if (window.location.hash === '#members') {
      navigate(ORGANIZATION_MEMBERS_PATH, { replace: true });
    }
  }, [navigate]);

  const { data: mergeRequests = [] } = usePendingWorkspaceMergeRequests();

  const currentUserRole: 'owner' | 'admin' | 'member' =
    currentOrganization?.userRole === 'owner' || currentOrganization?.userRole === 'admin'
      ? currentOrganization.userRole
      : 'member';
  const currentOrganizationId = currentOrganization?.id;
  const hasOrganizationSettingsAccess = canManageOrganization();
  const incomingMergeRequests = useMemo(() => {
    if (!currentOrganizationId) {
      return [];
    }

    return mergeRequests.filter(
      (request) => request.is_incoming && request.workspace_org_id === currentOrganizationId,
    );
  }, [mergeRequests, currentOrganizationId]);

  if (isLoading || !currentOrganization) {
    return (
      <Page maxWidth="full" padding="workspace">
        <PageHeader
          title={t('organizationHub.settings')}
          description={t('organizationHub.loading')}
          icon={<Settings className="h-5 w-5" />}
        />
      </Page>
    );
  }

  if (!hasOrganizationSettingsAccess) {
    if (incomingMergeRequests.length > 0) {
      return (
        <Page maxWidth="full" padding="workspace">
          <div className="space-y-6">
            <PageHeader
              title={t('organizationHub.mergeTitle')}
              description={t('organizationHub.mergeDescription', { name: currentOrganization.name })}
              icon={<Settings className="h-5 w-5" />}
            />
            {currentOrganizationId && (
              <WorkspaceMergeRequestsCard
                workspaceOrgId={currentOrganizationId}
                requests={incomingMergeRequests}
              />
            )}
          </div>
        </Page>
      );
    }

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

        {incomingMergeRequests.length > 0 && currentOrganizationId && (
          <WorkspaceMergeRequestsCard
            workspaceOrgId={currentOrganizationId}
            requests={incomingMergeRequests}
          />
        )}

        <div className="border-b pb-4">
          <PageHeader
            title={t('organizationHub.settings')}
            description={t('organizationHub.settingsDescription', { name: currentOrganization.name })}
            icon={<Settings className="h-5 w-5" />}
          />
        </div>

        <Card>
          <CardContent className="px-3 py-4 sm:px-6 sm:py-6">
            <OrganizationSettings organization={currentOrganization} currentUserRole={currentUserRole} />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default Organization;
