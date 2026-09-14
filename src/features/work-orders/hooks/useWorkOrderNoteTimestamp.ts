import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { workOrders, workOrderMetrics } from '@/lib/queryKeys';
import { invalidateWorkOrderCaches } from '@/features/work-orders/utils/invalidateWorkOrderQueries';
import { updateHistoricalWorkOrderNoteTimestamp } from '@/features/work-orders/services/workOrderNotesService';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditRemainingCopy } from '@/i18n/finalHardcodedAuditRemainingCopy';

type UpdateHistoricalNoteTimestampVariables = {
  workOrderId: string;
  noteId: string;
  createdAt: string;
};

export function useUpdateHistoricalWorkOrderNoteTimestamp() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditRemainingCopy(language);

  return useMutation({
    mutationFn: async ({ workOrderId, noteId, createdAt }: UpdateHistoricalNoteTimestampVariables) => {
      if (!currentOrganization?.id) throw new Error(copy.noteTimestampUpdateFailed);
      if (currentOrganization.userRole !== 'owner' && currentOrganization.userRole !== 'admin') {
        throw new Error(copy.noteTimestampUpdateFailed);
      }

      const result = await updateHistoricalWorkOrderNoteTimestamp(
        currentOrganization.id,
        workOrderId,
        noteId,
        createdAt,
      );

      if (!result.success) throw new Error(result.error ?? copy.noteTimestampUpdateFailed);
      return result;
    },
    onSuccess: (_result, variables) => {
      if (currentOrganization?.id) {
        invalidateWorkOrderCaches(queryClient, currentOrganization.id, variables.workOrderId);
        void queryClient.invalidateQueries({ queryKey: workOrders.notesWithImages(variables.workOrderId) });
        void queryClient.invalidateQueries({ queryKey: workOrders.images(variables.workOrderId) });
        void queryClient.invalidateQueries({ queryKey: workOrderMetrics.imageCount(variables.workOrderId) });
      }
      toast.success(copy.noteTimestampUpdated);
    },
    onError: () => {
      toast.error(copy.noteTimestampUpdateFailed);
    },
  });
}
