import { createSketchId } from '../core/id';
import { clampPositive } from '../core/geometry';
import {
  displayToModelUnits,
  modelUnitsToDisplay,
  unitPrecision,
} from '../core/units';
import type {
  RectEntity,
  SketchDocument,
  SketchPoint,
  SketchStyle,
} from '../core/types';

type RectangleDocumentUnits = Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>;


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

export const getRectangleDynamicWidth = (
  start: SketchPoint,
  current: SketchPoint,
  document: RectangleDocumentUnits,
): string =>
  modelUnitsToDisplay(Math.abs(current.x - start.x), document)
    .toFixed(unitPrecision(document.displayUnit));

export const resolveRectangleWidth = (
  widthInput: string,
  fallbackWidth: number,
  document: RectangleDocumentUnits,
): number =>
  clampPositive(
    displayToModelUnits(Number(widthInput), document),
    fallbackWidth,
  );

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
