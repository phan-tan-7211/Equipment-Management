import { useI18n } from '@/i18n';
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getInventoryItems,
  getInventoryListMetadata,
  getRecentlyAdjustedInventoryItemIds,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  getInventoryTransactions,
  getCompatibleInventoryItems,
  DEFAULT_TRANSACTION_LIMIT,
  type TransactionPaginationParams,
  type PaginatedTransactionsResult
} from '@/features/inventory/services/inventoryService';
import {
  getCompatibleEquipmentForItem,
  bulkLinkEquipmentToItem
} from '@/features/inventory/services/inventoryCompatibilityService';
import {
  getCompatibilityRulesForItem,
  bulkSetCompatibilityRules,
  countEquipmentMatchingRules,
  getEquipmentMatchingItemRules
} from '@/features/inventory/services/inventoryCompatibilityRulesService';
import type {
  InventoryQuantityAdjustment,
  InventoryFilters,
  PartCompatibilityRule,
  PartCompatibilityRuleFormData,
  EquipmentMatchedByRules
} from '@/features/inventory/types/inventory';
import type { InventoryItemFormData } from '@/features/inventory/schemas/inventorySchema';
import { useAppToast } from '@/hooks/useAppToast';
import { inventory as inventoryKeys } from '@/lib/queryKeys';
import { invalidateEquipmentLinkQueries } from '@/features/inventory/hooks/inventoryEquipmentLinkMutations';

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

type ItemScopedQueryOptions = {
  staleTime?: number;
  enabled?: boolean;
};

function useInventoryItemQuery<T>(
  queryKeyPrefix: string,
  organizationId: string | undefined,
  itemId: string | undefined,
  queryFn: (orgId: string, id: string) => Promise<T>,
  emptyValue: T,
  options?: ItemScopedQueryOptions,
) {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: [queryKeyPrefix, organizationId, itemId],
    queryFn: async () => {
      if (!organizationId || !itemId) return emptyValue;
      return await queryFn(organizationId, itemId);
    },
    enabled: enabled && !!organizationId && !!itemId,
    staleTime,
  });
}

// ============================================
// Query Hooks
// ============================================

export const useInventoryItems = (
  organizationId: string | undefined,
  filters: InventoryFilters = {},
  options?: {
    staleTime?: number;
  }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;

  return useQuery({
    queryKey: inventoryKeys.list(organizationId ?? '', filters),
    queryFn: async () => {
      if (!organizationId) return [];
      return await getInventoryItems(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime,
    // Keep the previous list visible while sort/filter refetches so mobile
    // filter sheets stay mounted and users can keep adjusting options.
    // Do not carry placeholder data across organization switches.
    placeholderData: (previousData, previousQuery) => {
      const previousOrgId = previousQuery?.queryKey[1];
      if (previousOrgId !== organizationId) {
        return undefined;
      }
      return previousData;
    },
  });
};

export const useInventoryListMetadata = (
  organizationId: string | undefined,
  options?: {
    staleTime?: number;
  }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;

  return useQuery({
    queryKey: inventoryKeys.metadata(organizationId ?? ''),
    queryFn: async () => {
      if (!organizationId) {
        return {
          uniqueLocations: [],
          totalCount: 0,
          negativeStockCount: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
          healthyCount: 0,
          missingLocationCount: 0,
          missingUnitCostCount: 0,
          missingSkuCount: 0,
          estimatedInventoryValue: 0,
        };
      }

      return await getInventoryListMetadata(organizationId);
    },
    enabled: !!organizationId,
    staleTime,
  });
};

export const useRecentlyAdjustedInventoryItemIds = (
  organizationId: string | undefined,
  options?: {
    staleTime?: number;
    days?: number;
  }
) => {
  const staleTime = options?.staleTime ?? 2 * 60 * 1000;
  const days = options?.days ?? 30;

  return useQuery({
    queryKey: ['inventory-recent-adjustments', organizationId, days],
    queryFn: async () => {
      if (!organizationId) return {};
      return await getRecentlyAdjustedInventoryItemIds(organizationId, days);
    },
    enabled: !!organizationId,
    staleTime,
  });
};

export const useInventoryItem = (
  organizationId: string | undefined,
  itemId: string | undefined,
  options?: {
    staleTime?: number;
  }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;

  return useQuery({
    queryKey: ['inventory-item', organizationId, itemId],
    queryFn: async () => {
      if (!organizationId || !itemId) return null;
      return await getInventoryItemById(organizationId, itemId);
    },
    enabled: !!organizationId && !!itemId,
    staleTime
  });
};

const EMPTY_PAGINATED_RESULT: PaginatedTransactionsResult = {
  transactions: [],
  totalCount: 0,
  page: 1,
  limit: DEFAULT_TRANSACTION_LIMIT,
  hasMore: false
};

export const useInventoryTransactions = (
  organizationId: string | undefined,
  itemId?: string,
  options?: {
    staleTime?: number;
    pagination?: TransactionPaginationParams;
  }
) => {
  const staleTime = options?.staleTime ?? 2 * 60 * 1000; // 2 minutes for transactions
  const pagination = options?.pagination;

  return useQuery({
    queryKey: ['inventory-transactions', organizationId, itemId, pagination?.page, pagination?.limit],
    queryFn: async () => {
      if (!organizationId) return EMPTY_PAGINATED_RESULT;
      return await getInventoryTransactions(organizationId, itemId, pagination);
    },
    enabled: !!organizationId,
    staleTime
  });
};

export const useCompatibleInventoryItems = (
  organizationId: string | undefined,
  equipmentIds: string[],
  options?: {
    staleTime?: number;
  }
) => {
  const staleTime = options?.staleTime ?? DEFAULT_STALE_TIME;

  // Create stable sorted key using useMemo to avoid recomputation on every render
  // This ensures the key only changes when IDs change, not when array reference changes
  const sortedKey = useMemo(() => {
    return equipmentIds.length > 0 
      ? [...equipmentIds].sort().join(',')
      : '';
  }, [equipmentIds]);

  return useQuery({
    queryKey: ['compatible-inventory-items', organizationId, sortedKey],
    queryFn: async () => {
      if (!organizationId || equipmentIds.length === 0) return [];
      return await getCompatibleInventoryItems(organizationId, equipmentIds);
    },
    enabled: !!organizationId && equipmentIds.length > 0,
    staleTime
  });
};

export const useCompatibleEquipmentForItem = (
  organizationId: string | undefined,
  itemId: string | undefined,
  options?: ItemScopedQueryOptions,
) =>
  useInventoryItemQuery(
    'compatible-equipment',
    organizationId,
    itemId,
    getCompatibleEquipmentForItem,
    [],
    options,
  );

// ============================================
// Mutation Hooks
// ============================================

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      formData
    }: {
      organizationId: string;
      formData: InventoryItemFormData;
    }) => {
      if (!user) throw new Error(t('inventoryMutation.notAuthenticated'));
      return await createInventoryItem(organizationId, formData, user.id);
    },
    onSuccess: (data, variables) => {
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.listPrefix(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.metadata(variables.organizationId),
      });
      toast({
        title: t('inventoryMutation.createdTitle'),
        description: t('inventoryMutation.createdDescription', { name: data.name })
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.createError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.createFailed'),
        variant: 'error'
      });
    }
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      itemId,
      formData
    }: {
      organizationId: string;
      itemId: string;
      formData: Partial<InventoryItemFormData>;
    }) => {
      return await updateInventoryItem(organizationId, itemId, formData);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.listPrefix(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.metadata(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', variables.organizationId, variables.itemId]
      });
      toast({
        title: t('inventoryMutation.updatedTitle'),
        description: t('inventoryMutation.updatedDescription', { name: data.name })
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.updateError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.updateFailed'),
        variant: 'error'
      });
    }
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      itemId
    }: {
      organizationId: string;
      itemId: string;
    }) => {
      return await deleteInventoryItem(organizationId, itemId);
    },
    onSuccess: (_, variables) => {
      // Invalidate inventory items list
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.listPrefix(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.metadata(variables.organizationId),
      });
      toast({
        title: t('inventoryMutation.deletedTitle'),
        description: t('inventoryMutation.deletedDescription')
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.deleteError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.deleteFailed'),
        variant: 'error'
      });
    }
  });
};

export const useAdjustInventoryQuantity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      adjustment
    }: {
      organizationId: string;
      adjustment: InventoryQuantityAdjustment;
    }) => {
      if (!user) throw new Error(t('inventoryMutation.notAuthenticated'));
      return await adjustInventoryQuantity(organizationId, adjustment);
    },
    onSuccess: (newQuantity, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.listPrefix(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.metadata(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory-item', variables.organizationId, variables.adjustment.itemId]
      });
      // Invalidate all transaction queries for this item (uses TanStack Query's partial key matching,
      // which will match any query key that starts with these elements regardless of pagination params)
      queryClient.invalidateQueries({
        queryKey: ['inventory-transactions', variables.organizationId, variables.adjustment.itemId]
      });

      // Show warning if quantity is negative
      if (newQuantity < 0) {
        toast({
          title: t('inventoryMutation.adjustedTitle'),
          description: t('inventoryMutation.negativeQuantity', { quantity: newQuantity }),
          variant: 'warning'
        });
      } else {
        toast({
          title: t('inventoryMutation.adjustedTitle'),
          description: t('inventoryMutation.newQuantity', { quantity: newQuantity })
        });
      }
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.adjustError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.adjustFailed'),
        variant: 'error'
      });
    }
  });
};

export const useBulkLinkEquipmentToItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      itemId,
      equipmentIds
    }: {
      organizationId: string;
      itemId: string;
      equipmentIds: string[];
    }) => {
      return await bulkLinkEquipmentToItem(organizationId, itemId, equipmentIds);
    },
    onSuccess: (result, variables) => {
      // Invalidate queries to refetch compatible equipment
      invalidateEquipmentLinkQueries(queryClient, variables);
      
      // Show summary toast with counts
      const { added, removed } = result;
      const messages = [];
      if (added > 0) messages.push(t('inventoryMutation.equipmentAdded', { count: added }));
      if (removed > 0) messages.push(t('inventoryMutation.equipmentRemoved', { count: removed }));
      
      toast({
        title: t('inventoryMutation.linkUpdated'),
        description: messages.length > 0 ? messages.join(', ') : t('inventoryMutation.noChanges')
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.linkUpdateError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.linkUpdateFailed'),
        variant: 'error'
      });
    }
  });
};

// ============================================
// Compatibility Rules Hooks
// ============================================

/**
 * Hook to fetch compatibility rules for an inventory item.
 */
export const useCompatibilityRulesForItem = (
  organizationId: string | undefined,
  itemId: string | undefined,
  options?: ItemScopedQueryOptions,
) =>
  useInventoryItemQuery(
    'compatibility-rules',
    organizationId,
    itemId,
    getCompatibilityRulesForItem,
    [] as PartCompatibilityRule[],
    options,
  );

/**
 * Hook to fetch equipment that matches an inventory item's compatibility rules.
 * 
 * This is the inverse of useCompatibleInventoryItems - instead of finding parts
 * for equipment, it finds equipment that matches a part's compatibility rules.
 */
export const useEquipmentMatchingItemRules = (
  organizationId: string | undefined,
  itemId: string | undefined,
  options?: ItemScopedQueryOptions,
) =>
  useInventoryItemQuery(
    'equipment-matching-rules',
    organizationId,
    itemId,
    getEquipmentMatchingItemRules,
    [] as EquipmentMatchedByRules[],
    options,
  );

/**
 * Hook to bulk set (replace) all compatibility rules for an item.
 */
export const useBulkSetCompatibilityRules = () => {
  const queryClient = useQueryClient();
  const { toast } = useAppToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({
      organizationId,
      itemId,
      rules
    }: {
      organizationId: string;
      itemId: string;
      rules: PartCompatibilityRuleFormData[];
    }) => {
      return await bulkSetCompatibilityRules(organizationId, itemId, rules);
    },
    onSuccess: (result, variables) => {
      // Invalidate rules query
      queryClient.invalidateQueries({
        queryKey: ['compatibility-rules', variables.organizationId, variables.itemId]
      });
      // Invalidate compatible items queries
      queryClient.invalidateQueries({
        queryKey: ['compatible-inventory-items', variables.organizationId]
      });
      
      toast({
        title: t('inventoryMutation.rulesUpdated'),
        description: t('inventoryMutation.rulesSet', { count: result.rulesSet })
      });
    },
    onError: (error) => {
      toast({
        title: t('inventoryMutation.rulesUpdateError'),
        description: error instanceof Error ? error.message : t('inventoryMutation.rulesUpdateFailed'),
        variant: 'error'
      });
    }
  });
};

/**
 * Hook to count equipment matching a set of rules.
 * Used for displaying match count in the UI.
 */
export const useEquipmentMatchCount = (
  organizationId: string | undefined,
  rules: PartCompatibilityRuleFormData[],
  options?: {
    staleTime?: number;
  }
) => {
  const staleTime = options?.staleTime ?? 30 * 1000; // 30 seconds for count

  // Memoize a stable rules array based on its content.
  // 
  // Why JSON.stringify in dependencies?
  // - react-hook-form recreates the rules array reference on every render
  // - Using [rules] directly would cause useMemo to recompute every render
  // - JSON.stringify creates a content-based comparison: same content = same string
  // - The stringify runs once per render (unavoidable), but useMemo only returns
  //   a new array reference when the content actually changes
  //
  // Alternative approaches considered:
  // - [rules]: Would defeat memoization entirely (new reference every render)
  // - useDeepCompareEffect: Adds a dependency for minimal benefit
  // - Custom hook: Over-engineering for this use case
  //
  // This is the standard pattern for content-based memoization in React.
  const stableRules = useMemo(
    () => rules,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content-based comparison via JSON.stringify
    [JSON.stringify(rules)]
  );

  // Create a stable string key from rules for React Query cache.
  const rulesKey = useMemo(() => {
    if (stableRules.length === 0) return '';
    return stableRules
      .map(r => `${r.manufacturer.toLowerCase().trim()}|${r.model?.toLowerCase().trim() ?? ''}`)
      .sort()
      .join(',');
  }, [stableRules]);

  return useQuery({
    queryKey: ['equipment-match-count', organizationId, rulesKey],
    queryFn: async () => {
      if (!organizationId || stableRules.length === 0) return 0;
      return await countEquipmentMatchingRules(organizationId, stableRules);
    },
    enabled: !!organizationId && stableRules.length > 0,
    staleTime
  });
};
