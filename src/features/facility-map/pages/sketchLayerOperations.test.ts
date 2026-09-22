import { describe, expect, it } from 'vitest';

import { deleteSelectedSketchLayers } from '@/features/facility-map/pages/sketchLayerOperations';
import { createSketchDocument } from '@/features/facility-map/sketch';

const DEFAULT_SKETCH_ID = 'default';

describe('deleteSelectedSketchLayers (generic Delete/Backspace on a whole-sketch selection)', () => {
  it('clears the default sketch when sketch:default is selected', () => {
    const defaultDocument = createSketchDocument();
    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: defaultDocument,
        defaultSketchLocked: false,
        sketches: [],
      },
      new Set([`sketch:${DEFAULT_SKETCH_ID}`]),
    );

    expect(result.deletedDefault).toBe(true);
    expect(result.sketchDocument).toBeUndefined();
  });

  it('removes an additional sketch from the list', () => {
    const layerA = { id: 'sketch-a', locked: false, document: createSketchDocument() };
    const layerB = { id: 'sketch-b', locked: false, document: createSketchDocument() };

    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: createSketchDocument(),
        defaultSketchLocked: false,
        sketches: [layerA, layerB],
      },
      new Set(['sketch:sketch-a']),
    );

    expect(result.sketches).toEqual([layerB]);
    expect(result.deletedDefault).toBe(false);
    // Untouched additional sketches keep the exact same document instance.
    expect(result.sketches[0]).toBe(layerB);
  });

  it('never deletes a locked default sketch, even if selected', () => {
    const defaultDocument = createSketchDocument();
    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: defaultDocument,
        defaultSketchLocked: true,
        sketches: [],
      },
      new Set([`sketch:${DEFAULT_SKETCH_ID}`]),
    );

    expect(result.deletedDefault).toBe(false);
    expect(result.sketchDocument).toBe(defaultDocument);
  });

  it('never deletes a locked additional sketch, even if selected', () => {
    const lockedLayer = { id: 'sketch-a', locked: true, document: createSketchDocument() };
    const unlockedLayer = { id: 'sketch-b', locked: false, document: createSketchDocument() };

    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: createSketchDocument(),
        defaultSketchLocked: false,
        sketches: [lockedLayer, unlockedLayer],
      },
      new Set(['sketch:sketch-a', 'sketch:sketch-b']),
    );

    // Only the unlocked one is removed; the locked one survives untouched.
    expect(result.sketches).toEqual([lockedLayer]);
  });

  it('deletes the default sketch and multiple additional sketches together in one selection', () => {
    const layerA = { id: 'sketch-a', locked: false, document: createSketchDocument() };
    const layerB = { id: 'sketch-b', locked: false, document: createSketchDocument() };
    const layerC = { id: 'sketch-c', locked: true, document: createSketchDocument() };

    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: createSketchDocument(),
        defaultSketchLocked: false,
        sketches: [layerA, layerB, layerC],
      },
      new Set([`sketch:${DEFAULT_SKETCH_ID}`, 'sketch:sketch-a', 'sketch:sketch-b', 'sketch:sketch-c']),
    );

    expect(result.deletedDefault).toBe(true);
    expect(result.sketchDocument).toBeUndefined();
    expect(result.sketches).toEqual([layerC]);
  });

  it('is a no-op when the selection has no sketch:* ids', () => {
    const layerA = { id: 'sketch-a', locked: false, document: createSketchDocument() };
    const defaultDocument = createSketchDocument();

    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: defaultDocument,
        defaultSketchLocked: false,
        sketches: [layerA],
      },
      new Set(['asset:CEV-001', 'zone:zone-1']),
    );

    expect(result.deletedDefault).toBe(false);
    expect(result.sketchDocument).toBe(defaultDocument);
    expect(result.sketches).toEqual([layerA]);
  });

  it('leaves an already-empty default sketch (undefined) as undefined', () => {
    const result = deleteSelectedSketchLayers(
      {
        defaultSketchId: DEFAULT_SKETCH_ID,
        defaultSketchDocument: undefined,
        defaultSketchLocked: false,
        sketches: [],
      },
      new Set([`sketch:${DEFAULT_SKETCH_ID}`]),
    );

    expect(result.deletedDefault).toBe(true);
    expect(result.sketchDocument).toBeUndefined();
  });
});
