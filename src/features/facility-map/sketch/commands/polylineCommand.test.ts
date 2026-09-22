import { describe, expect, it } from 'vitest';

import {
  appendPolylinePoint,
  createPolylineEntity,
  finishPolylineDraft,
  startPolylineDraft,
  updatePolylineDraft,
} from '@/features/facility-map/sketch/commands/polylineCommand';

describe('polyline command', () => {
  it('starts with one committed vertex and a matching preview point', () => {
    const point = { x: 10, y: 20 };
    const draft = startPolylineDraft(point);

    expect(draft).toEqual({
      type: 'polyline',
      points: [{ x: 10, y: 20 }],
      current: { x: 10, y: 20 },
    });
    expect(draft.points[0]).not.toBe(point);
    expect(draft.current).not.toBe(point);
  });

  it('updates only the preview point', () => {
    const draft = startPolylineDraft({ x: 1, y: 2 });
    const updated = updatePolylineDraft(draft, { x: 8, y: 9 });

    expect(updated.points).toEqual([{ x: 1, y: 2 }]);
    expect(updated.current).toEqual({ x: 8, y: 9 });
    expect(draft.current).toEqual({ x: 1, y: 2 });
  });

  it('appends a committed vertex without mutating the previous draft', () => {
    const draft = startPolylineDraft({ x: 1, y: 2 });
    const updated = appendPolylinePoint(draft, { x: 5, y: 6 });

    expect(updated.points).toEqual([
      { x: 1, y: 2 },
      { x: 5, y: 6 },
    ]);
    expect(updated.current).toEqual({ x: 5, y: 6 });
    expect(draft.points).toEqual([{ x: 1, y: 2 }]);
  });

  it('finishes after two or more committed vertices', () => {
    const draft = appendPolylinePoint(
      startPolylineDraft({ x: 0, y: 0 }),
      { x: 10, y: 5 },
    );

    expect(finishPolylineDraft(draft)).toEqual(draft);
    expect(finishPolylineDraft(startPolylineDraft({ x: 0, y: 0 }))).toBeNull();
  });

  it('drops duplicate terminal vertices produced by a double-click finish', () => {
    const first = appendPolylinePoint(
      startPolylineDraft({ x: 0, y: 0 }),
      { x: 10, y: 5 },
    );
    const duplicated = appendPolylinePoint(first, { x: 10, y: 5 });

    expect(finishPolylineDraft(duplicated)?.points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('does not create an entity until at least two vertices exist', () => {
    expect(
      createPolylineEntity({
        draft: startPolylineDraft({ x: 0, y: 0 }),
        style: { color: '#2563eb', lineWidth: 1.5 },
      }),
    ).toBeNull();
  });

  it('creates an immutable polyline entity from committed vertices', () => {
    const draft = appendPolylinePoint(
      startPolylineDraft({ x: 0, y: 0 }),
      { x: 10, y: 5 },
    );

    const entity = createPolylineEntity({
      id: 'polyline-test',
      draft,
      style: { color: '#2563eb', lineWidth: 1.5 },
    });

    expect(entity).toEqual({
      id: 'polyline-test',
      type: 'polyline',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
      ],
      closed: undefined,
      color: '#2563eb',
      lineWidth: 1.5,
    });
    expect(entity?.points).not.toBe(draft.points);
  });
});
