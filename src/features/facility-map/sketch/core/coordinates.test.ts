import { describe, expect, it } from 'vitest';

import {
  clientPointToSketchPoint,
  cssPixelsToSketchUnits,
} from '@/features/facility-map/sketch/core/coordinates';

describe('sketch coordinate helpers', () => {
  it('maps client coordinates into sketch model space', () => {
    expect(
      clientPointToSketchPoint(
        300,
        250,
        { left: 100, top: 50, width: 400, height: 400 },
        1000,
        800,
      ),
    ).toEqual({ x: 500, y: 400 });
  });

  it('returns null when the rendered viewport has no usable size', () => {
    expect(
      clientPointToSketchPoint(
        100,
        100,
        { left: 0, top: 0, width: 0, height: 100 },
        1000,
        800,
      ),
    ).toBeNull();
  });

  it('converts a CSS-pixel tolerance to sketch units', () => {
    expect(cssPixelsToSketchUnits(10, 500, 1000)).toBe(20);
  });
});
