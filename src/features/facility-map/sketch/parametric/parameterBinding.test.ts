import { describe, expect, it } from 'vitest';

import { createSketchDocument } from '@/features/facility-map/sketch/core/document';
import {
  bindDimensionToParameter,
  dimensionParameterDimension,
  recalculateParametricDocument,
} from '@/features/facility-map/sketch/parametric/parameterBinding';
import { getSketchViewDimensions } from '@/features/facility-map/sketch/dimensions/viewDimensions';

describe('parameter binding', () => {
  it('binds a length dimension to a length parameter and drives geometry', () => {
    const document = createSketchDocument({
      mmPerUnit: 10,
      entities: [
        {
          id: 'line',
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 5,
          y2: 0,
          color: '#000000',
          lineWidth: 1,
        },
      ],
      parameters: [
        {
          id: 'p-width',
          name: 'width',
          expression: '200 mm',
        },
      ],
    });
    const length = getSketchViewDimensions(document.entities).find(
      (dimension) => dimension.kind === 'length',
    )!;

    const bound = bindDimensionToParameter(
      document,
      length,
      'p-width',
    );

    expect(bound.parameters[0]).toMatchObject({
      value: 20,
      dimension: 'length',
    });
    expect(bound.entities[0]).toMatchObject({
      x2: 20,
      y2: 0,
    });
    expect(bound.dimensions[0]).toMatchObject({
      parameterId: 'p-width',
      value: 20,
      driving: true,
    });
  });

  it('recalculates bindings after parameter expression changes', () => {
    const document = createSketchDocument({
      mmPerUnit: 10,
      entities: [
        {
          id: 'circle',
          type: 'circle',
          cx: 0,
          cy: 0,
          r: 5,
          color: '#000000',
          lineWidth: 1,
        },
      ],
      parameters: [
        {
          id: 'p-radius',
          name: 'radius',
          expression: '100 mm',
        },
      ],
    });
    const radius = getSketchViewDimensions(document.entities).find(
      (dimension) => dimension.kind === 'radius',
    )!;
    const bound = bindDimensionToParameter(
      document,
      radius,
      'p-radius',
    );
    const changed = recalculateParametricDocument({
      ...bound,
      parameters: bound.parameters.map((parameter) => ({
        ...parameter,
        expression: '250 mm',
      })),
    });

    expect(changed.entities[0]).toMatchObject({ r: 25 });
  });

  it('requires scalar parameters for angles and length for distance dimensions', () => {
    expect(dimensionParameterDimension('angle')).toBe('scalar');
    expect(dimensionParameterDimension('radius')).toBe('length');
    expect(dimensionParameterDimension('horizontal')).toBe('length');
  });

  it('does not drive geometry when parameter dimension is incompatible', () => {
    const document = createSketchDocument({
      entities: [
        {
          id: 'line',
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 10,
          y2: 0,
          color: '#000000',
          lineWidth: 1,
        },
      ],
      parameters: [
        {
          id: 'p-scalar',
          name: 'factor',
          expression: '2',
        },
      ],
    });
    const length = getSketchViewDimensions(document.entities).find(
      (dimension) => dimension.kind === 'length',
    )!;
    const bound = bindDimensionToParameter(
      document,
      length,
      'p-scalar',
    );

    expect(bound.entities[0]).toMatchObject({ x2: 10 });
  });
});
