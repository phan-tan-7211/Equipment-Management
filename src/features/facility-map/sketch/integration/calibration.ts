import { normalizeMmPerUnit } from '../core/units';

export const calibrateMmPerUnitFromFloorWidth = (
  knownWidthMm: number,
  canvasWidth: number,
  fallback: number,
): number => {
  if (
    !Number.isFinite(knownWidthMm) ||
    knownWidthMm <= 0 ||
    !Number.isFinite(canvasWidth) ||
    canvasWidth <= 0
  ) {
    return normalizeMmPerUnit(fallback);
  }

  return normalizeMmPerUnit(
    knownWidthMm / canvasWidth,
    fallback,
  );
};
