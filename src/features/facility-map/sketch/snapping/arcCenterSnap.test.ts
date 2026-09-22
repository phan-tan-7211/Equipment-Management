import { describe, expect, it } from 'vitest';

import {
  findArcCenterSnap,
  getArcCenterSnapPoint,
} from '@/features/facility-map/sketch/snapping/arcCenterSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('arc center snap', () => {
  it('returns the center of an Arc', () => {
    expect(
      getArcCenterSnapPoint({
        id: 'arc-1',
        type: 'arc',
        cx: 12,
        cy: 34,
        r: 5,
        startAngleDeg: 0,
        endAngleDeg: 90,
        ...style,
      }),
    ).toEqual({ x: 12, y: 34 });
  });

  it('does not return center candidates for non-Arc entities', () => {
    const entities: SketchEntity[] = [
      {
        id: 'circle-1',
        type: 'circle',
        cx: 10,
        cy: 20,
        r: 5,
        ...style,
      },
      {
        id: 'line-1',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        ...style,
      },
    ];

    expect(getArcCenterSnapPoint(entities[0])).toBeNull();
    expect(getArcCenterSnapPoint(entities[1])).toBeNull();
  });

  it('selects the nearest Arc center inside the threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'arc-a',
        type: 'arc',
        cx: 10,
        cy: 10,
        r: 5,
        startAngleDeg: 0,
        endAngleDeg: 90,
        ...style,
      },
      {
        id: 'arc-b',
        type: 'arc',
        cx: 14,
        cy: 10,
        r: 8,
        startAngleDeg: 90,
        endAngleDeg: 180,
        ...style,
      },
    ];

    expect(
      findArcCenterSnap({ x: 12.5, y: 10 }, entities, 4),
    ).toMatchObject({
      point: { x: 14, y: 10 },
      entityId: 'arc-b',
    });
  });

  it('does not snap at or outside the threshold', () => {
    const entities: SketchEntity[] = [{
      id: 'arc-1',
      type: 'arc',
      cx: 10,
      cy: 10,
      r: 5,
      startAngleDeg: 0,
      endAngleDeg: 90,
      ...style,
    }];

    expect(
      findArcCenterSnap({ x: 13, y: 10 }, entities, 3),
    ).toBeNull();
  });
});
