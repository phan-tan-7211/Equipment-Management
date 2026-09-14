import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, RefreshCw, Users, Loader2, Unlink, ShieldAlert } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/hooks/useAppToast';
import { useI18n } from '@/i18n';
import {
  getGoogleWorkspaceConnectionStatus,
  syncGoogleWorkspaceUsers,
} from '@/services/google-workspace';
import {
  canSyncGoogleWorkspaceDirectory,
  evaluateGoogleWorkspaceConnectionHealth,
  isGoogleWorkspaceConfigured,
} from '@/services/google-workspace/auth';
import { googleWorkspace } from '@/lib/queryKeys';
import { ORGANIZATION_INTEGRATIONS_PATH, ORGANIZATION_MEMBERS_PATH } from '@/features/organization/constants/routes';
import { GoogleWorkspaceMarkIcon } from '@/components/icons/GoogleWorkspaceMarkIcon';
import { IntegrationLoadingCard } from '@/features/organization/components/IntegrationLoadingCard';
import { IntegrationNotConfiguredCard } from '@/features/organization/components/IntegrationNotConfiguredCard';
import {
  IntegrationCardHeader,
  IntegrationCardLayout,
  integrationActionButtonClassName,
} from '@/features/organization/components/IntegrationCardLayout';
import { GoogleWorkspaceDisconnectDialog } from '@/features/organization/components/GoogleWorkspaceDisconnectDialog';
import { useGoogleWorkspaceConnect } from '@/features/organization/hooks/useGoogleWorkspaceConnect';
import { useGoogleWorkspaceDisconnect } from '@/features/organization/hooks/useGoogleWorkspaceDisconnect';
import { canManageGoogleWorkspaceIntegration } from '@/features/organization/utils/googleWorkspaceManageAccess';

const googleWorkspaceMark = <GoogleWorkspaceMarkIcon />;

interface GoogleWorkspaceIntegrationProps {
  currentUserRole: 'owner' | 'admin' | 'member';
}

export const GoogleWorkspaceIntegration = ({ currentUserRole }: GoogleWorkspaceIntegrationProps) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const canManage = canManageGoogleWorkspaceIntegration(currentUserRole);
  const isConfigured = isGoogleWorkspaceConfigured();
  const organizationId = currentOrganization?.id;

  const { connect: connectDirectory, isConnecting: isConnectingDirectory } = useGoogleWorkspaceConnect({
    organizationId,
    redirectUrl: ORGANIZATION_INTEGRATIONS_PATH,
    consentMode: 'directory',
  });

  const { connect: connectExport, isConnecting: isConnectingExport } = useGoogleWorkspaceConnect({
    organizationId,
    redirectUrl: ORGANIZATION_INTEGRATIONS_PATH,
    consentMode: 'export',
  });

  const isConnecting = isConnectingDirectory || isConnectingExport;

  const disconnectMutation = useGoogleWorkspaceDisconnect(organizationId);

  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: googleWorkspace.connection(organizationId ?? ''),
    queryFn: () => getGoogleWorkspaceConnectionStatus(organizationId!),
    enabled: !!organizationId && canManage,
    staleTime: 60 * 1000,
  });

  const connectionHealth = evaluateGoogleWorkspaceConnectionHealth(connectionStatus);
  const canSyncDirectory = canSyncGoogleWorkspaceDirectory(connectionStatus);

  const handleSync = async () => {
    if (!organizationId) return;
    setIsSyncing(true);
    try {
      const result = await syncGoogleWorkspaceUsers(organizationId);
      const revocationSummary =
        result.membersDeactivated > 0 || result.claimsRevoked > 0
          ? t('organizationIntegrations.syncRevoked', { count: result.membersDeactivated })
          : '';
      toast({
        title: t('organizationIntegrations.directorySynced'),
        description: t('organizationIntegrations.syncLoaded', { count: result.usersSynced, revoked: revocationSummary }),
      });
      await queryClient.invalidateQueries({ queryKey: googleWorkspace.root });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizationIntegrations.tryAgain');
      const isTokenError = /revoked|expired|token|not connected|401|403/i.test(message);
      toast({
        title: t('organizationIntegrations.syncFailed'),
        description: isTokenError
          ? t('organizationIntegrations.authorizationInvalid')
          : message,
        variant: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSettled: () => {
        setDisconnectDialogOpen(false);
      },
    });
  };

  if (!canManage) {
    return null;
  }

  if (!isConfigured) {
    return (
      <IntegrationNotConfiguredCard
        title="Google Workspace"
        description={t('organizationIntegrations.googleDescription')}
        icon={googleWorkspaceMark}
      />
    );
  }

  if (isLoading) {
    return <IntegrationLoadingCard label={t('organizationIntegrations.googleLoading')} />;
  }

  const statusBadge =
    connectionHealth === 'healthy' ? (
      <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
        {t('organizationIntegrations.connected')}
      </Badge>
    ) : connectionHealth === 'missing_permissions' ? (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
        {t('organizationIntegrations.permissionsNeeded')}
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        {t('organizationIntegrations.notConnected')}
      </Badge>
    );

  return (
    <>
      <IntegrationCardLayout>
        <IntegrationCardHeader
          title="Google Workspace"
          icon={googleWorkspaceMark}
          description={
            connectionHealth === 'disconnected'
              ? t('organizationIntegrations.googleDescription')
              : t('organizationIntegrations.domain', { domain: connectionStatus?.domain || t('organizationIntegrations.unknown') })
          }
          badge={statusBadge}
          actions={
            <>
              {connectionHealth === 'disconnected' && (
                <Button
                  size="sm"
                  className={integrationActionButtonClassName}
                  onClick={connectDirectory}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {t('organizationIntegrations.connect')}
                </Button>
              )}

              {connectionHealth === 'healthy' && (
                <>
                  {canSyncDirectory && (
                    <Button
                      size="sm"
                      className={integrationActionButtonClassName}
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {t('organizationIntegrations.syncDirectory')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={integrationActionButtonClassName}
                    onClick={() => setDisconnectDialogOpen(true)}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {t('organizationIntegrations.disconnect')}
                  </Button>
                  <Button variant="ghost" size="sm" className={integrationActionButtonClassName} asChild>
                    <Link to={ORGANIZATION_MEMBERS_PATH}>
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      {t('organizationIntegrations.members')}
                    </Link>
                  </Button>
                </>
              )}

              {connectionHealth === 'missing_permissions' && (
                <>
                  {canSyncDirectory && (
                    <Button
                      size="sm"
                      className={integrationActionButtonClassName}
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {t('organizationIntegrations.syncDirectory')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className={integrationActionButtonClassName}
                    onClick={connectExport}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {t('organizationIntegrations.finishAuthorization')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={integrationActionButtonClassName}
                    onClick={() => setDisconnectDialogOpen(true)}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {t('organizationIntegrations.disconnect')}
                  </Button>
                </>
              )}
            </>
          }
        />

        {connectionHealth === 'missing_permissions' && (
          <Alert>
            <AlertDescription className="text-sm">
              {t('organizationIntegrations.incrementalConsent')}
            </AlertDescription>
          </Alert>
        )}

        {connectionHealth === 'disconnected' && (
          <p className="text-xs text-muted-foreground">
            {t('organizationIntegrations.claimedDomain')}
          </p>
        )}
      </IntegrationCardLayout>

      <GoogleWorkspaceDisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={handleConfirmDisconnect}
        isPending={disconnectMutation.isPending}
      />
    </>
  );
};
