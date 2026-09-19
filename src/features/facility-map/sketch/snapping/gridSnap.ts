import { distance } from '../core/geometry';
import type { SketchPoint } from '../core/types';

export const DEFAULT_GRID_STEP = 10;

export type GridSnapResult = {
  point: SketchPoint;
  distance: number;
};

export const getGridSnapPoint = (
  point: SketchPoint,
  step = DEFAULT_GRID_STEP,
): SketchPoint => {
  const safeStep = Number.isFinite(step) && step > 0
    ? step
    : DEFAULT_GRID_STEP;

  return {
    x: Math.round(point.x / safeStep) * safeStep,
    y: Math.round(point.y / safeStep) * safeStep,
  };
};

export const findGridSnap = (
  point: SketchPoint,
  threshold: number,
  step = DEFAULT_GRID_STEP,
): GridSnapResult | null => {
  const candidate = getGridSnapPoint(point, step);
  const candidateDistance = distance(point, candidate);

  if (candidateDistance >= threshold) return null;

  return {
    point: candidate,
    distance: candidateDistance,
  };
};
