import { useI18n } from '@/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAppToast } from '@/hooks/useAppToast';

type AddPartsRoleVariables = {
  organizationId: string;
  userId: string;
};

type AddPartsRoleConfig = {
  addAssignee: (organizationId: string, userId: string, assignedBy: string) => Promise<unknown>;
  listQueryKey: (organizationId: string) => readonly unknown[];
  statusQueryKey: (organizationId: string, userId: string) => readonly unknown[];
  messageKeyPrefix: 'managerAdded' | 'managerRemoved' | 'consumerAdded' | 'consumerRemoved';
};

export function createAddPartsRoleMutation(config: AddPartsRoleConfig) {
  return function useAddPartsRole() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useAppToast();
    const { t } = useI18n();

    return useMutation({
      mutationFn: async ({ organizationId, userId }: AddPartsRoleVariables) => {
        if (!user) throw new Error(t('inventoryMutation.notAuthenticated'));
        return await config.addAssignee(organizationId, userId, user.id);
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: config.listQueryKey(variables.organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: config.statusQueryKey(variables.organizationId, variables.userId),
        });
        toast({
          title: t(`inventoryMutation.${config.messageKeyPrefix}Title`),
          description: t(`inventoryMutation.${config.messageKeyPrefix}Description`),
        });
      },
      onError: (error) => {
        toast({
          title: t(`inventoryMutation.${config.messageKeyPrefix}ErrorTitle`),
          description: error instanceof Error ? error.message : t(`inventoryMutation.${config.messageKeyPrefix}ErrorFallback`),
          variant: 'error',
        });
      },
    });
  };
}

type RemovePartsRoleConfig = {
  removeAssignee: (organizationId: string, userId: string) => Promise<void>;
  listQueryKey: (organizationId: string) => readonly unknown[];
  statusQueryKey: (organizationId: string, userId: string) => readonly unknown[];
  messageKeyPrefix: 'managerAdded' | 'managerRemoved' | 'consumerAdded' | 'consumerRemoved';
};

export function createRemovePartsRoleMutation(config: RemovePartsRoleConfig) {
  return function useRemovePartsRole() {
    const queryClient = useQueryClient();
    const { toast } = useAppToast();
    const { t } = useI18n();

    return useMutation({
      mutationFn: async ({ organizationId, userId }: AddPartsRoleVariables) => {
        await config.removeAssignee(organizationId, userId);
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: config.listQueryKey(variables.organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: config.statusQueryKey(variables.organizationId, variables.userId),
        });
        toast({
          title: t(`inventoryMutation.${config.messageKeyPrefix}Title`),
          description: t(`inventoryMutation.${config.messageKeyPrefix}Description`),
        });
      },
      onError: (error) => {
        toast({
          title: t(`inventoryMutation.${config.messageKeyPrefix}ErrorTitle`),
          description: error instanceof Error ? error.message : t(`inventoryMutation.${config.messageKeyPrefix}ErrorFallback`),
          variant: 'error',
        });
      },
    });
  };
}
