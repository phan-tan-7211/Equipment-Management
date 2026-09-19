import { describe, expect, it } from 'vitest';

import {
  applySymmetryConstraint,
  applyTangentConstraint,
} from '@/features/facility-map/sketch/constraints/parametricConstraints';
import type {
  LineEntity,
  SketchEntity,
} from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const line = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): LineEntity => ({
  ...style,
  id,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
});

describe('parametric constraints', () => {
  it('moves a line parallel to itself until tangent to a circle', () => {
    const tangent = line('line', -10, 0, 10, 0);
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 5,
      r: 2,
    };

    const result = applyTangentConstraint(
      [tangent, circle],
      'line',
      'circle',
      'tangent-1',
    )!;

    expect(result.entities[0]).toMatchObject({
      y1: 3,
      y2: 3,
    });
    expect(result.constraint).toMatchObject({
      kind: 'tangent',
      entityIds: ['line', 'circle'],
    });
  });

  it('mirrors reference geometry into target across the axis', () => {
    const axis = line('axis', 0, -10, 0, 10);
    const reference = line('reference', 2, 1, 6, 1);
    const target = line('target', 20, 20, 30, 20);

    const result = applySymmetryConstraint(
      [axis, reference, target],
      'axis',
      'reference',
      'target',
      'symmetry-1',
    )!;

    expect(result.entities[2]).toMatchObject({
      id: 'target',
      x1: -2,
      y1: 1,
      x2: -6,
      y2: 1,
    });
    expect(result.constraint.entityIds).toEqual([
      'axis',
      'reference',
      'target',
    ]);
  });
});
