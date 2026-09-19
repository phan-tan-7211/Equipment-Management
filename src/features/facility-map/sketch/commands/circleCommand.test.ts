import { describe, expect, it } from 'vitest';

import {
  createCircleEntity,
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
