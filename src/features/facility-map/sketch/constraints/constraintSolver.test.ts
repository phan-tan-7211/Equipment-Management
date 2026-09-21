import { describe, expect, it } from 'vitest';

import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';
import type {
  SketchConstraint,
  SketchEntity,
} from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const line = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SketchEntity => ({
  ...style,
  id,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
});

describe('constraint solver', () => {
  it('iterates deterministic constraints until geometry converges', () => {
    const constraints: SketchConstraint[] = [
      {
        id: 'horizontal',
        kind: 'horizontal',
        entityIds: ['a'],
        enabled: true,
      },
      {
        id: 'coincident',
        kind: 'coincident',
        entityIds: ['a', 'b'],
        enabled: true,
      },
    ];

    const result = solveSketchConstraints(
      [
        line('a', 0, 0, 10, 3),
        line('b', 12, 4, 20, 4),
      ],
      constraints,
    );

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThanOrEqual(1);
    expect(result.entities[0]).toMatchObject({
      y1: 0,
      y2: 0,
    });
    expect(result.entities[1]).toMatchObject({
      x1: 10,
      y1: 0,
    });
    expect(result.status).toBe('under-constrained');
  });

  it('marks incompatible horizontal and vertical constraints as conflict', () => {
    const constraints: SketchConstraint[] = [
      {
        id: 'horizontal',
        kind: 'horizontal',
        entityIds: ['a'],
      },
      {
        id: 'vertical',
        kind: 'vertical',
        entityIds: ['a'],
      },
    ];

    const result = solveSketchConstraints(
      [line('a', 0, 0, 10, 5)],
      constraints,
    );

    expect(result.status).toBe('conflict');
    expect(result.converged).toBe(false);
    expect(
      result.constraints.filter((constraint) => constraint.conflict),
    ).toHaveLength(2);
  });

  it('reports fully constrained conservatively when every entity is fixed', () => {
    const result = solveSketchConstraints(
      [
        line('a', 0, 0, 10, 0),
        line('b', 0, 5, 10, 5),
      ],
      [
        { id: 'fix-a', kind: 'fix', entityIds: ['a'] },
        { id: 'fix-b', kind: 'fix', entityIds: ['b'] },
      ],
    );

    expect(result.status).toBe('fully-constrained');
  });

  it('detects duplicate semantic constraints as over-constrained', () => {
    const result = solveSketchConstraints(
      [line('a', 0, 0, 10, 0)],
      [
        { id: 'h-1', kind: 'horizontal', entityIds: ['a'] },
        { id: 'h-2', kind: 'horizontal', entityIds: ['a'] },
      ],
    );

    expect(result.status).toBe('over-constrained');
    expect(
      result.constraints.every((constraint) => constraint.overConstrained),
    ).toBe(true);
  });

  it('keeps a fixed entity pinned even when another constraint tries to move it', () => {
    const constraints: SketchConstraint[] = [
      { id: 'fix-a', kind: 'fix', entityIds: ['a'], enabled: true },
      {
        id: 'coincident',
        kind: 'coincident',
        entityIds: ['b', 'a'],
        enabled: true,
      },
    ];

    const result = solveSketchConstraints(
      [
        line('a', 0, 0, 10, 0),
        line('b', 3, 3, 13, 3),
      ],
      constraints,
    );

    // "a" is fixed: it must stay exactly where it started even though the
    // coincident constraint (b's start -> a's start) would otherwise pull it.
    expect(result.entities[0]).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
    });
  });

  it('blocks a direct user edit/drag on a fixed entity from sticking (production edit -> postProcess -> solve sequence)', () => {
    // Entity starts at A. Fix captures A as the anchor at the moment it was
    // applied — exactly what applyFixConstraint() does.
    const atA = line('a', 0, 0, 10, 0);
    const fixConstraint: SketchConstraint = {
      id: 'fix-a',
      kind: 'fix',
      entityIds: ['a'],
      enabled: true,
      fixedGeometry: atA,
    };

    // Production pipeline is "user edit/drag -> postProcess -> solve": by
    // the time solve runs, the entity it receives has ALREADY been dragged
    // to B. A solver that anchors to "whatever solve was handed" (the old
    // bug) would treat B as the new fixed position; it must instead ignore
    // this edit entirely and restore A.
    const userDraggedToB = line('a', 50, 40, 60, 40);

    const result = solveSketchConstraints([userDraggedToB], [fixConstraint]);

    expect(result.entities[0]).toMatchObject({ x1: 0, y1: 0, x2: 10, y2: 0 });
    expect(result.status).toBe('fully-constrained');
  });

  it('older fix constraints saved without a fixedGeometry snapshot still pin (backward compatible)', () => {
    // Simulates a sketch document saved before the fixedGeometry field
    // existed: the constraint has no snapshot, so the solver must fall
    // back to treating whatever it's handed as the anchor — same as the
    // pre-fix behavior — rather than crashing or silently un-fixing it.
    const legacyFixConstraint: SketchConstraint = {
      id: 'fix-a',
      kind: 'fix',
      entityIds: ['a'],
      enabled: true,
    };

    const result = solveSketchConstraints(
      [line('a', 0, 0, 10, 0)],
      [legacyFixConstraint],
    );

    expect(result.entities[0]).toMatchObject({ x1: 0, y1: 0, x2: 10, y2: 0 });
    expect(result.status).toBe('fully-constrained');
  });

  it('flags parallel and perpendicular constraints on the same pair as a conflict', () => {
    const constraints: SketchConstraint[] = [
      {
        id: 'parallel',
        kind: 'parallel',
        entityIds: ['a', 'b'],
        enabled: true,
      },
      {
        id: 'perpendicular',
        kind: 'perpendicular',
        entityIds: ['a', 'b'],
        enabled: true,
      },
    ];

    const result = solveSketchConstraints(
      [
        line('a', 0, 0, 10, 0),
        line('b', 0, 5, 10, 6),
      ],
      constraints,
    );

    expect(result.status).toBe('conflict');
    expect(
      result.constraints.filter((constraint) => constraint.conflict),
    ).toHaveLength(2);
  });

  it('stops at max iterations when convergence cannot be reached', () => {
    const result = solveSketchConstraints(
      [line('a', 0, 0, 10, 2)],
      [
        {
          id: 'horizontal',
          kind: 'horizontal',
          entityIds: ['a'],
        },
      ],
      { maxIterations: 1 },
    );

    expect(result.iterations).toBe(1);
  });
});
