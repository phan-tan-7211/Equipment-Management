import { describe, expect, it } from 'vitest';

import {
  createArcEntity,
  setArcStartPoint,
  startArcDraft,
  updateArcDraft,
} from '@/features/facility-map/sketch/commands/arcCommand';

describe('arc command', () => {
  it('starts with a center and no start point', () => {
    const center = { x: 10, y: 20 };
    const draft = startArcDraft(center);

    expect(draft).toEqual({
      type: 'arc',
      center: { x: 10, y: 20 },
      start: null,
      current: { x: 10, y: 20 },
    });
    expect(draft.center).not.toBe(center);
  });

  it('captures the start point and updates the current end preview', () => {
    const draft = setArcStartPoint(
      startArcDraft({ x: 0, y: 0 }),
      { x: 10, y: 0 },
    );
    const updated = updateArcDraft(draft, { x: 0, y: 10 });

    expect(updated.start).toEqual({ x: 10, y: 0 });
    expect(updated.current).toEqual({ x: 0, y: 10 });
    expect(draft.current).toEqual({ x: 10, y: 0 });
  });

  it('does not create an arc before the radius is defined', () => {
    expect(
      createArcEntity({
        draft: startArcDraft({ x: 0, y: 0 }),
        style: { color: '#2563eb', lineWidth: 1.5 },
      }),
    ).toBeNull();
  });

  it('creates an arc from center, start and end points', () => {
    const draft = updateArcDraft(
      setArcStartPoint(
        startArcDraft({ x: 0, y: 0 }),
        { x: 10, y: 0 },
      ),
      { x: 0, y: 10 },
    );

    expect(
      createArcEntity({
        id: 'arc-test',
        draft,
        style: { color: '#2563eb', lineWidth: 1.5 },
      }),
    ).toEqual({
      id: 'arc-test',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
      clockwise: undefined,
      color: '#2563eb',
      lineWidth: 1.5,
    });
  });
});
