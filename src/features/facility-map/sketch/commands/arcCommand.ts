import { createSketchId } from '../core/id';
import { angleDeg, distance } from '../core/geometry';
import type {
  ArcEntity,
  SketchPoint,
  SketchStyle,
} from '../core/types';

export type ArcDraft = {
  type: 'arc';
  center: SketchPoint;
  start: SketchPoint | null;
  current: SketchPoint;
};

export const startArcDraft = (center: SketchPoint): ArcDraft => ({
  type: 'arc',
  center: { ...center },
  start: null,
  current: { ...center },
});

export const setArcStartPoint = (
  draft: ArcDraft,
  start: SketchPoint,
): ArcDraft => ({
  ...draft,
  start: { ...start },
  current: { ...start },
});

export const updateArcDraft = (
  draft: ArcDraft,
  current: SketchPoint,
): ArcDraft => ({
  ...draft,
  current: { ...current },
});

export type CreateArcEntityInput = {
  draft: ArcDraft;
  style: SketchStyle;
  clockwise?: boolean;
  id?: string;
};

export const createArcEntity = (
  input: CreateArcEntityInput,
): ArcEntity | null => {
  if (!input.draft.start) return null;

  const radius = distance(input.draft.center, input.draft.start);
  if (!Number.isFinite(radius) || radius <= 0) return null;

  return {
    id: input.id ?? createSketchId('sketch-arc'),
    type: 'arc',
    cx: input.draft.center.x,
    cy: input.draft.center.y,
    r: radius,
    startAngleDeg: angleDeg(input.draft.center, input.draft.start),
    endAngleDeg: angleDeg(input.draft.center, input.draft.current),
    clockwise: input.clockwise || undefined,
    ...input.style,
  };
};
