import type {
  ArcEntity,
  CircleEntity,
  LineEntity,
  SketchConstraint,
  SketchEntity,
} from '../core/types';
import { mirrorEntityAcrossLine } from '../modify/mirror';

type ApplyResult = {
  entities: SketchEntity[];
  constraint: SketchConstraint;
};

type RadialEntity = CircleEntity | ArcEntity;

const isRadial = (entity: SketchEntity): entity is RadialEntity =>
  entity.type === 'circle' || entity.type === 'arc';

export const applyTangentConstraint = (
  entities: SketchEntity[],
  lineId: string,
  radialId: string,
  constraintId: string,
): ApplyResult | null => {
  const line = entities.find(
    (entity): entity is LineEntity =>
      entity.id === lineId && entity.type === 'line',
  );
  const radial = entities.find(
    (entity): entity is RadialEntity =>
      entity.id === radialId && isRadial(entity),
  );
  if (!line || !radial) return null;

  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const length = Math.hypot(dx, dy);
  if (length <= 1e-12) return null;

  const normal = {
    x: -dy / length,
    y: dx / length,
  };
  const signedDistance =
    (radial.cx - line.x1) * normal.x +
    (radial.cy - line.y1) * normal.y;
  const desired = signedDistance < 0 ? -radial.r : radial.r;
  const shift = signedDistance - desired;
  const moved: LineEntity = {
    ...line,
    x1: line.x1 + normal.x * shift,
    y1: line.y1 + normal.y * shift,
    x2: line.x2 + normal.x * shift,
    y2: line.y2 + normal.y * shift,
  };

  return {
    entities: entities.map((entity) =>
      entity.id === line.id ? moved : entity,
    ),
    constraint: {
      id: constraintId,
      kind: 'tangent',
      entityIds: [line.id, radial.id],
      enabled: true,
    },
  };
};

export const applySymmetryConstraint = (
  entities: SketchEntity[],
  axisId: string,
  referenceId: string,
  targetId: string,
  constraintId: string,
): ApplyResult | null => {
  const axis = entities.find(
    (entity): entity is LineEntity =>
      entity.id === axisId && entity.type === 'line',
  );
  const reference = entities.find((entity) => entity.id === referenceId);
  const target = entities.find((entity) => entity.id === targetId);
  if (
    !axis ||
    !reference ||
    !target ||
    axis.id === reference.id ||
    axis.id === target.id ||
    reference.id === target.id
  ) {
    return null;
  }

  const mirrored = mirrorEntityAcrossLine(
    reference,
    axis,
    target.id,
  );
  if (!mirrored) return null;

  return {
    entities: entities.map((entity) =>
      entity.id === target.id ? mirrored : entity,
    ),
    constraint: {
      id: constraintId,
      kind: 'symmetry',
      entityIds: [axis.id, reference.id, target.id],
      enabled: true,
    },
  };
};
