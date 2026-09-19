import { describe, expect, it } from 'vitest';

import {
  applyCoincidentConstraint,
  applyHorizontalConstraint,
  applyVerticalConstraint,
} from '@/features/facility-map/sketch/constraints/basicConstraints';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const line = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SketchEntity => ({
  ...style,
  id,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
});

describe('basic constraints', () => {
  it('makes a line horizontal', () => {
    const result = applyHorizontalConstraint(
      [line('a', 1, 2, 9, 7)],
      'a',
      'constraint-h',
    )!;

    expect(result.entities[0]).toMatchObject({
      x1: 1,
      y1: 2,
      x2: 9,
      y2: 2,
    });
    expect(result.constraint).toMatchObject({
      kind: 'horizontal',
      entityIds: ['a'],
    });
  });

  it('makes a line vertical', () => {
    const result = applyVerticalConstraint(
      [line('a', 1, 2, 9, 7)],
      'a',
      'constraint-v',
    )!;

    expect(result.entities[0]).toMatchObject({
      x1: 1,
      y1: 2,
      x2: 1,
      y2: 7,
    });
  });

  it('joins the closest pair of endpoints for coincident', () => {
    const result = applyCoincidentConstraint(
      [
        line('a', 0, 0, 10, 0),
        line('b', 12, 2, 20, 2),
      ],
      'a',
      'b',
      'constraint-c',
    )!;

    expect(result.entities[1]).toMatchObject({
      x1: 10,
      y1: 0,
      x2: 20,
      y2: 2,
    });
    expect(result.constraint.pointRefs).toEqual([
      { entityId: 'a', point: 'end' },
      { entityId: 'b', point: 'start' },
    ]);
  });

  it('returns null for unsupported entity selections', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };
    expect(
      applyHorizontalConstraint([circle], 'circle', 'constraint'),
    ).toBeNull();
  });
});
