import { describe, expect, it } from 'vitest';

import {
  applyBasicGripDrag,
  getBasicEntityGrips,
} from '@/features/facility-map/sketch/selection/basicGrips';
import type {
  ArcEntity,
  CircleEntity,
  LineEntity,
  PolylineEntity,
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
      applyBasicGripDrag(circle, radiusGrip, { x: 6, y: 8 }),
    ).toMatchObject({ cx: 0, cy: 0, r: 10 });
  });

  it('exposes every polyline vertex and moves only the dragged vertex', () => {
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

    const grips = getBasicEntityGrips(polyline);
    expect(grips.map((grip) => grip.id)).toEqual([
      'polyline-vertex:0',
      'polyline-vertex:1',
      'polyline-vertex:2',
    ]);

    expect(
      applyBasicGripDrag(polyline, grips[1], { x: 7, y: 4 }),
    ).toMatchObject({
      points: [
        { x: 0, y: 0 },
        { x: 7, y: 4 },
        { x: 10, y: 10 },
      ],
    });
  });

  it('exposes arc center/start/end grips and moves the center', () => {
    const arc: ArcEntity = {
      ...style,
      id: 'arc',
      type: 'arc',
      cx: 10,
      cy: 20,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
    };

    const grips = getBasicEntityGrips(arc);
    expect(grips.map((grip) => grip.id)).toEqual([
      'arc-center',
      'arc-start',
      'arc-end',
    ]);

    expect(
      applyBasicGripDrag(arc, grips[0], { x: 30, y: 40 }),
    ).toMatchObject({
      cx: 30,
      cy: 40,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
    });
  });

  it('updates arc radius and the dragged endpoint angle', () => {
    const arc: ArcEntity = {
      ...style,
      id: 'arc',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
    };

    const endGrip = getBasicEntityGrips(arc)[2];
    expect(
      applyBasicGripDrag(arc, endGrip, { x: -20, y: 0 }),
    ).toMatchObject({
      r: 20,
      startAngleDeg: 0,
      endAngleDeg: 180,
    });
  });
});
