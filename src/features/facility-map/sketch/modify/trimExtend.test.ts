import { describe, expect, it } from 'vitest';

import {
  commitExtend,
  commitTrim,
  effectiveModifyMode,
  getExtendPreview,
  getTrimPreview,
} from '@/features/facility-map/sketch/modify/trimExtend';
import type { ArcEntity, LineEntity, SketchEntity } from '@/features/facility-map/sketch/core/types';

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

  it('trims a line at the boundary of a circle it crosses', () => {
    const target = line('target', 0, 0, 20, 0);
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 10,
      cy: 0,
      r: 5,
    };
    const entities = [target, circle];

    expect(
      getTrimPreview(entities, target, { x: 10, y: 0 }),
    ).toMatchObject({
      mode: 'trim',
      from: { x: 5, y: 0 },
      to: { x: 15, y: 0 },
    });

    const trimmed = commitTrim(entities, target, { x: 10, y: 0 }, createId)!;
    const lines = trimmed.filter(
      (entity): entity is LineEntity => entity.type === 'line',
    );
    expect(lines).toHaveLength(2);
    expect(lines).toContainEqual(
      expect.objectContaining({ x1: 0, y1: 0, x2: 5, y2: 0 }),
    );
    expect(lines).toContainEqual(
      expect.objectContaining({ x1: 15, y1: 0, x2: 20, y2: 0 }),
    );
  });

  it('trims a circle into the remaining arc where a line crosses it', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };
    const boundary = line('boundary', -10, 0, 10, 0);
    const entities = [circle, boundary];

    // Clicking the bottom of the circle removes the bottom half (180°→360°)
    // and leaves the top semicircle (0°→180°) as a single arc.
    const trimmed = commitTrim(entities, circle, { x: 0, y: -5 }, createId)!;
    expect(trimmed.some((entity) => entity.id === 'circle')).toBe(false);
    const arcs = trimmed.filter((entity) => entity.type === 'arc');
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toMatchObject({
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 5,
      startAngleDeg: 0,
      endAngleDeg: 180,
      clockwise: false,
    });
  });

  it('does not trim a circle with fewer than two crossing boundaries', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };
    // Tangent line touches the circle at a single point — not enough to
    // bracket a piece for removal.
    const tangent = line('tangent', -10, 5, 10, 5);
    expect(
      commitTrim([circle, tangent], circle, { x: 0, y: 5 }, createId),
    ).toBeNull();
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

  it('extends an arc forward from its end to the next crossing of another curve', () => {
    const arc: ArcEntity = {
      ...style,
      id: 'arc',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
      clockwise: false,
    };
    // Crosses the arc's circle at angle 0 (coincides with the arc's own
    // start, so it isn't a usable boundary) and at angle 180.
    const boundary = line('boundary', -20, 0, 20, 0);
    const entities = [arc, boundary];
    const clickNearEnd = { x: 1, y: 9 };

    const preview = getExtendPreview(entities, arc, clickNearEnd)!;
    expect(preview.to.x).toBeCloseTo(-10, 6);
    expect(preview.to.y).toBeCloseTo(0, 6);

    const extended = commitExtend(entities, arc, clickNearEnd)!;
    expect(extended[0]).toMatchObject({
      type: 'arc',
      startAngleDeg: 0,
      endAngleDeg: 180,
    });
  });

  it('does not extend an arc with no other curve crossing its circle', () => {
    const arc: ArcEntity = {
      ...style,
      id: 'arc',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
      clockwise: false,
    };
    expect(getExtendPreview([arc], arc, { x: 1, y: 9 })).toBeNull();
    expect(commitExtend([arc], arc, { x: 1, y: 9 })).toBeNull();
  });

  it('swaps trim and extend while Shift is held', () => {
    expect(effectiveModifyMode('trim', true)).toBe('extend');
    expect(effectiveModifyMode('extend', true)).toBe('trim');
    expect(effectiveModifyMode('trim', false)).toBe('trim');
  });
});
