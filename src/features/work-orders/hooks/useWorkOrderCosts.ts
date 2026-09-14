import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  getWorkOrderCosts,
  createWorkOrderCost,
  deleteWorkOrderCostWithInventoryInfo,
  updateWorkOrderCostWithQuantityTracking,
  type UpdateWorkOrderCostData,
} from '@/features/work-orders/services/workOrderCostsService';
import { adjustInventoryQuantity } from '@/features/inventory/services/inventoryService';
import { inventory as inventoryQueryKeys } from '@/lib/queryKeys';
import { useI18n } from '@/i18n';
import {
  formatFinalAuditCopy,
  getFinalHardcodedAuditCopy,
} from '@/i18n/finalHardcodedAuditCopy';

export const useWorkOrderCosts = (workOrderId: string) => {
  return useQuery({
    queryKey: ['work-order-costs', workOrderId],
    queryFn: () => getWorkOrderCosts(workOrderId),
    enabled: !!workOrderId,
  });
};

export const useCreateWorkOrderCost = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: createWorkOrderCost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-costs', data.work_order_id] });
      toast.success(copy.costAdded);
    },
    onError: (error) => {
      logger.error('Error creating cost item', error);
      toast.error(copy.costAddFailed);
    },
  });
};

export const useDeleteWorkOrderCostWithInventoryRestore = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: async ({ costId, organizationId }: { costId: string; organizationId: string }) => {
      const inventoryInfo = await deleteWorkOrderCostWithInventoryInfo(costId);
      if (inventoryInfo) {
        await adjustInventoryQuantity(organizationId, {
          itemId: inventoryInfo.inventory_item_id,
          delta: inventoryInfo.quantity,
          reason: 'Restored from deleted work order cost',
          workOrderId: inventoryInfo.work_order_id,
        });
      }
      return { inventoryRestored: !!inventoryInfo, quantity: inventoryInfo?.quantity ?? 0 };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-costs'] });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.listPrefix(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.metadata(variables.organizationId) });
      toast.success(
        result.inventoryRestored
          ? formatFinalAuditCopy(copy.costDeletedRestored, { count: result.quantity })
          : copy.costDeleted,
      );
    },
    onError: (error) => {
      logger.error('Error deleting cost item with inventory restore', error);
      toast.error(copy.costDeleteFailed);
    },
  });
};

export const useUpdateWorkOrderCostWithInventory = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: async ({ costId, updateData, organizationId }: { costId: string; updateData: UpdateWorkOrderCostData; organizationId: string }) => {
      const result = await updateWorkOrderCostWithQuantityTracking(costId, updateData);
      if (result.inventoryAdjustment) {
        const { inventory_item_id, delta } = result.inventoryAdjustment;
        await adjustInventoryQuantity(organizationId, {
          itemId: inventory_item_id,
          delta,
          reason: delta > 0
            ? 'Returned from work order cost quantity reduction'
            : 'Used in work order cost quantity increase',
          workOrderId: result.cost.work_order_id,
        });
      }
      return {
        cost: result.cost,
        inventoryAdjusted: !!result.inventoryAdjustment,
        delta: result.inventoryAdjustment?.delta ?? 0,
      };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-costs', result.cost.work_order_id] });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.listPrefix(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.metadata(variables.organizationId) });
      if (result.inventoryAdjusted) {
        const template = result.delta > 0 ? copy.costUpdatedRestored : copy.costUpdatedTaken;
        toast.success(formatFinalAuditCopy(template, { count: Math.abs(result.delta) }));
      } else {
        toast.success(copy.costUpdated);
      }
    },
    onError: (error) => {
      logger.error('Error updating cost item with inventory', error);
      toast.error(copy.costUpdateFailed);
    },
  });
};
