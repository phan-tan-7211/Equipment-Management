import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import {
  createPM,
  defaultForkliftChecklist,
  type PMChecklistItem,
} from '@/features/pm-templates/services/preventativeMaintenanceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { showErrorToast } from '@/utils/errorHandling';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import { attachWorkOrderCreationImages } from '@/features/work-orders/services/workOrderNotesService';
import { workOrders as workOrderQueryKeys, workOrderMetrics } from '@/lib/queryKeys';
import type { WorkOrder } from '@/features/work-orders/types/workOrder';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

export interface CreateWorkOrderData {
  title: string;
  description: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueDateHasTime?: boolean;
  estimatedHours?: number;
  equipmentWorkingHours?: number;
  hasPM?: boolean;
  pmTemplateId?: string;
  assigneeId?: string;
  images?: File[];
  creationPhotoNote?: string;
}

interface CreateWorkOrderResult {
  workOrder: WorkOrder | null;
  queuedOffline: boolean;
  creationPhotoFailure?: boolean;
}

export const useCreateWorkOrder = (options?: { onSuccess?: (workOrder: WorkOrder) => void }) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const offlineCtx = useOfflineQueueOptional();

  return useMutation({
    mutationFn: async (data: CreateWorkOrderData): Promise<CreateWorkOrderResult> => {
      if (!currentOrganization) throw new Error('No organization selected');
      if (!user) throw new Error('User not authenticated');

      let assigneeId = data.assigneeId;
      if (!assigneeId && currentOrganization.memberCount === 1) assigneeId = user.id;

      const svc = new OfflineAwareWorkOrderService(currentOrganization.id, user.id);
      const result = await svc.createWorkOrder(data, assigneeId);

      if (result.queuedOffline) {
        offlineCtx?.refresh();
        return { workOrder: null, queuedOffline: true };
      }

      const workOrder = result.data!;
      let creationPhotoFailure = false;

      if (data.equipmentWorkingHours && data.equipmentWorkingHours > 0) {
        try {
          const { error } = await supabase.rpc('update_equipment_working_hours', {
            p_equipment_id: data.equipmentId,
            p_new_hours: data.equipmentWorkingHours,
            p_update_source: 'work_order',
            p_work_order_id: workOrder.id,
            p_notes: `Updated from work order: ${data.title}`,
          });
          if (error) {
            logger.error('Failed to update equipment working hours', error);
            toast.error(copy.workOrderCreatedHoursFailed);
          }
        } catch (error) {
          logger.error('Error updating equipment working hours', error);
          toast.error(copy.workOrderCreatedHoursFailed);
        }
      }

      if (data.hasPM && data.equipmentId) {
        try {
          let checklistData: PMChecklistItem[] = defaultForkliftChecklist;
          let notes = '';
          if (data.pmTemplateId) {
            const { data: template } = await supabase
              .from('pm_checklist_templates')
              .select('template_data, description')
              .eq('id', data.pmTemplateId)
              .single();
            if (template && Array.isArray(template.template_data)) {
              checklistData = template.template_data as unknown as PMChecklistItem[];
              notes = template.description || '';
            }
          }
          await createPM({
            workOrderId: workOrder.id,
            equipmentId: data.equipmentId,
            organizationId: currentOrganization.id,
            checklistData,
            notes,
            templateId: data.pmTemplateId,
          });
        } catch (error) {
          logger.error('Failed to create PM for equipment', error);
          toast.error(t('workOrderResidual.initializeFailed'));
        }
      }

      if (data.images?.length) {
        try {
          const { primaryImageId } = await attachWorkOrderCreationImages({
            workOrderId: workOrder.id,
            organizationId: currentOrganization.id,
            images: data.images,
            noteContent: data.creationPhotoNote,
          });
          if (primaryImageId) {
            queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.images(workOrder.id) });
            queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.notesWithImages(workOrder.id) });
            queryClient.invalidateQueries({ queryKey: workOrderMetrics.imageCount(workOrder.id) });
          } else {
            creationPhotoFailure = true;
          }
        } catch (error) {
          logger.error('Failed to attach creation photos to work order', error);
          creationPhotoFailure = true;
        }
      }

      return { workOrder, queuedOffline: false, creationPhotoFailure };
    },
    onSuccess: (result) => {
      if (result.queuedOffline) {
        toast.info(t('workOrderFieldAction.savedOffline'));
        if (!options?.onSuccess) navigate('/dashboard/work-orders');
        return;
      }

      toast.success(copy.workOrderCreated);
      if (result.creationPhotoFailure) toast.warning(t('equipmentQRScan.photosAttachFailed'));

      if (currentOrganization?.id) {
        queryClient.invalidateQueries({ queryKey: workOrderQueryKeys.pagedList(currentOrganization.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-filtered-optimized', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['team-based-work-orders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['team-based-recent-work-orders', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['team-based-dashboard-stats', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-cost-trend', currentOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', currentOrganization?.id] });

      if (result.workOrder) {
        if (options?.onSuccess) options.onSuccess(result.workOrder);
        else navigate(`/dashboard/work-orders/${result.workOrder.id}`);
      }
    },
    onError: (error) => {
      logger.error('Error creating work order', error);
      showErrorToast(error, t('workOrderForm.createTitle'));
    },
  });
};
