import { describe, expect, it } from 'vitest';

import { selectEntitiesInDrag } from '@/features/facility-map/sketch/selection/windowSelection';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const line = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SketchEntity => ({
  id,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
  color: '#000000',
  lineWidth: 1,
});

describe('window selection', () => {
  const entities = [
    line('inside', 2, 2, 8, 8),
    line('crossing', 8, 8, 14, 14),
    line('outside', 20, 20, 30, 30),
  ];

  it('left-to-right selects only entities fully inside the window', () => {
    expect(
      selectEntitiesInDrag(
        entities,
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ),
    ).toEqual(['inside']);
  });

  it('right-to-left crossing selects entities that touch the window', () => {
    expect(
      selectEntitiesInDrag(
        entities,
        { x: 10, y: 10 },
        { x: 0, y: 0 },
      ),
    ).toEqual(['inside', 'crossing']);
  });

  it('returns no ids when the drag box hits nothing', () => {
    expect(
      selectEntitiesInDrag(
        entities,
        { x: 40, y: 40 },
        { x: 50, y: 50 },
      ),
    ).toEqual([]);
  });
});
