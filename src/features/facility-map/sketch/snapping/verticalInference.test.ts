import { describe, expect, it } from 'vitest';

import {
  applyVerticalInference,
  isVerticalInferenceCandidate,
} from '@/features/facility-map/sketch/snapping/verticalInference';

describe('vertical inference', () => {
  it('recognizes near-vertical points above and below the start', () => {
    expect(
      isVerticalInferenceCandidate(
        { x: 0, y: 0 },
        { x: 5, y: 100 },
      ),
    ).toBe(true);

    expect(
      isVerticalInferenceCandidate(
        { x: 0, y: 0 },
        { x: 5, y: -100 },
      ),
    ).toBe(true);
  });

  it('does not infer vertical outside tolerance', () => {
    expect(
      isVerticalInferenceCandidate(
        { x: 0, y: 0 },
        { x: 10, y: 100 },
      ),
    ).toBe(false);
  });

  it('locks x to the start point while preserving y', () => {
    expect(
      applyVerticalInference(
        { x: 10, y: 20 },
        { x: 14, y: 120 },
      ),
    ).toEqual({ x: 10, y: 120 });
  });

  it('returns an unchanged copy when vertical inference does not apply', () => {
    const current = { x: 40, y: 20 };
    const result = applyVerticalInference(
      { x: 0, y: 0 },
      current,
    );

    expect(result).toEqual(current);
    expect(result).not.toBe(current);
  });
});
