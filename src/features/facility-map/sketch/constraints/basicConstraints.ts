import { distance } from '../core/geometry';
import type {
  LineEntity,
  SketchConstraint,
  SketchConstraintPointRef,
  SketchEntity,
  SketchPoint,
} from '../core/types';

type ApplyResult = {
  entities: SketchEntity[];
  constraint: SketchConstraint;
};

const linePoint = (
  line: LineEntity,
  point: 'start' | 'end',
): SketchPoint =>
  point === 'start'
    ? { x: line.x1, y: line.y1 }
    : { x: line.x2, y: line.y2 };

export const applyHorizontalConstraint = (
  entities: SketchEntity[],
  entityId: string,
  constraintId: string,
): ApplyResult | null => {
  const target = entities.find(
    (entity): entity is LineEntity =>
      entity.id === entityId && entity.type === 'line',
  );
  if (!target) return null;

  return {
    entities: entities.map((entity) =>
      entity.id === target.id
        ? { ...target, y2: target.y1 }
        : entity,
    ),
    constraint: {
      id: constraintId,
      kind: 'horizontal',
      entityIds: [target.id],
      enabled: true,
    },
  };
};

export const applyVerticalConstraint = (
  entities: SketchEntity[],
  entityId: string,
  constraintId: string,
): ApplyResult | null => {
  const target = entities.find(
    (entity): entity is LineEntity =>
      entity.id === entityId && entity.type === 'line',
  );
  if (!target) return null;

  return {
    entities: entities.map((entity) =>
      entity.id === target.id
        ? { ...target, x2: target.x1 }
        : entity,
    ),
    constraint: {
      id: constraintId,
      kind: 'vertical',
      entityIds: [target.id],
      enabled: true,
    },
  };
};

const nearestEndpointPair = (
  a: LineEntity,
  b: LineEntity,
): [SketchConstraintPointRef, SketchConstraintPointRef] => {
  const aRefs: Array<'start' | 'end'> = ['start', 'end'];
  const bRefs: Array<'start' | 'end'> = ['start', 'end'];
  let best: {
    distance: number;
    a: 'start' | 'end';
    b: 'start' | 'end';
  } | null = null;

  aRefs.forEach((aPoint) => {
    bRefs.forEach((bPoint) => {
      const candidate = distance(
        linePoint(a, aPoint),
        linePoint(b, bPoint),
      );
      if (!best || candidate < best.distance) {
        best = { distance: candidate, a: aPoint, b: bPoint };
      }
    });
  });

  return [
    { entityId: a.id, point: best!.a },
    { entityId: b.id, point: best!.b },
  ];
};

const moveLineEndpoint = (
  line: LineEntity,
  point: 'start' | 'end',
  target: SketchPoint,
): LineEntity =>
  point === 'start'
    ? { ...line, x1: target.x, y1: target.y }
    : { ...line, x2: target.x, y2: target.y };

export const applyCoincidentConstraint = (
  entities: SketchEntity[],
  firstId: string,
  secondId: string,
  constraintId: string,
): ApplyResult | null => {
  const first = entities.find(
    (entity): entity is LineEntity =>
      entity.id === firstId && entity.type === 'line',
  );
  const second = entities.find(
    (entity): entity is LineEntity =>
      entity.id === secondId && entity.type === 'line',
  );
  if (!first || !second || first.id === second.id) return null;

  const [firstRef, secondRef] = nearestEndpointPair(first, second);
  const target = linePoint(
    first,
    firstRef.point as 'start' | 'end',
  );
  const movedSecond = moveLineEndpoint(
    second,
    secondRef.point as 'start' | 'end',
    target,
  );

  return {
    entities: entities.map((entity) =>
      entity.id === movedSecond.id ? movedSecond : entity,
    ),
    constraint: {
      id: constraintId,
      kind: 'coincident',
      entityIds: [first.id, second.id],
      pointRefs: [firstRef, secondRef],
      enabled: true,
    },
  };
};
