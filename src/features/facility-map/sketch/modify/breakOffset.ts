import type {
  LineEntity,
  PolylineEntity,
  SketchEntity,
  SketchPoint,
} from '../core/types';

const projectToSegment = (
  point: SketchPoint,
  a: SketchPoint,
  b: SketchPoint,
): { point: SketchPoint; t: number; distance: number } => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 1e-12) {
    const distance = Math.hypot(point.x - a.x, point.y - a.y);
    return { point: { ...a }, t: 0, distance };
  }

  const rawT =
    ((point.x - a.x) * dx + (point.y - a.y) * dy) /
    lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projected = {
    x: a.x + dx * t,
    y: a.y + dy * t,
  };

  return {
    point: projected,
    t,
    distance: Math.hypot(
      point.x - projected.x,
      point.y - projected.y,
    ),
  };
};

export const breakLineAtPoint = (
  entities: SketchEntity[],
  target: LineEntity,
  click: SketchPoint,
  createId: () => string,
): SketchEntity[] | null => {
  const start = { x: target.x1, y: target.y1 };
  const end = { x: target.x2, y: target.y2 };
  const projected = projectToSegment(click, start, end);

  if (projected.t <= 1e-4 || projected.t >= 1 - 1e-4) {
    return null;
  }

  const first: LineEntity = {
    ...target,
    id: createId(),
    x2: projected.point.x,
    y2: projected.point.y,
  };
  const second: LineEntity = {
    ...target,
    id: createId(),
    x1: projected.point.x,
    y1: projected.point.y,
  };

  return [
    ...entities.filter((entity) => entity.id !== target.id),
    first,
    second,
  ];
};

type Normal = {
  x: number;
  y: number;
};

const segmentNormal = (
  a: SketchPoint,
  b: SketchPoint,
): Normal => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length <= 1e-12) return { x: 0, y: 0 };
  return {
    x: -dy / length,
    y: dx / length,
  };
};

const normalize = (vector: Normal, fallback: Normal): Normal => {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 1e-12) return fallback;
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
};

const lineSideFromClick = (
  a: SketchPoint,
  b: SketchPoint,
  click: SketchPoint,
): number => {
  const cross =
    (b.x - a.x) * (click.y - a.y) -
    (b.y - a.y) * (click.x - a.x);
  return cross < 0 ? -1 : 1;
};

export const offsetLine = (
  line: LineEntity,
  distance: number,
  click: SketchPoint,
  id: string,
): LineEntity | null => {
  if (!Number.isFinite(distance) || distance <= 0) return null;
  const a = { x: line.x1, y: line.y1 };
  const b = { x: line.x2, y: line.y2 };
  const normal = segmentNormal(a, b);
  if (normal.x === 0 && normal.y === 0) return null;
  const side = lineSideFromClick(a, b, click);
  const dx = normal.x * distance * side;
  const dy = normal.y * distance * side;

  return {
    ...line,
    id,
    x1: line.x1 + dx,
    y1: line.y1 + dy,
    x2: line.x2 + dx,
    y2: line.y2 + dy,
  };
};

const closestSegmentIndex = (
  polyline: PolylineEntity,
  click: SketchPoint,
): number => {
  let bestIndex = 0;
  let bestDistance = Infinity;
  const count = polyline.closed
    ? polyline.points.length
    : Math.max(0, polyline.points.length - 1);

  for (let index = 0; index < count; index += 1) {
    const a = polyline.points[index];
    const b = polyline.points[(index + 1) % polyline.points.length];
    const candidate = projectToSegment(click, a, b).distance;
    if (candidate < bestDistance) {
      bestDistance = candidate;
      bestIndex = index;
    }
  }

  return bestIndex;
};

export const offsetPolyline = (
  polyline: PolylineEntity,
  distance: number,
  click: SketchPoint,
  id: string,
): PolylineEntity | null => {
  if (
    !Number.isFinite(distance) ||
    distance <= 0 ||
    polyline.points.length < 2
  ) {
    return null;
  }

  const segmentCount = polyline.closed
    ? polyline.points.length
    : polyline.points.length - 1;
  const normals = Array.from({ length: segmentCount }, (_, index) =>
    segmentNormal(
      polyline.points[index],
      polyline.points[(index + 1) % polyline.points.length],
    ),
  );

  const selectedIndex = closestSegmentIndex(polyline, click);
  const selectedA = polyline.points[selectedIndex];
  const selectedB =
    polyline.points[(selectedIndex + 1) % polyline.points.length];
  const side = lineSideFromClick(selectedA, selectedB, click);

  // A corner's offset vertex sits on the bisector of its two adjacent edge
  // normals, but it must travel *further* than `distance` along that
  // bisector — by a factor of 1 / cos(half the angle between the edges) —
  // so the offset edges stay exactly `distance` away from the originals
  // (the standard CAD/SVG "miter join"). Moving by `distance` directly (the
  // previous behavior) under-shoots on every non-collinear corner.
  const MITER_LIMIT = 8;

  const points = polyline.points.map((point, index) => {
    let normal: Normal;
    let scale = distance;

    if (!polyline.closed && index === 0) {
      normal = normals[0];
    } else if (!polyline.closed && index === polyline.points.length - 1) {
      normal = normals[normals.length - 1];
    } else {
      const previousIndex =
        (index - 1 + normals.length) % normals.length;
      const nextIndex = index % normals.length;
      const previousNormal = normals[previousIndex];
      const nextNormal = normals[nextIndex];
      const bisector = normalize(
        {
          x: previousNormal.x + nextNormal.x,
          y: previousNormal.y + nextNormal.y,
        },
        nextNormal,
      );
      const alignment = Math.abs(
        bisector.x * previousNormal.x + bisector.y * previousNormal.y,
      );
      scale = alignment > 1e-6
        ? Math.min(distance / alignment, distance * MITER_LIMIT)
        : distance;
      normal = bisector;
    }

    return {
      x: point.x + normal.x * scale * side,
      y: point.y + normal.y * scale * side,
    };
  });

  return {
    ...polyline,
    id,
    points,
  };
};

export const createOffsetEntity = (
  entity: SketchEntity,
  distance: number,
  click: SketchPoint,
  id: string,
): SketchEntity | null => {
  if (entity.type === 'line') {
    return offsetLine(entity, distance, click, id);
  }
  if (entity.type === 'polyline') {
    return offsetPolyline(entity, distance, click, id);
  }
  return null;
};
