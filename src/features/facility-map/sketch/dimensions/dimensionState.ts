import type { SketchDimension } from '../core/types';
import type { ViewDimension } from './viewDimensions';

export const setDimensionReference = (
  dimensions: SketchDimension[],
  dimension: ViewDimension,
  reference: boolean,
): SketchDimension[] => {
  const next: SketchDimension = {
    id: dimension.id,
    kind: dimension.kind,
    entityId: dimension.entityId,
    driving: !reference,
    reference,
    value: dimension.value,
  };
  const index = dimensions.findIndex((item) => item.id === dimension.id);

  if (index < 0) return [...dimensions, next];

  return dimensions.map((item, itemIndex) =>
    itemIndex === index ? next : item,
  );
};

export const deleteDimensionById = (
  dimensions: SketchDimension[],
  dimensionId: string,
): SketchDimension[] =>
  dimensions.filter((dimension) => dimension.id !== dimensionId);
