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

export const normalizeAngle360 = (deg: number): number => ((deg % 360) + 360) % 360;

/** Angle in degrees of `point` as seen from `center`, normalized to [0, 360). */
export const angleAround = (center: SketchPoint, point: SketchPoint): number =>
  normalizeAngle360((Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI);

/** Whether `angleDegValue` falls within the arc's own swept range. */
export const isAngleOnArc = (angleDegValue: number, entity: ArcEntity): boolean => {
  const sweepDeg = entity.clockwise
    ? normalizeAngle360(entity.startAngleDeg - entity.endAngleDeg)
    : normalizeAngle360(entity.endAngleDeg - entity.startAngleDeg);
  const offset = entity.clockwise
    ? normalizeAngle360(entity.startAngleDeg - angleDegValue)
    : normalizeAngle360(angleDegValue - entity.startAngleDeg);
  return offset <= sweepDeg + 1e-6;
};

export type CircleLike = { cx: number; cy: number; r: number };

/**
 * Up to two intersections of line segment a→b (or the infinite line through
 * it, when `infiniteLine`) with a circle — the missing piece that let Trim
 * and Break only ever consider line/rect/polyline boundaries, never a
 * circle or arc crossing through them.
 */
export const lineCircleIntersections = (
  a: SketchPoint,
  b: SketchPoint,
  circle: CircleLike,
  infiniteLine = false,
): Array<{ point: SketchPoint; t: number }> => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - circle.cx;
  const fy = a.y - circle.cy;
  const coeffA = dx * dx + dy * dy;
  if (coeffA <= 1e-12) return [];
  const coeffB = 2 * (fx * dx + fy * dy);
  const coeffC = fx * fx + fy * fy - circle.r * circle.r;
  const discriminant = coeffB * coeffB - 4 * coeffA * coeffC;
  if (discriminant < 0) return [];
  const sqrtDisc = Math.sqrt(discriminant);
  const candidates = discriminant < 1e-12
    ? [-coeffB / (2 * coeffA)]
    : [(-coeffB - sqrtDisc) / (2 * coeffA), (-coeffB + sqrtDisc) / (2 * coeffA)];
  const results: Array<{ point: SketchPoint; t: number }> = [];
  for (const t of candidates) {
    if (!infiniteLine && (t < -1e-9 || t > 1 + 1e-9)) continue;
    results.push({ point: { x: a.x + t * dx, y: a.y + t * dy }, t });
  }
  return results;
};

/** 0, 1 (tangent) or 2 intersection points between two circles. */
export const circleCircleIntersections = (
  c1: CircleLike,
  c2: CircleLike,
): SketchPoint[] => {
  const dx = c2.cx - c1.cx;
  const dy = c2.cy - c1.cy;
  const centerDistance = Math.hypot(dx, dy);
  if (
    centerDistance <= 1e-9 ||
    centerDistance > c1.r + c2.r + 1e-9 ||
    centerDistance < Math.abs(c1.r - c2.r) - 1e-9
  ) {
    return [];
  }
  const a = (c1.r * c1.r - c2.r * c2.r + centerDistance * centerDistance) / (2 * centerDistance);
  const heightSquared = c1.r * c1.r - a * a;
  const height = Math.sqrt(Math.max(0, heightSquared));
  const midX = c1.cx + (a * dx) / centerDistance;
  const midY = c1.cy + (a * dy) / centerDistance;
  if (height <= 1e-9) {
    return [{ x: midX, y: midY }];
  }
  const offsetX = -(dy / centerDistance) * height;
  const offsetY = (dx / centerDistance) * height;
  return [
    { x: midX + offsetX, y: midY + offsetY },
    { x: midX - offsetX, y: midY - offsetY },
  ];
};

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

/**
 * Where the two INFINITE lines through a→b and c→d cross — unlike
 * `segmentIntersection`, neither side is bounded to its own segment. Used
 * to re-join two independently offset edges at a corner: each edge's
 * offset copy is only trustworthy as an infinite line until it's re-cut
 * against its neighbor's offset copy at their new shared vertex.
 */
export const infiniteLineIntersection = (
  a: SketchPoint,
  b: SketchPoint,
  c: SketchPoint,
  d: SketchPoint,
): SketchPoint | null => {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) < 1e-9) return null;
  const q = { x: c.x - a.x, y: c.y - a.y };
  const t = (q.x * s.y - q.y * s.x) / cross;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
};
