import { createSketchId } from '../core/id';
import { clampPositive, distance } from '../core/geometry';
import {
  displayToModelUnits,
  modelUnitsToDisplay,
  unitPrecision,
} from '../core/units';
import type {
  CircleEntity,
  SketchDocument,
  SketchPoint,
  SketchStyle,
} from '../core/types';

type CircleDocumentUnits = Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>;

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

export const getCircleDynamicRadius = (
  center: SketchPoint,
  current: SketchPoint,
  document: CircleDocumentUnits,
): string =>
  modelUnitsToDisplay(distance(center, current), document)
    .toFixed(unitPrecision(document.displayUnit));

export const resolveCircleRadius = (
  radiusInput: string,
  fallbackRadius: number,
  document: CircleDocumentUnits,
): number =>
  clampPositive(
    displayToModelUnits(Number(radiusInput), document),
    fallbackRadius,
  );

export type ResolveCirclePreviewPointInput = {
  draft: CircleDraft;
  radiusInput: string;
  lockRadius: boolean;
  document: CircleDocumentUnits;
};

export const resolveCirclePreviewPoint = (
  input: ResolveCirclePreviewPointInput,
): SketchPoint => {
  const fallbackRadius = distance(input.draft.start, input.draft.current);
  const radius = input.lockRadius
    ? resolveCircleRadius(input.radiusInput, fallbackRadius, input.document)
    : fallbackRadius;

  return {
    x: input.draft.start.x + radius,
    y: input.draft.start.y,
  };
};

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
