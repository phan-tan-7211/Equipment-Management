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
import {
  clientPointToSketchPoint,
  cssPixelsToSketchUnits,
} from '@/features/facility-map/sketch/core/coordinates';
import {
  findEndpointSnap,
} from '@/features/facility-map/sketch/snapping/endpointSnap';
import {
  findMidpointSnap,
} from '@/features/facility-map/sketch/snapping/midpointSnap';
import {
  findCircleCenterSnap,
} from '@/features/facility-map/sketch/snapping/circleCenterSnap';
import {
  findArcCenterSnap,
} from '@/features/facility-map/sketch/snapping/arcCenterSnap';
import {
  findLineLineIntersectionSnap,
} from '@/features/facility-map/sketch/snapping/lineIntersectionSnap';
import {
  findPolylineIntersectionSnap,
} from '@/features/facility-map/sketch/snapping/polylineIntersectionSnap';
import {
  findNearestSnap,
} from '@/features/facility-map/sketch/snapping/nearestSnap';
import {
  findGridSnap,
} from '@/features/facility-map/sketch/snapping/gridSnap';
import {
  selectSnapCandidate,
  type SnapCandidate,
} from '@/features/facility-map/sketch/snapping/snapPriority';
import { SnapIndicator } from '@/features/facility-map/sketch/rendering/SnapIndicator';
import {
  toggleSelection,
} from '@/features/facility-map/sketch/selection/selectionState';
import {
  selectEntitiesInDrag,
} from '@/features/facility-map/sketch/selection/windowSelection';
import {
  applyBasicGripDrag,
  getBasicEntityGrips,
  type BasicGrip,
} from '@/features/facility-map/sketch/selection/basicGrips';
import {
  applyHorizontalInference,
  isHorizontalInferenceCandidate,
} from '@/features/facility-map/sketch/snapping/horizontalInference';
import {
  applyVerticalInference,
  isVerticalInferenceCandidate,
} from '@/features/facility-map/sketch/snapping/verticalInference';
import {
  angleDeg,
  arcPoint,
  clampPositive,
  degToRad,
  distance,
  rectEdges,
  segmentIntersection,
  translateSketchEntity,
} from '@/features/facility-map/sketch/core/geometry';
import {
  commitLineDraft,
  getLineDynamicAngle,
  getLineDynamicLength,
  getLineKeyboardAction,
  resolveLinePreviewEnd,
  startLineDraft,
  updateLineDraft,
  type LineDraft,
} from '@/features/facility-map/sketch/commands/lineCommand';
import {
  createRectangleEntity,
  getRectangleDynamicHeight,
  getRectangleDynamicWidth,
  resolveRectangleHeight,
  resolveRectangleWidth,
  startRectangleDraft,
  updateRectangleDraft,
  type RectangleDraft,
} from '@/features/facility-map/sketch/commands/rectangleCommand';
import {
  createCircleEntity,
  getCircleDynamicRadius,
  resolveCircleRadius,
  resolveCirclePreviewPoint,
  startCircleDraft,
  updateCircleDraft,
  type CircleDraft,
} from '@/features/facility-map/sketch/commands/circleCommand';
import {
  appendPolylinePoint,
  createPolylineEntity,
  finishPolylineDraft,
  startPolylineDraft,
  updatePolylineDraft,
  type PolylineDraft,
} from '@/features/facility-map/sketch/commands/polylineCommand';
import {
  createArcEntity,
  setArcStartPoint,
  startArcDraft,
  updateArcDraft,
  type ArcDraft,
} from '@/features/facility-map/sketch/commands/arcCommand';
import {
  parseToolPresets,
  TOOL_PRESET_STORAGE_KEY,
  updateToolPreset,
  type ToolPresetMap,
} from '@/features/facility-map/sketch/persistence/toolPresets';

type Draft =
  | LineDraft
  | RectangleDraft
  | CircleDraft
  | PolylineDraft
  | ArcDraft
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

export default function InventorSketchOverlay({
  enabled,
  storageKey,
  canvasWidth,
  canvasHeight,
  t,
  onExit,
}: Props) {
  const sketchHistory = useSketchDocumentHistory(storageKey);
  const store = sketchHistory.document;
  const setStore = sketchHistory.commit;
  const [commandState, setCommandState] = useState(() => createSketchCommandState());
  const tool = commandState.tool;
  const setTool = useCallback((nextTool: SketchTool) => {
    setCommandState((current) => selectSketchTool(current, nextTool));
  }, []);
  const [presets, setPresets] = useState<ToolPresetMap>(() =>
    parseToolPresets(localStorage.getItem(TOOL_PRESET_STORAGE_KEY)),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSnap, setActiveSnap] = useState<SnapCandidate | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; current: Point } | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [dynamicA, setDynamicA] = useState('');
  const [dynamicB, setDynamicB] = useState('');
  const [dynamicLocks, setDynamicLocks] = useState<DynamicLocks>({ a: false, b: false });
  const [message, setMessage] = useState('');
  const [draggingId, setDraggingId] = useState('');
  const [activeGrip, setActiveGrip] = useState<BasicGrip | null>(null);
  const dragRef = useRef<{ start: Point; entity: SketchEntity } | null>(null);
  const gripRef = useRef<{ entity: SketchEntity; grip: BasicGrip } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setSelectedIds([]);
    setSelectionBox(null);
    setDraft(null);
    setCommandState(createSketchCommandState());
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(TOOL_PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    if (!enabled) {
      setDraft(null);
      setSelectedIds([]);
      setSelectionBox(null);
      setDraggingId('');
      setActiveGrip(null);
      gripRef.current = null;
      setCommandState(createSketchCommandState());
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setDraft(null);
        setSelectedIds([]);
        setSelectionBox(null);
        setActiveGrip(null);
        gripRef.current = null;
        sketchHistory.cancelTransaction();
        setCommandState(cancelSketchCommand());
        setMessage('');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) sketchHistory.redo();
        else sketchHistory.undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        sketchHistory.redo();
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length) {
        event.preventDefault();
        const selected = new Set(selectedIds);
        setStore((current) => ({
          ...current,
          entities: current.entities.filter((entity) => !selected.has(entity.id)),
        }));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, selectedIds, sketchHistory]);

  const currentStyle = useMemo(() => {
    if (
      tool === 'line' ||
      tool === 'polyline' ||
      tool === 'rect' ||
      tool === 'circle' ||
      tool === 'arc'
    ) {
      return presets[tool];
    }
    return presets.line;
  }, [presets, tool]);

  const pointFromEvent = useCallback((event: React.MouseEvent<SVGSVGElement | SVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    return clientPointToSketchPoint(
      event.clientX,
      event.clientY,
      svg.getBoundingClientRect(),
      canvasWidth,
      canvasHeight,
    );
  }, [canvasHeight, canvasWidth]);

  const endpointSnap = useCallback((point: Point) => {
    const svg = svgRef.current;
    if (!svg) return point;
    const rect = svg.getBoundingClientRect();
    const threshold = cssPixelsToSketchUnits(10, rect.width, canvasWidth);
    const endpoint = findEndpointSnap(point, store.entities, threshold);
    const midpoint = findMidpointSnap(point, store.entities, threshold);
    const circleCenter = findCircleCenterSnap(
      point,
      store.entities,
      threshold,
    );
    const arcCenter = findArcCenterSnap(
      point,
      store.entities,
      threshold,
    );
    const lineIntersection = findLineLineIntersectionSnap(
      point,
      store.entities,
      threshold,
    );
    const polylineIntersection = findPolylineIntersectionSnap(
      point,
      store.entities,
      threshold,
    );
    const nearest = findNearestSnap(
      point,
      store.entities,
      threshold,
    );
    const grid = findGridSnap(point, threshold);
    const best = selectSnapCandidate([
      endpoint && {
        kind: 'endpoint',
        point: endpoint.point,
        distance: endpoint.distance,
      },
      lineIntersection && {
        kind: 'intersection',
        point: lineIntersection.point,
        distance: lineIntersection.distance,
      },
      polylineIntersection && {
        kind: 'intersection',
        point: polylineIntersection.point,
        distance: polylineIntersection.distance,
      },
      midpoint && {
        kind: 'midpoint',
        point: midpoint.point,
        distance: midpoint.distance,
      },
      circleCenter && {
        kind: 'center',
        point: circleCenter.point,
        distance: circleCenter.distance,
      },
      arcCenter && {
        kind: 'center',
        point: arcCenter.point,
        distance: arcCenter.distance,
      },
      nearest && {
        kind: 'nearest',
        point: nearest.point,
        distance: nearest.distance,
      },
      grid && {
        kind: 'grid',
        point: grid.point,
        distance: grid.distance,
      },
    ]);

    setActiveSnap(best);
    return best?.point ?? point;
  }, [canvasWidth, store.entities]);

  const inferLineEnd = useCallback((start: Point, raw: Point) => {
    const snapped = endpointSnap(raw);
    if (isHorizontalInferenceCandidate(start, snapped)) {
      return applyHorizontalInference(start, snapped);
    }
    if (isVerticalInferenceCandidate(start, snapped)) {
      return applyVerticalInference(start, snapped);
    }
    return snapped;
  }, [endpointSnap]);

  const updatePreset = (patch: Partial<SketchStyle>) => {
    if (
      tool !== 'line' &&
      tool !== 'polyline' &&
      tool !== 'arc' &&
      tool !== 'rect' &&
      tool !== 'circle'
    ) {
      return;
    }
    setPresets((current) => updateToolPreset(current, tool, patch));
  };

  const resetDynamic = () => {
    setDynamicA('');
    setDynamicB('');
    setDynamicLocks({ a: false, b: false });
  };

  const updateDynamicFromPointer = (next: Point) => {
    if (!draft) return;
    if (draft.type === 'line') {
      if (!dynamicLocks.a) setDynamicA(getLineDynamicLength(draft.start, next, store));
      if (!dynamicLocks.b) setDynamicB(getLineDynamicAngle(draft.start, next));
    } else if (draft.type === 'rect') {
      if (!dynamicLocks.a) setDynamicA(getRectangleDynamicWidth(draft.start, next, store));
      if (!dynamicLocks.b) setDynamicB(getRectangleDynamicHeight(draft.start, next, store));
    } else if (draft.type === 'circle') {
      if (!dynamicLocks.a) setDynamicA(getCircleDynamicRadius(draft.start, next, store));
    }
  };

  const finishCreateInteraction = () => {
    setDraft(null);
    setCommandState((current) => endSketchInteraction(current));
    resetDynamic();
  };

  const commitLine = (currentPoint: Point) => {
    if (!draft || draft.type !== 'line') return;

    const line = commitLineDraft({
      draft,
      current: currentPoint,
      lengthInput: dynamicA,
      angleInput: dynamicB,
      document: store,
      style: presets.line,
    });

    setStore((current) => ({
      ...current,
      entities: [...current.entities, line],
    }));
    finishCreateInteraction();
  };

  const handleLineInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!draft || draft.type !== 'line') return;
    const action = getLineKeyboardAction(event.key);
    if (action === 'none') return;

    event.preventDefault();
    event.stopPropagation();

    if (action === 'confirm') {
      commitLine(pointer);
      return;
    }

    setDraft(null);
    setCommandState(cancelSketchCommand());
    resetDynamic();
    setMessage('');
  };

  const commitPolyline = (polylineDraft: PolylineDraft) => {
    const entity = createPolylineEntity({
      draft: polylineDraft,
      style: presets.polyline,
    });
    if (!entity) return false;

    setStore((current) => ({
      ...current,
      entities: [...current.entities, entity],
    }));
    finishCreateInteraction();
    return true;
  };

  const finishActivePolyline = () => {
    if (!draft || draft.type !== 'polyline') return;
    const finished = finishPolylineDraft(draft);
    if (!finished) return;
    commitPolyline(finished);
  };

  useEffect(() => {
    if (!enabled || !draft || draft.type !== 'polyline') return;

    const onPolylineKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key !== 'Enter') return;
      event.preventDefault();
      finishActivePolyline();
    };

    window.addEventListener('keydown', onPolylineKeyDown);
    return () => window.removeEventListener('keydown', onPolylineKeyDown);
  }, [draft, enabled, presets.polyline, setStore]);

  const commitArc = (arcDraft: ArcDraft) => {
    const entity = createArcEntity({
      draft: arcDraft,
      style: presets.arc,
    });
    if (!entity) return false;

    setStore((current) => ({
      ...current,
      entities: [...current.entities, entity],
    }));
    finishCreateInteraction();
    return true;
  };

  const commitDraft = (currentPoint: Point) => {
    if (!draft || draft.type === 'line' || draft.type === 'polyline' || draft.type === 'arc') return;
    const style = draft.type === 'rect' ? presets.rect : presets.circle;

    if (draft.type === 'rect') {
      const fallbackW = Math.abs(currentPoint.x - draft.start.x);
      const fallbackH = Math.abs(currentPoint.y - draft.start.y);
      const width = resolveRectangleWidth(dynamicA, fallbackW, store);
      const height = resolveRectangleHeight(dynamicB, fallbackH, store);
      const rect = createRectangleEntity({
        draft,
        current: currentPoint,
        width,
        height,
        style,
      });
      setStore((current) => ({
        ...current,
        entities: [...current.entities, rect],
      }));
    } else {
      const fallbackRadius = distance(draft.start, currentPoint);
      const radius = resolveCircleRadius(dynamicA, fallbackRadius, store);
      const circle = createCircleEntity({
        draft,
        radius,
        style,
      });
      setStore((current) => ({
        ...current,
        entities: [...current.entities, circle],
      }));
    }

    finishCreateInteraction();
  };

  const editLineLength = (entity: LineEntity) => {
    const currentValue = modelUnitsToDisplay(distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }), store);
    const raw = window.prompt(t('facilityMap.sketchEnterLength'), currentValue.toFixed(unitPrecision(store.displayUnit)));
    if (raw == null) return;
    const nextValue = Number(raw);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    const angle = Math.atan2(entity.y2 - entity.y1, entity.x2 - entity.x1);
    const units = displayToModelUnits(nextValue, store);
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
    const currentValue = modelUnitsToDisplay(axis === 'w' ? entity.w : entity.h, store);
    const raw = window.prompt(
      axis === 'w' ? t('facilityMap.sketchEnterWidth') : t('facilityMap.sketchEnterHeight'),
      currentValue.toFixed(unitPrecision(store.displayUnit)),
    );
    if (raw == null) return;
    const nextValue = Number(raw);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    const units = displayToModelUnits(nextValue, store);
    setStore((current) => ({
      ...current,
      entities: current.entities.map((item) =>
        item.id === entity.id ? { ...entity, [axis]: units } : item,
      ),
    }));
  };

  const editCircleRadius = (entity: CircleEntity) => {
    const raw = window.prompt(
      t('facilityMap.sketchEnterRadius'),
      modelUnitsToDisplay(entity.r, store).toFixed(unitPrecision(store.displayUnit)),
    );
    if (raw == null) return;
    const nextValue = Number(raw);
    if (!Number.isFinite(nextValue) || nextValue <= 0) return;
    setStore((current) => ({
      ...current,
      entities: current.entities.map((item) =>
        item.id === entity.id ? { ...entity, r: displayToModelUnits(nextValue, store) } : item,
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
      if (entity.type === 'polyline') {
        for (let index = 0; index < entity.points.length - 1; index += 1) {
          otherSegments.push([entity.points[index], entity.points[index + 1]]);
        }
        if (entity.closed && entity.points.length > 2) {
          otherSegments.push([entity.points[entity.points.length - 1], entity.points[0]]);
        }
      }
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
          { ...target, id: createSketchId('sketch-line'), x2: leftEnd.x, y2: leftEnd.y },
          { ...target, id: createSketchId('sketch-line'), x1: rightStart.x, y1: rightStart.y },
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
      if (entity.type === 'polyline') {
        for (let index = 0; index < entity.points.length - 1; index += 1) {
          otherSegments.push([entity.points[index], entity.points[index + 1]]);
        }
        if (entity.closed && entity.points.length > 2) {
          otherSegments.push([entity.points[entity.points.length - 1], entity.points[0]]);
        }
      }
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

    if (tool === 'line') {
      event.stopPropagation();
      if (!draft) {
        setDraft(startLineDraft(point));
        setCommandState((current) => beginSketchInteraction(current, 'creating'));
        resetDynamic();
        return;
      }
      commitLine(point);
      return;
    }

    if (tool === 'polyline') {
      event.stopPropagation();
      if (!draft) {
        setDraft(startPolylineDraft(point));
        setCommandState((current) => beginSketchInteraction(current, 'creating'));
        resetDynamic();
        return;
      }
      if (draft.type === 'polyline') {
        setDraft(appendPolylinePoint(draft, point));
      }
      return;
    }

    if (tool === 'arc') {
      event.stopPropagation();
      if (!draft) {
        setDraft(startArcDraft(point));
        setCommandState((current) => beginSketchInteraction(current, 'creating'));
        resetDynamic();
        return;
      }
      if (draft.type === 'arc') {
        if (!draft.start) {
          setDraft(setArcStartPoint(draft, point));
          return;
        }
        commitArc(updateArcDraft(draft, point));
      }
      return;
    }

    if (tool === 'rect') {
      event.stopPropagation();
      if (!draft) {
        setDraft(startRectangleDraft(point));
        setCommandState((current) => beginSketchInteraction(current, 'creating'));
        resetDynamic();
        return;
      }
      commitDraft(point);
      return;
    }

    if (tool === 'circle') {
      event.stopPropagation();
      if (!draft) {
        setDraft(startCircleDraft(point));
        setCommandState((current) => beginSketchInteraction(current, 'creating'));
        resetDynamic();
        return;
      }
      commitDraft(point);
      return;
    }

    if (tool === 'select') {
      setSelectedIds([]);
      setSelectionBox({ start: raw, current: raw });
      setActiveSnap(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const raw = pointFromEvent(event);
    if (!raw) return;

    if (selectionBox && tool === 'select' && !draggingId) {
      setSelectionBox((current) => current ? { ...current, current: raw } : null);
      setPointer(raw);
      setActiveSnap(null);
      return;
    }

    const next = draft?.type === 'line' ? inferLineEnd(draft.start, raw) : endpointSnap(raw);
    setPointer(next);

    if (activeGrip && gripRef.current) {
      const source = gripRef.current.entity;
      const updated = applyBasicGripDrag(source, gripRef.current.grip, next);
      sketchHistory.updateTransient((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === source.id ? updated : entity,
        ),
      }));
      return;
    }

    if (draggingId && dragRef.current) {
      const dx = next.x - dragRef.current.start.x;
      const dy = next.y - dragRef.current.start.y;
      const source = dragRef.current.entity;
      sketchHistory.updateTransient((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === draggingId ? translateSketchEntity(source, dx, dy) : entity,
        ),
      }));
      return;
    }

    if (draft) {
      setDraft(
        draft.type === 'line'
          ? updateLineDraft(draft, next)
          : draft.type === 'rect'
            ? updateRectangleDraft(draft, next)
            : draft.type === 'circle'
              ? updateCircleDraft(draft, next)
              : draft.type === 'polyline'
                ? updatePolylineDraft(draft, next)
                : updateArcDraft(draft, next),
      );
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

    if (event.ctrlKey || event.metaKey) {
      setSelectedIds((current) => toggleSelection(current, entity.id));
      return;
    }

    setSelectedIds([entity.id]);
    dragRef.current = { start: point, entity: structuredClone(entity) };
    sketchHistory.beginTransaction();
    setCommandState((current) => beginSketchInteraction(current, 'dragging'));
    setDraggingId(entity.id);
  };

  const handleEntityMouseUp = () => {
    if (draggingId || activeGrip) sketchHistory.commitTransaction();
    setDraggingId('');
    setActiveGrip(null);
    dragRef.current = null;
    gripRef.current = null;
    setCommandState((current) => endSketchInteraction(current));
  };

  const handleGripMouseDown = (
    event: React.MouseEvent<SVGCircleElement>,
    entity: SketchEntity,
    grip: BasicGrip,
  ) => {
    if (!enabled || tool !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedIds([entity.id]);
    gripRef.current = { entity: structuredClone(entity), grip };
    sketchHistory.beginTransaction();
    setCommandState((current) => beginSketchInteraction(current, 'dragging'));
    setActiveGrip(grip);
  };

  const handleCanvasMouseUp = () => {
    if (selectionBox && tool === 'select' && !draggingId) {
      setSelectedIds(
        selectEntitiesInDrag(
          store.entities,
          selectionBox.start,
          selectionBox.current,
        ),
      );
      setSelectionBox(null);
      return;
    }

    handleEntityMouseUp();
  };

  const draftPreview = useMemo(() => {
    if (!draft) return null;
    if (draft.type === 'line') {
      return {
        ...draft,
        current: resolveLinePreviewEnd({
          start: draft.start,
          current: draft.current,
          lengthInput: dynamicA,
          angleInput: dynamicB,
          lockLength: dynamicLocks.a,
          lockAngle: dynamicLocks.b,
          document: store,
        }),
      };
    }
    if (draft.type === 'rect') {
      const fallbackW = Math.abs(draft.current.x - draft.start.x);
      const fallbackH = Math.abs(draft.current.y - draft.start.y);
      const width = dynamicLocks.a ? resolveRectangleWidth(dynamicA, fallbackW, store) : fallbackW;
      const height = dynamicLocks.b ? resolveRectangleHeight(dynamicB, fallbackH, store) : fallbackH;
      const signX = draft.current.x >= draft.start.x ? 1 : -1;
      const signY = draft.current.y >= draft.start.y ? 1 : -1;
      return {
        ...draft,
        current: { x: draft.start.x + signX * width, y: draft.start.y + signY * height },
      };
    }
    if (draft.type === 'polyline' || draft.type === 'arc') {
      return draft;
    }
    return {
      ...draft,
      current: resolveCirclePreviewPoint({
        draft,
        radiusInput: dynamicA,
        lockRadius: dynamicLocks.a,
        document: store,
      }),
    };
  }, [draft, dynamicA, dynamicB, dynamicLocks, store.displayUnit, store.mmPerUnit]);

  const dimensionColor = '#0ea5e9';

  return (
    <div className="pointer-events-none absolute inset-0 z-[18]">
      <svg
        ref={svgRef}
        className={`absolute inset-0 h-full w-full ${enabled ? 'pointer-events-auto' : 'pointer-events-none'}`}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="none"
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={(event) => {
          if (tool !== 'polyline' || !draft || draft.type !== 'polyline') return;
          event.preventDefault();
          event.stopPropagation();
          finishActivePolyline();
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => {
          setActiveSnap(null);
          setSelectionBox(null);
          handleEntityMouseUp();
        }}
      >
        {store.entities.map((entity) => {
          const selected = selectedIds.includes(entity.id);
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
            const lineLength = distance({ x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 });
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
                  {formatSketchDistance(lineLength, store)}
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
                  {formatSketchDistance(entity.w, store)}
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
                  {formatSketchDistance(entity.h, store)}
                </text>
              </g>
            );
          }

          if (entity.type === 'circle') {
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
                  R {formatSketchDistance(entity.r, store)}
                </text>
              </g>
            );
          }

          if (entity.type === 'polyline') {
            return (
              <polyline
                key={entity.id}
                points={entity.points.map((point) => `${point.x},${point.y}`).join(' ')}
                {...common}
                fill="none"
              />
            );
          }

          const start = arcPoint(entity, entity.startAngleDeg);
          const end = arcPoint(entity, entity.endAngleDeg);
          const rawDelta = entity.clockwise
            ? entity.startAngleDeg - entity.endAngleDeg
            : entity.endAngleDeg - entity.startAngleDeg;
          const normalizedDelta = ((rawDelta % 360) + 360) % 360;
          const largeArcFlag = normalizedDelta > 180 ? 1 : 0;
          const sweepFlag = entity.clockwise ? 0 : 1;
          return (
            <path
              key={entity.id}
              d={`M ${start.x} ${start.y} A ${entity.r} ${entity.r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`}
              {...common}
            />
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
        {draftPreview?.type === 'polyline' && (
          <polyline
            points={[
              ...draftPreview.points,
              draftPreview.current,
            ].map((point) => `${point.x},${point.y}`).join(' ')}
            stroke={presets.polyline.color}
            strokeWidth={presets.polyline.lineWidth}
            strokeDasharray="6 4"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {draftPreview?.type === 'arc' && !draftPreview.start && (
          <line
            x1={draftPreview.center.x}
            y1={draftPreview.center.y}
            x2={draftPreview.current.x}
            y2={draftPreview.current.y}
            stroke={presets.arc.color}
            strokeWidth={presets.arc.lineWidth}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {draftPreview?.type === 'arc' && draftPreview.start && (() => {
          const radius = distance(draftPreview.center, draftPreview.start);
          const startAngle = angleDeg(draftPreview.center, draftPreview.start);
          const endAngle = angleDeg(draftPreview.center, draftPreview.current);
          const startPoint = draftPreview.start;
          const endPoint = {
            x: draftPreview.center.x + Math.cos(degToRad(endAngle)) * radius,
            y: draftPreview.center.y + Math.sin(degToRad(endAngle)) * radius,
          };
          const delta = ((endAngle - startAngle) % 360 + 360) % 360;
          const largeArcFlag = delta > 180 ? 1 : 0;
          return (
            <path
              d={`M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`}
              stroke={presets.arc.color}
              strokeWidth={presets.arc.lineWidth}
              strokeDasharray="6 4"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          );
        })()}
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

        {enabled && tool === 'select' && store.entities.flatMap((entity) => {
          if (!selectedIds.includes(entity.id)) return [];
          return getBasicEntityGrips(entity).map((grip) => (
            <circle
              key={`${entity.id}:${grip.id}`}
              cx={grip.point.x}
              cy={grip.point.y}
              r={5}
              fill="#ffffff"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              pointerEvents="all"
              style={{ cursor: 'crosshair' }}
              onMouseDown={(event) => handleGripMouseDown(event, entity, grip)}
            />
          ));
        })}

        {enabled && selectionBox && (() => {
          const x = Math.min(selectionBox.start.x, selectionBox.current.x);
          const y = Math.min(selectionBox.start.y, selectionBox.current.y);
          const width = Math.abs(selectionBox.current.x - selectionBox.start.x);
          const height = Math.abs(selectionBox.current.y - selectionBox.start.y);
          const crossing = selectionBox.current.x < selectionBox.start.x;
          return (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={crossing ? 'rgba(34,197,94,0.10)' : 'rgba(14,165,233,0.10)'}
              stroke={crossing ? '#22c55e' : '#0ea5e9'}
              strokeWidth={1}
              strokeDasharray={crossing ? '5 3' : undefined}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          );
        })()}

        {enabled && activeSnap && (
          <SnapIndicator candidate={activeSnap} />
        )}

        {enabled && draft && draft.type !== 'polyline' && draft.type !== 'arc' && (
          <foreignObject x={Math.min(pointer.x + 12, canvasWidth - 230)} y={Math.min(pointer.y + 12, canvasHeight - 92)} width="220" height="88" style={{ pointerEvents: 'all' }}>
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className="rounded-lg border border-sky-400/40 bg-slate-950/95 p-2 text-[11px] text-white shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {draft.type === 'line' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchLength')} ({store.displayUnit})</span>
                    <input
                      value={dynamicA}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, a: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, a: true })); setDynamicA(event.target.value); }}
                      onKeyDown={handleLineInputKeyDown}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchAngle')}</span>
                    <input
                      value={dynamicB}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, b: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, b: true })); setDynamicB(event.target.value); }}
                      onKeyDown={handleLineInputKeyDown}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                </div>
              )}
              {draft.type === 'rect' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchWidth')} ({store.displayUnit})</span>
                    <input
                      value={dynamicA}
                      onFocus={() => setDynamicLocks((value) => ({ ...value, a: true }))}
                      onChange={(event) => { setDynamicLocks((value) => ({ ...value, a: true })); setDynamicA(event.target.value); }}
                      className="w-full rounded border border-white/15 bg-white/10 px-1.5 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-400">{t('facilityMap.sketchHeight')} ({store.displayUnit})</span>
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
                  <span className="mb-1 block text-slate-400">{t('facilityMap.sketchRadius')} ({store.displayUnit})</span>
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
              ['polyline', Minus, 'Polyline'],
              ['arc', CircleIcon, 'Arc'],
              ['rect', Square, 'facilityMap.toolRectangle'],
              ['circle', CircleIcon, 'facilityMap.toolCircle'],
              ['trim', Scissors, 'facilityMap.sketchTrim'],
              ['extend', ArrowUpRight, 'facilityMap.sketchExtend'],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sketchHistory.cancelTransaction();
                  setTool(id);
                  setDraft(null);
                  resetDynamic();
                  setMessage('');
                }}
                className={`rounded-md p-2 ${tool === id ? 'bg-sky-500 text-white' : 'hover:bg-white/10'}`}
                title={label === 'Polyline' || label === 'Arc' ? label : t(label)}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-white/15" />
            <button
              type="button"
              onClick={sketchHistory.undo}
              disabled={!sketchHistory.canUndo}
              className="rounded-md p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              title={t('facilityMap.undo')}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={sketchHistory.redo}
              disabled={!sketchHistory.canRedo}
              className="rounded-md p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              title={t('facilityMap.redo')}
            >
              <Redo2 className="h-4 w-4" />
            </button>
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
                onChange={(event) => setStore((current) => ({ ...current, mmPerUnit: normalizeMmPerUnit(Number(event.target.value), current.mmPerUnit) }))}
                className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-right"
              />
            </label>
            <label className="mb-2 flex items-center justify-between gap-2 text-[11px]">
              <span>{t('facilityMap.sketchDisplayUnit')}</span>
              <select
                value={store.displayUnit}
                onChange={(event) => setStore((current) => ({ ...current, displayUnit: event.target.value === 'm' ? 'm' : 'mm' }))}
                className="rounded border border-white/10 bg-slate-900 px-2 py-1"
              >
                <option value="mm">mm</option>
                <option value="m">m</option>
              </select>
            </label>

            {(tool === 'line' || tool === 'polyline' || tool === 'arc' || tool === 'rect' || tool === 'circle') && (
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

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const selected = new Set(selectedIds);
                  setStore((current) => ({
                    ...current,
                    entities: current.entities.filter((entity) => !selected.has(entity.id)),
                  }));
                  setSelectedIds([]);
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
