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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen, TriangleAlert, Users } from 'lucide-react';
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
      <Page maxWidth="7xl" padding="responsive">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('organizationHub.members')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('organizationHub.loading')}</p>
          </div>
        </div>
      </Page>
    );
  }

  if (currentUserRole === 'member') {
    if (incomingMergeRequests.length > 0) {
      return (
        <Page maxWidth="7xl" padding="responsive">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('organizationHub.mergeTitle')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {t('organizationHub.mergeDescription', { name: currentOrganization.name })}
              </p>
            </div>
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
      <Page maxWidth="7xl" padding="responsive">
        <RestrictedOrganizationAccess currentOrganizationName={currentOrganization.name} />
      </Page>
    );
  }

  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-4 sm:space-y-6">
        <OrganizationSubnav />

        {incomingMergeRequests.length > 0 && currentOrganizationId && (
          <WorkspaceMergeRequestsCard
            workspaceOrgId={currentOrganizationId}
            requests={incomingMergeRequests}
          />
        )}

        <div className="pb-1 sm:pb-4 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border bg-muted/40 p-2.5 shrink-0">
                <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('organizationHub.members')}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('organizationHub.membersDescription', { name: currentOrganization.name })}
                </p>
              </div>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('organizationMembers.setupGuide')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('organizationMembers.setupGuideTitle')}</DialogTitle>
                  <DialogDescription>{t('organizationMembers.setupGuideDescription')}</DialogDescription>
                </DialogHeader>

                <ol className="space-y-4 text-sm list-decimal pl-5">
                  <li className="pl-1">
                    <p>{t('organizationMembers.setupStep1')}</p>
                    <code className="mt-2 block rounded-md bg-muted px-3 py-2 text-xs sm:text-sm">
                      VITE_ALLOW_PUBLIC_SIGNUP=true
                    </code>
                  </li>
                  <li className="pl-1">{t('organizationMembers.setupStep2')}</li>
                  <li className="pl-1">{t('organizationMembers.setupStep3')}</li>
                  <li className="pl-1">{t('organizationMembers.setupStep4')}</li>
                  <li className="pl-1">{t('organizationMembers.setupStep5')}</li>
                  <li className="pl-1">{t('organizationMembers.setupStep6')}</li>
                </ol>

                <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <p>{t('organizationMembers.setupWarning')}</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
