import { describe, expect, it } from 'vitest';

import {
  getEntityViewDimensions,
  getSketchViewDimensions,
} from '@/features/facility-map/sketch/dimensions/viewDimensions';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

describe('view dimensions', () => {
  it('creates length and angle dimensions for a line', () => {
    const line: SketchEntity = {
      ...style,
      id: 'line-1',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 4,
    };

    const dimensions = getEntityViewDimensions(line);

    expect(dimensions.map((item) => item.kind)).toEqual([
      'length',
      'angle',
    ]);
    expect(dimensions[0].value).toBe(5);
    expect(dimensions[1].value).toBeCloseTo(53.1301, 4);
  });

  it('creates horizontal and vertical dimensions for a rectangle', () => {
    const rect: SketchEntity = {
      ...style,
      id: 'rect-1',
      type: 'rect',
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    };

    expect(
      getEntityViewDimensions(rect).map((item) => [
        item.kind,
        item.value,
      ]),
    ).toEqual([
      ['horizontal', 30],
      ['vertical', 40],
    ]);
  });

  it('creates radius and diameter dimensions for a circle', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle-1',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 12,
    };

    expect(
      getEntityViewDimensions(circle).map((item) => [
        item.kind,
        item.value,
      ]),
    ).toEqual([
      ['radius', 12],
      ['diameter', 24],
    ]);
  });

  it('creates radius and sweep angle for an arc and ignores polyline', () => {
    const arc: SketchEntity = {
      ...style,
      id: 'arc-1',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 20,
      endAngleDeg: 110,
    };
    const polyline: SketchEntity = {
      ...style,
      id: 'polyline-1',
      type: 'polyline',
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };

    expect(
      getEntityViewDimensions(arc).map((item) => [
        item.kind,
        item.value,
      ]),
    ).toEqual([
      ['radius', 10],
      ['angle', 90],
    ]);
    expect(getSketchViewDimensions([polyline])).toEqual([]);
  });
});
