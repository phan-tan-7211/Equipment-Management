import { useI18n } from '@/i18n';
import { useCallback, useState } from 'react';
import { generateGoogleWorkspaceAuthUrl } from '@/services/google-workspace/auth';
import { useAppToast } from '@/hooks/useAppToast';

interface UseGoogleWorkspaceConnectOptions {
  organizationId: string | undefined;
  redirectUrl: string;
  consentMode?: 'directory' | 'export';
}

export function useGoogleWorkspaceConnect({
  organizationId,
  redirectUrl,
  consentMode = 'directory',
}: UseGoogleWorkspaceConnectOptions) {
  const { toast } = useAppToast();
  const { t } = useI18n();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    setIsConnecting(true);
    try {
      const authUrl = await generateGoogleWorkspaceAuthUrl({
        organizationId,
        redirectUrl,
        consentMode,
      });
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: t('organizationNotices.workspaceConnectFailed'),
        description: error instanceof Error ? error.message : t('organizationNotices.tryAgain'),
        variant: 'error',
      });
      setIsConnecting(false);
    }
  }, [organizationId, redirectUrl, consentMode, toast, t]);

  return { connect, isConnecting };
}
