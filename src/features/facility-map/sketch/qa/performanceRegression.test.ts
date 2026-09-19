import { describe, expect, it } from 'vitest';

import {
  commitSketchHistory,
  createSketchDocument,
  createSketchHistory,
  deserializeSketchDocument,
  serializeSketchDocument,
  undoSketchHistory,
  type SketchDocument,
  type SketchEntity,
} from '@/features/facility-map/sketch';
import { getSketchViewDimensions } from '@/features/facility-map/sketch/dimensions/viewDimensions';
import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';

const clone = (document: SketchDocument) => structuredClone(document);

const makeLines = (count: number): SketchEntity[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `line-${index}`,
    type: 'line' as const,
    x1: index % 100,
    y1: Math.floor(index / 100),
    x2: (index % 100) + 8,
    y2: Math.floor(index / 100),
    color: '#111111',
    lineWidth: 1,
  }));

describe('sketch performance regression', () => {
  it('handles 500 entities through dimensions, solve, and persistence', () => {
    const document = createSketchDocument({
      id: 'qa-500',
      entities: makeLines(500),
    });

    const dimensions = getSketchViewDimensions(document.entities);
    const solved = solveSketchConstraints(
      document.entities,
      document.constraints,
    );
    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'qa-500',
    );

    expect(dimensions).toHaveLength(1000);
    expect(solved.entities).toHaveLength(500);
    expect(restored.entities).toHaveLength(500);
  });

  it('handles 2,000 entities without changing entity count', () => {
    const document = createSketchDocument({
      id: 'qa-2000',
      entities: makeLines(2000),
    });

    const restored = deserializeSketchDocument(
      serializeSketchDocument(document),
      'qa-2000',
    );
    const solved = solveSketchConstraints(
      restored.entities,
      restored.constraints,
      { maxIterations: 2 },
    );

    expect(restored.entities).toHaveLength(2000);
    expect(solved.entities).toHaveLength(2000);
    expect(solved.status).toBe('under-constrained');
  });

  it('supports at least 50 sequential undo operations', () => {
    const initial = createSketchDocument({
      id: 'undo-50',
      entities: [],
    });
    let history = createSketchHistory(initial, clone);

    for (let index = 0; index < 50; index += 1) {
      const next = {
        ...history.present,
        entities: makeLines(index + 1),
        updatedAt: index + 1,
      };
      history = commitSketchHistory(history, next, clone);
    }

    expect(history.present.entities).toHaveLength(50);

    for (let index = 0; index < 50; index += 1) {
      history = undoSketchHistory(history, clone);
    }

    expect(history.present.entities).toHaveLength(0);
  });
});
