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

type GuideTableProps = {
  headers: [string, string];
  rows: Array<[string, string]>;
};

const GuideTable = ({ headers, rows }: GuideTableProps) => (
  <div className="overflow-x-auto rounded-md border">
    <table className="w-full min-w-[520px] text-left text-sm">
      <thead className="bg-muted/60">
        <tr>
          <th className="px-3 py-2 font-medium">{headers[0]}</th>
          <th className="px-3 py-2 font-medium">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={`${label}-${value}`} className="border-t">
            <td className="px-3 py-2 align-top font-medium">{label}</td>
            <td className="px-3 py-2 align-top text-muted-foreground">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GuideSteps = ({ steps }: { steps: string[] }) => (
  <ol className="space-y-2 text-sm list-decimal pl-5">
    {steps.map((step) => (
      <li key={step} className="pl-1">{step}</li>
    ))}
  </ol>
);

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
              <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('organizationMembers.setupGuideTitle')}</DialogTitle>
                  <DialogDescription>{t('organizationMembers.setupGuideDescription')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-8">
                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">1. {t('organizationMembers.setupAdminTitle')}</h2>
                    <GuideSteps steps={[
                      t('organizationMembers.setupAdminStep1'),
                      t('organizationMembers.setupAdminStep2'),
                      t('organizationMembers.setupAdminStep3'),
                      t('organizationMembers.setupAdminStep4'),
                      t('organizationMembers.setupAdminStep5'),
                      t('organizationMembers.setupAdminStep6'),
                      t('organizationMembers.setupAdminStep7'),
                      t('organizationMembers.setupAdminStep8'),
                    ]} />
                    <code className="block rounded-md bg-muted px-3 py-2 text-xs sm:text-sm">
                      VITE_ALLOW_PUBLIC_SIGNUP=true
                    </code>
                    <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                      <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                      <p>{t('organizationMembers.setupAdminWarning')}</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">2. {t('organizationMembers.setupInviteTitle')}</h2>
                    <GuideSteps steps={[
                      t('organizationMembers.setupInviteStep1'),
                      t('organizationMembers.setupInviteStep2'),
                      t('organizationMembers.setupInviteStep3'),
                      t('organizationMembers.setupInviteStep4'),
                      t('organizationMembers.setupInviteStep5'),
                      t('organizationMembers.setupInviteStep6'),
                      t('organizationMembers.setupInviteStep7'),
                    ]} />
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">3. {t('organizationMembers.setupEmployeeTitle')}</h2>
                    <GuideSteps steps={[
                      t('organizationMembers.setupEmployeeStep1'),
                      t('organizationMembers.setupEmployeeStep2'),
                      t('organizationMembers.setupEmployeeStep3'),
                      t('organizationMembers.setupEmployeeStep4'),
                      t('organizationMembers.setupEmployeeStep5'),
                      t('organizationMembers.setupEmployeeStep6'),
                      t('organizationMembers.setupEmployeeStep7'),
                    ]} />
                    <p className="text-sm text-muted-foreground">{t('organizationMembers.setupEmployeeNote')}</p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">4. {t('organizationMembers.setupLoginTitle')}</h2>
                    <GuideTable
                      headers={[
                        t('organizationMembers.setupLoginUserHeader'),
                        t('organizationMembers.setupLoginMethodHeader'),
                      ]}
                      rows={[
                        [t('organizationMembers.setupLoginAdmin'), t('organizationMembers.setupLoginAdminMethod')],
                        [t('organizationMembers.setupLoginEmployee'), t('organizationMembers.setupLoginEmployeeMethod')],
                        [t('organizationMembers.setupLoginGoogle'), t('organizationMembers.setupLoginGoogleMethod')],
                        [t('organizationMembers.setupLoginNewPhone'), t('organizationMembers.setupLoginNewPhoneMethod')],
                      ]}
                    />
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">5. {t('organizationMembers.setupLinksTitle')}</h2>
                    <GuideTable
                      headers={[
                        t('organizationMembers.setupLinksPathHeader'),
                        t('organizationMembers.setupLinksFunctionHeader'),
                      ]}
                      rows={[
                        ['/auth', t('organizationMembers.setupLinkAuth')],
                        ['/auth?tab=signup', t('organizationMembers.setupLinkSignup')],
                        [t('organizationMembers.setupLinkInvitePath'), t('organizationMembers.setupLinkInvite')],
                        ['Organization → Members', t('organizationMembers.setupLinkMembers')],
                        ['Organization → Members → Invite Member', t('organizationMembers.setupLinkInviteMember')],
                      ]}
                    />
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">6. {t('organizationMembers.setupLocalTitle')}</h2>
                    <p className="text-sm">{t('organizationMembers.setupLocalEnable')}</p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs sm:text-sm"><code>{`$env:VITE_ALLOW_PUBLIC_SIGNUP="true"\nnpm run build\nnpm run preview -- --port 4174 --strictPort`}</code></pre>
                    <p className="text-sm">{t('organizationMembers.setupLocalDisable')}</p>
                    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs sm:text-sm"><code>{`Remove-Item Env:VITE_ALLOW_PUBLIC_SIGNUP\nnpm run build\nnpm run preview -- --port 4174 --strictPort`}</code></pre>
                    <p className="text-sm text-muted-foreground">{t('organizationMembers.setupStrictPortNote')}</p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold">7. {t('organizationMembers.setupSecurityTitle')}</h2>
                    <GuideTable
                      headers={[
                        t('organizationMembers.setupSecurityRuleHeader'),
                        t('organizationMembers.setupSecurityStatusHeader'),
                      ]}
                      rows={[
                        [t('organizationMembers.setupSecurityOutsider'), t('organizationMembers.setupStatusLocked')],
                        [t('organizationMembers.setupSecurityEmployeeOrg'), t('organizationMembers.setupStatusLocked')],
                        [t('organizationMembers.setupSecurityEmployeePassword'), t('organizationMembers.setupStatusAllowed')],
                        [t('organizationMembers.setupSecurityAdminInvite'), t('organizationMembers.setupStatusAllowed')],
                        [t('organizationMembers.setupSecurityEmployeePhone'), t('organizationMembers.setupStatusAllowed')],
                        [t('organizationMembers.setupSecurityPublicSignup'), t('organizationMembers.setupStatusNotRecommended')],
                      ]}
                    />
                    <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                      <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                      <p>{t('organizationMembers.setupBackendWarning')}</p>
                    </div>
                    <p className="text-sm font-medium">{t('organizationMembers.setupFlowLabel')}</p>
                    <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs sm:text-sm">{t('organizationMembers.setupFlow')}</pre>
                  </section>
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
