import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EquipmentTemplateService } from '@/features/equipment/services/equipmentTemplateService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { useI18n } from '@/i18n';

export const useRemoveTemplateFromEquipment = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { t } = useI18n();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      EquipmentTemplateService.removeTemplateFromEquipment(equipmentId),
    onSuccess: () => {
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.list(currentOrganization.id),
        });
      }
      toast.success(t('equipmentMutation.templateRemoved'));
    },
    onError: (error) => {
      console.error('Error removing template:', error);
      toast.error(t('equipmentMutation.templateRemoveFailed'));
    },
  });
};

export const useBulkAssignTemplate = () => {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { t } = useI18n();

  return useMutation({
    mutationFn: ({ equipmentIds, templateId }: { equipmentIds: string[]; templateId: string }) =>
      EquipmentTemplateService.bulkAssignTemplate(equipmentIds, templateId),
    onSuccess: ({ successCount, errorCount }) => {
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.list(currentOrganization.id),
        });
      }

      if (successCount > 0) {
        const baseMessage = t(
          successCount === 1
            ? 'equipmentMutation.templateAssigned'
            : 'equipmentMutation.templateAssignedPlural',
          { count: successCount },
        );
        toast.success(
          errorCount > 0
            ? t('equipmentMutation.withFailures', { message: baseMessage, count: errorCount })
            : baseMessage,
        );
      }

      if (errorCount > 0 && successCount === 0) {
        toast.error(t('equipmentMutation.templateAssignNone'));
      }
    },
    onError: (error) => {
      console.error('Error in bulk template assignment:', error);
      toast.error(t('equipmentMutation.templateAssignFailed'));
    },
  });
};
