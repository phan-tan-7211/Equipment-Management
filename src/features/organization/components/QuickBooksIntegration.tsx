/**
 * QuickBooks Integration Component
 *
 * Compact horizontal-row layout showing connection status and actions.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Link2,
  Unlink,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateQuickBooksAuthUrl,
  isQuickBooksConfigured,
  getConnectionStatus,
  disconnectQuickBooks,
} from '@/services/quickbooks';
import { useQuickBooksAccess } from '@/hooks/useQuickBooksAccess';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { QuickBooksMarkIcon } from '@/components/icons/QuickBooksMarkIcon';
import { IntegrationLoadingCard } from '@/features/organization/components/IntegrationLoadingCard';
import { IntegrationNotConfiguredCard } from '@/features/organization/components/IntegrationNotConfiguredCard';
import {
  IntegrationCardHeader,
  IntegrationCardLayout,
  IntegrationInlineActions,
  integrationActionButtonClassName,
} from '@/features/organization/components/IntegrationCardLayout';

const quickBooksMark = <QuickBooksMarkIcon />;

interface QuickBooksIntegrationProps {
  /** @deprecated - No longer used. Permission is now derived from useQuickBooksAccess hook. */
  currentUserRole?: 'owner' | 'admin' | 'member';
}

export const QuickBooksIntegration = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserRole: _currentUserRole,
}: QuickBooksIntegrationProps) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: canManage = false, isLoading: permissionLoading } = useQuickBooksAccess();

  const isConfigured = isQuickBooksConfigured();

  const {
    data: connectionStatus,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['quickbooks', 'connection', currentOrganization?.id],
    queryFn: () => getConnectionStatus(currentOrganization!.id),
    enabled: !!currentOrganization?.id && canManage && isConfigured,
    staleTime: 60 * 1000,
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectQuickBooks(currentOrganization!.id),
    onSuccess: () => {
      toast.success(t('organizationIntegrations.quickBooksDisconnected'));
      queryClient.invalidateQueries({ queryKey: ['quickbooks', 'connection'] });
    },
    onError: (error: Error) => {
      toast.error(t('organizationIntegrations.disconnectFailed', { message: error.message }));
    },
  });

  const handleConnect = async () => {
    if (!currentOrganization?.id) return;

    setIsConnecting(true);
    try {
      const authUrl = await generateQuickBooksAuthUrl({
        organizationId: currentOrganization.id,
        redirectUrl: window.location.pathname,
      });
      window.location.href = authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizationIntegrations.oauthStartFailed');
      toast.error(message);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm(t('organizationIntegrations.quickBooksConfirm'))) {
      disconnectMutation.mutate();
    }
  };

  if (!permissionLoading && !canManage) {
    return null;
  }

  if (permissionLoading || statusLoading) {
    return <IntegrationLoadingCard label={t('organizationIntegrations.quickBooksLoading')} />;
  }

  if (!isConfigured) {
    return (
      <IntegrationNotConfiguredCard
        title="QuickBooks Online"
        description={t('organizationIntegrations.quickBooksDescription')}
        icon={quickBooksMark}
      />
    );
  }

  if (statusError) {
    return (
      <IntegrationCardLayout>
        <IntegrationCardHeader
          title="QuickBooks Online"
          description={t('organizationIntegrations.quickBooksDescription')}
          icon={quickBooksMark}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{t('organizationIntegrations.connectionFailed')}</AlertDescription>
        </Alert>
      </IntegrationCardLayout>
    );
  }

  const isConnected = connectionStatus?.isConnected;
  const isRefreshTokenExpired = connectionStatus?.isRefreshTokenValid === false;

  return (
    <IntegrationCardLayout>
      <IntegrationCardHeader
        title="QuickBooks Online"
        description={t('organizationIntegrations.quickBooksDescription')}
        icon={quickBooksMark}
        badge={
          isConnected ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('organizationIntegrations.connected')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t('organizationIntegrations.notConnected')}
            </Badge>
          )
        }
        actions={
          isConnected ? (
            <IntegrationInlineActions>
              {isRefreshTokenExpired ? (
                <Button
                  size="sm"
                  className={integrationActionButtonClassName}
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  {t('organizationIntegrations.reconnect')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 ${integrationActionButtonClassName}`}
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {t('organizationIntegrations.disconnect')}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
                <a
                  href="https://appcenter.intuit.com/app/connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('organizationIntegrations.quickBooksManage')}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </IntegrationInlineActions>
          ) : (
            <Button
              size="sm"
              className={integrationActionButtonClassName}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t('organizationIntegrations.connect')}
            </Button>
          )
        }
      />

      {isConnected && isRefreshTokenExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t('organizationIntegrations.authorizationExpired')}
          </AlertDescription>
        </Alert>
      )}
    </IntegrationCardLayout>
  );
};
