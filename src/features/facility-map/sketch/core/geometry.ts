import type {
  ArcEntity,
  RectEntity,
  SketchEntity,
  SketchPoint,
} from './types';

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
