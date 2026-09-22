import { describe, expect, it } from 'vitest';

import {
  hideDimension,
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

  it('hides an auto dimension so it stays deleted after regeneration', () => {
    const dimensions = setDimensionReference([], view, true);
    const hidden = hideDimension(dimensions, view);

    expect(hidden).toHaveLength(1);
    expect(hidden[0]).toMatchObject({
      id: view.id,
      reference: true,
      hidden: true,
    });
  });

  it('creates a hidden tombstone when an auto dimension was never persisted', () => {
    expect(hideDimension([], view)).toEqual([
      {
        id: view.id,
        kind: 'length',
        entityId: 'line-1',
        value: 42,
        hidden: true,
      },
    ]);
  });
});
