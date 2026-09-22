import { describe, expect, it } from 'vitest';

import {
  createCircleEntity,
  getCircleDynamicRadius,
  resolveCirclePreviewPoint,
  resolveCircleRadius,
  startCircleDraft,
  updateCircleDraft,
} from '@/features/facility-map/sketch/commands/circleCommand';

describe('circle command', () => {
  it('starts a circle draft at the first click', () => {
    const point = { x: 10, y: 20 };
    const draft = startCircleDraft(point);

    expect(draft).toEqual({
      type: 'circle',
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 },
    });
    expect(draft.start).not.toBe(point);
  });

  it('updates the circle preview point without moving the center', () => {
    const draft = startCircleDraft({ x: 2, y: 3 });
    const updated = updateCircleDraft(draft, { x: 8, y: 9 });

    expect(updated.start).toEqual({ x: 2, y: 3 });
    expect(updated.current).toEqual({ x: 8, y: 9 });
    expect(draft.current).toEqual({ x: 2, y: 3 });
  });

  it('formats dynamic circle radius in the active display unit', () => {
    expect(
      getCircleDynamicRadius(
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { displayUnit: 'mm', mmPerUnit: 10 },
      ),
    ).toBe('50');

    expect(
      getCircleDynamicRadius(
        { x: 0, y: 0 },
        { x: 300, y: 400 },
        { displayUnit: 'm', mmPerUnit: 10 },
      ),
    ).toBe('5.000');
  });

  it('resolves circle radius input to model units with pointer fallback', () => {
    const document = { displayUnit: 'mm' as const, mmPerUnit: 10 };

    expect(resolveCircleRadius('120', 7, document)).toBe(12);
    expect(resolveCircleRadius('invalid', 7, document)).toBe(7);
    expect(resolveCircleRadius('0', 7, document)).toBe(7);
  });

  it('resolves circle preview point from locked or pointer radius', () => {
    const draft = updateCircleDraft(
      startCircleDraft({ x: 10, y: 20 }),
      { x: 13, y: 24 },
    );
    const document = { displayUnit: 'mm' as const, mmPerUnit: 10 };

    expect(
      resolveCirclePreviewPoint({
        draft,
        radiusInput: '100',
        lockRadius: false,
        document,
      }),
    ).toEqual({ x: 15, y: 20 });

    expect(
      resolveCirclePreviewPoint({
        draft,
        radiusInput: '100',
        lockRadius: true,
        document,
      }),
    ).toEqual({ x: 20, y: 20 });
  });

  it('creates a circle from the draft center and supplied radius', () => {
    expect(
      createCircleEntity({
        id: 'circle-test',
        draft: startCircleDraft({ x: 5, y: 6 }),
        radius: 12,
        style: { color: '#0891b2', lineWidth: 1.5 },
      }),
    ).toEqual({
      id: 'circle-test',
      type: 'circle',
      cx: 5,
      cy: 6,
      r: 12,
      color: '#0891b2',
      lineWidth: 1.5,
    });
  });
});
