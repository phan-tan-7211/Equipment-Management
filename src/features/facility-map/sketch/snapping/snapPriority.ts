import type { SketchPoint } from '../core/types';

export type SnapKind =
  | 'endpoint'
  | 'intersection'
  | 'midpoint'
  | 'center'
  | 'nearest'
  | 'grid';

export type SnapCandidate = {
  kind: SnapKind;
  point: SketchPoint;
  distance: number;
};

export const SNAP_PRIORITY: Record<SnapKind, number> = {
  endpoint: 0,
  intersection: 1,
  midpoint: 2,
  center: 3,
  nearest: 4,
  grid: 5,
};

export const selectSnapCandidate = (
  candidates: Array<SnapCandidate | null>,
): SnapCandidate | null => {
  let best: SnapCandidate | null = null;

  candidates.forEach((candidate) => {
    if (!candidate) return;
    if (!best) {
      best = candidate;
      return;
    }

    const candidatePriority = SNAP_PRIORITY[candidate.kind];
    const bestPriority = SNAP_PRIORITY[best.kind];

    if (
      candidatePriority < bestPriority ||
      (
        candidatePriority === bestPriority &&
        candidate.distance < best.distance
      )
    ) {
      best = candidate;
    }
  });

  return best;
};
