import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WorkOrderService } from '@/features/work-orders/services/workOrderService';
import { workOrderKeys } from '@/features/work-orders/hooks/useWorkOrders';
import { workOrders as workOrderQueryKeys, notifications as notificationQueryKeys } from '@/lib/queryKeys';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

export type NotificationData = {
  work_order_id?: string;
  team_id?: string;
  transfer_id?: string;
  organization_id?: string;
  organization_name?: string;
  workspace_org_id?: string;
  workspace_org_name?: string;
  merge_request_id?: string;
  from_user_id?: string;
  from_user_name?: string;
  new_org_id?: string;
  reason?: string;
  [key: string]: unknown;
};

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: NotificationData;
  read: boolean;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root });
    },
  });
};

export const useUpdateWorkOrderStatus = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: async ({ workOrderId, status, organizationId, assigneeId }: { workOrderId: string; status: string; organizationId: string; assigneeId?: string | null }) => {
      const service = new WorkOrderService(organizationId);
      const response = await service.updateStatus(
        workOrderId,
        status as 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
        assigneeId,
      );
      if (!response.success) throw new Error(response.error || copy.workOrderStatusUpdateFailed);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(variables.organizationId, variables.workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.pagedList(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.optimized(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.byId(variables.organizationId, variables.workOrderId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byOrg(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', variables.organizationId] });
      toast.success(copy.workOrderStatusUpdated);
    },
    onError: (error) => {
      console.error('Error updating work order status:', error);
      toast.error(copy.workOrderStatusUpdateFailed);
    },
  });
};
