import { useMutation, useQueryClient } from '@tanstack/react-query';
import { defaultForkliftChecklist, PMChecklistItem } from '@/features/pm-templates/services/preventativeMaintenanceService';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineQueueOptional } from '@/contexts/OfflineQueueContext';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy';

export const useInitializePMChecklist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditExtraCopy(language);
  const offlineCtx = useOfflineQueueOptional();

  return useMutation({
    mutationFn: async ({
      workOrderId,
      equipmentId,
      organizationId,
      templateId,
    }: {
      workOrderId: string;
      equipmentId: string;
      organizationId: string;
      templateId?: string;
    }) => {
      let checklistData = defaultForkliftChecklist;
      let notes = 'PM checklist initialized with default forklift maintenance items.';

      if (templateId) {
        try {
          const { pmChecklistTemplatesService } = await import('@/features/pm-templates/services/pmChecklistTemplatesService');
          const template = await pmChecklistTemplatesService.getTemplate(templateId);

          if (template && Array.isArray(template.template_data)) {
            const templateItems = template.template_data as unknown as PMChecklistItem[];
            checklistData = templateItems.map((item) => ({
              ...item,
              condition: null,
              notes: '',
            }));
            notes = `PM checklist initialized from template: ${template.name}`;
          }
        } catch (error) {
          logger.warn('Failed to fetch PM template, using default', error);
        }
      }

      if (user?.id) {
        const svc = new OfflineAwareWorkOrderService(organizationId, user.id);
        const result = await svc.initPM({
          workOrderId,
          equipmentId,
          templateId,
          checklistData,
          notes,
        });
        if (result.queuedOffline) {
          offlineCtx?.refresh();
          return null;
        }
        if (!result.data) {
          throw new Error('Failed to create PM record');
        }
        return result.data;
      }

      const { createPM } = await import('@/features/pm-templates/services/preventativeMaintenanceService');
      const pmRecord = await createPM({
        workOrderId,
        equipmentId,
        organizationId,
        checklistData,
        notes,
        templateId,
      });

      if (!pmRecord) {
        throw new Error('Failed to create PM record');
      }

      return pmRecord;
    },
    onSuccess: (pmRecord, variables) => {
      if (pmRecord === null) return;

      const queryKey = ['preventativeMaintenance', variables.workOrderId, variables.equipmentId, variables.organizationId];
      queryClient.setQueryData(queryKey, pmRecord);
      queryClient.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: ['preventativeMaintenance', variables.workOrderId],
        exact: false,
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: ['preventativeMaintenance', 'all', variables.workOrderId, variables.organizationId],
        exact: true,
        refetchType: 'none',
      });
      queryClient.invalidateQueries({
        queryKey: ['workOrder', variables.organizationId, variables.workOrderId],
        exact: true,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['workOrder'],
        exact: false,
        refetchType: 'active',
      });

      toast.success(copy.pmChecklistInitialized);
    },
    onError: (error) => {
      logger.error('Error initializing PM checklist', error);
      toast.error(copy.pmChecklistInitializeFailed);
    },
  });
};
