import { describe, expect, it } from 'vitest';

import {
  findNearestSnap,
  getNearestPointOnEntity,
} from '@/features/facility-map/sketch/snapping/nearestSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('nearest snap', () => {
  it('projects onto finite Line and Rectangle edges', () => {
    expect(
      getNearestPointOnEntity(
        { x: 5, y: 3 },
        {
          id: 'line-1',
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 10,
          y2: 0,
          ...style,
        },
      ),
    ).toEqual({ x: 5, y: 0 });

    expect(
      getNearestPointOnEntity(
        { x: 15, y: 8 },
        {
          id: 'rect-1',
          type: 'rect',
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          ...style,
        },
      ),
    ).toEqual({ x: 10, y: 8 });
  });

  it('projects onto the nearest Polyline segment', () => {
    expect(
      getNearestPointOnEntity(
        { x: 9, y: 4 },
        {
          id: 'polyline-1',
          type: 'polyline',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
          ],
          ...style,
        },
      ),
    ).toEqual({ x: 10, y: 4 });
  });

  it('projects radially onto a Circle', () => {
    expect(
      getNearestPointOnEntity(
        { x: 20, y: 10 },
        {
          id: 'circle-1',
          type: 'circle',
          cx: 10,
          cy: 10,
          r: 5,
          ...style,
        },
      ),
    ).toEqual({ x: 15, y: 10 });
  });

  it('projects onto an Arc only when the radial angle lies on the Arc', () => {
    const arc: SketchEntity = {
      id: 'arc-1',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
      ...style,
    };

    const onArc = getNearestPointOnEntity({ x: 8, y: 8 }, arc);
    expect(onArc?.x).toBeCloseTo(Math.sqrt(50));
    expect(onArc?.y).toBeCloseTo(Math.sqrt(50));

    const endpoint = getNearestPointOnEntity({ x: -10, y: 0 }, arc);
    expect(endpoint?.x).toBeCloseTo(0);
    expect(endpoint?.y).toBeCloseTo(10);
  });

  it('selects the nearest entity point inside threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 20,
        y2: 0,
        ...style,
      },
      {
        id: 'line-b',
        type: 'line',
        x1: 0,
        y1: 5,
        x2: 20,
        y2: 5,
        ...style,
      },
    ];

    expect(findNearestSnap({ x: 10, y: 4 }, entities, 3)).toMatchObject({
      point: { x: 10, y: 5 },
      entityId: 'line-b',
    });
  });

  it('does not snap at or outside threshold', () => {
    const entities: SketchEntity[] = [{
      id: 'line-1',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
      ...style,
    }];

    expect(findNearestSnap({ x: 5, y: 3 }, entities, 3)).toBeNull();
  });
});
