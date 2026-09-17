/**
 * Retention window for list data after its component unmounts.
 *
 * This affects cache garbage collection only; it does not make business data
 * fresh for longer. List queries still revalidate according to staleTime.
 */
export const DEFAULT_LIST_QUERY_GC_TIME = 30 * 60 * 1000;

/**
 * Keep cached list rows available for repeat navigation without allowing a
 * caller's cache-retention setting to be shorter than its freshness window.
 */
export function resolveListQueryGcTime(
  staleTime: number,
  requestedGcTime?: number,
): number {
  return Math.max(
    staleTime,
    requestedGcTime ?? DEFAULT_LIST_QUERY_GC_TIME,
  );
}
