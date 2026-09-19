import { describe, expect, it } from 'vitest';

import {
  findCircleCenterSnap,
  getCircleCenterSnapPoint,
} from '@/features/facility-map/sketch/snapping/circleCenterSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('circle center snap', () => {
  it('returns the center of a Circle', () => {
    expect(
      getCircleCenterSnapPoint({
        id: 'circle-1',
        type: 'circle',
        cx: 12,
        cy: 34,
        r: 5,
        ...style,
      }),
    ).toEqual({ x: 12, y: 34 });
  });

  it('does not return center candidates for non-Circle entities', () => {
    const entities: SketchEntity[] = [
      {
        id: 'line-1',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        ...style,
      },
      {
        id: 'arc-1',
        type: 'arc',
        cx: 10,
        cy: 20,
        r: 5,
        startAngleDeg: 0,
        endAngleDeg: 90,
        ...style,
      },
    ];

    expect(getCircleCenterSnapPoint(entities[0])).toBeNull();
    expect(getCircleCenterSnapPoint(entities[1])).toBeNull();
  });

  it('selects the nearest Circle center inside the threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'circle-a',
        type: 'circle',
        cx: 10,
        cy: 10,
        r: 5,
        ...style,
      },
      {
        id: 'circle-b',
        type: 'circle',
        cx: 14,
        cy: 10,
        r: 8,
        ...style,
      },
    ];

    expect(
      findCircleCenterSnap({ x: 12.5, y: 10 }, entities, 4),
    ).toMatchObject({
      point: { x: 14, y: 10 },
      entityId: 'circle-b',
    });
  });

  it('does not snap at or outside the threshold', () => {
    const entities: SketchEntity[] = [{
      id: 'circle-1',
      type: 'circle',
      cx: 10,
      cy: 10,
      r: 5,
      ...style,
    }];

    expect(
      findCircleCenterSnap({ x: 13, y: 10 }, entities, 3),
    ).toBeNull();
  });
});
