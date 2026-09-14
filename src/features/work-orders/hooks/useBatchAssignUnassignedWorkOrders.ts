import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAuthClaims } from '@/lib/authClaims';
import { workOrders } from '@/lib/queryKeys';
import { useI18n } from '@/i18n';
import {
  formatRemainingCopy,
  getFinalHardcodedAuditRemainingCopy,
} from '@/i18n/finalHardcodedAuditRemainingCopy';

export const useBatchAssignUnassignedWorkOrders = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditRemainingCopy(language);

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const claims = await getAuthClaims();
      if (!claims) throw new Error(copy.batchAssignFailed);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('member_count')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      if (orgData.member_count !== 1) throw new Error(copy.batchAssignFailed);

      const { data: unassignedOrders, error: ordersError } = await supabase
        .from('work_orders')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'submitted')
        .is('assignee_id', null);

      if (ordersError) throw ordersError;

      if (unassignedOrders && unassignedOrders.length > 0) {
        const { error: updateError } = await supabase
          .from('work_orders')
          .update({
            assignee_id: claims.sub,
            status: 'assigned',
            acceptance_date: new Date().toISOString(),
          })
          .in('id', unassignedOrders.map((order) => order.id));

        if (updateError) throw updateError;
        return unassignedOrders.length;
      }

      return 0;
    },
    onSuccess: (count, organizationId) => {
      if (count > 0) {
        toast.success(formatRemainingCopy(copy.batchAssigned, { count }));
      } else {
        toast.info(copy.noUnassignedWorkOrders);
      }

      queryClient.invalidateQueries({ queryKey: workOrders.pagedList(organizationId) });
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-filtered-optimized', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', organizationId] });
    },
    onError: (error) => {
      console.error('Error batch assigning work orders:', error);
      toast.error(copy.batchAssignFailed);
    },
  });
};
