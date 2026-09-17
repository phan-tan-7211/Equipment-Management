// fallow-ignore-file code-duplication
// Duplication rationale: Members route shares org hub page shell with settings/integrations siblings
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationMembersQuery } from '@/features/organization/hooks/useOrganizationMembers';
import { usePendingWorkspaceMergeRequests } from '@/features/organization/hooks/useWorkspacePersonalOrgMerge';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { OrganizationSubnav } from '@/features/organization/components/OrganizationSubnav';
import UnifiedMembersList from '@/features/organization/components/UnifiedMembersList';
import RestrictedOrganizationAccess from '@/features/organization/components/RestrictedOrganizationAccess';
import { WorkspaceMergeRequestsCard } from '@/features/organization/components/WorkspaceMergeRequestsCard';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Users } from 'lucide-react';
import { useMemo } from 'react';
import { useI18n } from '@/i18n';

const OrganizationMembers = () => {
  const { t } = useI18n();
  const { currentOrganization, isLoading } = useOrganization();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembersQuery(
    currentOrganization?.id || '',
  );
  const permissions = usePagePermissions(currentOrganization);
  const { data: mergeRequests = [] } = usePendingWorkspaceMergeRequests();

  const currentUserRole: 'owner' | 'admin' | 'member' = currentOrganization?.userRole || 'member';
  const currentOrganizationId = currentOrganization?.id;
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
          title={t('organizationHub.members')}
          description={t('organizationHub.loading')}
          icon={<Users className="h-5 w-5" />}
        />
      </Page>
    );
  }

  if (currentUserRole === 'member') {
    if (incomingMergeRequests.length > 0) {
      return (
        <Page maxWidth="full" padding="workspace">
          <div className="space-y-6">
            <PageHeader
              title={t('organizationHub.mergeTitle')}
              description={t('organizationHub.mergeDescription', { name: currentOrganization.name })}
              icon={<Users className="h-5 w-5" />}
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
            title={t('organizationHub.members')}
            description={t('organizationHub.membersDescription', { name: currentOrganization.name })}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <UnifiedMembersList
          members={members}
          organizationId={currentOrganization.id}
          currentUserRole={currentUserRole}
          isLoading={membersLoading}
          canInviteMembers={!!permissions?.canInviteMembers}
        />
      </div>
    </Page>
  );
};

export default OrganizationMembers;
