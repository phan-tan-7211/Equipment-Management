import { describe, expect, it } from 'vitest';

import {
  findPolylineIntersectionSnap,
  getPolylineIntersectionPoints,
} from '@/features/facility-map/sketch/snapping/polylineIntersectionSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('polyline intersection snap', () => {
  it('returns Polyline-Line intersections', () => {
    const entities: SketchEntity[] = [
      {
        id: 'polyline-a',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        ...style,
      },
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 5,
        x2: 20,
        y2: 5,
        ...style,
      },
    ];

    expect(getPolylineIntersectionPoints(entities)).toEqual([
      {
        point: { x: 5, y: 5 },
        entityIds: ['polyline-a', 'line-a'],
      },
      {
        point: { x: 15, y: 5 },
        entityIds: ['polyline-a', 'line-a'],
      },
    ]);
  });

  it('returns Polyline-Polyline intersections', () => {
    const entities: SketchEntity[] = [
      {
        id: 'polyline-a',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        ...style,
      },
      {
        id: 'polyline-b',
        type: 'polyline',
        points: [
          { x: 0, y: 10 },
          { x: 10, y: 0 },
        ],
        ...style,
      },
    ];

    expect(getPolylineIntersectionPoints(entities)).toEqual([
      {
        point: { x: 5, y: 5 },
        entityIds: ['polyline-a', 'polyline-b'],
      },
    ]);
  });

  it('includes the closing segment of a closed Polyline', () => {
    const entities: SketchEntity[] = [
      {
        id: 'polyline-a',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
        closed: true,
        ...style,
      },
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 8,
        x2: 10,
        y2: 8,
        ...style,
      },
    ];

    expect(getPolylineIntersectionPoints(entities)).toEqual(
      expect.arrayContaining([
        {
          point: { x: 8, y: 8 },
          entityIds: ['polyline-a', 'line-a'],
        },
      ]),
    );
  });

  it('does not duplicate a shared intersection from adjacent segments', () => {
    const entities: SketchEntity[] = [
      {
        id: 'polyline-a',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        ...style,
      },
      {
        id: 'line-a',
        type: 'line',
        x1: 10,
        y1: 0,
        x2: 10,
        y2: 20,
        ...style,
      },
    ];

    expect(getPolylineIntersectionPoints(entities)).toEqual([
      {
        point: { x: 10, y: 10 },
        entityIds: ['polyline-a', 'line-a'],
      },
    ]);
  });

  it('selects the nearest Polyline intersection inside threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'polyline-a',
        type: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        ...style,
      },
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 5,
        x2: 20,
        y2: 5,
        ...style,
      },
    ];

    expect(
      findPolylineIntersectionSnap({ x: 14.2, y: 5 }, entities, 2),
    ).toMatchObject({
      point: { x: 15, y: 5 },
      entityIds: ['polyline-a', 'line-a'],
    });
  });
});
