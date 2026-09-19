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
