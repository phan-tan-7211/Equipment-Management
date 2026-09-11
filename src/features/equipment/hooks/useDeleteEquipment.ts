import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEquipmentCascade } from '@/features/equipment/services/deleteEquipmentService';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useI18n } from '@/i18n';

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { t } = useI18n();

  return useMutation({
    mutationFn: ({ equipmentId, orgId }: { equipmentId: string; orgId: string }) =>
      deleteEquipmentCascade(equipmentId, orgId),
    onSuccess: () => {
      if (currentOrganization?.id) {
        queryClient.invalidateQueries({ queryKey: ['equipment', currentOrganization.id] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats', currentOrganization.id] });
        queryClient.invalidateQueries({ queryKey: ['work-orders', currentOrganization.id] });
        queryClient.invalidateQueries({ queryKey: ['equipment-status-counts', currentOrganization.id] });
      }

      toast({
        title: t('equipmentMutation.deletedTitle'),
        description: t('equipmentMutation.deletedDescription'),
      });
    },
    onError: (error: unknown) => {
      console.error('Delete equipment error:', error);
      toast({
        title: t('equipmentMutation.deleteFailedTitle'),
        description: t('equipmentMutation.deleteFailedDescription'),
        variant: 'destructive',
      });
    },
  });
};
