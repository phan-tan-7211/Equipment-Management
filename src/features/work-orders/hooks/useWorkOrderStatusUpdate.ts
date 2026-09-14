import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { showErrorToast } from '@/utils/errorHandling';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import { invalidateWorkOrderCaches } from '@/features/work-orders/utils/invalidateWorkOrderQueries';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy';

interface StatusUpdateData {
  workOrderId: string;
  newStatus: Database["public"]["Enums"]["work_order_status"];
  serverUpdatedAt?: string;
}

interface StatusUpdateResult {
  data: Record<string, unknown> | null;
  queuedOffline: boolean;
}

export const useWorkOrderStatusUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const extra = getFinalHardcodedAuditExtraCopy(language);
  const offlineCtx = useOfflineQueueOptional();

  return useMutation({
    mutationFn: async ({ workOrderId, newStatus, serverUpdatedAt }: StatusUpdateData): Promise<StatusUpdateResult> => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error(copy.workOrderStatusUpdateFailed);
      }

      const svc = new OfflineAwareWorkOrderService(currentOrganization.id, user.id);
      const result = await svc.updateStatus(workOrderId, newStatus, serverUpdatedAt);

      if (result.queuedOffline) {
        offlineCtx?.refresh();
        return { data: null, queuedOffline: true };
      }

      return { data: result.data, queuedOffline: false };
    },
    onSuccess: ({ queuedOffline }, { workOrderId }) => {
      if (queuedOffline) {
        toast({
          title: extra.savedOffline,
          description: extra.statusSyncLater,
        });
        return;
      }

      if (currentOrganization?.id) {
        invalidateWorkOrderCaches(queryClient, currentOrganization.id, workOrderId);
      }

      toast({
        title: extra.workOrderStatusUpdatedTitle,
        description: extra.workOrderStatusUpdatedDescription,
      });
    },
    onError: (error: Error) => {
      console.error('Status update error:', error);
      toast({
        title: extra.workOrderStatusUpdateFailedTitle,
        description: copy.workOrderStatusUpdateFailed,
        variant: 'destructive',
      });
      showErrorToast(error, t('workOrderForm.editTitle'));
    },
  });
};
