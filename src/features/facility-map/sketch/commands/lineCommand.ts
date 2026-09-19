import { createSketchId } from '../core/id';
import {
  angleDeg,
  clampPositive,
  degToRad,
  distance,
} from '../core/geometry';
import {
  displayToModelUnits,
  modelUnitsToDisplay,
  unitPrecision,
} from '../core/units';
import type {
  LineEntity,
  SketchDocument,
  SketchPoint,
  SketchStyle,
} from '../core/types';

type LineDocumentUnits = Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>;

export type LineDraft = {
  type: 'line';
  start: SketchPoint;
  current: SketchPoint;
};

export const startLineDraft = (point: SketchPoint): LineDraft => ({
  type: 'line',
  start: { ...point },
  current: { ...point },
});

export const updateLineDraft = (
  draft: LineDraft,
  current: SketchPoint,
): LineDraft => ({
  ...draft,
  current: { ...current },
});

export type LineCommandInput = {
  start: SketchPoint;
  current: SketchPoint;
  lengthInput: string;
  angleInput: string;
  document: LineDocumentUnits;
};

export type LinePreviewInput = LineCommandInput & {
  lockLength: boolean;
  lockAngle: boolean;
};

export type CreateLineEntityInput = LineCommandInput & {
  style: SketchStyle;
  id?: string;
};

const resolveLineEnd = (
  input: LineCommandInput,
  useLengthInput: boolean,
  useAngleInput: boolean,
): SketchPoint => {
  const fallbackLength = distance(input.start, input.current);
  const fallbackAngle = angleDeg(input.start, input.current);
  const parsedLength = displayToModelUnits(Number(input.lengthInput), input.document);
  const lengthUnits = useLengthInput
    ? clampPositive(parsedLength, fallbackLength)
    : fallbackLength;
  const parsedAngle = Number(input.angleInput);
  const angle = useAngleInput && Number.isFinite(parsedAngle)
    ? parsedAngle
    : fallbackAngle;
  const radians = degToRad(angle);

  return {
    x: input.start.x + Math.cos(radians) * lengthUnits,
    y: input.start.y + Math.sin(radians) * lengthUnits,
  };
};

export const getLineDynamicLength = (
  start: SketchPoint,
  current: SketchPoint,
  document: LineDocumentUnits,
): string =>
  modelUnitsToDisplay(distance(start, current), document)
    .toFixed(unitPrecision(document.displayUnit));

export const getLineDynamicAngle = (
  start: SketchPoint,
  current: SketchPoint,
): string => angleDeg(start, current).toFixed(1);

export const getLineDynamicValues = (
  start: SketchPoint,
  current: SketchPoint,
  document: LineDocumentUnits,
): { length: string; angle: string } => ({
  length: getLineDynamicLength(start, current, document),
  angle: getLineDynamicAngle(start, current),
});

export const resolveLinePreviewEnd = (
  input: LinePreviewInput,
): SketchPoint =>
  resolveLineEnd(input, input.lockLength, input.lockAngle);

export type CommitLineDraftInput = Omit<CreateLineEntityInput, 'start'> & {
  draft: LineDraft;
};

export const commitLineDraft = (
  input: CommitLineDraftInput,
): LineEntity =>
  createLineEntity({
    current: input.current,
    lengthInput: input.lengthInput,
    angleInput: input.angleInput,
    document: input.document,
    style: input.style,
    id: input.id,
    start: input.draft.start,
  });

export const createLineEntity = (
  input: CreateLineEntityInput,
): LineEntity => {
  const end = resolveLineEnd(input, true, true);

  return {
    id: input.id ?? createSketchId('sketch-line'),
    type: 'line',
    x1: input.start.x,
    y1: input.start.y,
    x2: end.x,
    y2: end.y,
    ...input.style,
  };
};
