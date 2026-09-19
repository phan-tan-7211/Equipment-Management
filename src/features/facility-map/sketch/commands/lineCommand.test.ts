import { describe, expect, it } from 'vitest';

import {
  createLineEntity,
  getLineDynamicValues,
  resolveLinePreviewEnd,
} from '@/features/facility-map/sketch/commands/lineCommand';

const document = {
  displayUnit: 'mm' as const,
  mmPerUnit: 10,
};

describe('line command', () => {
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
