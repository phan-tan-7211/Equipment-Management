import { describe, expect, it } from 'vitest';

import {
  findMidpointSnap,
  getEntityMidpointSnapPoints,
} from '@/features/facility-map/sketch/snapping/midpointSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('midpoint snap', () => {
  it('returns the midpoint of a Line', () => {
    expect(
      getEntityMidpointSnapPoints({
        id: 'line-1',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 20,
        ...style,
      }),
    ).toEqual([{ x: 5, y: 10 }]);
  });

  it('returns a midpoint for every Polyline segment including the closing segment', () => {
    expect(
      getEntityMidpointSnapPoints({
        id: 'polyline-1',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
        closed: true,
        ...style,
      }),
    ).toEqual([
      { x: 5, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 5 },
    ]);
  });

  it('returns the four Rectangle edge midpoints', () => {
    expect(
      getEntityMidpointSnapPoints({
        id: 'rect-1',
        type: 'rect',
        x: 10,
        y: 20,
        w: 30,
        h: 40,
        ...style,
      }),
    ).toEqual([
      { x: 25, y: 20 },
      { x: 40, y: 40 },
      { x: 25, y: 60 },
      { x: 10, y: 40 },
    ]);
  });

  it('does not treat Circle or Arc center as midpoint snap candidates', () => {
    const entities: SketchEntity[] = [
      {
        id: 'circle-1',
        type: 'circle',
        cx: 10,
        cy: 10,
        r: 5,
        ...style,
      },
      {
        id: 'arc-1',
        type: 'arc',
        cx: 10,
        cy: 10,
        r: 5,
        startAngleDeg: 0,
        endAngleDeg: 90,
        ...style,
      },
    ];

    expect(getEntityMidpointSnapPoints(entities[0])).toEqual([]);
    expect(getEntityMidpointSnapPoints(entities[1])).toEqual([]);
  });

  it('selects the nearest midpoint inside the threshold', () => {
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
        x1: 10,
        y1: 10,
        x2: 20,
        y2: 10,
        ...style,
      },
    ];

    expect(findMidpointSnap({ x: 5.5, y: 0 }, entities, 2)).toMatchObject({
      point: { x: 5, y: 0 },
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

    expect(findMidpointSnap({ x: 8, y: 0 }, entities, 3)).toBeNull();
  });
});
