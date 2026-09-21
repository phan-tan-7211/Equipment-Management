import { describe, expect, it } from 'vitest';

import {
  commitExtend,
  commitTrim,
  effectiveModifyMode,
  getExtendPreview,
  getTrimPreview,
} from '@/features/facility-map/sketch/modify/trimExtend';
import type { LineEntity, SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };
let id = 0;
const createId = () => `generated-${id += 1}`;

const line = (
  entityId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): LineEntity => ({
  ...style,
  id: entityId,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
});

describe('trim/extend modify', () => {
  it('previews and trims a line between boundaries', () => {
    const target = line('target', 0, 0, 20, 0);
    const entities = [
      target,
      line('left', 5, -5, 5, 5),
      line('right', 15, -5, 15, 5),
    ];

    expect(
      getTrimPreview(entities, target, { x: 10, y: 0 }),
    ).toMatchObject({
      mode: 'trim',
      from: { x: 5, y: 0 },
      to: { x: 15, y: 0 },
    });

    const trimmed = commitTrim(
      entities,
      target,
      { x: 10, y: 0 },
      createId,
    )!;

    expect(
      trimmed.filter((entity) => entity.id.startsWith('generated')),
    ).toHaveLength(2);
  });

  it('trims a rectangle edge by exploding the remaining topology into lines', () => {
    const rect: SketchEntity = {
      ...style,
      id: 'rect',
      type: 'rect',
      x: 0,
      y: 0,
      w: 20,
      h: 10,
    };
    const entities = [
      rect,
      line('left', 5, -5, 5, 5),
      line('right', 15, -5, 15, 5),
    ];
    const trimmed = commitTrim(
      entities,
      rect,
      { x: 10, y: 0 },
      createId,
    )!;

    expect(trimmed.some((entity) => entity.id === 'rect')).toBe(false);
    expect(
      trimmed.filter((entity) => entity.id.startsWith('generated')).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('trims the selected polyline segment and preserves other segments as lines', () => {
    const polyline: SketchEntity = {
      ...style,
      id: 'poly',
      type: 'polyline',
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
      ],
    };
    const entities = [
      polyline,
      line('left', 5, -5, 5, 5),
      line('right', 15, -5, 15, 5),
    ];
    const trimmed = commitTrim(
      entities,
      polyline,
      { x: 10, y: 0 },
      createId,
    )!;

    expect(trimmed.some((entity) => entity.id === 'poly')).toBe(false);
    expect(
      trimmed.filter((entity) => entity.id.startsWith('generated')).length,
    ).toBe(3);
  });

  it('previews and extends the selected end of a line', () => {
    const target = line('target', 0, 0, 10, 0);
    const boundary = line('boundary', 20, -5, 20, 5);
    const preview = getExtendPreview(
      [target, boundary],
      target,
      { x: 10, y: 0 },
    )!;
    expect(preview.to).toEqual({ x: 20, y: 0 });

    const extended = commitExtend(
      [target, boundary],
      target,
      { x: 10, y: 0 },
    )!;
    expect(extended[0]).toMatchObject({ x2: 20, y2: 0 });
  });

  it('swaps trim and extend while Shift is held', () => {
    expect(effectiveModifyMode('trim', true)).toBe('extend');
    expect(effectiveModifyMode('extend', true)).toBe('trim');
    expect(effectiveModifyMode('trim', false)).toBe('trim');
  });
});
