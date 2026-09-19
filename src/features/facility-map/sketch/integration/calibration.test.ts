import { describe, expect, it } from 'vitest';

import { calibrateMmPerUnitFromFloorWidth } from '@/features/facility-map/sketch/integration/calibration';

describe('floor sketch calibration', () => {
  it('calibrates model units from known physical floor width', () => {
    expect(
      calibrateMmPerUnitFromFloorWidth(30000, 1200, 10),
    ).toBe(25);
  });

  it('keeps fallback for invalid calibration input', () => {
    expect(
      calibrateMmPerUnitFromFloorWidth(0, 1200, 10),
    ).toBe(10);
    expect(
      calibrateMmPerUnitFromFloorWidth(30000, 0, 10),
    ).toBe(10);
  });
});
