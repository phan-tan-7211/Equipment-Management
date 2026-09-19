import { describe, expect, it } from 'vitest';

import {
  beginSketchHistoryTransaction,
  cancelSketchHistoryTransaction,
  commitSketchHistory,
  commitSketchHistoryTransaction,
  createSketchCommandState,
  createSketchDocument,
  createSketchHistory,
  deserializeSketchDocument,
  displayToModelUnits,
  modelUnitsToDisplay,
  redoSketchHistory,
  serializeSketchDocument,
  undoSketchHistory,
  updateSketchHistoryTransient,
  type SketchDocument,
  type SketchEntity,
} from '@/features/facility-map/sketch';

const clone = (value: SketchDocument) => structuredClone(value);

const entities: SketchEntity[] = [
  {
    id: 'line-1',
    type: 'line',
    x1: 1,
    y1: 2,
    x2: 3,
    y2: 4,
    color: '#111111',
    lineWidth: 1,
  },
  {
    id: 'polyline-1',
    type: 'polyline',
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 5 },
      { x: 8, y: 1 },
    ],
    closed: true,
    color: '#222222',
    lineWidth: 2,
  },
  {
    id: 'rect-1',
    type: 'rect',
    x: 10,
    y: 11,
    w: 12,
    h: 13,
    color: '#333333',
    lineWidth: 1.5,
  },
  {
    id: 'circle-1',
    type: 'circle',
    cx: 20,
    cy: 21,
    r: 5,
    color: '#444444',
    lineWidth: 1,
  },
  {
    id: 'arc-1',
    type: 'arc',
    cx: 30,
    cy: 31,
    r: 8,
    startAngleDeg: 15,
    endAngleDeg: 140,
    clockwise: true,
    color: '#555555',
    lineWidth: 1,
  },
];

describe('sketch foundation', () => {
  it('round-trips every Phase 1 geometry through the versioned document serializer', () => {
    const document = createSketchDocument({
      id: 'document-test',
      displayUnit: 'mm',
      mmPerUnit: 10,
      entities,
      createdAt: 100,
      updatedAt: 200,
    });

    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'floor-1',
    );

    expect(restored).toEqual(document);
    expect(restored.dimensions).toEqual([]);
    expect(restored.constraints).toEqual([]);
    expect(restored.entities.map((entity) => entity.type)).toEqual([
      'line',
      'polyline',
      'rect',
      'circle',
      'arc',
    ]);
  });

  it('migrates the legacy pre-Phase-1 sketch shape without losing geometry', () => {
    const restored = deserializeSketchDocument(
      JSON.stringify({
        mmPerUnit: 25,
        displayUnit: 'm',
        entities,
      }),
      'legacy-floor',
    );

    expect(restored.schemaVersion).toBe(1);
    expect(restored.id).toBe('document-legacy-floor');
    expect(restored.mmPerUnit).toBe(25);
    expect(restored.displayUnit).toBe('m');
    expect(restored.entities).toEqual(entities);
    expect(restored.dimensions).toEqual([]);
    expect(restored.constraints).toEqual([]);
  });

  it('converts display units to model space and back consistently', () => {
    const document = createSketchDocument({
      displayUnit: 'm',
      mmPerUnit: 10,
    });

    const modelUnits = displayToModelUnits(2.5, document);

    expect(modelUnits).toBe(250);
    expect(modelUnitsToDisplay(modelUnits, document)).toBe(2.5);
  });

  it('supports commit, undo, and redo without mutating prior snapshots', () => {
    const initial = createSketchDocument({
      id: 'history-test',
      entities: [],
      createdAt: 100,
      updatedAt: 100,
    });
    const line = entities[0];
    const next = {
      ...initial,
      entities: [line],
      updatedAt: 200,
    };

    const committed = commitSketchHistory(
      createSketchHistory(initial, clone),
      next,
      clone,
    );
    const undone = undoSketchHistory(committed, clone);
    const redone = redoSketchHistory(undone, clone);

    expect(committed.present.entities).toEqual([line]);
    expect(undone.present.entities).toEqual([]);
    expect(redone.present.entities).toEqual([line]);
    expect(initial.entities).toEqual([]);
  });

  it('commits a drag transaction as one undo step and can cancel a transaction', () => {
    const initial = createSketchDocument({
      id: 'transaction-test',
      entities: [entities[0]],
      createdAt: 100,
      updatedAt: 100,
    });
    const history = createSketchHistory(initial, clone);

    const started = beginSketchHistoryTransaction(history, clone);
    const transient = updateSketchHistoryTransient(
      started,
      {
        ...initial,
        entities: [{ ...entities[0], x2: 99 } as SketchEntity],
      },
      clone,
    );
    const committed = commitSketchHistoryTransaction(transient, clone);
    const undone = undoSketchHistory(committed, clone);

    expect(committed.past).toHaveLength(1);
    expect(committed.present.entities[0]).toMatchObject({ x2: 99 });
    expect(undone.present.entities[0]).toMatchObject({ x2: 3 });

    const cancelled = cancelSketchHistoryTransaction(
      updateSketchHistoryTransient(
        beginSketchHistoryTransaction(history, clone),
        {
          ...initial,
          entities: [{ ...entities[0], x2: 123 } as SketchEntity],
        },
        clone,
      ),
      clone,
    );

    expect(cancelled.present.entities[0]).toMatchObject({ x2: 3 });
    expect(cancelled.transactionStart).toBeNull();
  });

  it('starts command state in a stable idle state', () => {
    expect(createSketchCommandState()).toEqual({
      tool: 'select',
      interaction: 'idle',
    });
    expect(createSketchCommandState('line')).toEqual({
      tool: 'line',
      interaction: 'idle',
    });
  });
});
