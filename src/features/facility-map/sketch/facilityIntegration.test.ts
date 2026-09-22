import { describe, expect, it } from 'vitest';

import {
  cloneSketchDocument,
  createSketchDocument,
  deserializeSketchDocument,
  serializeSketchDocument,
} from '@/features/facility-map/sketch';

describe('facility sketch integration', () => {
  it('keeps an embedded sketch document stable inside floor-plan snapshots', () => {
    const sketch = createSketchDocument({
      id: 'floor-sketch',
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
          id: 'parameter-width',
          name: 'width',
          expression: '100 mm',
        },
      ],
    });

    const embedded = cloneSketchDocument(sketch);
    const historySnapshot = JSON.parse(
      JSON.stringify({ sketchDocument: embedded }),
    ) as { sketchDocument: typeof sketch };
    const restored = deserializeSketchDocument(
      serializeSketchDocument(historySnapshot.sketchDocument),
      'floor',
    );

    expect(restored).toEqual(sketch);
    expect(restored).not.toBe(sketch);
  });

  it('supports cancel semantics through an immutable entry snapshot', () => {
    const initial = createSketchDocument({
      id: 'cancel-sketch',
      entities: [],
    });
    const snapshot = cloneSketchDocument(initial);
    const edited = cloneSketchDocument(initial);
    edited.entities.push({
      id: 'line',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 20,
      y2: 0,
      color: '#000000',
      lineWidth: 1,
    });

    expect(snapshot.entities).toEqual([]);
    expect(edited.entities).toHaveLength(1);
  });
});
