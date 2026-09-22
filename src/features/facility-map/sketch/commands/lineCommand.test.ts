import { describe, expect, it } from 'vitest';

import {
  commitLineDraft,
  createLineEntity,
  getLineDynamicAngle,
  getLineDynamicLength,
  getLineDynamicValues,
  getLineKeyboardAction,
  resolveLinePreviewEnd,
  startLineDraft,
  updateLineDraft,
} from '@/features/facility-map/sketch/commands/lineCommand';

const document = {
  displayUnit: 'mm' as const,
  mmPerUnit: 10,
};

describe('line command', () => {
  it('maps keyboard input to line confirm and cancel actions', () => {
    expect(getLineKeyboardAction('Enter')).toBe('confirm');
    expect(getLineKeyboardAction('Escape')).toBe('cancel');
    expect(getLineKeyboardAction('Tab')).toBe('none');
  });

  it('starts a line draft at the first click without sharing point references', () => {
    const point = { x: 12, y: 34 };
    const draft = startLineDraft(point);

    expect(draft).toEqual({
      type: 'line',
      start: { x: 12, y: 34 },
      current: { x: 12, y: 34 },
    });
    expect(draft.start).not.toBe(point);
    expect(draft.current).not.toBe(point);
  });

  it('updates only the preview pointer while preserving the line start', () => {
    const draft = startLineDraft({ x: 1, y: 2 });
    const updated = updateLineDraft(draft, { x: 8, y: 9 });

    expect(updated).toEqual({
      type: 'line',
      start: { x: 1, y: 2 },
      current: { x: 8, y: 9 },
    });
    expect(draft.current).toEqual({ x: 1, y: 2 });
  });

  it('formats dynamic line length in the active display unit', () => {
    expect(
      getLineDynamicLength(
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        document,
      ),
    ).toBe('50');

    expect(
      getLineDynamicLength(
        { x: 0, y: 0 },
        { x: 300, y: 400 },
        { displayUnit: 'm', mmPerUnit: 10 },
      ),
    ).toBe('5.000');
  });

  it('formats dynamic line angle from the current pointer direction', () => {
    expect(getLineDynamicAngle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe('0.0');
    expect(getLineDynamicAngle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe('90.0');
    expect(getLineDynamicAngle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBe('180.0');
  });

  it('reports dynamic length and angle from the current pointer', () => {
    expect(
      getLineDynamicValues(
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        document,
      ),
    ).toEqual({
      length: '50',
      angle: '53.1',
    });
  });

  it('keeps pointer geometry when dynamic inputs are not locked', () => {
    expect(
      resolveLinePreviewEnd({
        start: { x: 10, y: 10 },
        current: { x: 13, y: 14 },
        lengthInput: '100',
        angleInput: '0',
        lockLength: false,
        lockAngle: false,
        document,
      }),
    ).toEqual({ x: 13, y: 14 });
  });

  it('applies locked length and angle to the preview endpoint', () => {
    const end = resolveLinePreviewEnd({
      start: { x: 10, y: 10 },
      current: { x: 13, y: 14 },
      lengthInput: '100',
      angleInput: '90',
      lockLength: true,
      lockAngle: true,
      document,
    });

    expect(end.x).toBeCloseTo(10);
    expect(end.y).toBeCloseTo(20);
  });

  it('commits the active line draft from the second click', () => {
    const draft = updateLineDraft(
      startLineDraft({ x: 2, y: 3 }),
      { x: 5, y: 7 },
    );

    expect(
      commitLineDraft({
        id: 'line-commit',
        draft,
        current: { x: 5, y: 7 },
        lengthInput: '50',
        angleInput: '0',
        document,
        style: {
          color: '#123456',
          lineWidth: 2,
        },
      }),
    ).toEqual({
      id: 'line-commit',
      type: 'line',
      x1: 2,
      y1: 3,
      x2: 7,
      y2: 3,
      color: '#123456',
      lineWidth: 2,
    });
  });

  it('creates the committed line using the same dynamic input semantics', () => {
    expect(
      createLineEntity({
        id: 'line-test',
        start: { x: 5, y: 6 },
        current: { x: 8, y: 10 },
        lengthInput: '100',
        angleInput: '0',
        document,
        style: {
          color: '#2563eb',
          lineWidth: 1.5,
        },
      }),
    ).toEqual({
      id: 'line-test',
      type: 'line',
      x1: 5,
      y1: 6,
      x2: 15,
      y2: 6,
      color: '#2563eb',
      lineWidth: 1.5,
    });
  });

  it('falls back to pointer length and angle when committed inputs are invalid', () => {
    expect(
      createLineEntity({
        id: 'line-fallback',
        start: { x: 0, y: 0 },
        current: { x: 3, y: 4 },
        lengthInput: 'invalid',
        angleInput: 'invalid',
        document,
        style: {
          color: '#000000',
          lineWidth: 1,
        },
      }),
    ).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 4,
    });
  });
});
