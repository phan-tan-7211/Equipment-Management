import type { SketchEntity, SketchPoint } from '../core/types';

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const boundsFromPoints = (points: SketchPoint[]): Bounds => ({
  minX: Math.min(...points.map((point) => point.x)),
  minY: Math.min(...points.map((point) => point.y)),
  maxX: Math.max(...points.map((point) => point.x)),
  maxY: Math.max(...points.map((point) => point.y)),
});

export const getEntityBounds = (entity: SketchEntity): Bounds => {
  if (entity.type === 'line') {
    return boundsFromPoints([
      { x: entity.x1, y: entity.y1 },
      { x: entity.x2, y: entity.y2 },
    ]);
  }

  if (entity.type === 'polyline') {
    return entity.points.length
      ? boundsFromPoints(entity.points)
      : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  if (entity.type === 'rect') {
    return {
      minX: Math.min(entity.x, entity.x + entity.w),
      minY: Math.min(entity.y, entity.y + entity.h),
      maxX: Math.max(entity.x, entity.x + entity.w),
      maxY: Math.max(entity.y, entity.y + entity.h),
    };
  }

  return {
    minX: entity.cx - entity.r,
    minY: entity.cy - entity.r,
    maxX: entity.cx + entity.r,
    maxY: entity.cy + entity.r,
  };
};

const dragBounds = (start: SketchPoint, current: SketchPoint): Bounds => ({
  minX: Math.min(start.x, current.x),
  minY: Math.min(start.y, current.y),
  maxX: Math.max(start.x, current.x),
  maxY: Math.max(start.y, current.y),
});

const contains = (outer: Bounds, inner: Bounds): boolean =>
  inner.minX >= outer.minX &&
  inner.maxX <= outer.maxX &&
  inner.minY >= outer.minY &&
  inner.maxY <= outer.maxY;

const intersects = (a: Bounds, b: Bounds): boolean =>
  a.maxX >= b.minX &&
  a.minX <= b.maxX &&
  a.maxY >= b.minY &&
  a.minY <= b.maxY;

export const selectEntitiesInDrag = (
  entities: SketchEntity[],
  start: SketchPoint,
  current: SketchPoint,
): string[] => {
  const box = dragBounds(start, current);
  const crossing = current.x < start.x;

  return entities
    .filter((entity) => {
      const entityBounds = getEntityBounds(entity);
      return crossing
        ? intersects(box, entityBounds)
        : contains(box, entityBounds);
    })
    .map((entity) => entity.id);
};
