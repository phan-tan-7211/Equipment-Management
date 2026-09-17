import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Query } from '@tanstack/react-query';
import type { InventoryItem } from '@/features/inventory/types/inventory';
import { inventory } from '@/lib/queryKeys';
import { useInventoryItems } from './useInventory';

const useQueryMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

vi.mock('@/features/inventory/services/inventoryService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/inventory/services/inventoryService')>();
  return {
    ...actual,
    getInventoryItems: vi.fn(),
  };
});

type InventoryQueryConfig = {
  queryKey: readonly unknown[];
  staleTime: number;
  gcTime: number;
  placeholderData: PlaceholderDataFn;
};

type PlaceholderDataFn = (
  previousData: InventoryItem[] | undefined,
  previousQuery: Query | undefined,
) => InventoryItem[] | undefined;

function getLastQueryConfig(): InventoryQueryConfig {
  return useQueryMock.mock.calls.at(-1)?.[0] as InventoryQueryConfig;
}

function getPlaceholderDataFromLastCall(): PlaceholderDataFn {
  return getLastQueryConfig().placeholderData;
}

function makePreviousQuery(orgId: string): Query {
  return {
    queryKey: inventory.list(orgId, {}),
  } as Query;
}

describe('useInventoryItems placeholderData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: [], isPending: false });
  });

  it('keeps list rows cached beyond staleTime for repeat navigation', () => {
    renderHook(() => useInventoryItems('org-1', {}));

    const config = getLastQueryConfig();
    expect(config.gcTime).toBeGreaterThanOrEqual(config.staleTime);
    expect(config.gcTime).toBe(30 * 60 * 1000);
    expect(config.queryKey).toEqual(inventory.list('org-1', {}));
  });

  it('retains previous data for same-organization filter changes', () => {
    renderHook(() => useInventoryItems('org-1', { lowStockOnly: true }));

    const placeholderData = getPlaceholderDataFromLastCall();
    const previousItems = [{ id: 'item-1' } as InventoryItem];

    expect(
      placeholderData(previousItems, makePreviousQuery('org-1')),
    ).toBe(previousItems);
  });

  it('does not retain previous data when organization changes', () => {
    renderHook(() => useInventoryItems('org-2', {}));

    const placeholderData = getPlaceholderDataFromLastCall();
    const previousItems = [{ id: 'item-1' } as InventoryItem];

    expect(
      placeholderData(previousItems, makePreviousQuery('org-1')),
    ).toBeUndefined();
  });
});
