import type {
  SketchDimension,
  SketchDimensionKind,
  SketchDocument,
  SketchParameterDimension,
} from '../core/types';
import {
  applyDrivingDimension,
} from '../dimensions/drivingDimensions';
import {
  getSketchViewDimensions,
  type ViewDimension,
} from '../dimensions/viewDimensions';
import { recalculateParameters } from './parameterEngine';

export const dimensionParameterDimension = (
  kind: SketchDimensionKind,
): SketchParameterDimension =>
  kind === 'angle' ? 'scalar' : 'length';

export const recalculateParametricDocument = (
  document: SketchDocument,
): SketchDocument => {
  const parameters = recalculateParameters(
    document.parameters,
    document.mmPerUnit,
  );
  const parameterById = new Map(
    parameters.map((parameter) => [parameter.id, parameter]),
  );
  let entities = structuredClone(document.entities);
  const dimensions = document.dimensions.map((dimension) => ({ ...dimension }));

  for (let index = 0; index < dimensions.length; index += 1) {
    const dimension = dimensions[index];
    if (
      !dimension.parameterId ||
      dimension.reference ||
      dimension.hidden
    ) {
      continue;
    }

    const parameter = parameterById.get(dimension.parameterId);
    if (
      !parameter ||
      parameter.error ||
      parameter.value == null ||
      parameter.dimension !== dimensionParameterDimension(dimension.kind)
    ) {
      continue;
    }

    const view = getSketchViewDimensions(entities).find(
      (candidate) => candidate.id === dimension.id,
    );
    if (!view) continue;

    const entity = entities.find(
      (candidate) => candidate.id === view.entityId,
    );
    if (!entity) continue;

    const nextEntity = applyDrivingDimension(
      entity,
      view,
      parameter.value,
    );
    entities = entities.map((candidate) =>
      candidate.id === entity.id ? nextEntity : candidate,
    );
    dimensions[index] = {
      ...dimension,
      driving: true,
      reference: false,
      value: parameter.value,
    };
  }

  return {
    ...document,
    entities,
    dimensions,
    parameters,
  };
};

export const bindDimensionToParameter = (
  document: SketchDocument,
  dimension: ViewDimension,
  parameterId: string | null,
): SketchDocument => {
  const existing = document.dimensions.find(
    (item) => item.id === dimension.id,
  );
  const next: SketchDimension = {
    ...(existing ?? {
      id: dimension.id,
      kind: dimension.kind,
      entityId: dimension.entityId,
      value: dimension.value,
    }),
    driving: parameterId ? true : existing?.driving,
    reference: parameterId ? false : existing?.reference,
    parameterId: parameterId ?? undefined,
  };

  const dimensions = existing
    ? document.dimensions.map((item) =>
        item.id === dimension.id ? next : item,
      )
    : [...document.dimensions, next];

  return recalculateParametricDocument({
    ...document,
    dimensions,
  });
};
