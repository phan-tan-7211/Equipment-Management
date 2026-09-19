import { createSketchId } from '../core/id';
import type {
  PolylineEntity,
  SketchPoint,
  SketchStyle,
} from '../core/types';

export type PolylineDraft = {
  type: 'polyline';
  points: SketchPoint[];
  current: SketchPoint;
};

export const startPolylineDraft = (point: SketchPoint): PolylineDraft => ({
  type: 'polyline',
  points: [{ ...point }],
  current: { ...point },
});

export const updatePolylineDraft = (
  draft: PolylineDraft,
  current: SketchPoint,
): PolylineDraft => ({
  ...draft,
  current: { ...current },
});

export const appendPolylinePoint = (
  draft: PolylineDraft,
  point: SketchPoint,
): PolylineDraft => ({
  ...draft,
  points: [...draft.points, { ...point }],
  current: { ...point },
});

export type CreatePolylineEntityInput = {
  draft: PolylineDraft;
  style: SketchStyle;
  closed?: boolean;
  id?: string;
};

export const createPolylineEntity = (
  input: CreatePolylineEntityInput,
): PolylineEntity | null => {
  if (input.draft.points.length < 2) return null;

  return {
    id: input.id ?? createSketchId('sketch-polyline'),
    type: 'polyline',
    points: input.draft.points.map((point) => ({ ...point })),
    closed: input.closed || undefined,
    ...input.style,
  };
};
