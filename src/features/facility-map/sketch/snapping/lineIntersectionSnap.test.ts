import { describe, expect, it } from 'vitest';

import {
  findLineLineIntersectionSnap,
  getLineLineIntersectionPoints,
} from '@/features/facility-map/sketch/snapping/lineIntersectionSnap';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('line-line intersection snap', () => {
  it('returns the finite intersection of two Lines', () => {
    const entities: SketchEntity[] = [
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
        ...style,
      },
      {
        id: 'line-b',
        type: 'line',
        x1: 0,
        y1: 10,
        x2: 10,
        y2: 0,
        ...style,
      },
    ];

    expect(getLineLineIntersectionPoints(entities)).toEqual([
      {
        point: { x: 5, y: 5 },
        entityIds: ['line-a', 'line-b'],
      },
    ]);
  });

  it('ignores parallel Lines and intersections outside finite segments', () => {
    const entities: SketchEntity[] = [
      {
        id: 'parallel-a',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        ...style,
      },
      {
        id: 'parallel-b',
        type: 'line',
        x1: 0,
        y1: 5,
        x2: 10,
        y2: 5,
        ...style,
      },
      {
        id: 'short-a',
        type: 'line',
        x1: 20,
        y1: 0,
        x2: 25,
        y2: 0,
        ...style,
      },
      {
        id: 'short-b',
        type: 'line',
        x1: 30,
        y1: -5,
        x2: 30,
        y2: 5,
        ...style,
      },
    ];

    expect(getLineLineIntersectionPoints(entities)).toEqual([]);
  });

  it('selects the nearest Line-Line intersection inside threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'horizontal',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 20,
        y2: 0,
        ...style,
      },
      {
        id: 'vertical-a',
        type: 'line',
        x1: 5,
        y1: -5,
        x2: 5,
        y2: 5,
        ...style,
      },
      {
        id: 'vertical-b',
        type: 'line',
        x1: 15,
        y1: -5,
        x2: 15,
        y2: 5,
        ...style,
      },
    ];

    expect(
      findLineLineIntersectionSnap({ x: 14, y: 0 }, entities, 3),
    ).toMatchObject({
      point: { x: 15, y: 0 },
      entityIds: ['horizontal', 'vertical-b'],
    });
  });

  it('does not snap at or outside threshold', () => {
    const entities: SketchEntity[] = [
      {
        id: 'line-a',
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
        ...style,
      },
      {
        id: 'line-b',
        type: 'line',
        x1: 0,
        y1: 10,
        x2: 10,
        y2: 0,
        ...style,
      },
    ];

    expect(
      findLineLineIntersectionSnap({ x: 8, y: 5 }, entities, 3),
    ).toBeNull();
  });
});
