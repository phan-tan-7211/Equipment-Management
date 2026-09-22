import { describe, expect, it } from 'vitest';

import {
  findEndpointSnap,
  getEntityEndpointSnapPoints,
} from '@/features/facility-map/sketch/snapping/endpointSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('endpoint snap', () => {
  it('returns Line endpoints, Polyline vertices and Rectangle corners', () => {
    expect(
      getEntityEndpointSnapPoints({
        id: 'line-1',
        type: 'line',
        x1: 1,
        y1: 2,
        x2: 3,
        y2: 4,
        ...style,
      }),
    ).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);

    expect(
      getEntityEndpointSnapPoints({
        id: 'polyline-1',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 0 },
        ],
        ...style,
      }),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ]);

    expect(
      getEntityEndpointSnapPoints({
        id: 'rect-1',
        type: 'rect',
        x: 10,
        y: 20,
        w: 30,
        h: 40,
        ...style,
      }),
    ).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ]);
  });

  it('returns Arc start/end but excludes Arc center and Circle center', () => {
    const arc: SketchEntity = {
      id: 'arc-1',
      type: 'arc',
      cx: 10,
      cy: 10,
      r: 5,
      startAngleDeg: 0,
      endAngleDeg: 90,
      ...style,
    };

    expect(getEntityEndpointSnapPoints(arc)).toEqual([
      { x: 15, y: 10 },
      { x: 10, y: 15 },
    ]);

    expect(
      getEntityEndpointSnapPoints({
        id: 'circle-1',
        type: 'circle',
        cx: 10,
        cy: 10,
        r: 5,
        ...style,
      }),
    ).toEqual([]);
  });

  it('selects the nearest endpoint inside the threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        ...style,
      },
      {
        id: 'line-b',
        type: 'line',
        x1: 12,
        y1: 0,
        x2: 20,
        y2: 0,
        ...style,
      },
    ];

    expect(findEndpointSnap({ x: 10.8, y: 0 }, entities, 3)).toMatchObject({
      point: { x: 10, y: 0 },
      entityId: 'line-a',
    });
  });

  it('does not snap at or outside the threshold', () => {
    const entities: SketchEntity[] = [{
      id: 'line-1',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
      ...style,
    }];

    expect(findEndpointSnap({ x: 13, y: 0 }, entities, 3)).toBeNull();
    expect(findEndpointSnap({ x: 20, y: 20 }, entities, 3)).toBeNull();
  });
});
