import { describe, expect, it } from 'vitest';

import {
  createRectangleEntity,
  startRectangleDraft,
  updateRectangleDraft,
} from '@/features/facility-map/sketch/commands/rectangleCommand';

describe('rectangle command', () => {
  it('starts a rectangle draft at the first click', () => {
    const point = { x: 10, y: 20 };
    const draft = startRectangleDraft(point);

    expect(draft).toEqual({
      type: 'rect',
      start: { x: 10, y: 20 },
      current: { x: 10, y: 20 },
    });
    expect(draft.start).not.toBe(point);
  });

  it('updates the rectangle preview point without moving the start', () => {
    const draft = startRectangleDraft({ x: 2, y: 3 });
    const updated = updateRectangleDraft(draft, { x: 9, y: 11 });

    expect(updated.start).toEqual({ x: 2, y: 3 });
    expect(updated.current).toEqual({ x: 9, y: 11 });
    expect(draft.current).toEqual({ x: 2, y: 3 });
  });

  it('creates a rectangle in the positive drag direction', () => {
    expect(
      createRectangleEntity({
        id: 'rect-positive',
        draft: startRectangleDraft({ x: 10, y: 20 }),
        current: { x: 30, y: 50 },
        width: 20,
        height: 30,
        style: { color: '#123456', lineWidth: 2 },
      }),
    ).toEqual({
      id: 'rect-positive',
      type: 'rect',
      x: 10,
      y: 20,
      w: 20,
      h: 30,
      color: '#123456',
      lineWidth: 2,
    });
  });

  it('anchors x/y correctly when dragging left and upward', () => {
    expect(
      createRectangleEntity({
        id: 'rect-negative',
        draft: startRectangleDraft({ x: 10, y: 20 }),
        current: { x: 5, y: 15 },
        width: 5,
        height: 5,
        style: { color: '#000000', lineWidth: 1 },
      }),
    ).toMatchObject({
      x: 5,
      y: 15,
      w: 5,
      h: 5,
    });
  });
});
