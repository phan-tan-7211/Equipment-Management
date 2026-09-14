import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import { createScopedQueryPersister } from '@/lib/queryPersistence';
import {
  getPMByWorkOrderId,
  getPMByWorkOrderAndEquipment,
  getPMsByWorkOrderId,
  getLatestCompletedPMDetails,
  UpdatePMData,
} from '@/features/pm-templates/services/preventativeMaintenanceService';
import { preventiveMaintenance as preventiveMaintenanceKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

function fieldReadPersister() {
  return createScopedQueryPersister().persisterFn;
}

export const usePMByWorkOrderId = (workOrderId: string) => {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['preventativeMaintenance', workOrderId, currentOrganization?.id],
    queryFn: () => getPMByWorkOrderId(workOrderId, currentOrganization!.id),
    enabled: !!workOrderId && !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const usePMByWorkOrderAndEquipment = (workOrderId: string, equipmentId: string) => {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['preventativeMaintenance', workOrderId, equipmentId, currentOrganization?.id],
    queryFn: () => getPMByWorkOrderAndEquipment(workOrderId, equipmentId, currentOrganization!.id),
    enabled: !!workOrderId && !!equipmentId && !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryOnMount: true,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    persister: fieldReadPersister(),
  });
};

const usePMsByWorkOrderId = (workOrderId: string) => {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: ['preventativeMaintenance', 'all', workOrderId, currentOrganization?.id],
    queryFn: () => getPMsByWorkOrderId(workOrderId, currentOrganization!.id),
    enabled: !!workOrderId && !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useLatestCompletedPMDetails = (
  equipmentId: string | undefined,
  organizationId: string | undefined,
) => {
  const enabled = Boolean(equipmentId && organizationId);
  return useQuery({
    queryKey: enabled
      ? preventiveMaintenanceKeys.latestCompletedByEquipment(organizationId!, equipmentId!)
      : (['preventativeMaintenance', 'latest-completed', 'idle'] as const),
    queryFn: () => getLatestCompletedPMDetails(equipmentId!, organizationId!),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};

export const useUpdatePM = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const offlineCtx = useOfflineQueueOptional();

  return useMutation({
    mutationFn: async ({ pmId, data, serverUpdatedAt }: { pmId: string; data: UpdatePMData; serverUpdatedAt?: string }) => {
      if (currentOrganization?.id && user?.id) {
        const svc = new OfflineAwareWorkOrderService(currentOrganization.id, user.id);
        const result = await svc.updatePM(pmId, data, serverUpdatedAt);
        if (result.queuedOffline) {
          offlineCtx?.refresh();
          return null;
        }
        return result.data;
      }
      const { updatePM } = await import('@/features/pm-templates/services/preventativeMaintenanceService');
      return await updatePM(pmId, data);
    },
    onSuccess: (updatedPM) => {
      if (updatedPM && currentOrganization?.id) {
        queryClient.setQueryData(
          ['preventativeMaintenance', updatedPM.work_order_id, updatedPM.equipment_id, currentOrganization.id],
          updatedPM,
        );
        queryClient.invalidateQueries({
          queryKey: ['preventativeMaintenance', updatedPM.work_order_id],
          exact: false,
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['workOrder'],
          exact: false,
          refetchType: 'active',
        });
      } else if (updatedPM === null) {
        toast.success(copy.pmSavedOffline);
      }
    },
    onError: (error) => {
      console.error('Error updating PM:', error);
      toast.error(copy.pmUpdateFailed);
    },
  });
};
