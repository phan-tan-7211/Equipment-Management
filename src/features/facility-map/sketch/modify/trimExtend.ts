import {
  distance,
  rectEdges,
  segmentIntersection,
} from '../core/geometry';
import type {
  LineEntity,
  PolylineEntity,
  RectEntity,
  SketchEntity,
  SketchPoint,
  SketchStyle,
} from '../core/types';

export type ModifyMode = 'trim' | 'extend';

export type ModifyPreview = {
  mode: ModifyMode;
  from: SketchPoint;
  to: SketchPoint;
  targetId: string;
};

type Segment = {
  a: SketchPoint;
  b: SketchPoint;
};

const pointToSegmentDistance = (
  point: SketchPoint,
  a: SketchPoint,
  b: SketchPoint,
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 1e-12) return distance(point, a);
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared,
    ),
  );
  return distance(point, {
    x: a.x + dx * t,
    y: a.y + dy * t,
  });
};

const entitySegments = (entity: SketchEntity): Segment[] => {
  if (entity.type === 'line') {
    return [{
      a: { x: entity.x1, y: entity.y1 },
      b: { x: entity.x2, y: entity.y2 },
    }];
  }
  if (entity.type === 'rect') {
    return rectEdges(entity).map(([a, b]) => ({ a, b }));
  }
  if (entity.type === 'polyline') {
    const segments: Segment[] = [];
    for (let index = 0; index < entity.points.length - 1; index += 1) {
      segments.push({
        a: entity.points[index],
        b: entity.points[index + 1],
      });
    }
    if (entity.closed && entity.points.length > 2) {
      segments.push({
        a: entity.points[entity.points.length - 1],
        b: entity.points[0],
      });
    }
    return segments;
  }
  return [];
};

const otherSegments = (
  entities: SketchEntity[],
  targetId: string,
): Segment[] =>
  entities
    .filter((entity) => entity.id !== targetId)
    .flatMap(entitySegments);

const selectedSegment = (
  entity: SketchEntity,
  click: SketchPoint,
): Segment | null => {
  const segments = entitySegments(entity);
  if (!segments.length) return null;
  return segments.reduce((best, segment) =>
    pointToSegmentDistance(click, segment.a, segment.b) <
    pointToSegmentDistance(click, best.a, best.b)
      ? segment
      : best,
  );
};

const pointAt = (
  a: SketchPoint,
  b: SketchPoint,
  t: number,
): SketchPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const trimInterval = (
  a: SketchPoint,
  b: SketchPoint,
  click: SketchPoint,
  boundaries: Segment[],
): { leftT: number; rightT: number } | null => {
  const intersections = boundaries
    .map(({ a: c, b: d }) => segmentIntersection(a, b, c, d, false))
    .filter(Boolean)
    .map((result) => result!)
    .filter((result) => result.t > 1e-4 && result.t < 1 - 1e-4)
    .sort((x, y) => x.t - y.t);

  if (!intersections.length) return null;

  const lengthSquared = Math.max(
    (b.x - a.x) ** 2 + (b.y - a.y) ** 2,
    1e-9,
  );
  const clickT =
    ((click.x - a.x) * (b.x - a.x) +
      (click.y - a.y) * (b.y - a.y)) /
    lengthSquared;
  const params = [0, ...intersections.map((item) => item.t), 1];

  for (let index = 0; index < params.length - 1; index += 1) {
    if (clickT >= params[index] && clickT <= params[index + 1]) {
      return {
        leftT: params[index],
        rightT: params[index + 1],
      };
    }
  }

  return null;
};

const styleOf = (entity: SketchEntity): SketchStyle => ({
  color: entity.color,
  lineWidth: entity.lineWidth,
  construction: entity.construction,
  visible: entity.visible,
  locked: entity.locked,
});

const segmentToLine = (
  segment: Segment,
  style: SketchStyle,
  createId: () => string,
): LineEntity => ({
  ...style,
  id: createId(),
  type: 'line',
  x1: segment.a.x,
  y1: segment.a.y,
  x2: segment.b.x,
  y2: segment.b.y,
});

const sameSegment = (a: Segment, b: Segment): boolean =>
  (
    distance(a.a, b.a) < 1e-9 &&
    distance(a.b, b.b) < 1e-9
  ) || (
    distance(a.a, b.b) < 1e-9 &&
    distance(a.b, b.a) < 1e-9
  );

export const getTrimPreview = (
  entities: SketchEntity[],
  target: SketchEntity,
  click: SketchPoint,
): ModifyPreview | null => {
  const segment = selectedSegment(target, click);
  if (!segment) return null;
  const interval = trimInterval(
    segment.a,
    segment.b,
    click,
    otherSegments(entities, target.id),
  );
  if (!interval) return null;

  return {
    mode: 'trim',
    targetId: target.id,
    from: pointAt(segment.a, segment.b, interval.leftT),
    to: pointAt(segment.a, segment.b, interval.rightT),
  };
};

export const commitTrim = (
  entities: SketchEntity[],
  target: SketchEntity,
  click: SketchPoint,
  createId: () => string,
): SketchEntity[] | null => {
  const segment = selectedSegment(target, click);
  if (!segment) return null;
  const interval = trimInterval(
    segment.a,
    segment.b,
    click,
    otherSegments(entities, target.id),
  );
  if (!interval) return null;

  if (target.type === 'line') {
    const before = pointAt(segment.a, segment.b, interval.leftT);
    const after = pointAt(segment.a, segment.b, interval.rightT);
    const replacement: LineEntity[] = [];
    if (interval.leftT > 1e-6) {
      replacement.push({
        ...target,
        id: createId(),
        x2: before.x,
        y2: before.y,
      });
    }
    if (interval.rightT < 1 - 1e-6) {
      replacement.push({
        ...target,
        id: createId(),
        x1: after.x,
        y1: after.y,
      });
    }
    return [
      ...entities.filter((entity) => entity.id !== target.id),
      ...replacement,
    ];
  }

  const style = styleOf(target);
  const remainingSegments: Segment[] = [];
  for (const current of entitySegments(target)) {
    if (!sameSegment(current, segment)) {
      remainingSegments.push(current);
      continue;
    }
    if (interval.leftT > 1e-6) {
      remainingSegments.push({
        a: current.a,
        b: pointAt(current.a, current.b, interval.leftT),
      });
    }
    if (interval.rightT < 1 - 1e-6) {
      remainingSegments.push({
        a: pointAt(current.a, current.b, interval.rightT),
        b: current.b,
      });
    }
  }

  return [
    ...entities.filter((entity) => entity.id !== target.id),
    ...remainingSegments.map((remaining) =>
      segmentToLine(remaining, style, createId),
    ),
  ];
};

export const getExtendPreview = (
  entities: SketchEntity[],
  target: LineEntity,
  click: SketchPoint,
): ModifyPreview | null => {
  const a = { x: target.x1, y: target.y1 };
  const b = { x: target.x2, y: target.y2 };
  const extendStart = distance(click, a) < distance(click, b);

  const candidates = otherSegments(entities, target.id)
    .map(({ a: c, b: d }) => segmentIntersection(a, b, c, d, true))
    .filter(Boolean)
    .map((result) => result!)
    .filter((result) =>
      extendStart ? result.t < -1e-4 : result.t > 1 + 1e-4,
    )
    .sort((x, y) =>
      extendStart ? y.t - x.t : x.t - y.t,
    );

  const best = candidates[0];
  if (!best) return null;

  return {
    mode: 'extend',
    targetId: target.id,
    from: extendStart ? best.point : b,
    to: extendStart ? a : best.point,
  };
};

export const commitExtend = (
  entities: SketchEntity[],
  target: LineEntity,
  click: SketchPoint,
): SketchEntity[] | null => {
  const preview = getExtendPreview(entities, target, click);
  if (!preview) return null;

  const a = { x: target.x1, y: target.y1 };
  const extendStart = distance(preview.to, a) < 1e-9;

  return entities.map((entity) => {
    if (entity.id !== target.id) return entity;
    return extendStart
      ? {
          ...target,
          x1: preview.from.x,
          y1: preview.from.y,
        }
      : {
          ...target,
          x2: preview.to.x,
          y2: preview.to.y,
        };
  });
};

export const effectiveModifyMode = (
  tool: ModifyMode,
  shiftKey: boolean,
): ModifyMode =>
  shiftKey
    ? tool === 'trim' ? 'extend' : 'trim'
    : tool;
