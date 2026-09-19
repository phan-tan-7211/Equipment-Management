import { degToRad, distance } from '../core/geometry';
import type {
  SketchDimension,
  SketchEntity,
} from '../core/types';
import type { ViewDimension } from './viewDimensions';

const normalizeSweep = (value: number): number =>
  ((value % 360) + 360) % 360;

export const applyDrivingDimension = (
  entity: SketchEntity,
  dimension: ViewDimension,
  value: number,
): SketchEntity => {
  if (!Number.isFinite(value)) return entity;

  if (entity.type === 'line') {
    const start = { x: entity.x1, y: entity.y1 };
    const end = { x: entity.x2, y: entity.y2 };
    const currentLength = distance(start, end);

    if (dimension.kind === 'length' && value > 0) {
      const angle = currentLength > 1e-12
        ? Math.atan2(entity.y2 - entity.y1, entity.x2 - entity.x1)
        : 0;
      return {
        ...entity,
        x2: entity.x1 + Math.cos(angle) * value,
        y2: entity.y1 + Math.sin(angle) * value,
      };
    }

    if (dimension.kind === 'angle') {
      const radians = degToRad(value);
      return {
        ...entity,
        x2: entity.x1 + Math.cos(radians) * currentLength,
        y2: entity.y1 + Math.sin(radians) * currentLength,
      };
    }

    return entity;
  }

  if (entity.type === 'rect') {
    if (dimension.kind === 'horizontal' && value > 0) {
      return { ...entity, w: value };
    }
    if (dimension.kind === 'vertical' && value > 0) {
      return { ...entity, h: value };
    }
    return entity;
  }

  if (entity.type === 'circle') {
    if (dimension.kind === 'radius' && value > 0) {
      return { ...entity, r: value };
    }
    if (dimension.kind === 'diameter' && value > 0) {
      return { ...entity, r: value / 2 };
    }
    return entity;
  }

  if (entity.type === 'arc') {
    if (dimension.kind === 'radius' && value > 0) {
      return { ...entity, r: value };
    }
    if (dimension.kind === 'angle') {
      const sweep = normalizeSweep(value);
      if (sweep <= 0 || sweep >= 360) return entity;
      return {
        ...entity,
        endAngleDeg: entity.clockwise
          ? entity.startAngleDeg - sweep
          : entity.startAngleDeg + sweep,
      };
    }
  }

  return entity;
};

export const upsertDrivingDimension = (
  dimensions: SketchDimension[],
  dimension: ViewDimension,
  value: number,
): SketchDimension[] => {
  const next: SketchDimension = {
    id: dimension.id,
    kind: dimension.kind,
    entityId: dimension.entityId,
    driving: true,
    reference: false,
    value,
  };
  const index = dimensions.findIndex((item) => item.id === dimension.id);

  if (index < 0) return [...dimensions, next];

  return dimensions.map((item, itemIndex) =>
    itemIndex === index ? next : item,
  );
};
