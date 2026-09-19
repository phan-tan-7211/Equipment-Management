import { distance } from '../core/geometry';
import type {
  LineEntity,
  SketchConstraint,
  SketchEntity,
} from '../core/types';
import {
  applyCoincidentConstraint,
  applyHorizontalConstraint,
  applyVerticalConstraint,
} from './basicConstraints';
import {
  applyConcentricConstraint,
  applyEqualConstraint,
  applyMidpointConstraint,
  applyParallelConstraint,
  applyPerpendicularConstraint,
} from './advancedConstraints';
import {
  applySymmetryConstraint,
  applyTangentConstraint,
} from './parametricConstraints';

export type ConstraintSolveStatus =
  | 'under-constrained'
  | 'fully-constrained'
  | 'over-constrained'
  | 'conflict';

export type ConstraintSolveResult = {
  entities: SketchEntity[];
  constraints: SketchConstraint[];
  iterations: number;
  converged: boolean;
  status: ConstraintSolveStatus;
};

const lineLength = (line: LineEntity): number =>
  distance(
    { x: line.x1, y: line.y1 },
    { x: line.x2, y: line.y2 },
  );

const entityDelta = (
  before: SketchEntity,
  after: SketchEntity,
): number => {
  if (before.type !== after.type || before.id !== after.id) return Infinity;

  if (before.type === 'line' && after.type === 'line') {
    return Math.max(
      Math.abs(before.x1 - after.x1),
      Math.abs(before.y1 - after.y1),
      Math.abs(before.x2 - after.x2),
      Math.abs(before.y2 - after.y2),
    );
  }
  if (before.type === 'rect' && after.type === 'rect') {
    return Math.max(
      Math.abs(before.x - after.x),
      Math.abs(before.y - after.y),
      Math.abs(before.w - after.w),
      Math.abs(before.h - after.h),
    );
  }
  if (before.type === 'circle' && after.type === 'circle') {
    return Math.max(
      Math.abs(before.cx - after.cx),
      Math.abs(before.cy - after.cy),
      Math.abs(before.r - after.r),
    );
  }
  if (before.type === 'arc' && after.type === 'arc') {
    return Math.max(
      Math.abs(before.cx - after.cx),
      Math.abs(before.cy - after.cy),
      Math.abs(before.r - after.r),
      Math.abs(before.startAngleDeg - after.startAngleDeg),
      Math.abs(before.endAngleDeg - after.endAngleDeg),
    );
  }
  if (before.type === 'polyline' && after.type === 'polyline') {
    if (before.points.length !== after.points.length) return Infinity;
    return before.points.reduce(
      (max, point, index) =>
        Math.max(
          max,
          Math.abs(point.x - after.points[index].x),
          Math.abs(point.y - after.points[index].y),
        ),
      0,
    );
  }
  return Infinity;
};

const detectConflicts = (
  entities: SketchEntity[],
  constraints: SketchConstraint[],
  tolerance: number,
): Set<string> => {
  const conflicts = new Set<string>();
  const byEntity = new Map<string, SketchConstraint[]>();

  constraints
    .filter((constraint) => constraint.enabled !== false)
    .forEach((constraint) => {
      constraint.entityIds.forEach((entityId) => {
        const list = byEntity.get(entityId) ?? [];
        list.push(constraint);
        byEntity.set(entityId, list);
      });
    });

  byEntity.forEach((entityConstraints, entityId) => {
    const entity = entities.find((item) => item.id === entityId);
    if (!entity || entity.type !== 'line') return;

    const horizontal = entityConstraints.find(
      (constraint) => constraint.kind === 'horizontal',
    );
    const vertical = entityConstraints.find(
      (constraint) => constraint.kind === 'vertical',
    );

    if (
      horizontal &&
      vertical &&
      lineLength(entity) > tolerance
    ) {
      conflicts.add(horizontal.id);
      conflicts.add(vertical.id);
    }
  });

  return conflicts;
};

const detectOverConstraints = (
  constraints: SketchConstraint[],
): Set<string> => {
  const byKey = new Map<string, string[]>();

  constraints
    .filter((constraint) => constraint.enabled !== false)
    .forEach((constraint) => {
      const refs = [...(constraint.pointRefs ?? [])]
        .map((ref) => `${ref.entityId}:${ref.point}`)
        .sort()
        .join(',');
      const key = [
        constraint.kind,
        [...constraint.entityIds].sort().join(','),
        refs,
      ].join('|');
      const ids = byKey.get(key) ?? [];
      ids.push(constraint.id);
      byKey.set(key, ids);
    });

  const duplicateIds = new Set<string>();
  byKey.forEach((ids) => {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id));
  });
  return duplicateIds;
};

const applyConstraint = (
  entities: SketchEntity[],
  constraint: SketchConstraint,
): SketchEntity[] => {
  if (constraint.enabled === false || constraint.conflict) return entities;

  const [firstId, secondId] = constraint.entityIds;
  const result =
    constraint.kind === 'horizontal'
      ? applyHorizontalConstraint(entities, firstId, constraint.id)
      : constraint.kind === 'vertical'
        ? applyVerticalConstraint(entities, firstId, constraint.id)
        : constraint.kind === 'coincident' && secondId
          ? applyCoincidentConstraint(entities, firstId, secondId, constraint.id)
          : constraint.kind === 'parallel' && secondId
            ? applyParallelConstraint(entities, firstId, secondId, constraint.id)
            : constraint.kind === 'perpendicular' && secondId
              ? applyPerpendicularConstraint(entities, firstId, secondId, constraint.id)
              : constraint.kind === 'equal' && secondId
                ? applyEqualConstraint(entities, firstId, secondId, constraint.id)
                : constraint.kind === 'midpoint' && secondId
                  ? applyMidpointConstraint(entities, firstId, secondId, constraint.id)
                  : constraint.kind === 'concentric' && secondId
                    ? applyConcentricConstraint(entities, firstId, secondId, constraint.id)
                    : constraint.kind === 'tangent' && secondId
                      ? applyTangentConstraint(entities, firstId, secondId, constraint.id)
                      : constraint.kind === 'symmetry' && secondId && constraint.entityIds[2]
                        ? applySymmetryConstraint(
                            entities,
                            firstId,
                            secondId,
                            constraint.entityIds[2],
                            constraint.id,
                          )
                        : null;

  return result?.entities ?? entities;
};

export const solveSketchConstraints = (
  entities: SketchEntity[],
  constraints: SketchConstraint[],
  options: {
    maxIterations?: number;
    tolerance?: number;
  } = {},
): ConstraintSolveResult => {
  const maxIterations = Math.max(1, options.maxIterations ?? 12);
  const tolerance = Math.max(1e-9, options.tolerance ?? 1e-6);
  const conflictIds = detectConflicts(
    entities,
    constraints,
    tolerance,
  );
  const overConstraintIds = detectOverConstraints(constraints);
  const markedConstraints = constraints.map((constraint) => ({
    ...constraint,
    conflict: conflictIds.has(constraint.id),
    overConstrained: overConstraintIds.has(constraint.id),
  }));

  if (conflictIds.size) {
    return {
      entities: structuredClone(entities),
      constraints: markedConstraints,
      iterations: 0,
      converged: false,
      status: 'conflict',
    };
  }

  let current = structuredClone(entities);
  let converged = false;
  let iterations = 0;

  for (let index = 0; index < maxIterations; index += 1) {
    const before = structuredClone(current);
    markedConstraints.forEach((constraint) => {
      current = applyConstraint(current, constraint);
    });
    iterations = index + 1;

    const maxDelta = current.reduce((max, entity, entityIndex) => {
      const previous = before[entityIndex];
      return previous
        ? Math.max(max, entityDelta(previous, entity))
        : Infinity;
    }, 0);

    if (maxDelta <= tolerance) {
      converged = true;
      break;
    }
  }

  const fixedIds = new Set(
    markedConstraints
      .filter(
        (constraint) =>
          constraint.enabled !== false &&
          constraint.kind === 'fix',
      )
      .flatMap((constraint) => constraint.entityIds),
  );
  const fullyConstrained =
    current.length > 0 &&
    current.every((entity) => fixedIds.has(entity.id));

  return {
    entities: current,
    constraints: markedConstraints,
    iterations,
    converged,
    status: overConstraintIds.size
      ? 'over-constrained'
      : fullyConstrained
        ? 'fully-constrained'
        : 'under-constrained',
  };
};
