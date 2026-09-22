import { describe, expect, it } from 'vitest';

import {
  duplicateSelectedEntities,
  moveSelectedEntities,
} from '@/features/facility-map/sketch/selection/selectionTransform';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';

const style = {
  color: '#000000',
  lineWidth: 1,
};

const entities: SketchEntity[] = [
  {
    ...style,
    id: 'line-a',
    type: 'line',
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 0,
  },
  {
    ...style,
    id: 'circle-b',
    type: 'circle',
    cx: 20,
    cy: 20,
    r: 5,
  },
  {
    ...style,
    id: 'rect-c',
    type: 'rect',
    x: 50,
    y: 50,
    w: 10,
    h: 10,
  },
];

describe('selection transform', () => {
  it('moves every selected entity by the same delta', () => {
    const moved = moveSelectedEntities(
      entities,
      ['line-a', 'circle-b'],
      5,
      -3,
    );

    expect(moved[0]).toMatchObject({
      x1: 5,
      y1: -3,
      x2: 15,
      y2: -3,
    });
    expect(moved[1]).toMatchObject({
      cx: 25,
      cy: 17,
      r: 5,
    });
    expect(moved[2]).toMatchObject({
      x: 50,
      y: 50,
    });
  });

  it('duplicates only selected entities with new ids and an offset', () => {
    let nextId = 0;
    const result = duplicateSelectedEntities(
      entities,
      ['line-a', 'rect-c'],
      { x: 10, y: 10 },
      () => `copy-${nextId += 1}`,
    );

    expect(result.ids).toEqual(['copy-1', 'copy-2']);
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0]).toMatchObject({
      id: 'copy-1',
      x1: 10,
      y1: 10,
      x2: 20,
      y2: 10,
    });
    expect(result.entities[1]).toMatchObject({
      id: 'copy-2',
      x: 60,
      y: 60,
      w: 10,
      h: 10,
    });
  });
});
