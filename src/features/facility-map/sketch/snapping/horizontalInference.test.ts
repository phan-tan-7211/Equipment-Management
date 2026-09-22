import { describe, expect, it } from 'vitest';

import {
  applyHorizontalInference,
  DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG,
  isHorizontalInferenceCandidate,
} from '@/features/facility-map/sketch/snapping/horizontalInference';

describe('horizontal inference', () => {
  it('uses the existing 4 degree tolerance', () => {
    expect(DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG).toBe(4);
  });

  it('recognizes near-horizontal points in both directions', () => {
    expect(
      isHorizontalInferenceCandidate(
        { x: 0, y: 0 },
        { x: 100, y: 5 },
      ),
    ).toBe(true);

    expect(
      isHorizontalInferenceCandidate(
        { x: 0, y: 0 },
        { x: -100, y: 5 },
      ),
    ).toBe(true);
  });

  it('does not infer horizontal outside tolerance', () => {
    expect(
      isHorizontalInferenceCandidate(
        { x: 0, y: 0 },
        { x: 100, y: 10 },
      ),
    ).toBe(false);
  });

  it('locks y to the start point while preserving x', () => {
    expect(
      applyHorizontalInference(
        { x: 10, y: 20 },
        { x: 110, y: 24 },
      ),
    ).toEqual({ x: 110, y: 20 });
  });

  it('returns an unchanged copy when horizontal inference does not apply', () => {
    const current = { x: 20, y: 40 };
    const result = applyHorizontalInference(
      { x: 0, y: 0 },
      current,
    );

    expect(result).toEqual(current);
    expect(result).not.toBe(current);
  });
});
