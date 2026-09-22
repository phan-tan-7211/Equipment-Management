import { describe, expect, it } from 'vitest';

import {
  commitSketchHistory,
  createSketchDocument,
  createSketchHistory,
  deserializeSketchDocument,
  redoSketchHistory,
  serializeSketchDocument,
  undoSketchHistory,
  type SketchDocument,
  type SketchEntity,
} from '@/features/facility-map/sketch';
import {
  applyDrivingDimension,
  upsertDrivingDimension,
} from '@/features/facility-map/sketch/dimensions/drivingDimensions';
import {
  hideDimension,
  setDimensionReference,
} from '@/features/facility-map/sketch/dimensions/dimensionState';
import {
  getEntityViewDimensions,
  type ViewDimension,
} from '@/features/facility-map/sketch/dimensions/viewDimensions';

const style = {
  color: '#111111',
  lineWidth: 1,
};

const clone = (document: SketchDocument) => structuredClone(document);

const line: SketchEntity = {
  ...style,
  id: 'line-1',
  type: 'line',
  x1: 0,
  y1: 0,
  x2: 30,
  y2: 40,
};

const lengthDimension = (): ViewDimension =>
  getEntityViewDimensions(line).find(
    (dimension) => dimension.kind === 'length',
  )!;

describe('dimension regression', () => {
  it('round-trips persisted driving/reference/hidden dimensions', () => {
    const length = lengthDimension();
    const reference = setDimensionReference([], length, true);
    const hidden = hideDimension(reference, length);

    const document = createSketchDocument({
      id: 'dimension-round-trip',
      entities: [line],
      dimensions: hidden,
      createdAt: 100,
      updatedAt: 200,
    });

    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'dimension-floor',
    );

    expect(restored).toEqual(document);
    expect(restored.dimensions).toHaveLength(1);
    expect(restored.dimensions[0]).toMatchObject({
      id: length.id,
      kind: 'length',
      entityId: 'line-1',
      reference: true,
      hidden: true,
    });
  });

  it('commits a driving dimension change as an undoable document step', () => {
    const length = lengthDimension();
    const initial = createSketchDocument({
      id: 'dimension-history',
      entities: [line],
      dimensions: [],
      createdAt: 100,
      updatedAt: 100,
    });

    const drivenLine = applyDrivingDimension(line, length, 100);
    const next: SketchDocument = {
      ...initial,
      entities: [drivenLine],
      dimensions: upsertDrivingDimension(
        initial.dimensions,
        length,
        100,
      ),
      updatedAt: 200,
    };

    const committed = commitSketchHistory(
      createSketchHistory(initial, clone),
      next,
      clone,
    );
    const undone = undoSketchHistory(committed, clone);
    const redone = redoSketchHistory(undone, clone);

    const committedLine = committed.present.entities[0] as Extract<SketchEntity, { type: 'line' }>;
    expect(committedLine.x2).toBeCloseTo(60);
    expect(committedLine.y2).toBeCloseTo(80);
    expect(committed.present.dimensions[0]).toMatchObject({
      id: length.id,
      driving: true,
      reference: false,
      value: 100,
    });
    expect(undone.present.entities[0]).toEqual(line);
    expect(undone.present.dimensions).toEqual([]);
    const redoneLine = redone.present.entities[0] as Extract<SketchEntity, { type: 'line' }>;
    expect(redoneLine.x2).toBeCloseTo(60);
    expect(redoneLine.y2).toBeCloseTo(80);
    expect(redone.present.dimensions).toHaveLength(1);
  });

  it('keeps reference dimensions non-driving until explicitly changed', () => {
    const length = lengthDimension();
    const dimensions = setDimensionReference([], length, true);

    expect(dimensions[0]).toMatchObject({
      driving: false,
      reference: true,
      value: 50,
    });
    expect(line).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 30,
      y2: 40,
    });
  });

  it('persists a hidden tombstone for deleted auto dimensions', () => {
    const length = lengthDimension();
    const hidden = hideDimension([], length);

    expect(hidden).toEqual([
      {
        id: length.id,
        kind: 'length',
        entityId: 'line-1',
        value: 50,
        hidden: true,
      },
    ]);
  });
});
