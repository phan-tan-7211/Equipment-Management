import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { showErrorToast } from '@/utils/errorHandling';
import { logger } from '@/utils/logger';
import { workOrderKeys } from '@/features/work-orders/hooks/useWorkOrders';
import { workOrders as workOrderQueryKeys, notifications as notificationQueryKeys } from '@/lib/queryKeys';
import { useI18n } from '@/i18n';

interface AcceptWorkOrderParams {
  workOrderId: string;
  organizationId: string;
  assigneeId?: string;
}

export const useWorkOrderAcceptance = () => {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({ workOrderId, organizationId, assigneeId }: AcceptWorkOrderParams) => {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const isSingleUserOrg = (orgMembers?.length || 0) === 1;
      let targetStatus: Database['public']['Enums']['work_order_status'] = 'accepted';

      if (isSingleUserOrg) targetStatus = 'in_progress';
      else if (assigneeId) targetStatus = 'assigned';

      const updateData: Database['public']['Tables']['work_orders']['Update'] = {
        status: targetStatus,
        acceptance_date: new Date().toISOString(),
      };

      if (assigneeId || isSingleUserOrg) updateData.assignee_id = assigneeId;

      const { data, error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { workOrderId, organizationId }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(organizationId, workOrderId) });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.pagedList(organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.enhancedList(organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.legacyList(organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.optimized(organizationId) });
      queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.byId(organizationId, workOrderId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.byOrg(organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', organizationId] });
      toast.success(t('workOrderAssignment.acceptedSuccess'));
    },
    onError: (error) => {
      logger.error('Error accepting work order', error);
      toast.error(t('workOrderAssignment.acceptFailed'));
      showErrorToast(error, t('workOrderAssignment.acceptFailed'));
    },
  });
};
