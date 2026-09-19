import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Circle as CircleIcon,
  ArrowUpRight,
  Minus,
  MousePointer2,
  Scissors,
  Square,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';

import {
  beginSketchInteraction,
  cancelSketchCommand,
  createSketchCommandState,
  createSketchId,
  displayToModelUnits,
  endSketchInteraction,
  formatSketchDistance,
  modelUnitsToDisplay,
  normalizeMmPerUnit,
  selectSketchTool,
  unitPrecision,
  useSketchDocumentHistory,
  type ArcEntity,
  type CircleEntity,
  type LineEntity,
  type PolylineEntity,
  type RectEntity,
  type SketchEntity,
  type SketchPoint as Point,
  type SketchStyle,
  type SketchTool,
} from '@/features/facility-map/sketch';

type ToolPresetMap = Record<'line' | 'rect' | 'circle', SketchStyle>;

type Draft =
  | { type: 'line'; start: Point; current: Point }
  | { type: 'rect'; start: Point; current: Point }
  | { type: 'circle'; start: Point; current: Point }
  | null;

type DynamicLocks = {
  a: boolean;
  b: boolean;
};

type Props = {
  enabled: boolean;
  storageKey: string;
  canvasWidth: number;
  canvasHeight: number;
  t: (key: string, params?: Record<string, unknown>) => string;
  onExit: () => void;
};

const PRESET_KEY = 'znteqr:facility-sketch:presets:v1';

const DEFAULT_PRESETS: ToolPresetMap = {
  line: { color: '#2563eb', lineWidth: 1.5 },
  rect: { color: '#7c3aed', lineWidth: 1.5 },
  circle: { color: '#0891b2', lineWidth: 1.5 },
};

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const angleDeg = (a: Point, b: Point) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const degToRad = (deg: number) => (deg * Math.PI) / 180;
const clampPositive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const readPresets = (): ToolPresetMap => {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw) as Partial<ToolPresetMap>;
    return {
      line: { ...DEFAULT_PRESETS.line, ...(parsed.line ?? {}) },
      rect: { ...DEFAULT_PRESETS.rect, ...(parsed.rect ?? {}) },
      circle: { ...DEFAULT_PRESETS.circle, ...(parsed.circle ?? {}) },
    };
  } catch {
    return DEFAULT_PRESETS;
  }
};

const rectEdges = (entity: RectEntity): Array<[Point, Point]> => {
  const x2 = entity.x + entity.w;
  const y2 = entity.y + entity.h;
  return [
    [{ x: entity.x, y: entity.y }, { x: x2, y: entity.y }],
    [{ x: x2, y: entity.y }, { x: x2, y: y2 }],
    [{ x: x2, y: y2 }, { x: entity.x, y: y2 }],
    [{ x: entity.x, y: y2 }, { x: entity.x, y: entity.y }],
  ];
};

const segmentIntersection = (
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  allowTargetInfinite = false,
): { point: Point; t: number; u: number } | null => {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) < 1e-9) return null;
  const q = { x: c.x - a.x, y: c.y - a.y };
  const t = (q.x * s.y - q.y * s.x) / cross;
  const u = (q.x * r.y - q.y * r.x) / cross;
  if ((!allowTargetInfinite && (t < 0 || t > 1)) || u < 0 || u > 1) return null;
  return { point: { x: a.x + t * r.x, y: a.y + t * r.y }, t, u };
};

export default function InventorSketchOverlay({
  enabled,
  storageKey,
  canvasWidth,
  canvasHeight,
  t,
  onExit,
}: Props) {
  const [tool, setTool] = useState<SketchTool>('select');
  const [store, setStore] = useState<SketchStore>(() => readStore(storageKey));
  const [presets, setPresets] = useState<ToolPresetMap>(() => readPresets());
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Draft>(null);
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [dynamicA, setDynamicA] = useState('');
  const [dynamicB, setDynamicB] = useState('');
  const [dynamicLocks, setDynamicLocks] = useState<DynamicLocks>({ a: false, b: false });
  const [message, setMessage] = useState('');
  const [draggingId, setDraggingId] = useState('');
  const dragRef = useRef<{ start: Point; entity: SketchEntity } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const next = readStore(storageKey);
    setStore(next);
    setSelectedId('');
    setDraft(null);
    setTool('select');
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(`${STORE_PREFIX}${storageKey}`, JSON.stringify(store));
  }, [storageKey, store]);

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    if (!enabled) {
      setDraft(null);
      setSelectedId('');
      setDraggingId('');
      setTool('select');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setDraft(null);
        setSelectedId('');
        setTool('select');
        setMessage('');
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        setStore((current) => ({
          ...current,
          entities: current.entities.filter((entity) => entity.id !== selectedId),
        }));
        setSelectedId('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, selectedId]);

  const currentStyle = useMemo(() => {
    if (tool === 'rect' || tool === 'circle') return presets[tool];
    return presets.line;
  }, [presets, tool]);

  const pointFromEvent = useCallback((event: React.MouseEvent<SVGSVGElement | SVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvasWidth,
      y: ((event.clientY - rect.top) / rect.height) * canvasHeight,
    };
  }, [canvasHeight, canvasWidth]);

  const endpointSnap = useCallback((point: Point) => {
    const svg = svgRef.current;
    if (!svg) return point;
    const rect = svg.getBoundingClientRect();
    const threshold = (10 / Math.max(rect.width, 1)) * canvasWidth;
    let best: Point | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    store.entities.forEach((entity) => {
      const candidates: Point[] =
        entity.type === 'line'
          ? [{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }]
          : entity.type === 'rect'
            ? [
                { x: entity.x, y: entity.y },
                { x: entity.x + entity.w, y: entity.y },
                { x: entity.x + entity.w, y: entity.y + entity.h },
                { x: entity.x, y: entity.y + entity.h },
              ]
            : [{ x: entity.cx, y: entity.cy }];
      candidates.forEach((candidate) => {
        const d = distance(point, candidate);
        if (d < threshold && d < bestDistance) {
          best = candidate;
          bestDistance = d;
        }
      });
    });
    return best ?? point;
  }, [canvasWidth, store.entities]);

  const inferLineEnd = useCallback((start: Point, raw: Point) => {
    const snapped = endpointSnap(raw);
    const dx = snapped.x - start.x;
    const dy = snapped.y - start.y;
    const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
    const normalized = Math.min(angle, Math.abs(180 - angle));
    if (normalized < 4) return { x: snapped.x, y: start.y };
    if (Math.abs(90 - angle) < 4) return { x: start.x, y: snapped.y };
    return snapped;
  }, [endpointSnap]);

  const updatePreset = (patch: Partial<SketchStyle>) => {
    if (tool !== 'line' && tool !== 'rect' && tool !== 'circle') return;
    setPresets((current) => ({
      ...current,
      [tool]: { ...current[tool], ...patch },
    }));
  };

  const resetDynamic = () => {
    setDynamicA('');
    setDynamicB('');
    setDynamicLocks({ a: false, b: false });
  };

  const updateDynamicFromPointer = (next: Point) => {
    if (!draft) return;
    if (draft.type === 'line') {
      if (!dynamicLocks.a) setDynamicA((distance(draft.start, next) * store.mmPerUnit).toFixed(0));
      if (!dynamicLocks.b) setDynamicB(angleDeg(draft.start, next).toFixed(1));
    } else if (draft.type === 'rect') {
      if (!dynamicLocks.a) setDynamicA((Math.abs(next.x - draft.start.x) * store.mmPerUnit).toFixed(0));
      if (!dynamicLocks.b) setDynamicB((Math.abs(next.y - draft.start.y) * store.mmPerUnit).toFixed(0));
    } else if (draft.type === 'circle') {
      if (!dynamicLocks.a) setDynamicA((distance(draft.start, next) * store.mmPerUnit).toFixed(0));
    }
  };

  const commitDraft = (currentPoint: Point) => {
    if (!draft) return;
    const style = draft.type === 'rect' ? presets.rect : draft.type === 'circle' ? presets.circle : presets.line;

    if (draft.type === 'line') {
      const fallbackLength = distance(draft.start, currentPoint);
      const fallbackAngle = angleDeg(draft.start, currentPoint);
      const lengthUnits = clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackLength);
      const angle = Number.isFinite(Number(dynamicB)) ? Number(dynamicB) : fallbackAngle;
      const radians = degToRad(angle);
      const end = {
        x: draft.start.x + Math.cos(radians) * lengthUnits,
        y: draft.start.y + Math.sin(radians) * lengthUnits,
      };
      setStore((current) => ({
        ...current,
        entities: [
          ...current.entities,
          { id: makeId('sketch-line'), type: 'line', x1: draft.start.x, y1: draft.start.y, x2: end.x, y2: end.y, ...style },
        ],
      }));
    } else if (draft.type === 'rect') {
      const fallbackW = Math.abs(currentPoint.x - draft.start.x);
      const fallbackH = Math.abs(currentPoint.y - draft.start.y);
      const width = clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackW);
      const height = clampPositive(Number(dynamicB) / store.mmPerUnit, fallbackH);
      const signX = currentPoint.x >= draft.start.x ? 1 : -1;
      const signY = currentPoint.y >= draft.start.y ? 1 : -1;
      setStore((current) => ({
        ...current,
        entities: [
          ...current.entities,
          {
            id: makeId('sketch-rect'),
            type: 'rect',
            x: signX > 0 ? draft.start.x : draft.start.x - width,
            y: signY > 0 ? draft.start.y : draft.start.y - height,
            w: width,
            h: height,
            ...style,
          },
        ],
      }));
    } else {
      const fallbackRadius = distance(draft.start, currentPoint);
      const radius = clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackRadius);
      setStore((current) => ({
        ...current,
        entities: [
          ...current.entities,
          { id: makeId('sketch-circle'), type: 'circle', cx: draft.start.x, cy: draft.start.y, r: radius, ...style },
        ],
      }));
    }

    setDraft(null);
    resetDynamic();
  };

  const editLineLength = (entity: LineEntity) => {
    const currentMm = distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) * store.mmPerUnit;
    const raw = window.prompt(t('facilityMap.sketchEnterLength'), currentMm.toFixed(0));
    if (raw == null) return;
    const nextMm = Number(raw);
    if (!Number.isFinite(nextMm) || nextMm <= 0) return;
    const angle = Math.atan2(entity.y2 - entity.y1, entity.x2 - entity.x1);
    const units = nextMm / store.mmPerUnit;
    setStore((current) => ({
      ...current,
      entities: current.entities.map((item) =>
        item.id === entity.id
          ? { ...entity, x2: entity.x1 + Math.cos(angle) * units, y2: entity.y1 + Math.sin(angle) * units }
          : item,
      ),
    }));
  };

  const editLineAngle = (entity: LineEntity) => {
    const current = angleDeg({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 });
    const raw = window.prompt(t('facilityMap.sketchEnterAngle'), current.toFixed(1));
    if (raw == null) return;
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    const lengthUnits = distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 });
    const radians = degToRad(next);
    setStore((currentStore) => ({
      ...currentStore,
      entities: currentStore.entities.map((item) =>
        item.id === entity.id
          ? { ...entity, x2: entity.x1 + Math.cos(radians) * lengthUnits, y2: entity.y1 + Math.sin(radians) * lengthUnits }
          : item,
      ),
    }));
  };

  const editRectDimension = (entity: RectEntity, axis: 'w' | 'h') => {
    const currentMm = (axis === 'w' ? entity.w : entity.h) * store.mmPerUnit;
    const raw = window.prompt(axis === 'w' ? t('facilityMap.sketchEnterWidth') : t('facilityMap.sketchEnterHeight'), currentMm.toFixed(0));
    if (raw == null) return;
    const nextMm = Number(raw);
    if (!Number.isFinite(nextMm) || nextMm <= 0) return;
    const units = nextMm / store.mmPerUnit;
    setStore((current) => ({
      ...current,
      entities: current.entities.map((item) =>
        item.id === entity.id ? { ...entity, [axis]: units } : item,
      ),
    }));
  };

  const editCircleRadius = (entity: CircleEntity) => {
    const raw = window.prompt(t('facilityMap.sketchEnterRadius'), (entity.r * store.mmPerUnit).toFixed(0));
    if (raw == null) return;
    const nextMm = Number(raw);
    if (!Number.isFinite(nextMm) || nextMm <= 0) return;
    setStore((current) => ({
      ...current,
      entities: current.entities.map((item) =>
        item.id === entity.id ? { ...entity, r: nextMm / store.mmPerUnit } : item,
      ),
    }));
  };

  const trimLine = (target: LineEntity, click: Point) => {
    const a = { x: target.x1, y: target.y1 };
    const b = { x: target.x2, y: target.y2 };
    const otherSegments: Array<[Point, Point]> = [];
    store.entities.forEach((entity) => {
      if (entity.id === target.id) return;
      if (entity.type === 'line') otherSegments.push([{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }]);
      if (entity.type === 'rect') otherSegments.push(...rectEdges(entity));
    });
    const intersections = otherSegments
      .map(([c, d]) => segmentIntersection(a, b, c, d, false))
      .filter(Boolean)
      .map((result) => result!)
      .filter((result) => result.t > 1e-4 && result.t < 1 - 1e-4)
      .sort((x, y) => x.t - y.t);

    if (!intersections.length) {
      setMessage(t('facilityMap.sketchNoTrimBoundary'));
      return;
    }

    const lengthSquared = Math.max((target.x2 - target.x1) ** 2 + (target.y2 - target.y1) ** 2, 1e-9);
    const clickT = ((click.x - target.x1) * (target.x2 - target.x1) + (click.y - target.y1) * (target.y2 - target.y1)) / lengthSquared;
    const params = [0, ...intersections.map((item) => item.t), 1];
    let interval = 0;
    for (let i = 0; i < params.length - 1; i += 1) {
      if (clickT >= params[i] && clickT <= params[i + 1]) {
        interval = i;
        break;
      }
    }
    const leftT = params[interval];
    const rightT = params[interval + 1];
    const at = (tValue: number) => ({ x: a.x + (b.x - a.x) * tValue, y: a.y + (b.y - a.y) * tValue });

    setStore((current) => {
      const without = current.entities.filter((entity) => entity.id !== target.id);
      if (leftT <= 1e-6) {
        const start = at(rightT);
        return { ...current, entities: [...without, { ...target, x1: start.x, y1: start.y }] };
      }
      if (rightT >= 1 - 1e-6) {
        const end = at(leftT);
        return { ...current, entities: [...without, { ...target, x2: end.x, y2: end.y }] };
      }
      const leftEnd = at(leftT);
      const rightStart = at(rightT);
      return {
        ...current,
        entities: [
          ...without,
          { ...target, id: makeId('sketch-line'), x2: leftEnd.x, y2: leftEnd.y },
          { ...target, id: makeId('sketch-line'), x1: rightStart.x, y1: rightStart.y },
        ],
      };
    });
    setMessage(t('facilityMap.sketchTrimApplied'));
  };

  const extendLine = (target: LineEntity, click: Point) => {
    const a = { x: target.x1, y: target.y1 };
    const b = { x: target.x2, y: target.y2 };
    const clickToStart = distance(click, a);
    const clickToEnd = distance(click, b);
    const extendStart = clickToStart < clickToEnd;

    const otherSegments: Array<[Point, Point]> = [];
    store.entities.forEach((entity) => {
      if (entity.id === target.id) return;
      if (entity.type === 'line') otherSegments.push([{ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }]);
      if (entity.type === 'rect') otherSegments.push(...rectEdges(entity));
    });

    const candidates = otherSegments
      .map(([c, d]) => segmentIntersection(a, b, c, d, true))
      .filter(Boolean)
      .map((result) => result!)
      .filter((result) => (extendStart ? result.t < -1e-4 : result.t > 1 + 1e-4))
      .sort((x, y) => (extendStart ? y.t - x.t : x.t - y.t));

    const best = candidates[0];
    if (!best) {
      setMessage(t('facilityMap.sketchNoExtendBoundary'));
      return;
    }

    setStore((current) => ({
      ...current,
      entities: current.entities.map((entity) =>
        entity.id === target.id
          ? extendStart
            ? { ...target, x1: best.point.x, y1: best.point.y }
            : { ...target, x2: best.point.x, y2: best.point.y }
          : entity,
      ),
    }));
    setMessage(t('facilityMap.sketchExtendApplied'));
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!enabled || event.button !== 0) return;
    const raw = pointFromEvent(event);
    if (!raw) return;
    const point = endpointSnap(raw);
    setPointer(point);

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      event.stopPropagation();
      if (!draft) {
        setDraft({ type: tool, start: point, current: point });
        resetDynamic();
        return;
      }
      commitDraft(point);
      return;
    }

    if (tool === 'select') {
      setSelectedId('');
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const raw = pointFromEvent(event);
    if (!raw) return;
    const next = draft?.type === 'line' ? inferLineEnd(draft.start, raw) : endpointSnap(raw);
    setPointer(next);

    if (draggingId && dragRef.current) {
      const dx = next.x - dragRef.current.start.x;
      const dy = next.y - dragRef.current.start.y;
      const source = dragRef.current.entity;
      setStore((current) => ({
        ...current,
        entities: current.entities.map((entity) => {
          if (entity.id !== draggingId) return entity;
          if (source.type === 'line') return { ...source, x1: source.x1 + dx, y1: source.y1 + dy, x2: source.x2 + dx, y2: source.y2 + dy };
          if (source.type === 'rect') return { ...source, x: source.x + dx, y: source.y + dy };
          return { ...source, cx: source.cx + dx, cy: source.cy + dy };
        }),
      }));
      return;
    }

    if (draft) {
      setDraft({ ...draft, current: next } as Draft);
      updateDynamicFromPointer(next);
    }
  };

  const handleEntityMouseDown = (event: React.MouseEvent<SVGElement>, entity: SketchEntity) => {
    if (!enabled) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.stopPropagation();

    if (tool === 'trim' && entity.type === 'line') {
      trimLine(entity, point);
      return;
    }
    if (tool === 'extend' && entity.type === 'line') {
      extendLine(entity, point);
      return;
    }
    if (tool !== 'select') return;

    setSelectedId(entity.id);
    dragRef.current = { start: point, entity: structuredClone(entity) };
    setDraggingId(entity.id);
  };

  const handleEntityMouseUp = () => {
    setDraggingId('');
    dragRef.current = null;
  };

  const draftPreview = useMemo(() => {
    if (!draft) return null;
    if (draft.type === 'line') {
      const fallbackLength = distance(draft.start, draft.current);
      const fallbackAngle = angleDeg(draft.start, draft.current);
      const lengthUnits = dynamicLocks.a ? clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackLength) : fallbackLength;
      const angle = dynamicLocks.b && Number.isFinite(Number(dynamicB)) ? Number(dynamicB) : fallbackAngle;
      const radians = degToRad(angle);
      return {
        ...draft,
        current: {
          x: draft.start.x + Math.cos(radians) * lengthUnits,
          y: draft.start.y + Math.sin(radians) * lengthUnits,
        },
      };
    }
    if (draft.type === 'rect') {
      const fallbackW = Math.abs(draft.current.x - draft.start.x);
      const fallbackH = Math.abs(draft.current.y - draft.start.y);
      const width = dynamicLocks.a ? clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackW) : fallbackW;
      const height = dynamicLocks.b ? clampPositive(Number(dynamicB) / store.mmPerUnit, fallbackH) : fallbackH;
      const signX = draft.current.x >= draft.start.x ? 1 : -1;
      const signY = draft.current.y >= draft.start.y ? 1 : -1;
      return {
        ...draft,
        current: { x: draft.start.x + signX * width, y: draft.start.y + signY * height },
      };
    }
    const fallbackRadius = distance(draft.start, draft.current);
    const radius = dynamicLocks.a ? clampPositive(Number(dynamicA) / store.mmPerUnit, fallbackRadius) : fallbackRadius;
    return { ...draft, current: { x: draft.start.x + radius, y: draft.start.y } };
  }, [draft, dynamicA, dynamicB, dynamicLocks, store.mmPerUnit]);

  const dimensionColor = '#0ea5e9';

  return (
    <div className="pointer-events-none absolute inset-0 z-[18]">
      <svg
        ref={svgRef}
        className={`absolute inset-0 h-full w-full ${enabled ? 'pointer-events-auto' : 'pointer-events-none'}`}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="none"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleEntityMouseUp}
        onMouseLeave={handleEntityMouseUp}
      >
        {store.entities.map((entity) => {
          const selected = selectedId === entity.id;
          const common = {
            stroke: entity.color,
            strokeWidth: selected ? entity.lineWidth + 0.8 : entity.lineWidth,
            vectorEffect: 'non-scaling-stroke' as const,
            fill: 'none',
            style: { cursor: enabled && tool === 'select' ? 'move' : enabled && (tool === 'trim' || tool === 'extend') ? 'crosshair' : 'default' },
            pointerEvents: enabled ? ('all' as const) : ('none' as const),
            onMouseDown: (event: React.MouseEvent<SVGElement>) => handleEntityMouseDown(event, entity),
            onMouseUp: handleEntityMouseUp,
          };

          if (entity.type === 'line') {
            const midX = (entity.x1 + entity.x2) / 2;
            const midY = (entity.y1 + entity.y2) / 2;
            const lengthMm = distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) * store.mmPerUnit;
            const angle = angleDeg({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 });
            return (
              <g key={entity.id}>
                <line x1={entity.x1} y1={entity.y1} x2={entity.x2} y2={entity.y2} {...common} />
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  fill={dimensionColor}
                  fontSize="14"
                  fontWeight="600"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents={enabled ? 'auto' : 'none'}
                  style={{ cursor: 'pointer', paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
                  onDoubleClick={(event) => { event.stopPropagation(); editLineLength(entity); }}
                >
                  {lengthMm.toFixed(0)} mm
                </text>
                <text
                  x={entity.x1 + 12}
                  y={entity.y1 - 10}
                  fill={dimensionColor}
                  fontSize="12"
                  pointerEvents={enabled ? 'auto' : 'none'}
                  style={{ cursor: 'pointer', paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
                  onDoubleClick={(event) => { event.stopPropagation(); editLineAngle(entity); }}
                >
                  ∠ {angle.toFixed(1)}°
                </text>
              </g>
            );
          }

          if (entity.type === 'rect') {
            return (
              <g key={entity.id}>
                <rect x={entity.x} y={entity.y} width={entity.w} height={entity.h} {...common} />
                <text
                  x={entity.x + entity.w / 2}
                  y={entity.y - 8}
                  textAnchor="middle"
                  fill={dimensionColor}
                  fontSize="14"
                  fontWeight="600"
                  pointerEvents={enabled ? 'auto' : 'none'}
                  style={{ cursor: 'pointer', paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
                  onDoubleClick={(event) => { event.stopPropagation(); editRectDimension(entity, 'w'); }}
                >
                  {(entity.w * store.mmPerUnit).toFixed(0)} mm
                </text>
                <text
                  x={entity.x + entity.w + 8}
                  y={entity.y + entity.h / 2}
                  fill={dimensionColor}
                  fontSize="14"
                  fontWeight="600"
                  pointerEvents={enabled ? 'auto' : 'none'}
                  style={{ cursor: 'pointer', paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
                  onDoubleClick={(event) => { event.stopPropagation(); editRectDimension(entity, 'h'); }}
                >
                  {(entity.h * store.mmPerUnit).toFixed(0)} mm
                </text>
              </g>
            );
          }

          return (
            <g key={entity.id}>
              <circle cx={entity.cx} cy={entity.cy} r={entity.r} {...common} />
              <text
                x={entity.cx + entity.r + 8}
                y={entity.cy}
                fill={dimensionColor}
                fontSize="14"
                fontWeight="600"
                pointerEvents={enabled ? 'auto' : 'none'}
                style={{ cursor: 'pointer', paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
                onDoubleClick={(event) => { event.stopPropagation(); editCircleRadius(entity); }}
              >
                R {(entity.r * store.mmPerUnit).toFixed(0)}
              </text>
            </g>
          );
        })}

        {draftPreview?.type === 'line' && (
          <line
            x1={draftPreview.start.x}
            y1={draftPreview.start.y}
            x2={draftPreview.current.x}
            y2={draftPreview.current.y}
            stroke={presets.line.color}
            strokeWidth={presets.line.lineWidth}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {draftPreview?.type === 'rect' && (
          <rect
            x={Math.min(draftPreview.start.x, draftPreview.current.x)}
            y={Math.min(draftPreview.start.y, draftPreview.current.y)}
            width={Math.abs(draftPreview.current.x - draftPreview.start.x)}
            height={Math.abs(draftPreview.current.y - draftPreview.start.y)}
            stroke={presets.rect.color}
            strokeWidth={presets.rect.lineWidth}
            strokeDasharray="6 4"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {draftPreview?.type === 'circle' && (
          <circle
            cx={draftPreview.start.x}
            cy={draftPreview.start.y}
            r={distance(draftPreview.start, draftPreview.current)}
            stroke={presets.circle.color}
            strokeWidth={presets.circle.lineWidth}
            strokeDasharray="6 4"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {enabled && draft && (
          <foreignObject x={Math.min(pointer.x + 12, canvasWidth - 230)} y={Math.min(pointer.y + 12, canvasHeight - 92)} width="220" height="88" style={{ pointerEvents: 'all' }}>
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className="rounded-lg border border-sky-400/40 bg-slate-950/95 p-2 text-[11px] text-white shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {draft.type === 'line' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchLength')}</span>
                    <input
                      value={dynamicA}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, a: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, a: true })); setDynamicA(event.target.value); }}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchAngle')}</span>
                    <input
                      value={dynamicB}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, b: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, b: true })); setDynamicB(event.target.value); }}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                </div>
              )}
              {draft.type === 'rect' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchWidth')}</span>
                    <input
                      value={dynamicA}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, a: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, a: true })); setDynamicA(event.target.value); }}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchHeight')}</span>
                    <input
                      value={dynamicB}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, b: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, b: true })); setDynamicB(event.target.value); }}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                </div>
              )}
              {draft.type === 'circle' && (
                <label>
                  <span className="mb-1 block text-slate-400">{t('facilityMap.sketchRadius')}</span>
                  <input
                    value={dynamicA}
                    onFocus={() => setDynamicLocks((value) => ({ ...value, a: true }))}
                    onChange={(event) => { setDynamicLocks((value) => ({ ...value, a: true })); setDynamicA(event.target.value); }}
                    className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                  />
                </label>
              )}
              <div className="mt-1 text-[9px] text-slate-500">{t('facilityMap.sketchDynamicHint')}</div>
            </div>
          </foreignObject>
        )}
      </svg>

      {enabled && (
        <>
          <div className="pointer-events-auto absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-sky-400/30 bg-slate-950/90 p-1.5 text-white shadow-2xl backdrop-blur">
            {([
              ['select', MousePointer2, 'facilityMap.toolSelect'],
              ['line', Minus, 'facilityMap.toolLine'],
              ['rect', Square, 'facilityMap.toolRectangle'],
              ['circle', CircleIcon, 'facilityMap.toolCircle'],
              ['trim', Scissors, 'facilityMap.sketchTrim'],
              ['extend', ArrowUpRight, 'facilityMap.sketchExtend'],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTool(id); setDraft(null); resetDynamic(); setMessage(''); }}
                className={`rounded-md p-2 ${tool === id ? 'bg-sky-500 text-white' : 'hover:bg-white/10'}`}
                title={t(label)}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-white/15" />
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
            >
              <Check className="h-4 w-4" />
              {t('facilityMap.finishSketch')}
            </button>
          </div>

          <div className="pointer-events-auto absolute right-3 top-14 w-64 rounded-xl border border-white/10 bg-slate-950/92 p-3 text-white shadow-xl backdrop-blur">
            <div className="mb-2 text-xs font-semibold">{t('facilityMap.sketchProperties')}</div>
            <label className="mb-2 flex items-center justify-between gap-2 text-[11px]">
              <span>{t('facilityMap.sketchScale')}</span>
              <input
                type="number"
                min="0.001"
                step="0.1"
                value={store.mmPerUnit}
                onChange={(event) => setStore((current) => ({ ...current, mmPerUnit: clampPositive(Number(event.target.value), current.mmPerUnit) }))}
                className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-right"
              />
            </label>

            {(tool === 'line' || tool === 'rect' || tool === 'circle') && (
              <>
                <label className="mb-2 flex items-center justify-between gap-2 text-[11px]">
                  <span>{t('facilityMap.annotationColor')}</span>
                  <input
                    type="color"
                    value={currentStyle.color}
                    onChange={(event) => updatePreset({ color: event.target.value })}
                    className="h-7 w-10 rounded border border-white/10 bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-[11px]">
                  <span>{t('facilityMap.lineWeight')}</span>
                  <select
                    value={currentStyle.lineWidth}
                    onChange={(event) => updatePreset({ lineWidth: Number(event.target.value) })}
                    className="rounded border border-white/10 bg-slate-900 px-2 py-1"
                  >
                    {[0.5, 1, 1.5, 2, 3, 4].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {selectedId && (
              <button
                type="button"
                onClick={() => {
                  setStore((current) => ({ ...current, entities: current.entities.filter((entity) => entity.id !== selectedId) }));
                  setSelectedId('');
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-400/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('facilityMap.deleteSelected')}
              </button>
            )}

            <div className="mt-3 rounded-md bg-white/5 p-2 text-[10px] text-slate-400">
              {tool === 'trim' || tool === 'extend'
                ? t('facilityMap.sketchTrimExtendHint')
                : t('facilityMap.sketchDimensionHint')}
            </div>
            {message && <div className="mt-2 text-[10px] text-amber-300">{message}</div>}
          </div>
        </>
      )}
    </div>
  );
}
