import { describe, expect, it } from 'vitest';

import {
  applyDrivingDimension,
  upsertDrivingDimension,
} from '@/features/facility-map/sketch/dimensions/drivingDimensions';
import type { SketchEntity } from '@/features/facility-map/sketch/core/types';
import type { ViewDimension } from '@/features/facility-map/sketch/dimensions/viewDimensions';

const style = { color: '#000000', lineWidth: 1 };

const dimension = (
  entityId: string,
  kind: ViewDimension['kind'],
): ViewDimension => ({
  id: `auto:${entityId}:${kind}`,
  entityId,
  kind,
  value: 0,
  anchor: { x: 0, y: 0 },
});

describe('driving dimensions', () => {
  it('changes line length while preserving direction', () => {
    const line: SketchEntity = {
      ...style,
      id: 'line',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 3,
      y2: 4,
    };

    const next = applyDrivingDimension(
      line,
      dimension('line', 'length'),
      10,
    ) as Extract<SketchEntity, { type: 'line' }>;

    expect(next.x2).toBeCloseTo(6);
    expect(next.y2).toBeCloseTo(8);
  });

  it('changes line angle while preserving length', () => {
    const line: SketchEntity = {
      ...style,
      id: 'line',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 0,
    };

    const next = applyDrivingDimension(
      line,
      dimension('line', 'angle'),
      90,
    );
    expect(next).toMatchObject({ x1: 0, y1: 0 });
    expect((next as Extract<SketchEntity, { type: 'line' }>).x2).toBeCloseTo(0);
    expect((next as Extract<SketchEntity, { type: 'line' }>).y2).toBeCloseTo(10);
  });

  it('drives rectangle horizontal and vertical dimensions', () => {
    const rect: SketchEntity = {
      ...style,
      id: 'rect',
      type: 'rect',
      x: 0,
      y: 0,
      w: 10,
      h: 20,
    };

    const width = applyDrivingDimension(
      rect,
      dimension('rect', 'horizontal'),
      30,
    );
    const height = applyDrivingDimension(
      width,
      dimension('rect', 'vertical'),
      40,
    );

    expect(height).toMatchObject({ w: 30, h: 40 });
  });

  it('drives circle radius and diameter', () => {
    const circle: SketchEntity = {
      ...style,
      id: 'circle',
      type: 'circle',
      cx: 0,
      cy: 0,
      r: 5,
    };

    const radius = applyDrivingDimension(
      circle,
      dimension('circle', 'radius'),
      12,
    );
    const diameter = applyDrivingDimension(
      radius,
      dimension('circle', 'diameter'),
      30,
    );

    expect(diameter).toMatchObject({ r: 15 });
  });

  it('drives arc radius and sweep angle', () => {
    const arc: SketchEntity = {
      ...style,
      id: 'arc',
      type: 'arc',
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 20,
      endAngleDeg: 100,
      clockwise: false,
    };

    const radius = applyDrivingDimension(
      arc,
      dimension('arc', 'radius'),
      25,
    );
    const angle = applyDrivingDimension(
      radius,
      dimension('arc', 'angle'),
      120,
    );

    expect(angle).toMatchObject({
      r: 25,
      startAngleDeg: 20,
      endAngleDeg: 140,
    });
  });

  it('persists a driving dimension by stable id', () => {
    const view = dimension('line', 'length');
    const first = upsertDrivingDimension([], view, 100);
    const second = upsertDrivingDimension(first, view, 200);

    expect(second).toHaveLength(1);
    expect(second[0]).toEqual({
      id: view.id,
      kind: 'length',
      entityId: 'line',
      driving: true,
      reference: false,
      value: 200,
    });
  });
});
