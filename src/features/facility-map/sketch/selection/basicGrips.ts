import {
  angleDeg,
  arcPoint,
  distance,
} from '../core/geometry';
import type {
  ArcEntity,
  CircleEntity,
  LineEntity,
  PolylineEntity,
  RectEntity,
  SketchEntity,
  SketchPoint,
} from '../core/types';

export type BasicGripId =
  | 'line-start'
  | 'line-end'
  | 'rect-top-left'
  | 'rect-top-right'
  | 'rect-bottom-right'
  | 'rect-bottom-left'
  | 'circle-center'
  | 'circle-radius'
  | `polyline-vertex:${number}`
  | 'arc-center'
  | 'arc-start'
  | 'arc-end';

export type BasicGrip = {
  id: BasicGripId;
  point: SketchPoint;
};

export const getBasicEntityGrips = (
  entity: SketchEntity,
): BasicGrip[] => {
  if (entity.type === 'line') {
    return [
      { id: 'line-start', point: { x: entity.x1, y: entity.y1 } },
      { id: 'line-end', point: { x: entity.x2, y: entity.y2 } },
    ];
  }

  if (entity.type === 'rect') {
    const x2 = entity.x + entity.w;
    const y2 = entity.y + entity.h;
    return [
      { id: 'rect-top-left', point: { x: entity.x, y: entity.y } },
      { id: 'rect-top-right', point: { x: x2, y: entity.y } },
      { id: 'rect-bottom-right', point: { x: x2, y: y2 } },
      { id: 'rect-bottom-left', point: { x: entity.x, y: y2 } },
    ];
  }

  if (entity.type === 'circle') {
    return [
      { id: 'circle-center', point: { x: entity.cx, y: entity.cy } },
      {
        id: 'circle-radius',
        point: { x: entity.cx + entity.r, y: entity.cy },
      },
    ];
  }

  if (entity.type === 'polyline') {
    return entity.points.map((point, index) => ({
      id: `polyline-vertex:${index}`,
      point: { ...point },
    }));
  }

  return [
    { id: 'arc-center', point: { x: entity.cx, y: entity.cy } },
    { id: 'arc-start', point: arcPoint(entity, entity.startAngleDeg) },
    { id: 'arc-end', point: arcPoint(entity, entity.endAngleDeg) },
  ];
};

const resizeRectFromCorner = (
  entity: RectEntity,
  gripId: BasicGripId,
  point: SketchPoint,
): RectEntity => {
  const left = entity.x;
  const top = entity.y;
  const right = entity.x + entity.w;
  const bottom = entity.y + entity.h;

  const opposite =
    gripId === 'rect-top-left'
      ? { x: right, y: bottom }
      : gripId === 'rect-top-right'
        ? { x: left, y: bottom }
        : gripId === 'rect-bottom-right'
          ? { x: left, y: top }
          : { x: right, y: top };

  const minX = Math.min(point.x, opposite.x);
  const minY = Math.min(point.y, opposite.y);
  const maxX = Math.max(point.x, opposite.x);
  const maxY = Math.max(point.y, opposite.y);

  return {
    ...entity,
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
};

const polylineVertexIndex = (gripId: BasicGripId): number | null => {
  if (!gripId.startsWith('polyline-vertex:')) return null;
  const index = Number(gripId.slice('polyline-vertex:'.length));
  return Number.isInteger(index) && index >= 0 ? index : null;
};

const dragPolylineVertex = (
  entity: PolylineEntity,
  gripId: BasicGripId,
  point: SketchPoint,
): PolylineEntity => {
  const index = polylineVertexIndex(gripId);
  if (index === null || index >= entity.points.length) return entity;

  return {
    ...entity,
    points: entity.points.map((current, currentIndex) =>
      currentIndex === index ? { ...point } : { ...current },
    ),
  };
};

const dragArcGrip = (
  entity: ArcEntity,
  gripId: BasicGripId,
  point: SketchPoint,
): ArcEntity => {
  if (gripId === 'arc-center') {
    return { ...entity, cx: point.x, cy: point.y };
  }

  if (gripId !== 'arc-start' && gripId !== 'arc-end') {
    return entity;
  }

  const center = { x: entity.cx, y: entity.cy };
  const nextRadius = Math.max(distance(center, point), 1e-9);
  const nextAngle = angleDeg(center, point);

  return gripId === 'arc-start'
    ? {
        ...entity,
        r: nextRadius,
        startAngleDeg: nextAngle,
      }
    : {
        ...entity,
        r: nextRadius,
        endAngleDeg: nextAngle,
      };
};

export const applyBasicGripDrag = (
  entity: SketchEntity,
  grip: BasicGrip,
  point: SketchPoint,
): SketchEntity => {
  if (entity.type === 'line') {
    const line = entity as LineEntity;
    if (grip.id === 'line-start') {
      return { ...line, x1: point.x, y1: point.y };
    }
    if (grip.id === 'line-end') {
      return { ...line, x2: point.x, y2: point.y };
    }
    return line;
  }

  if (entity.type === 'rect') {
    if (
      grip.id === 'rect-top-left' ||
      grip.id === 'rect-top-right' ||
      grip.id === 'rect-bottom-right' ||
      grip.id === 'rect-bottom-left'
    ) {
      return resizeRectFromCorner(entity, grip.id, point);
    }
    return entity;
  }

  if (entity.type === 'circle') {
    const circle = entity as CircleEntity;
    if (grip.id === 'circle-center') {
      return { ...circle, cx: point.x, cy: point.y };
    }
    if (grip.id === 'circle-radius') {
      return {
        ...circle,
        r: Math.max(distance({ x: circle.cx, y: circle.cy }, point), 1e-9),
      };
    }
    return circle;
  }

  if (entity.type === 'polyline') {
    return dragPolylineVertex(entity, grip.id, point);
  }

  return dragArcGrip(entity, grip.id, point);
};
