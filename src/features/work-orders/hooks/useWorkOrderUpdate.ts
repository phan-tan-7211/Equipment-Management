import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { showErrorToast } from '@/utils/errorHandling';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import type { WorkOrderServerSnapshot } from '@/services/offlineQueueService';
import { preventiveMaintenance } from '@/lib/queryKeys';
import { invalidateWorkOrderCaches } from '@/features/work-orders/utils/invalidateWorkOrderQueries';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy';
import { getFinalHardcodedAuditRemainingCopy } from '@/i18n/finalHardcodedAuditRemainingCopy';

export interface UpdateWorkOrderData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueDateHasTime?: boolean;
  estimatedHours?: number;
  hasPM?: boolean;
}

interface UpdateWorkOrderResult {
  result: Record<string, unknown> | null;
  queuedOffline: boolean;
}

export const useUpdateWorkOrder = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const extra = getFinalHardcodedAuditExtraCopy(language);
  const copy = getFinalHardcodedAuditRemainingCopy(language);
  const queryClient = useQueryClient();
  const offlineCtx = useOfflineQueueOptional();

  return useMutation({
    mutationFn: async ({
      workOrderId,
      data,
      serverUpdatedAt,
      serverSnapshot,
    }: {
      workOrderId: string;
      data: UpdateWorkOrderData;
      serverUpdatedAt?: string;
      serverSnapshot?: WorkOrderServerSnapshot;
    }): Promise<UpdateWorkOrderResult> => {
      if (!currentOrganization?.id || !user?.id) throw new Error(copy.workOrderUpdateFailed);

      const svc = new OfflineAwareWorkOrderService(currentOrganization.id, user.id);
      const result = await svc.updateWorkOrder(workOrderId, data, serverUpdatedAt, serverSnapshot);

      if (result.queuedOffline) {
        offlineCtx?.refresh();
        return { result: null, queuedOffline: true };
      }

      return { result: result.data, queuedOffline: false };
    },
    onSuccess: ({ queuedOffline }, variables) => {
      if (queuedOffline) {
        toast({
          title: extra.savedOffline,
          description: extra.changesSyncLater,
        });
        return;
      }

      const { workOrderId } = variables;
      const orgId = currentOrganization?.id ?? '';
      invalidateWorkOrderCaches(queryClient, orgId, workOrderId);
      queryClient.invalidateQueries({ queryKey: preventiveMaintenance.byWorkOrder(workOrderId) });

      toast({
        title: copy.workOrderUpdatedTitle,
        description: copy.workOrderUpdatedDescription,
      });
    },
    onError: (error) => {
      console.error('Update work order error:', error);
      toast({
        title: extra.workOrderStatusUpdateFailedTitle,
        description: copy.workOrderUpdateFailed,
        variant: 'destructive',
      });
      showErrorToast(error, t('workOrderForm.editTitle'));
    },
  });
};
