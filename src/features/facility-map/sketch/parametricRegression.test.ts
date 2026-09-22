import { describe, expect, it } from 'vitest';

import {
  createSketchDocument,
  deserializeSketchDocument,
  serializeSketchDocument,
} from '@/features/facility-map/sketch';
import { getSketchViewDimensions } from '@/features/facility-map/sketch/dimensions/viewDimensions';
import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';
import {
  applySymmetryConstraint,
  applyTangentConstraint,
} from '@/features/facility-map/sketch/constraints/parametricConstraints';
import {
  bindDimensionToParameter,
  recalculateParametricDocument,
} from '@/features/facility-map/sketch/parametric/parameterBinding';
import { recalculateParameters } from '@/features/facility-map/sketch/parametric/parameterEngine';
import type {
  LineEntity,
  SketchEntity,
} from '@/features/facility-map/sketch/core/types';

const style = { color: '#000000', lineWidth: 1 };

const line = (
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): LineEntity => ({
  ...style,
  id,
  type: 'line',
  x1,
  y1,
  x2,
  y2,
});

describe('parametric regression', () => {
  it('persists parameters and dimension bindings across serialization', () => {
    const base = createSketchDocument({
      mmPerUnit: 10,
      entities: [line('line', 0, 0, 5, 0)],
      parameters: [
        {
          id: 'p-width',
          name: 'width',
          expression: '200 mm',
        },
      ],
    });
    const dimension = getSketchViewDimensions(base.entities).find(
      (item) => item.kind === 'length',
    )!;
    const bound = bindDimensionToParameter(base, dimension, 'p-width');
    const restored = deserializeSketchDocument(
      serializeSketchDocument(bound),
      'parametric-floor',
    );
    const recalculated = recalculateParametricDocument(restored);

    expect(recalculated.parameters[0]).toMatchObject({
      name: 'width',
      value: 20,
      dimension: 'length',
    });
    expect(recalculated.dimensions[0]).toMatchObject({
      parameterId: 'p-width',
    });
    expect(recalculated.entities[0]).toMatchObject({ x2: 20 });
  });

  it('keeps cycle errors stable after recalculation', () => {
    const calculated = recalculateParameters(
      [
        { id: 'a', name: 'a', expression: 'b + 1' },
        { id: 'b', name: 'b', expression: 'a + 1' },
      ],
      10,
    );

    expect(
      calculated.every((parameter) => parameter.error === 'Cyclic dependency'),
    ).toBe(true);
  });

  it('keeps tangent and symmetry deterministic', () => {
    const tangentLine = line('line', -10, 0, 10, 0);
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 5,
      r: 2,
    };
    const tangent = applyTangentConstraint(
      [tangentLine, circle],
      'line',
      'circle',
      'tangent',
    )!;
    expect(tangent.entities[0]).toMatchObject({ y1: 3, y2: 3 });

    const axis = line('axis', 0, -10, 0, 10);
    const reference = line('reference', 2, 1, 6, 1);
    const target = line('target', 20, 20, 30, 20);
    const symmetric = applySymmetryConstraint(
      [axis, reference, target],
      'axis',
      'reference',
      'target',
      'symmetry',
    )!;
    expect(symmetric.entities[2]).toMatchObject({
      x1: -2,
      x2: -6,
    });
  });

  it('reports redundant duplicate constraints as over-constrained', () => {
    const result = solveSketchConstraints(
      [line('line', 0, 0, 10, 0)],
      [
        { id: 'h1', kind: 'horizontal', entityIds: ['line'] },
        { id: 'h2', kind: 'horizontal', entityIds: ['line'] },
      ],
    );

    expect(result.status).toBe('over-constrained');
  });
});
