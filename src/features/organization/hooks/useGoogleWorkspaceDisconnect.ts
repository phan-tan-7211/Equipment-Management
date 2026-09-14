import { useI18n } from '@/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { disconnectGoogleWorkspace } from '@/services/google-workspace';
import { googleWorkspace } from '@/lib/queryKeys';
import { useAppToast } from '@/hooks/useAppToast';
import { assertCanManageGoogleWorkspaceIntegration } from '@/features/organization/utils/googleWorkspaceManageAccess';

export function useGoogleWorkspaceDisconnect(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error('Organization is required to disconnect Google Workspace.');
      }

      await assertCanManageGoogleWorkspaceIntegration(organizationId);
      return disconnectGoogleWorkspace(organizationId);
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: googleWorkspace.root }),
        queryClient.invalidateQueries({ queryKey: googleWorkspace.onboardingRoot }),
      ]);

      toast({
        title: t('organizationNotices.workspaceDisconnected'),
        description: result.domain
          ? t('organizationNotices.disconnectedDomain', { domain: result.domain })
          : t('organizationNotices.disconnectedGeneral'),
      });

      navigate('/dashboard/onboarding/workspace');
    },
    onError: (error: Error) => {
      toast({
        title: t('organizationNotices.workspaceDisconnectFailed'),
        description: error.message || t('organizationNotices.tryAgain'),
        variant: 'error',
      });
    },
  });
}
