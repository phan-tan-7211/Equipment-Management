import { describe, expect, it } from 'vitest';

import {
  angleDeg,
  arcPoint,
  clampPositive,
  degToRad,
  distance,
  getSketchEntitiesBounds,
  rectEdges,
  segmentIntersection,
  translateSketchEntity,
} from '@/features/facility-map/sketch/core/geometry';
import type {
  ArcEntity,
  LineEntity,
  RectEntity,
} from '@/features/facility-map/sketch';

describe('sketch geometry helpers', () => {
  it('computes distance and angle without changing coordinate semantics', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 3, y: 4 };

    expect(distance(start, end)).toBe(5);
    expect(angleDeg(start, { x: 0, y: 10 })).toBe(90);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('uses the fallback for invalid positive values only', () => {
    expect(clampPositive(12, 5)).toBe(12);
    expect(clampPositive(0, 5)).toBe(5);
    expect(clampPositive(Number.NaN, 5)).toBe(5);
  });

  it('computes arc points from center, radius, and angle', () => {
    const arc: ArcEntity = {
      id: 'arc-1',
      type: 'arc',
      cx: 10,
      cy: 20,
      r: 5,
      startAngleDeg: 0,
      endAngleDeg: 90,
      color: '#000000',
      lineWidth: 1,
    };

    expect(arcPoint(arc, 0)).toEqual({ x: 15, y: 20 });
    expect(arcPoint(arc, 90).x).toBeCloseTo(10);
    expect(arcPoint(arc, 90).y).toBeCloseTo(25);
  });

  it('returns rectangle edges in perimeter order', () => {
    const rect: RectEntity = {
      id: 'rect-1',
      type: 'rect',
      x: 2,
      y: 3,
      w: 4,
      h: 5,
      color: '#000000',
      lineWidth: 1,
    };

    expect(rectEdges(rect)).toEqual([
      [{ x: 2, y: 3 }, { x: 6, y: 3 }],
      [{ x: 6, y: 3 }, { x: 6, y: 8 }],
      [{ x: 6, y: 8 }, { x: 2, y: 8 }],
      [{ x: 2, y: 8 }, { x: 2, y: 3 }],
    ]);
  });

  it('translates entities without mutating the source', () => {
    const line: LineEntity = {
      id: 'line-1',
      type: 'line',
      x1: 1,
      y1: 2,
      x2: 3,
      y2: 4,
      color: '#000000',
      lineWidth: 1,
    };

    expect(translateSketchEntity(line, 10, -2)).toMatchObject({
      x1: 11,
      y1: 0,
      x2: 13,
      y2: 2,
    });
    expect(line).toMatchObject({ x1: 1, y1: 2, x2: 3, y2: 4 });
  });

  it('computes the overall bounds across mixed entity types', () => {
    const line: LineEntity = {
      id: 'line-1', type: 'line', x1: 0, y1: 0, x2: 10, y2: 0, color: '#000', lineWidth: 1,
    };
    const rect: RectEntity = {
      id: 'rect-1', type: 'rect', x: 5, y: 5, w: 20, h: 10, color: '#000', lineWidth: 1,
    };

    expect(getSketchEntitiesBounds([line, rect])).toEqual({
      minX: 0,
      minY: 0,
      maxX: 25,
      maxY: 15,
    });
  });

  it('returns null bounds for an empty entity list', () => {
    expect(getSketchEntitiesBounds([])).toBeNull();
  });

  it('finds segment intersections and supports an infinite target line', () => {
    expect(
      segmentIntersection(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: -5 },
        { x: 5, y: 5 },
      ),
    ).toMatchObject({
      point: { x: 5, y: 0 },
      t: 0.5,
      u: 0.5,
    });

    expect(
      segmentIntersection(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: -1 },
        { x: 2, y: 1 },
      ),
    ).toBeNull();

    expect(
      segmentIntersection(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: -1 },
        { x: 2, y: 1 },
        true,
      ),
    ).toMatchObject({
      point: { x: 2, y: 0 },
      t: 2,
      u: 0.5,
    });
  });
});
