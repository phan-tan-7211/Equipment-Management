import type {
  ArcEntity,
  RectEntity,
  SketchEntity,
  SketchPoint,
} from './types';

/** Tight axis-aligned bounds of an entire sketch, in its own model units. */
export function getSketchEntitiesBounds(
  entities: SketchEntity[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (!entities.length) return null;
  const boxes = entities.map((entity) => {
    if (entity.type === 'line') {
      return {
        minX: Math.min(entity.x1, entity.x2),
        minY: Math.min(entity.y1, entity.y2),
        maxX: Math.max(entity.x1, entity.x2),
        maxY: Math.max(entity.y1, entity.y2),
      };
    }
    if (entity.type === 'rect') {
      return {
        minX: Math.min(entity.x, entity.x + entity.w),
        minY: Math.min(entity.y, entity.y + entity.h),
        maxX: Math.max(entity.x, entity.x + entity.w),
        maxY: Math.max(entity.y, entity.y + entity.h),
      };
    }
    if (entity.type === 'circle') {
      return {
        minX: entity.cx - entity.r,
        minY: entity.cy - entity.r,
        maxX: entity.cx + entity.r,
        maxY: entity.cy + entity.r,
      };
    }
    if (entity.type === 'arc') {
      return getArcBounds(entity);
    }
    const xs = entity.points.map((point) => point.x);
    const ys = entity.points.map((point) => point.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  });

  return {
    minX: Math.min(...boxes.map((box) => box.minX)),
    minY: Math.min(...boxes.map((box) => box.minY)),
    maxX: Math.max(...boxes.map((box) => box.maxX)),
    maxY: Math.max(...boxes.map((box) => box.maxY)),
  };
}

export type SegmentIntersection = {
  point: SketchPoint;
  t: number;
  u: number;
};

export const distance = (a: SketchPoint, b: SketchPoint): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const angleDeg = (a: SketchPoint, b: SketchPoint): number =>
  (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

export const degToRad = (degrees: number): number =>
  (degrees * Math.PI) / 180;

export const clampPositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const arcPoint = (
  entity: ArcEntity,
  angleDegValue: number,
): SketchPoint => {
  const radians = degToRad(angleDegValue);
  return {
    x: entity.cx + Math.cos(radians) * entity.r,
    y: entity.cy + Math.sin(radians) * entity.r,
  };
};

const normalizeAngle360 = (deg: number): number => ((deg % 360) + 360) % 360;

/**
 * Tight axis-aligned bounds of the swept arc — not the full circle. Used for
 * selection/hit-testing, where treating a short arc as a full circle would
 * select it from empty space nowhere near the visible curve.
 */
export const getArcBounds = (
  entity: ArcEntity,
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const sweepDeg = entity.clockwise
    ? normalizeAngle360(entity.startAngleDeg - entity.endAngleDeg)
    : normalizeAngle360(entity.endAngleDeg - entity.startAngleDeg);

  const points = [
    arcPoint(entity, entity.startAngleDeg),
    arcPoint(entity, entity.endAngleDeg),
  ];

  [0, 90, 180, 270].forEach((axisDeg) => {
    const offset = entity.clockwise
      ? normalizeAngle360(entity.startAngleDeg - axisDeg)
      : normalizeAngle360(axisDeg - entity.startAngleDeg);
    if (offset <= sweepDeg) {
      points.push(arcPoint(entity, axisDeg));
    }
  });

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

export const rectEdges = (
  entity: RectEntity,
): Array<[SketchPoint, SketchPoint]> => {
  const x2 = entity.x + entity.w;
  const y2 = entity.y + entity.h;
  return [
    [{ x: entity.x, y: entity.y }, { x: x2, y: entity.y }],
    [{ x: x2, y: entity.y }, { x: x2, y: y2 }],
    [{ x: x2, y: y2 }, { x: entity.x, y: y2 }],
    [{ x: entity.x, y: y2 }, { x: entity.x, y: entity.y }],
  ];
};

export const translateSketchEntity = (
  entity: SketchEntity,
  dx: number,
  dy: number,
): SketchEntity => {
  switch (entity.type) {
    case 'line':
      return {
        ...entity,
        x1: entity.x1 + dx,
        y1: entity.y1 + dy,
        x2: entity.x2 + dx,
        y2: entity.y2 + dy,
      };
    case 'polyline':
      return {
        ...entity,
        points: entity.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      };
    case 'rect':
      return { ...entity, x: entity.x + dx, y: entity.y + dy };
    case 'circle':
      return { ...entity, cx: entity.cx + dx, cy: entity.cy + dy };
    case 'arc':
      return { ...entity, cx: entity.cx + dx, cy: entity.cy + dy };
  }
};

export const segmentIntersection = (
  a: SketchPoint,
  b: SketchPoint,
  c: SketchPoint,
  d: SketchPoint,
  allowTargetInfinite = false,
): SegmentIntersection | null => {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) < 1e-9) return null;

  const q = { x: c.x - a.x, y: c.y - a.y };
  const t = (q.x * s.y - q.y * s.x) / cross;
  const u = (q.x * r.y - q.y * r.x) / cross;

  if ((!allowTargetInfinite && (t < 0 || t > 1)) || u < 0 || u > 1) {
    return null;
  }

  return {
    point: {
      x: a.x + t * r.x,
      y: a.y + t * r.y,
    },
    t,
    u,
  };
};
