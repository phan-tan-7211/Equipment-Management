import { angleDeg } from '../core/geometry';
import type {
  ArcEntity,
  LineEntity,
  PolylineEntity,
  RectEntity,
  SketchEntity,
  SketchPoint,
} from '../core/types';

const reflectPoint = (
  point: SketchPoint,
  axisStart: SketchPoint,
  axisEnd: SketchPoint,
): SketchPoint => {
  const dx = axisEnd.x - axisStart.x;
  const dy = axisEnd.y - axisStart.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 1e-12) return { ...point };

  const t =
    ((point.x - axisStart.x) * dx +
      (point.y - axisStart.y) * dy) /
    lengthSquared;
  const projection = {
    x: axisStart.x + dx * t,
    y: axisStart.y + dy * t,
  };

  return {
    x: 2 * projection.x - point.x,
    y: 2 * projection.y - point.y,
  };
};

const reflectAngle = (
  center: SketchPoint,
  radius: number,
  angle: number,
  axisStart: SketchPoint,
  axisEnd: SketchPoint,
): number => {
  const radians = (angle * Math.PI) / 180;
  const point = {
    x: center.x + Math.cos(radians) * radius,
    y: center.y + Math.sin(radians) * radius,
  };
  const reflectedCenter = reflectPoint(center, axisStart, axisEnd);
  const reflectedPoint = reflectPoint(point, axisStart, axisEnd);
  return angleDeg(reflectedCenter, reflectedPoint);
};

const rectCorners = (rect: RectEntity): SketchPoint[] => [
  { x: rect.x, y: rect.y },
  { x: rect.x + rect.w, y: rect.y },
  { x: rect.x + rect.w, y: rect.y + rect.h },
  { x: rect.x, y: rect.y + rect.h },
];

export const mirrorEntityAcrossLine = (
  entity: SketchEntity,
  axis: LineEntity,
  id: string,
): SketchEntity | null => {
  const axisStart = { x: axis.x1, y: axis.y1 };
  const axisEnd = { x: axis.x2, y: axis.y2 };
  if (
    Math.hypot(
      axisEnd.x - axisStart.x,
      axisEnd.y - axisStart.y,
    ) <= 1e-12
  ) {
    return null;
  }

  if (entity.type === 'line') {
    const start = reflectPoint(
      { x: entity.x1, y: entity.y1 },
      axisStart,
      axisEnd,
    );
    const end = reflectPoint(
      { x: entity.x2, y: entity.y2 },
      axisStart,
      axisEnd,
    );
    return {
      ...entity,
      id,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    };
  }

  if (entity.type === 'polyline') {
    return {
      ...entity,
      id,
      points: entity.points.map((point) =>
        reflectPoint(point, axisStart, axisEnd),
      ),
    };
  }

  if (entity.type === 'rect') {
    const polyline: PolylineEntity = {
      id,
      type: 'polyline',
      points: rectCorners(entity).map((point) =>
        reflectPoint(point, axisStart, axisEnd),
      ),
      closed: true,
      color: entity.color,
      lineWidth: entity.lineWidth,
      construction: entity.construction,
      visible: entity.visible,
      locked: entity.locked,
    };
    return polyline;
  }

  if (entity.type === 'circle') {
    const center = reflectPoint(
      { x: entity.cx, y: entity.cy },
      axisStart,
      axisEnd,
    );
    return {
      ...entity,
      id,
      cx: center.x,
      cy: center.y,
    };
  }

  const center = { x: entity.cx, y: entity.cy };
  const reflectedCenter = reflectPoint(
    center,
    axisStart,
    axisEnd,
  );
  const arc: ArcEntity = {
    ...entity,
    id,
    cx: reflectedCenter.x,
    cy: reflectedCenter.y,
    startAngleDeg: reflectAngle(
      center,
      entity.r,
      entity.startAngleDeg,
      axisStart,
      axisEnd,
    ),
    endAngleDeg: reflectAngle(
      center,
      entity.r,
      entity.endAngleDeg,
      axisStart,
      axisEnd,
    ),
    clockwise: !entity.clockwise,
  };
  return arc;
};

export const mirrorSelectedEntities = (
  entities: SketchEntity[],
  axisId: string,
  targetIds: string[],
  createId: (entity: SketchEntity) => string,
): { copies: SketchEntity[]; ids: string[] } | null => {
  const axis = entities.find(
    (entity): entity is LineEntity =>
      entity.id === axisId && entity.type === 'line',
  );
  if (!axis) return null;

  const targets = new Set(
    targetIds.filter((id) => id !== axis.id),
  );
  const copies = entities
    .filter((entity) => targets.has(entity.id))
    .map((entity) =>
      mirrorEntityAcrossLine(
        entity,
        axis,
        createId(entity),
      ),
    )
    .filter((entity): entity is SketchEntity => Boolean(entity));

  return {
    copies,
    ids: copies.map((entity) => entity.id),
  };
};
