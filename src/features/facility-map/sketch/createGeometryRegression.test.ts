import { describe, expect, it } from 'vitest';

import {
  commitLineDraft,
  getLineKeyboardAction,
  resolveLinePreviewEnd,
  startLineDraft,
  updateLineDraft,
} from '@/features/facility-map/sketch/commands/lineCommand';
import {
  createRectangleEntity,
  resolveRectangleHeight,
  resolveRectangleWidth,
  startRectangleDraft,
  updateRectangleDraft,
} from '@/features/facility-map/sketch/commands/rectangleCommand';
import {
  createCircleEntity,
  resolveCirclePreviewPoint,
  resolveCircleRadius,
  startCircleDraft,
  updateCircleDraft,
} from '@/features/facility-map/sketch/commands/circleCommand';
import {
  appendPolylinePoint,
  createPolylineEntity,
  finishPolylineDraft,
  startPolylineDraft,
  updatePolylineDraft,
} from '@/features/facility-map/sketch/commands/polylineCommand';
import {
  createArcEntity,
  setArcStartPoint,
  startArcDraft,
  updateArcDraft,
} from '@/features/facility-map/sketch/commands/arcCommand';
import {
  parseToolPresets,
  updateToolPreset,
} from '@/features/facility-map/sketch/persistence/toolPresets';

const document = {
  displayUnit: 'mm' as const,
  mmPerUnit: 10,
};

const style = {
  color: '#2563eb',
  lineWidth: 1.5,
};

describe('Phase 2 create geometry regression', () => {
  it('keeps Line start → preview → commit semantics stable', () => {
    const draft = updateLineDraft(
      startLineDraft({ x: 10, y: 10 }),
      { x: 13, y: 14 },
    );

    const preview = resolveLinePreviewEnd({
      start: draft.start,
      current: draft.current,
      lengthInput: '100',
      angleInput: '90',
      lockLength: true,
      lockAngle: true,
      document,
    });

    expect(preview.x).toBeCloseTo(10);
    expect(preview.y).toBeCloseTo(20);
    expect(getLineKeyboardAction('Enter')).toBe('confirm');
    expect(getLineKeyboardAction('Escape')).toBe('cancel');

    const entity = commitLineDraft({
      id: 'line-regression',
      draft,
      current: draft.current,
      lengthInput: '100',
      angleInput: '90',
      document,
      style,
    });

    expect(entity.x1).toBe(10);
    expect(entity.y1).toBe(10);
    expect(entity.x2).toBeCloseTo(10);
    expect(entity.y2).toBeCloseTo(20);
  });

  it('keeps Rectangle width/height input and drag direction stable', () => {
    const draft = updateRectangleDraft(
      startRectangleDraft({ x: 20, y: 20 }),
      { x: 5, y: 10 },
    );

    const width = resolveRectangleWidth('150', 15, document);
    const height = resolveRectangleHeight('80', 10, document);

    const entity = createRectangleEntity({
      id: 'rect-regression',
      draft,
      current: draft.current,
      width,
      height,
      style,
    });

    expect(entity).toMatchObject({
      x: 5,
      y: 12,
      w: 15,
      h: 8,
    });
  });

  it('keeps Circle pointer radius, locked radius and entity center stable', () => {
    const draft = updateCircleDraft(
      startCircleDraft({ x: 10, y: 10 }),
      { x: 13, y: 14 },
    );

    expect(
      resolveCirclePreviewPoint({
        draft,
        radiusInput: '100',
        lockRadius: false,
        document,
      }),
    ).toEqual({ x: 15, y: 10 });

    expect(
      resolveCirclePreviewPoint({
        draft,
        radiusInput: '100',
        lockRadius: true,
        document,
      }),
    ).toEqual({ x: 20, y: 10 });

    const entity = createCircleEntity({
      id: 'circle-regression',
      draft,
      radius: resolveCircleRadius('100', 5, document),
      style,
    });

    expect(entity).toMatchObject({
      cx: 10,
      cy: 10,
      r: 10,
    });
  });

  it('keeps Polyline continue → finish → entity semantics stable', () => {
    const started = startPolylineDraft({ x: 0, y: 0 });
    const previewed = updatePolylineDraft(started, { x: 5, y: 5 });
    expect(previewed.points).toEqual([{ x: 0, y: 0 }]);

    const second = appendPolylinePoint(previewed, { x: 5, y: 5 });
    const third = appendPolylinePoint(second, { x: 10, y: 0 });
    const duplicated = appendPolylinePoint(third, { x: 10, y: 0 });
    const finished = finishPolylineDraft(duplicated);

    expect(finished?.points).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ]);

    const entity = finished
      ? createPolylineEntity({
          id: 'polyline-regression',
          draft: finished,
          style,
        })
      : null;

    expect(entity?.points).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ]);
  });

  it('keeps Arc 3-click center → start → end semantics stable', () => {
    const centered = startArcDraft({ x: 0, y: 0 });
    const started = setArcStartPoint(centered, { x: 10, y: 0 });
    const ended = updateArcDraft(started, { x: 0, y: 10 });

    const entity = createArcEntity({
      id: 'arc-regression',
      draft: ended,
      style,
    });

    expect(entity).toMatchObject({
      cx: 0,
      cy: 0,
      r: 10,
      startAngleDeg: 0,
      endAngleDeg: 90,
    });
  });

  it('keeps remembered properties independent while migrating legacy presets', () => {
    const migrated = parseToolPresets(JSON.stringify({
      line: { color: '#111111', lineWidth: 2 },
      rect: { color: '#222222', lineWidth: 3 },
      circle: { color: '#333333', lineWidth: 4 },
    }));

    expect(migrated.polyline).toEqual(migrated.line);
    expect(migrated.arc).toEqual(migrated.line);

    const updated = updateToolPreset(migrated, 'arc', {
      color: '#abcdef',
    });

    expect(updated.arc.color).toBe('#abcdef');
    expect(updated.line.color).toBe('#111111');
    expect(updated.polyline.color).toBe('#111111');
  });
});
