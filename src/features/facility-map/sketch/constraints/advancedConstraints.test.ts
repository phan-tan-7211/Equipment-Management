import { describe, expect, it } from 'vitest';

import {
  applyConcentricConstraint,
  applyEqualConstraint,
  applyFixConstraint,
  applyMidpointConstraint,
  applyParallelConstraint,
  applyPerpendicularConstraint,
} from '@/features/facility-map/sketch/constraints/advancedConstraints';
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

describe('advanced constraints', () => {
  it('makes the target line parallel while preserving target length', () => {
    const result = applyParallelConstraint(
      [line('a', 0, 0, 10, 0), line('b', 5, 5, 5, 15)],
      'a',
      'b',
      'parallel',
    )!;
    expect(result.entities[1]).toMatchObject({
      x1: 5,
      y1: 5,
      x2: 15,
      y2: 5,
    });
  });

  it('makes the target line perpendicular', () => {
    const result = applyPerpendicularConstraint(
      [line('a', 0, 0, 10, 0), line('b', 5, 5, 15, 5)],
      'a',
      'b',
      'perpendicular',
    )!;
    const target = result.entities[1] as Extract<SketchEntity, { type: 'line' }>;
    expect(target.x2).toBeCloseTo(5);
    expect(target.y2).toBeCloseTo(15);
  });

  it('makes line lengths equal', () => {
    const result = applyEqualConstraint(
      [line('a', 0, 0, 10, 0), line('b', 0, 0, 0, 4)],
      'a',
      'b',
      'equal',
    )!;
    expect(result.entities[1]).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 10,
    });
  });

  it('makes radial entity radii equal', () => {
    const entities: SketchEntity[] = [
      { ...style, id: 'a', type: 'circle', cx: 0, cy: 0, r: 12 },
      {
        ...style,
        id: 'b',
        type: 'arc',
        cx: 10,
        cy: 10,
        r: 5,
        startAngleDeg: 0,
        endAngleDeg: 90,
      },
    ];
    const result = applyEqualConstraint(entities, 'a', 'b', 'equal')!;
    expect(result.entities[1]).toMatchObject({ r: 12 });
  });

  it('records fix without moving geometry', () => {
    const entities = [line('a', 1, 2, 3, 4)];
    const result = applyFixConstraint(entities, 'a', 'fix')!;
    expect(result.entities).toBe(entities);
    expect(result.constraint).toMatchObject({
      kind: 'fix',
      entityIds: ['a'],
    });
  });

  it('moves the nearest target endpoint to reference midpoint', () => {
    const result = applyMidpointConstraint(
      [line('a', 0, 0, 10, 0), line('b', 6, 2, 20, 2)],
      'a',
      'b',
      'midpoint',
    )!;
    expect(result.entities[1]).toMatchObject({
      x1: 5,
      y1: 0,
      x2: 20,
      y2: 2,
    });
    expect(result.constraint.pointRefs?.[0]).toEqual({
      entityId: 'a',
      point: 'midpoint',
    });
  });

  it('moves target center to reference center for concentric', () => {
    const entities: SketchEntity[] = [
      { ...style, id: 'a', type: 'circle', cx: 5, cy: 7, r: 12 },
      { ...style, id: 'b', type: 'circle', cx: 20, cy: 30, r: 4 },
    ];
    const result = applyConcentricConstraint(
      entities,
      'a',
      'b',
      'concentric',
    )!;
    expect(result.entities[1]).toMatchObject({
      cx: 5,
      cy: 7,
      r: 4,
    });
  });
});
