import { DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG } from './horizontalInference';
import type { SketchPoint } from '../core/types';

const verticalDeviationDeg = (
  start: SketchPoint,
  current: SketchPoint,
): number => {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  return Math.abs(90 - angle);
};

export const isVerticalInferenceCandidate = (
  start: SketchPoint,
  current: SketchPoint,
  toleranceDeg = DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG,
): boolean =>
  verticalDeviationDeg(start, current) < toleranceDeg;

export const applyVerticalInference = (
  start: SketchPoint,
  current: SketchPoint,
  toleranceDeg = DEFAULT_INFERENCE_ANGLE_TOLERANCE_DEG,
): SketchPoint =>
  isVerticalInferenceCandidate(start, current, toleranceDeg)
    ? { x: start.x, y: current.y }
    : { ...current };
