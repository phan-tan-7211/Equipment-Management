import { describe, expect, it } from 'vitest';

import {
  applyBasicGripDrag,
  getBasicEntityGrips,
} from '@/features/facility-map/sketch/selection/basicGrips';
import type {
  CircleEntity,
  LineEntity,
  RectEntity,
} from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

describe('basic grips', () => {
  it('exposes line endpoint grips and moves an endpoint', () => {
    const line: LineEntity = {
      ...style,
      id: 'line',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
    };

    const grips = getBasicEntityGrips(line);
    expect(grips.map((grip) => grip.id)).toEqual([
      'line-start',
      'line-end',
    ]);

    expect(
      applyBasicGripDrag(line, grips[1], { x: 20, y: 5 }),
    ).toMatchObject({ x1: 0, y1: 0, x2: 20, y2: 5 });
  });

  it('resizes a rectangle from a corner and preserves positive bounds', () => {
    const rect: RectEntity = {
      ...style,
      id: 'rect',
      type: 'rect',
      x: 10,
      y: 10,
      w: 20,
      h: 10,
    };

    const grip = getBasicEntityGrips(rect)[0];
    expect(
      applyBasicGripDrag(rect, grip, { x: 35, y: 25 }),
    ).toMatchObject({
      x: 30,
      y: 20,
      w: 5,
      h: 5,
    });
  });

  it('moves circle center without changing radius', () => {
    const circle: CircleEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 10,
      cy: 10,
      r: 5,
    };

    const centerGrip = getBasicEntityGrips(circle)[0];
    expect(
      applyBasicGripDrag(circle, centerGrip, { x: 20, y: 30 }),
    ).toMatchObject({ cx: 20, cy: 30, r: 5 });
  });

  it('changes circle radius from the radius grip', () => {
    const circle: CircleEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };

    const radiusGrip = getBasicEntityGrips(circle)[1];
    expect(
      applyBasicGripDrag(circle, radiusGrip, { x: 3, y: 4 }),
    ).toMatchObject({ cx: 0, cy: 0, r: 5 });
  });
});
