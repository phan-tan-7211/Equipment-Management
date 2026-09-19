import { createSketchId } from '../core/id';
import type {
  CircleEntity,
  SketchPoint,
  SketchStyle,
} from '../core/types';

export type CircleDraft = {
  type: 'circle';
  start: SketchPoint;
  current: SketchPoint;
};

export const startCircleDraft = (point: SketchPoint): CircleDraft => ({
  type: 'circle',
  start: { ...point },
  current: { ...point },
});

export const updateCircleDraft = (
  draft: CircleDraft,
  current: SketchPoint,
): CircleDraft => ({
  ...draft,
  current: { ...current },
});

export type CreateCircleEntityInput = {
  draft: CircleDraft;
  radius: number;
  style: SketchStyle;
  id?: string;
};

export const createCircleEntity = (
  input: CreateCircleEntityInput,
): CircleEntity => ({
  id: input.id ?? createSketchId('sketch-circle'),
  type: 'circle',
  cx: input.draft.start.x,
  cy: input.draft.start.y,
  r: input.radius,
  ...input.style,
});
