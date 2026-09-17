import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useQueryMock = vi.fn();

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

vi.mock('@/features/equipment/services/EquipmentService', () => ({
  EquipmentService: {
    getFilteredList: vi.fn(),
  },
}));

import { useEquipmentList } from './useEquipment';

type EquipmentListQueryConfig = {
  queryKey: readonly unknown[];
  staleTime: number;
  gcTime: number;
  placeholderData: unknown;
};

function getLastQueryConfig(): EquipmentListQueryConfig {
  return useQueryMock.mock.calls.at(-1)?.[0] as EquipmentListQueryConfig;
}

describe('useEquipmentList cache retention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: { data: [], count: 0 } });
  });

  it('retains paginated rows beyond staleTime without changing the query key', () => {
    renderHook(() => useEquipmentList('org-1', { status: 'active' }));

    const config = getLastQueryConfig();
    expect(config.gcTime).toBeGreaterThanOrEqual(config.staleTime);
    expect(config.gcTime).toBe(30 * 60 * 1000);
    expect(config.queryKey).toEqual([
      'equipment',
      'org-1',
      'paginated',
      { status: 'active' },
      {},
    ]);
    expect(config.placeholderData).toEqual(expect.any(Function));
  });

  it('allows a longer explicit cache-retention window', () => {
    renderHook(() =>
      useEquipmentList(
        'org-1',
        {},
        {},
        { staleTime: 10 * 60 * 1000, gcTime: 60 * 60 * 1000 },
      ),
    );

    const config = getLastQueryConfig();
    expect(config.staleTime).toBe(10 * 60 * 1000);
    expect(config.gcTime).toBe(60 * 60 * 1000);
  });
});
