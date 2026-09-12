// fallow-ignore-file code-duplication
// Duplication rationale: Onboarding reuses workspace member import table semantics
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSession } from '@/hooks/useSession';
import { useWorkspaceOnboardingState } from '@/hooks/useWorkspaceOnboarding';
import { useAppToast } from '@/hooks/useAppToast';
import { useI18n } from '@/i18n';
import {
  getGoogleWorkspaceConnectionStatus,
  listWorkspaceDirectoryUsers,
  selectGoogleWorkspaceMembers,
  syncGoogleWorkspaceUsers,
} from '@/services/google-workspace';
import { generateGoogleWorkspaceAuthUrl, isGoogleWorkspaceConfigured } from '@/services/google-workspace/auth';
import { isConsumerGoogleDomain } from '@/utils/google-workspace';
import { getGoogleWorkspaceOAuthErrorMessage } from '@/utils/google-workspace-oauth-errors';
import { googleWorkspace } from '@/lib/queryKeys';
import { useGoogleWorkspaceMemberSelection } from '@/features/organization/hooks/useGoogleWorkspaceMemberSelection';
import { GoogleWorkspaceDisconnectDialog } from '@/features/organization/components/GoogleWorkspaceDisconnectDialog';
import { useGoogleWorkspaceDisconnect } from '@/features/organization/hooks/useGoogleWorkspaceDisconnect';
import { useGoogleWorkspaceManageAccess } from '@/features/organization/hooks/useGoogleWorkspaceManageAccess';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const WorkspaceOnboarding = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { refreshSession } = useSession();
  const { switchOrganization } = useOrganization();
  const { toast } = useAppToast();
  const { formatDate } = useFormatTimestamp();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: onboardingState, isLoading, refetch } = useWorkspaceOnboardingState();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [adminEmails, setAdminEmails] = useState<Set<string>>(new Set());
  const { toggleEmail, toggleAdmin, clearSelection } = useGoogleWorkspaceMemberSelection(
    setSelectedEmails,
    setAdminEmails,
  );

  // Handle OAuth callback parameters
  const gwError = searchParams.get('gw_error');
  const gwSupportRef = searchParams.get('gw_ref');
  const gwConnected = searchParams.get('gw_connected');
  const gwErrorMessage = gwError
    ? getGoogleWorkspaceOAuthErrorMessage(gwError, gwSupportRef, t)
    : null;

  // Clear query params after displaying them
  useEffect(() => {
    if (gwError || gwConnected) {
      // Show toast for success
      if (gwConnected === 'true' && !gwError) {
        toast({
          title: t('workspaceOnboarding.connected'),
          description: t('workspaceOnboarding.connectedDescription'),
        });
        // Refresh data after successful connection
        refetch();
        refreshSession();
      }
      // Clear the query params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('gw_error');
      newParams.delete('gw_error_description');
      newParams.delete('gw_ref');
      newParams.delete('gw_connected');
      setSearchParams(newParams, { replace: true });
    }
  }, [gwError, gwConnected, searchParams, setSearchParams, toast, refetch, refreshSession, t]);

  const isGoogleUser = useMemo(() => {
    const provider = (user?.app_metadata as { provider?: string })?.provider;
    const providers = (user?.app_metadata as { providers?: string[] })?.providers || [];
    return provider === 'google' || providers.includes('google');
  }, [user]);

  const domain = onboardingState?.domain || null;
  const isConsumerDomain = isConsumerGoogleDomain(domain);

  const workspaceOrgId = onboardingState?.workspace_org_id || null;

  const { canManage: canManageWorkspaceDisconnect } = useGoogleWorkspaceManageAccess(workspaceOrgId);
  const disconnectMutation = useGoogleWorkspaceDisconnect(workspaceOrgId ?? undefined);

  const { data: connectionStatus } = useQuery({
    queryKey: googleWorkspace.connection(workspaceOrgId ?? ''),
    queryFn: () => getGoogleWorkspaceConnectionStatus(workspaceOrgId!),
    enabled: !!workspaceOrgId,
    staleTime: 60 * 1000,
  });

  const { data: directoryUsers = [] } = useQuery({
    queryKey: googleWorkspace.directoryUsers(workspaceOrgId ?? ''),
    queryFn: () => listWorkspaceDirectoryUsers(workspaceOrgId!),
    enabled: !!workspaceOrgId && connectionStatus?.is_connected,
    staleTime: 60 * 1000,
  });

  // Only auto-switch to workspace org after OAuth callback
  // Otherwise, let users freely choose their organization
  useEffect(() => {
    // After OAuth callback, switch to workspace org
    if (gwConnected === 'true' && workspaceOrgId) {
      switchOrganization(workspaceOrgId);
    }
  }, [gwConnected, workspaceOrgId, switchOrganization]);

  const handleConnectWorkspace = async () => {
    setIsConnecting(true);
    try {
      // For first-time setup, don't pass organization_id - the callback will create one
      const authUrl = await generateGoogleWorkspaceAuthUrl({
        ...(workspaceOrgId ? { organizationId: workspaceOrgId } : {}),
        redirectUrl: '/dashboard/onboarding/workspace',
        consentMode: 'directory',
      });
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: t('workspaceOnboarding.connectFailed'),
        description: error instanceof Error ? error.message : t('workspaceOnboarding.tryAgain'),
        variant: 'error',
      });
      setIsConnecting(false);
    }
  };

  const handleSyncUsers = async () => {
    if (!workspaceOrgId) return;
    setIsSyncing(true);
    try {
      const result = await syncGoogleWorkspaceUsers(workspaceOrgId);
      const revocationSummary =
        result.membersDeactivated > 0 || result.claimsRevoked > 0
          ? t('workspaceOnboarding.revoked', { members: result.membersDeactivated, claims: result.claimsRevoked })
          : '';
      toast({
        title: t('workspaceOnboarding.directorySynced'),
        description: t('workspaceOnboarding.loaded', { count: result.usersSynced, revoked: revocationSummary }),
      });
      await queryClient.invalidateQueries({ queryKey: googleWorkspace.directoryUsers(workspaceOrgId) });
    } catch (error) {
      toast({
        title: t('workspaceOnboarding.syncFailed'),
        description: error instanceof Error ? error.message : t('workspaceOnboarding.tryAgain'),
        variant: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: async () => {
        await refetch();
      },
      onSettled: () => {
        setDisconnectDialogOpen(false);
      },
    });
  };

  const handleAddMembers = async () => {
    if (!workspaceOrgId || selectedEmails.size === 0) return;
    try {
      const result = await selectGoogleWorkspaceMembers(
        workspaceOrgId,
        Array.from(selectedEmails),
        Array.from(adminEmails)
      );
      toast({
        title: t('workspaceOnboarding.membersAdded'),
        description: t('workspaceOnboarding.added', { count: result.members_added, admins: result.admin_applied, pending: result.admin_pending }),
      });
      clearSelection();
      await refetch();
    } catch (error) {
      toast({
        title: t('workspaceOnboarding.addFailed'),
        description: error instanceof Error ? error.message : t('workspaceOnboarding.tryAgain'),
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <PageHeader title={t('workspaceOnboarding.title')} description={t('workspaceOnboarding.preparing')} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Page>
    );
  }

  if (!user || !isGoogleUser || !onboardingState || isConsumerDomain) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <PageHeader
          title={t('workspaceOnboarding.title')}
          description={t('workspaceOnboarding.businessOnly')}
        />
        <Alert>
          <AlertDescription>
            {t('workspaceOnboarding.signIn')}
          </AlertDescription>
        </Alert>
      </Page>
    );
  }

  const isConnected = connectionStatus?.is_connected;
  const showConnectButton = !isConnected;

  return (
    <Page maxWidth="7xl" padding="responsive">
      <PageHeader
        title={t('workspaceOnboarding.title')}
        description={t('workspaceOnboarding.setupFor', { domain: onboardingState.domain })}
      />

      <div className="space-y-6">
        {/* Error Alert */}
        {gwErrorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('workspaceOnboarding.connectionFailed')}</AlertTitle>
            <AlertDescription>{gwErrorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Connect Workspace Card */}
        {showConnectButton && (
          <Card>
            <CardHeader>
              <CardTitle>{t('workspaceOnboarding.connectTitle')}</CardTitle>
              <CardDescription>
                {t('workspaceOnboarding.connectDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGoogleWorkspaceConfigured() && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {t('workspaceOnboarding.notConfigured')}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleConnectWorkspace} 
                disabled={!isGoogleWorkspaceConfigured() || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('workspaceOnboarding.connecting')}
                  </>
                ) : (
                  t('workspaceOnboarding.connectTitle')
                )}
              </Button>

              <p className="text-sm text-muted-foreground">
                {t('workspaceOnboarding.redirectHelp')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Connected Status + Sync Card */}
        {isConnected && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  {t('workspaceOnboarding.connectedTitle')}
                </CardTitle>
                <CardDescription>
                  {t('workspaceOnboarding.organizationConnected')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>{t('workspaceOnboarding.connectedDomain', { domain: connectionStatus.domain })}</div>
                  <div>{t('workspaceOnboarding.connectedOn', { date: connectionStatus.connected_at ? formatDate(connectionStatus.connected_at) : t('workspaceOnboarding.unknown') })}</div>
                </div>
                
                <div className="pt-4 border-t">
                  {canManageWorkspaceDisconnect ? (
                    <>
                      <p className="text-sm font-medium mb-2">{t('workspaceOnboarding.disconnectTitle')}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDisconnectDialogOpen(true)}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('workspaceOnboarding.disconnecting')}
                          </>
                        ) : (
                          t('workspaceOnboarding.disconnectTitle')
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('workspaceOnboarding.disconnectDescription')}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('workspaceOnboarding.disconnectAdminOnly')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('workspaceOnboarding.syncTitle')}</CardTitle>
                <CardDescription>
                  {t('workspaceOnboarding.syncDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleSyncUsers} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('workspaceOnboarding.syncing')}
                    </>
                  ) : (
                    t('workspaceOnboarding.syncDirectory')
                  )}
                </Button>

                {directoryUsers.length > 0 && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('workspaceOnboarding.include')}</TableHead>
                          <TableHead>{t('workspaceOnboarding.email')}</TableHead>
                          <TableHead>{t('workspaceOnboarding.name')}</TableHead>
                          <TableHead>{t('workspaceOnboarding.makeAdmin')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {directoryUsers.map((dirUser) => {
                          const email = dirUser.primary_email;
                          const isSelected = selectedEmails.has(email);
                          const isAdmin = adminEmails.has(email);
                          return (
                            <TableRow key={dirUser.id}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => toggleEmail(email, Boolean(checked))}
                                  aria-label={t('workspaceOnboarding.selectEmail', { email })}
                                />
                              </TableCell>
                              <TableCell>{email}</TableCell>
                              <TableCell>{dirUser.full_name || '-'}</TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={isAdmin}
                                  disabled={!isSelected}
                                  onCheckedChange={(checked) => toggleAdmin(email, Boolean(checked))}
                                  aria-label={t('workspaceOnboarding.makeAdminEmail', { email })}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <Button
                      onClick={handleAddMembers}
                      disabled={selectedEmails.size === 0}
                    >
                      {t('workspaceOnboarding.addSelected')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <GoogleWorkspaceDisconnectDialog
        open={disconnectDialogOpen && canManageWorkspaceDisconnect}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={handleConfirmDisconnect}
        isPending={disconnectMutation.isPending}
      />
    </Page>
  );
};

export default WorkspaceOnboarding;
