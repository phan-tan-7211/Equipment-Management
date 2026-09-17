import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  InventoryFilters,
  InventoryQuickFilterKey,
} from '@/features/inventory/types/inventory';
import {
  DEFAULT_INVENTORY_DESKTOP_PAGE_SIZE,
  DEFAULT_INVENTORY_MOBILE_PAGE_SIZE,
} from '@/features/inventory/utils/inventoryListPagination';

const initialFilters: InventoryFilters = {
  search: '',
  lowStockOnly: false,
  sortBy: 'name',
  sortOrder: 'asc',
};

type InventoryListStateSnapshot = {
  filters: InventoryFilters;
  quickFilters: InventoryQuickFilterKey[];
  desktopPage: number;
  mobilePage: number;
  desktopPageSize: number;
  mobilePageSize: number;
};

const inventoryListStateCache = new Map<string, InventoryListStateSnapshot>();

function cloneInventoryListState(
  state: InventoryListStateSnapshot,
): InventoryListStateSnapshot {
  return {
    ...state,
    filters: { ...state.filters },
    quickFilters: [...state.quickFilters],
  };
}

function getCachedInventoryListState(
  organizationId?: string,
): InventoryListStateSnapshot | null {
  if (!organizationId) return null;
  const cached = inventoryListStateCache.get(organizationId);
  return cached ? cloneInventoryListState(cached) : null;
}

/** Clear in-memory Inventory list state between isolated tests. */
export function clearInventoryListStateCache(): void {
  inventoryListStateCache.clear();
}

type InventoryFilterUpdate =
  | Partial<InventoryFilters>
  | ((previous: InventoryFilters) => InventoryFilters);

/**
 * Keep Inventory list controls consistent with Equipment when navigating to
 * a detail page and back. State is scoped to the organization and lives only
 * in memory, so a full browser restart starts with a clean list.
 */
export function useInventoryListState(organizationId?: string) {
  const [filters, setFilters] = useState<InventoryFilters>(() =>
    getCachedInventoryListState(organizationId)?.filters ?? initialFilters,
  );
  const [quickFilters, setQuickFilters] = useState<InventoryQuickFilterKey[]>(() =>
    getCachedInventoryListState(organizationId)?.quickFilters ?? [],
  );
  const [desktopPage, setDesktopPage] = useState(() =>
    getCachedInventoryListState(organizationId)?.desktopPage ?? 1,
  );
  const [mobilePage, setMobilePage] = useState(() =>
    getCachedInventoryListState(organizationId)?.mobilePage ?? 1,
  );
  const [desktopPageSize, setDesktopPageSize] = useState(() =>
    getCachedInventoryListState(organizationId)?.desktopPageSize ??
      DEFAULT_INVENTORY_DESKTOP_PAGE_SIZE,
  );
  const [mobilePageSize, setMobilePageSize] = useState(() =>
    getCachedInventoryListState(organizationId)?.mobilePageSize ??
      DEFAULT_INVENTORY_MOBILE_PAGE_SIZE,
  );
  const hydratedOrganizationIdRef = useRef(organizationId ?? null);

  useEffect(() => {
    if (!organizationId || hydratedOrganizationIdRef.current === organizationId) return;

    hydratedOrganizationIdRef.current = organizationId;
    const cached = getCachedInventoryListState(organizationId);
    setFilters(cached?.filters ?? initialFilters);
    setQuickFilters(cached?.quickFilters ?? []);
    setDesktopPage(cached?.desktopPage ?? 1);
    setMobilePage(cached?.mobilePage ?? 1);
    setDesktopPageSize(cached?.desktopPageSize ?? DEFAULT_INVENTORY_DESKTOP_PAGE_SIZE);
    setMobilePageSize(cached?.mobilePageSize ?? DEFAULT_INVENTORY_MOBILE_PAGE_SIZE);
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || hydratedOrganizationIdRef.current !== organizationId) return;

    inventoryListStateCache.set(
      organizationId,
      cloneInventoryListState({
        filters,
        quickFilters,
        desktopPage,
        mobilePage,
        desktopPageSize,
        mobilePageSize,
      }),
    );
  }, [
    organizationId,
    filters,
    quickFilters,
    desktopPage,
    mobilePage,
    desktopPageSize,
    mobilePageSize,
  ]);

  const resetPagination = useCallback(() => {
    setDesktopPage(1);
    setMobilePage(1);
  }, []);

  const updateFilters = useCallback(
    (update: InventoryFilterUpdate) => {
      setFilters((previous) =>
        typeof update === 'function' ? update(previous) : { ...previous, ...update },
      );
      resetPagination();
    },
    [resetPagination],
  );

  const replaceFilters = useCallback(
    (next: InventoryFilters) => {
      setFilters({ ...next });
      resetPagination();
    },
    [resetPagination],
  );

  const updateQuickFilters = useCallback(
    (
      update:
        | InventoryQuickFilterKey[]
        | ((previous: InventoryQuickFilterKey[]) => InventoryQuickFilterKey[]),
    ) => {
      setQuickFilters((previous) =>
        typeof update === 'function' ? [...update(previous)] : [...update],
      );
      resetPagination();
    },
    [resetPagination],
  );

  return {
    filters,
    quickFilters,
    desktopPage,
    mobilePage,
    desktopPageSize,
    mobilePageSize,
    updateFilters,
    replaceFilters,
    updateQuickFilters,
    setDesktopPage,
    setMobilePage,
    setDesktopPageSize,
    setMobilePageSize,
  };
}
