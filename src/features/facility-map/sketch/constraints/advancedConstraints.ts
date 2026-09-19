import { distance } from '../core/geometry';
import type {
  ArcEntity,
  CircleEntity,
  LineEntity,
  SketchConstraint,
  SketchEntity,
  SketchPoint,
} from '../core/types';

type ApplyResult = {
  entities: SketchEntity[];
  constraint: SketchConstraint;
};

const lineLength = (line: LineEntity): number =>
  distance(
    { x: line.x1, y: line.y1 },
    { x: line.x2, y: line.y2 },
  );

const setLineDirection = (
  line: LineEntity,
  radians: number,
  length = lineLength(line),
): LineEntity => ({
  ...line,
  x2: line.x1 + Math.cos(radians) * length,
  y2: line.y1 + Math.sin(radians) * length,
});

const lineAngle = (line: LineEntity): number =>
  Math.atan2(line.y2 - line.y1, line.x2 - line.x1);

const replaceEntity = (
  entities: SketchEntity[],
  next: SketchEntity,
): SketchEntity[] =>
  entities.map((entity) => entity.id === next.id ? next : entity);

export const applyParallelConstraint = (
  entities: SketchEntity[],
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const reference = entities.find(
    (entity): entity is LineEntity =>
      entity.id === referenceId && entity.type === 'line',
  );
  const target = entities.find(
    (entity): entity is LineEntity =>
      entity.id === targetId && entity.type === 'line',
  );
  if (!reference || !target || reference.id === target.id) return null;

  const next = setLineDirection(target, lineAngle(reference));
  return {
    entities: replaceEntity(entities, next),
    constraint: {
      id: constraintId,
      kind: 'parallel',
      entityIds: [reference.id, target.id],
      enabled: true,
    },
  };
};

export const applyPerpendicularConstraint = (
  entities: SketchEntity[],
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const reference = entities.find(
    (entity): entity is LineEntity =>
      entity.id === referenceId && entity.type === 'line',
  );
  const target = entities.find(
    (entity): entity is LineEntity =>
      entity.id === targetId && entity.type === 'line',
  );
  if (!reference || !target || reference.id === target.id) return null;

  const next = setLineDirection(
    target,
    lineAngle(reference) + Math.PI / 2,
  );
  return {
    entities: replaceEntity(entities, next),
    constraint: {
      id: constraintId,
      kind: 'perpendicular',
      entityIds: [reference.id, target.id],
      enabled: true,
    },
  };
};

export const applyEqualConstraint = (
  entities: SketchEntity[],
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const reference = entities.find((entity) => entity.id === referenceId);
  const target = entities.find((entity) => entity.id === targetId);
  if (!reference || !target || reference.id === target.id) return null;

  let next: SketchEntity | null = null;

  if (reference.type === 'line' && target.type === 'line') {
    next = setLineDirection(
      target,
      lineAngle(target),
      lineLength(reference),
    );
  } else if (
    (reference.type === 'circle' || reference.type === 'arc') &&
    (target.type === 'circle' || target.type === 'arc')
  ) {
    next = { ...target, r: reference.r };
  }

  if (!next) return null;
  return {
    entities: replaceEntity(entities, next),
    constraint: {
      id: constraintId,
      kind: 'equal',
      entityIds: [reference.id, target.id],
      enabled: true,
    },
  };
};

export const applyFixConstraint = (
  entities: SketchEntity[],
  entityId: string,
  constraintId: string,
): ApplyResult | null => {
  const target = entities.find((entity) => entity.id === entityId);
  if (!target) return null;

  return {
    entities,
    constraint: {
      id: constraintId,
      kind: 'fix',
      entityIds: [target.id],
      enabled: true,
    },
  };
};

const lineMidpoint = (line: LineEntity): SketchPoint => ({
  x: (line.x1 + line.x2) / 2,
  y: (line.y1 + line.y2) / 2,
});

export const applyMidpointConstraint = (
  entities: SketchEntity[],
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const reference = entities.find(
    (entity): entity is LineEntity =>
      entity.id === referenceId && entity.type === 'line',
  );
  const target = entities.find(
    (entity): entity is LineEntity =>
      entity.id === targetId && entity.type === 'line',
  );
  if (!reference || !target || reference.id === target.id) return null;

  const midpoint = lineMidpoint(reference);
  const startDistance = distance(
    midpoint,
    { x: target.x1, y: target.y1 },
  );
  const endDistance = distance(
    midpoint,
    { x: target.x2, y: target.y2 },
  );
  const targetPoint = startDistance <= endDistance ? 'start' : 'end';
  const next = targetPoint === 'start'
    ? { ...target, x1: midpoint.x, y1: midpoint.y }
    : { ...target, x2: midpoint.x, y2: midpoint.y };

  return {
    entities: replaceEntity(entities, next),
    constraint: {
      id: constraintId,
      kind: 'midpoint',
      entityIds: [reference.id, target.id],
      pointRefs: [
        { entityId: reference.id, point: 'midpoint' },
        { entityId: target.id, point: targetPoint },
      ],
      enabled: true,
    },
  };
};

type RadialEntity = CircleEntity | ArcEntity;

const isRadial = (entity: SketchEntity): entity is RadialEntity =>
  entity.type === 'circle' || entity.type === 'arc';

export const applyConcentricConstraint = (
  entities: SketchEntity[],
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const reference = entities.find(
    (entity): entity is RadialEntity =>
      entity.id === referenceId && isRadial(entity),
  );
  const target = entities.find(
    (entity): entity is RadialEntity =>
      entity.id === targetId && isRadial(entity),
  );
  if (!reference || !target || reference.id === target.id) return null;

  const next = {
    ...target,
    cx: reference.cx,
    cy: reference.cy,
  } as RadialEntity;

  return {
    entities: replaceEntity(entities, next),
    constraint: {
      id: constraintId,
      kind: 'concentric',
      entityIds: [reference.id, target.id],
      pointRefs: [
        { entityId: reference.id, point: 'center' },
        { entityId: target.id, point: 'center' },
      ],
      enabled: true,
    },
  };
};
