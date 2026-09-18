import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Query } from '@tanstack/react-query';

const { mockCreateQueryPersister } = vi.hoisted(() => ({
  mockCreateQueryPersister: vi.fn((options: unknown) => ({
    options,
    persisterFn: vi.fn(),
  })),
}));

vi.mock('@tanstack/react-query-persist-client', () => ({
  experimental_createQueryPersister: mockCreateQueryPersister,
}));

import {
  createScopedQueryPersister,
  isPersistableQuery,
  OFFLINE_CACHE_BUSTER,
  PERSISTABLE_KEY_PREFIXES,
  setActivePersistenceScope,
} from './queryPersistence';

function makeQuery(
  queryKey: readonly unknown[],
  state: Partial<Query['state']> = {},
): Query {
  return {
    queryKey,
    state: {
      status: 'success',
      data: { cached: true },
      ...state,
    },
  } as Query;
}

describe('query persistence policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePersistenceScope(null);
  });

  it.each([
    'inventory',
    'inventory-item',
    'inventory-item-images',
    'inventory-item-alternates',
    'inventory-recent-adjustments',
    'inventory-transactions',
    'compatible-inventory-items',
    'compatible-equipment',
    'compatibility-rules',
    'equipment-match-count',
    'inventory-group-membership-counts',
    'alternate-groups',
    'alternate-group',
    'part-alternates',
    'make-model-parts',
  ])('allows the field Inventory family %s', (prefix) => {
    expect(PERSISTABLE_KEY_PREFIXES.has(prefix)).toBe(true);
    expect(isPersistableQuery(makeQuery([prefix, 'org-1', 'item-1']))).toBe(true);
  });

  it('keeps admin, audit, and access-grant namespaces out of persistence', () => {
    expect(
      isPersistableQuery(makeQuery(['inventory', 'org-1', 'admin', 'export'])),
    ).toBe(false);
    expect(
      isPersistableQuery(makeQuery(['inventory-item', 'org-1', 'audit'])),
    ).toBe(false);
    expect(isPersistableQuery(makeQuery(['parts-managers', 'org-1']))).toBe(false);
    expect(isPersistableQuery(makeQuery(['is-parts-consumer', 'org-1', 'user-1']))).toBe(
      false,
    );
  });

  it('does not persist errors or empty query states', () => {
    expect(
      isPersistableQuery(
        makeQuery(['inventory', 'org-1'], { status: 'error' }),
      ),
    ).toBe(false);
    expect(
      isPersistableQuery(
        makeQuery(['inventory', 'org-1'], { data: undefined }),
      ),
    ).toBe(false);
  });

  it('rebuilds the persister with a separate user and organization prefix', () => {
    setActivePersistenceScope({ userId: 'user-1', orgId: 'org-1' });
    const first = createScopedQueryPersister();

    setActivePersistenceScope({ userId: 'user-2', orgId: 'org-2' });
    const second = createScopedQueryPersister();

    expect(first).not.toBe(second);
    expect(mockCreateQueryPersister).toHaveBeenCalledTimes(2);
    expect(
      (mockCreateQueryPersister.mock.calls[0]?.[0] as { prefix: string }).prefix,
    ).toBe('equipqr:tq:user-1:org-1');
    expect(
      (mockCreateQueryPersister.mock.calls[1]?.[0] as { prefix: string }).prefix,
    ).toBe('equipqr:tq:user-2:org-2');
  });

  it('keeps the release-version buster explicit and the max age at 24 hours', () => {
    setActivePersistenceScope({ userId: 'user-1', orgId: 'org-1' });
    createScopedQueryPersister();

    const options = mockCreateQueryPersister.mock.calls[0]?.[0] as {
      buster: string;
      maxAge: number;
    };
    expect(options.buster).toBe(OFFLINE_CACHE_BUSTER);
    expect(options.maxAge).toBe(24 * 60 * 60 * 1000);
  });
});
