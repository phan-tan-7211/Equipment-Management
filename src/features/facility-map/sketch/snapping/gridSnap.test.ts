import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GRID_STEP,
  findGridSnap,
  getGridSnapPoint,
} from '@/features/facility-map/sketch/snapping/gridSnap';

describe('grid snap', () => {
  it('rounds model-space coordinates to the nearest grid step', () => {
    expect(DEFAULT_GRID_STEP).toBe(10);
    expect(getGridSnapPoint({ x: 14, y: 26 })).toEqual({
      x: 10,
      y: 30,
    });
    expect(getGridSnapPoint({ x: -14, y: -26 })).toEqual({
      x: -10,
      y: -30,
    });
  });

  it('supports an explicit model-space grid step', () => {
    expect(getGridSnapPoint({ x: 12, y: 18 }, 5)).toEqual({
      x: 10,
      y: 20,
    });
  });

  it('falls back to the default step when an invalid step is supplied', () => {
    expect(getGridSnapPoint({ x: 14, y: 26 }, 0)).toEqual({
      x: 10,
      y: 30,
    });
    expect(getGridSnapPoint({ x: 14, y: 26 }, Number.NaN)).toEqual({
      x: 10,
      y: 30,
    });
  });

  it('returns a grid candidate only inside the snap threshold', () => {
    expect(findGridSnap({ x: 12, y: 12 }, 4)).toEqual({
      point: { x: 10, y: 10 },
      distance: Math.sqrt(8),
    });

    expect(findGridSnap({ x: 15, y: 15 }, 5)).toBeNull();
  });
});
