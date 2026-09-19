import { describe, expect, it } from 'vitest';

import {
  breakLineAtPoint,
  createOffsetEntity,
  offsetLine,
  offsetPolyline,
} from '@/features/facility-map/sketch/modify/breakOffset';
import type {
  LineEntity,
  PolylineEntity,
  SketchEntity,
} from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const line: LineEntity = {
  ...style,
  id: 'line',
  type: 'line',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 0,
};

describe('break/offset modify', () => {
  it('breaks a line into two entities at the projected click point', () => {
    let nextId = 0;
    const result = breakLineAtPoint(
      [line],
      line,
      { x: 4, y: 3 },
      () => `part-${nextId += 1}`,
    )!;

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'part-1',
      x1: 0,
      y1: 0,
      x2: 4,
      y2: 0,
    });
    expect(result[1]).toMatchObject({
      id: 'part-2',
      x1: 4,
      y1: 0,
      x2: 10,
      y2: 0,
    });
  });

  it('rejects break points at line endpoints', () => {
    expect(
      breakLineAtPoint([line], line, { x: 0, y: 0 }, () => 'part'),
    ).toBeNull();
  });

  it('offsets a line toward the click side', () => {
    const above = offsetLine(
      line,
      5,
      { x: 5, y: 10 },
      'offset-above',
    )!;
    const below = offsetLine(
      line,
      5,
      { x: 5, y: -10 },
      'offset-below',
    )!;

    expect(above).toMatchObject({ y1: 5, y2: 5 });
    expect(below).toMatchObject({ y1: -5, y2: -5 });
  });

  it('offsets an open polyline while preserving point count', () => {
    const polyline: PolylineEntity = {
      ...style,
      id: 'polyline',
      type: 'polyline',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
    };

    const offset = offsetPolyline(
      polyline,
      2,
      { x: 5, y: 4 },
      'offset-polyline',
    )!;

    expect(offset.id).toBe('offset-polyline');
    expect(offset.points).toHaveLength(3);
    expect(offset.points[0]).toEqual({ x: 0, y: 2 });
  });

  it('returns null for unsupported offset entities', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };
    expect(
      createOffsetEntity(circle, 5, { x: 0, y: 10 }, 'offset'),
    ).toBeNull();
  });
});
