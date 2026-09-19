import { createSketchId } from '../core/id';
import type {
  RectEntity,
  SketchPoint,
  SketchStyle,
} from '../core/types';

export type RectangleDraft = {
  type: 'rect';
  start: SketchPoint;
  current: SketchPoint;
};

export const startRectangleDraft = (point: SketchPoint): RectangleDraft => ({
  type: 'rect',
  start: { ...point },
  current: { ...point },
});

export const updateRectangleDraft = (
  draft: RectangleDraft,
  current: SketchPoint,
): RectangleDraft => ({
  ...draft,
  current: { ...current },
});

export type CreateRectangleEntityInput = {
  draft: RectangleDraft;
  current: SketchPoint;
  width: number;
  height: number;
  style: SketchStyle;
  id?: string;
};

export const createRectangleEntity = (
  input: CreateRectangleEntityInput,
): RectEntity => {
  const signX = input.current.x >= input.draft.start.x ? 1 : -1;
  const signY = input.current.y >= input.draft.start.y ? 1 : -1;

  return {
    id: input.id ?? createSketchId('sketch-rect'),
    type: 'rect',
    x: signX > 0 ? input.draft.start.x : input.draft.start.x - input.width,
    y: signY > 0 ? input.draft.start.y : input.draft.start.y - input.height,
    w: input.width,
    h: input.height,
    ...input.style,
  };
};
