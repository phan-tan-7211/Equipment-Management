import { describe, expect, it } from 'vitest';

import {
  commitSketchHistory,
  createSketchDocument,
  createSketchHistory,
  deserializeSketchDocument,
  redoSketchHistory,
  serializeSketchDocument,
  undoSketchHistory,
  type SketchConstraint,
  type SketchDocument,
  type SketchEntity,
} from '@/features/facility-map/sketch';
import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';

const clone = (document: SketchDocument) => structuredClone(document);
const style = { color: '#000000', lineWidth: 1 };

const entities: SketchEntity[] = [
  {
    ...style,
    id: 'line-a',
    type: 'line',
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 3,
  },
  {
    ...style,
    id: 'line-b',
    type: 'line',
    x1: 12,
    y1: 4,
    x2: 20,
    y2: 4,
  },
];

const constraints: SketchConstraint[] = [
  {
    id: 'horizontal-a',
    kind: 'horizontal',
    entityIds: ['line-a'],
    enabled: true,
  },
  {
    id: 'coincident-ab',
    kind: 'coincident',
    entityIds: ['line-a', 'line-b'],
    pointRefs: [
      { entityId: 'line-a', point: 'end' },
      { entityId: 'line-b', point: 'start' },
    ],
    enabled: true,
  },
];

describe('constraint regression', () => {
  it('round-trips constraints through document serialization', () => {
    const document = createSketchDocument({
      id: 'constraint-round-trip',
      entities,
      constraints,
      createdAt: 100,
      updatedAt: 200,
    });

    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'constraint-floor',
    );

    expect(restored).toEqual(document);
    expect(restored.constraints).toEqual(constraints);
  });

  it('treats constraint creation as an undoable document step', () => {
    const initial = createSketchDocument({
      id: 'constraint-history',
      entities,
      constraints: [],
      createdAt: 100,
      updatedAt: 100,
    });
    const next: SketchDocument = {
      ...initial,
      constraints,
      updatedAt: 200,
    };

    const committed = commitSketchHistory(
      createSketchHistory(initial, clone),
      next,
      clone,
    );
    const undone = undoSketchHistory(committed, clone);
    const redone = redoSketchHistory(undone, clone);

    expect(committed.present.constraints).toEqual(constraints);
    expect(undone.present.constraints).toEqual([]);
    expect(redone.present.constraints).toEqual(constraints);
  });

  it('re-solves persisted constraints deterministically', () => {
    const document = createSketchDocument({
      id: 'constraint-solve',
      entities,
      constraints,
    });
    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'constraint-solve',
    );
    const solved = solveSketchConstraints(
      restored.entities,
      restored.constraints,
    );

    expect(solved.status).toBe('under-constrained');
    expect(solved.converged).toBe(true);
    expect(solved.entities[0]).toMatchObject({
      y1: 0,
      y2: 0,
    });
    expect(solved.entities[1]).toMatchObject({
      x1: 10,
      y1: 0,
    });
  });

  it('keeps conflict detection stable after persistence', () => {
    const conflictConstraints: SketchConstraint[] = [
      {
        id: 'horizontal',
        kind: 'horizontal',
        entityIds: ['line-a'],
      },
      {
        id: 'vertical',
        kind: 'vertical',
        entityIds: ['line-a'],
      },
    ];
    const document = createSketchDocument({
      id: 'constraint-conflict',
      entities: [entities[0]],
      constraints: conflictConstraints,
    });
    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'constraint-conflict',
    );
    const solved = solveSketchConstraints(
      restored.entities,
      restored.constraints,
    );

    expect(solved.status).toBe('conflict');
    expect(
      solved.constraints.every((constraint) => constraint.conflict),
    ).toBe(true);
  });
});
