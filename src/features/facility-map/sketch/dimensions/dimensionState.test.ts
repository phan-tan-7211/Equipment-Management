import { describe, expect, it } from 'vitest';

import {
  deleteDimensionById,
  setDimensionReference,
} from '@/features/facility-map/sketch/dimensions/dimensionState';
import type { ViewDimension } from '@/features/facility-map/sketch/dimensions/viewDimensions';

const view: ViewDimension = {
  id: 'auto:line-1:length',
  entityId: 'line-1',
  kind: 'length',
  value: 42,
  anchor: { x: 0, y: 0 },
};

describe('dimension state', () => {
  it('creates a reference dimension without changing geometry state', () => {
    expect(setDimensionReference([], view, true)).toEqual([
      {
        id: view.id,
        kind: 'length',
        entityId: 'line-1',
        driving: false,
        reference: true,
        value: 42,
      },
    ]);
  });

  it('toggles an existing dimension back to driving', () => {
    const reference = setDimensionReference([], view, true);
    const driving = setDimensionReference(reference, view, false);

    expect(driving).toHaveLength(1);
    expect(driving[0]).toMatchObject({
      driving: true,
      reference: false,
    });
  });

  it('deletes only the selected dimension record', () => {
    const dimensions = [
      ...setDimensionReference([], view, true),
      {
        id: 'auto:circle-1:radius',
        kind: 'radius' as const,
        entityId: 'circle-1',
        driving: true,
        reference: false,
        value: 10,
      },
    ];

    expect(deleteDimensionById(dimensions, view.id)).toEqual([
      dimensions[1],
    ]);
  });
});
