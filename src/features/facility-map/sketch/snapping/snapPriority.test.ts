import { describe, expect, it } from 'vitest';

import {
  SNAP_PRIORITY,
  selectSnapCandidate,
  type SnapCandidate,
} from '@/features/facility-map/sketch/snapping/snapPriority';

const candidate = (
  kind: SnapCandidate['kind'],
  distance: number,
  x = distance,
): SnapCandidate => ({
  kind,
  point: { x, y: 0 },
  distance,
});

describe('snap priority', () => {
  it('uses deterministic CAD-style snap priority before distance', () => {
    expect(SNAP_PRIORITY).toEqual({
      endpoint: 0,
      intersection: 1,
      midpoint: 2,
      center: 3,
      nearest: 4,
      grid: 5,
    });

    const result = selectSnapCandidate([
      candidate('grid', 0.1),
      candidate('nearest', 0.2),
      candidate('center', 0.3),
      candidate('midpoint', 0.4),
      candidate('intersection', 0.5),
      candidate('endpoint', 0.9),
    ]);

    expect(result?.kind).toBe('endpoint');
    expect(result?.distance).toBe(0.9);
  });

  it('uses distance only to break ties inside the same snap kind', () => {
    const result = selectSnapCandidate([
      candidate('intersection', 4, 40),
      candidate('intersection', 2, 20),
      candidate('intersection', 3, 30),
    ]);

    expect(result).toEqual(candidate('intersection', 2, 20));
  });

  it('keeps the first candidate when priority and distance are exactly tied', () => {
    const first = candidate('center', 2, 10);
    const second = candidate('center', 2, 20);

    expect(selectSnapCandidate([first, second])).toBe(first);
  });

  it('ignores unavailable candidates and returns null when none exist', () => {
    expect(
      selectSnapCandidate([
        null,
        candidate('grid', 1),
        null,
      ]),
    ).toEqual(candidate('grid', 1));

    expect(selectSnapCandidate([null, null])).toBeNull();
  });
});
