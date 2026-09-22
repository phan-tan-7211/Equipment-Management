import { describe, expect, it } from 'vitest';

import {
  mirrorEntityAcrossLine,
  mirrorSelectedEntities,
} from '@/features/facility-map/sketch/modify/mirror';
import type {
  LineEntity,
  SketchEntity,
} from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const axis: LineEntity = {
  ...style,
  id: 'axis',
  type: 'line',
  x1: 0,
  y1: -10,
  x2: 0,
  y2: 10,
};

describe('mirror modify', () => {
  it('mirrors a line across an axis', () => {
    const line: SketchEntity = {
      ...style,
      id: 'line',
      type: 'line',
      x1: 2,
      y1: 1,
      x2: 6,
      y2: 4,
    };

    expect(
      mirrorEntityAcrossLine(line, axis, 'mirror-line'),
    ).toMatchObject({
      id: 'mirror-line',
      x1: -2,
      y1: 1,
      x2: -6,
      y2: 4,
    });
  });

  it('mirrors circle center while preserving radius', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 8,
      cy: 3,
      r: 5,
    };

    expect(
      mirrorEntityAcrossLine(circle, axis, 'mirror-circle'),
    ).toMatchObject({
      cx: -8,
      cy: 3,
      r: 5,
    });
  });

  it('converts mirrored rectangle to a closed polyline', () => {
    const rect: SketchEntity = {
      ...style,
      id: 'rect',
      type: 'rect',
      x: 2,
      y: 1,
      w: 4,
      h: 3,
    };
    const mirrored = mirrorEntityAcrossLine(
      rect,
      axis,
      'mirror-rect',
    )!;

    expect(mirrored.type).toBe('polyline');
    expect(mirrored).toMatchObject({
      id: 'mirror-rect',
      closed: true,
    });
  });

  it('uses first selected line as axis and mirrors only targets', () => {
    const target: SketchEntity = {
      ...style,
      id: 'target',
      type: 'line',
      x1: 2,
      y1: 0,
      x2: 4,
      y2: 0,
    };
    const result = mirrorSelectedEntities(
      [axis, target],
      'axis',
      ['target'],
      () => 'copy-1',
    )!;

    expect(result.ids).toEqual(['copy-1']);
    expect(result.copies[0]).toMatchObject({
      x1: -2,
      x2: -4,
    });
  });
});
