import type { SketchPoint } from '../core/types';

export const DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG = 4;

const horizontalDeviationDeg = (
  start: SketchPoint,
  current: SketchPoint,
): number => {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  return Math.min(angle, Math.abs(180 - angle));
};

export const isHorizontalInferenceCandidate = (
  start: SketchPoint,
  current: SketchPoint,
  toleranceDeg = DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG,
): boolean =>
  horizontalDeviationDeg(start, current) < toleranceDeg;

export const applyHorizontalInference = (
  start: SketchPoint,
  current: SketchPoint,
  toleranceDeg = DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG,
): SketchPoint =>
  isHorizontalInferenceCandidate(start, current, toleranceDeg)
    ? { x: current.x, y: start.y }
    : { ...current };
