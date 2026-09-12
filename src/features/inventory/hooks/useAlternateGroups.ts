import { useI18n } from '@/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getAlternateGroups,
  createAlternateGroup,
  getAlternateGroupById,
  updateAlternateGroup,
  deleteAlternateGroup,
  addInventoryItemToGroup,
  removeGroupMember,
  createPartIdentifier,
  addIdentifierToGroup,
  getInventoryGroupMembershipCounts,
} from '@/features/inventory/services/partAlternatesService';
import type {
  PartIdentifierType,
  VerificationStatus,
} from '@/features/inventory/types/inventory';
import { useAppToast } from '@/hooks/useAppToast';

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch all alternate groups for an organization.
 */
export const useAlternateGroups = (
  organizationId: string | undefined,
  options?: { staleTime?: number; enabled?: boolean }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['alternate-groups', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      return await getAlternateGroups(organizationId);
    },
    enabled: enabled && !!organizationId,
    staleTime,
  });
};

/**
 * Fetch a single alternate group with its members.
 */
export const useAlternateGroup = (
  organizationId: string | undefined,
  groupId: string | undefined,
  options?: { staleTime?: number }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;

  return useQuery({
    queryKey: ['alternate-group', organizationId, groupId],
    queryFn: async () => {
      if (!organizationId || !groupId) return null;
      return await getAlternateGroupById(organizationId, groupId);
    },
    enabled: !!organizationId && !!groupId,
    staleTime,
  });
};

/**
 * Returns a map of inventoryItemId -> alternate-group count for the organization.
 * Used by inventory list surfaces to show membership indicators.
 */
export const useInventoryGroupMembershipCounts = (
  organizationId: string | undefined
) => {
  return useQuery({
    queryKey: ['inventory-group-membership-counts', organizationId],
    queryFn: async () => {
      if (!organizationId) return {} as Record<string, number>;
      return await getInventoryGroupMembershipCounts(organizationId);
    },
    enabled: !!organizationId,
    staleTime: DEFAULT_STALE_TIME,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export interface CreateAlternateGroupInput {
  name: string;
  description?: string;
  status?: VerificationStatus;
  notes?: string;
  evidence_url?: string;
}

/**
 * Create a new alternate group.
 */
export const useCreateAlternateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: CreateAlternateGroupInput;
    }) => {
      return await createAlternateGroup(organizationId, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      toast({
        title: t('inventoryMutation.groupCreated'),
        description: t('inventoryMutation.groupCreatedDescription', { name: data.name }),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.groupCreateError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.groupCreateFailed'),
        variant: 'error',
      });
    },
  });
};

/**
 * Update an alternate group.
 */
export const useUpdateAlternateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      groupId,
      data,
    }: {
      organizationId: string;
      groupId: string;
      data: Partial<CreateAlternateGroupInput>;
    }) => {
      return await updateAlternateGroup(organizationId, groupId, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alternate-group', variables.organizationId, variables.groupId],
      });
      toast({
        title: t('inventoryMutation.groupUpdated'),
        description: t('inventoryMutation.groupUpdatedDescription', { name: data.name }),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.groupUpdateError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.groupUpdateFailed'),
        variant: 'error',
      });
    },
  });
};

/**
 * Delete an alternate group.
 */
export const useDeleteAlternateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      groupId,
    }: {
      organizationId: string;
      groupId: string;
    }) => {
      return await deleteAlternateGroup(organizationId, groupId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-group-membership-counts', variables.organizationId],
      });
      toast({
        title: t('inventoryMutation.groupDeleted'),
        description: t('inventoryMutation.groupDeletedDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.groupDeleteError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.groupDeleteFailed'),
        variant: 'error',
      });
    },
  });
};

/**
 * Add an inventory item to an alternate group.
 */
export const useAddInventoryItemToGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      groupId,
      inventoryItemId,
      isPrimary = false,
    }: {
      organizationId: string;
      groupId: string;
      inventoryItemId: string;
      isPrimary?: boolean;
    }) => {
      return await addInventoryItemToGroup(groupId, inventoryItemId, isPrimary);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alternate-group', variables.organizationId, variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-group-membership-counts', variables.organizationId],
      });
      // Invalidate alternates queries since group membership changed.
      queryClient.invalidateQueries({
        queryKey: ['inventory-item-alternates'],
      });
      queryClient.invalidateQueries({
        queryKey: ['part-alternates'],
      });
      toast({
        title: t('inventoryMutation.itemAdded'),
        description: t('inventoryMutation.itemAddedDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.itemAddError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.itemAddFailed'),
        variant: 'error',
      });
    },
  });
};

/**
 * Add a part identifier to an alternate group.
 */
export const useAddPartIdentifierToGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      groupId,
      identifierType,
      rawValue,
      manufacturer,
      inventoryItemId,
    }: {
      organizationId: string;
      groupId: string;
      identifierType: PartIdentifierType;
      rawValue: string;
      manufacturer?: string;
      inventoryItemId?: string;
    }) => {
      if (!user) throw new Error(t('inventoryMutation.notAuthenticated'));
      
      // First create the identifier
      const identifier = await createPartIdentifier(organizationId, {
        identifier_type: identifierType,
        raw_value: rawValue,
        manufacturer,
        inventory_item_id: inventoryItemId,
      });
      
      // Then add it to the group
      await addIdentifierToGroup(groupId, identifier.id);
      
      return identifier;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alternate-group', variables.organizationId, variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['part-alternates'],
      });
      toast({
        title: t('inventoryMutation.identifierAdded'),
        description: t('inventoryMutation.identifierAddedDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.identifierAddError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.identifierAddFailed'),
        variant: 'error',
      });
    },
  });
};

/**
 * Remove a member (identifier or inventory item) from an alternate group.
 */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      memberId,
    }: {
      organizationId: string;
      groupId: string;
      memberId: string;
    }) => {
      return await removeGroupMember(memberId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['alternate-groups', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['alternate-group', variables.organizationId, variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-group-membership-counts', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-item-alternates'],
      });
      queryClient.invalidateQueries({
        queryKey: ['part-alternates'],
      });
      toast({
        title: t('inventoryMutation.memberRemoved'),
        description: t('inventoryMutation.memberRemovedDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.memberRemoveError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.memberRemoveFailed'),
        variant: 'error',
      });
    },
  });
};
