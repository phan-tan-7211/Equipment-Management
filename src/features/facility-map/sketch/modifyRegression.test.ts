import { describe, expect, it } from 'vitest';

import {
  breakLineAtPoint,
  createOffsetEntity,
} from '@/features/facility-map/sketch/modify/breakOffset';
import {
  commitExtend,
  commitTrim,
  effectiveModifyMode,
} from '@/features/facility-map/sketch/modify/trimExtend';
import { mirrorSelectedEntities } from '@/features/facility-map/sketch/modify/mirror';
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

describe('modify regression', () => {
  it('keeps trim, extend and Shift mode behavior stable', () => {
    const target = line('target', 0, 0, 20, 0);
    const boundaries = [
      line('left', 5, -5, 5, 5),
      line('right', 15, -5, 15, 5),
    ];
    let id = 0;
    const trimmed = commitTrim(
      [target, ...boundaries],
      target,
      { x: 10, y: 0 },
      () => `trim-${id += 1}`,
    );

    expect(trimmed).not.toBeNull();
    expect(effectiveModifyMode('trim', true)).toBe('extend');

    const short = line('short', 0, 10, 10, 10);
    const boundary = line('boundary', 20, 0, 20, 20);
    const extended = commitExtend(
      [short, boundary],
      short,
      { x: 10, y: 10 },
    );
    expect(extended?.[0]).toMatchObject({ x2: 20 });
  });

  it('keeps Break and Offset as non-destructive predictable operations', () => {
    const target = line('target', 0, 0, 10, 0);
    let id = 0;
    const broken = breakLineAtPoint(
      [target],
      target,
      { x: 5, y: 2 },
      () => `break-${id += 1}`,
    )!;
    expect(broken).toHaveLength(2);

    const offset = createOffsetEntity(
      target,
      3,
      { x: 5, y: 5 },
      'offset',
    )!;
    expect(offset).toMatchObject({
      id: 'offset',
      type: 'line',
      y1: 3,
      y2: 3,
    });
  });

  it('mirrors copies while retaining source geometry', () => {
    const axis = line('axis', 0, -10, 0, 10);
    const target = line('target', 2, 0, 4, 0);
    const source: SketchEntity[] = [axis, target];
    const mirrored = mirrorSelectedEntities(
      source,
      axis.id,
      [target.id],
      () => 'mirrored',
    )!;

    expect(source[1]).toMatchObject({ x1: 2, x2: 4 });
    expect(mirrored.copies[0]).toMatchObject({
      x1: -2,
      x2: -4,
    });
  });
});
