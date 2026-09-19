import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Circle as CircleIcon,
  Copy,
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
  modelUnitsToDisplay,
  normalizeMmPerUnit,
  selectSketchTool,
  unitPrecision,
  useSketchDocumentHistory,
  type LineEntity,
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
import { DimensionRenderer } from '@/features/facility-map/sketch/rendering/DimensionRenderer';
import { ConstraintGlyphRenderer } from '@/features/facility-map/sketch/rendering/ConstraintGlyphRenderer';
import {
  getSketchViewDimensions,
  type ViewDimension,
} from '@/features/facility-map/sketch/dimensions/viewDimensions';
import {
  applyDrivingDimension,
  upsertDrivingDimension,
} from '@/features/facility-map/sketch/dimensions/drivingDimensions';
import {
  hideDimension,
  setDimensionReference,
} from '@/features/facility-map/sketch/dimensions/dimensionState';
import {
  applyCoincidentConstraint,
  applyHorizontalConstraint,
  applyVerticalConstraint,
} from '@/features/facility-map/sketch/constraints/basicConstraints';
import {
  applyConcentricConstraint,
  applyEqualConstraint,
  applyFixConstraint,
  applyMidpointConstraint,
  applyParallelConstraint,
  applyPerpendicularConstraint,
} from '@/features/facility-map/sketch/constraints/advancedConstraints';
import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';
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
  duplicateSelectedEntities,
  moveSelectedEntities,
} from '@/features/facility-map/sketch/selection/selectionTransform';
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
} from '@/features/facility-map/sketch/core/geometry';
import {
  commitExtend,
  commitTrim,
  effectiveModifyMode,
  getExtendPreview,
  getTrimPreview,
  type ModifyPreview,
} from '@/features/facility-map/sketch/modify/trimExtend';
import {
  breakLineAtPoint,
  createOffsetEntity,
} from '@/features/facility-map/sketch/modify/breakOffset';
import { mirrorSelectedEntities } from '@/features/facility-map/sketch/modify/mirror';
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
  const [selectedDimensionId, setSelectedDimensionId] = useState('');
  const [activeSnap, setActiveSnap] = useState<SnapCandidate | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; current: Point } | null>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const [pointer, setPointer] = useState<Point>({ x: 0, y: 0 });
  const [dynamicA, setDynamicA] = useState('');
  const [dynamicB, setDynamicB] = useState('');
  const [dynamicLocks, setDynamicLocks] = useState<DynamicLocks>({ a: false, b: false });
  const [message, setMessage] = useState('');
  const [modifyPreview, setModifyPreview] = useState<ModifyPreview | null>(null);
  const [draggingId, setDraggingId] = useState('');
  const [activeGrip, setActiveGrip] = useState<BasicGrip | null>(null);
  const dragRef = useRef<{ start: Point; entities: SketchEntity[] } | null>(null);
  const gripRef = useRef<{ entity: SketchEntity; grip: BasicGrip } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setSelectedIds([]);
    setSelectedDimensionId('');
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
      setSelectedDimensionId('');
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
        setSelectedDimensionId('');
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
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'd' &&
        selectedIds.length
      ) {
        event.preventDefault();
        const duplicated = duplicateSelectedEntities(
          store.entities,
          selectedIds,
          { x: 10, y: 10 },
          (entity) => createSketchId(`sketch-${entity.type}`),
        );
        setStore((current) => ({
          ...current,
          entities: [...current.entities, ...duplicated.entities],
        }));
        setSelectedIds(duplicated.ids);
        return;
      }
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedDimensionId
      ) {
        event.preventDefault();
        const selected = viewDimensions.find(
          (dimension) => dimension.id === selectedDimensionId,
        );
        if (selected) {
          setStore((current) => ({
            ...current,
            dimensions: hideDimension(
              current.dimensions,
              selected,
            ),
          }));
        }
        setSelectedDimensionId('');
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
  }, [
    enabled,
    selectedDimensionId,
    selectedIds,
    sketchHistory,
    setStore,
    store.entities,
  ]);

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
      const moved = moveSelectedEntities(
        dragRef.current.entities,
        dragRef.current.entities.map((entity) => entity.id),
        dx,
        dy,
      );
      const movedById = new Map(moved.map((entity) => [entity.id, entity]));
      sketchHistory.updateTransient((current) => ({
        ...current,
        entities: current.entities.map(
          (entity) => movedById.get(entity.id) ?? entity,
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

  const resolveModifyPreview = (
    entity: SketchEntity,
    point: Point,
    shiftKey: boolean,
  ) => {
    if (tool !== 'trim' && tool !== 'extend') return null;
    const mode = effectiveModifyMode(tool, shiftKey);
    if (mode === 'trim') {
      return getTrimPreview(store.entities, entity, point);
    }
    return entity.type === 'line'
      ? getExtendPreview(store.entities, entity, point)
      : null;
  };

  const handleEntityMouseDown = (event: React.MouseEvent<SVGElement>, entity: SketchEntity) => {
    if (!enabled) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.stopPropagation();

    if (tool === 'break') {
      if (entity.type !== 'line') {
        setMessage('Break supports Line only.');
        return;
      }
      const nextEntities = breakLineAtPoint(
        store.entities,
        entity,
        point,
        () => createSketchId('sketch-line'),
      );
      if (!nextEntities) {
        setMessage('Choose a point inside the line, not an endpoint.');
        return;
      }
      setStore((current) => ({
        ...current,
        entities: nextEntities,
      }));
      setMessage('Break applied.');
      return;
    }

    if (tool === 'offset') {
      const rawDistance = window.prompt(
        `Offset distance (${store.displayUnit})`,
        '10',
      );
      if (rawDistance == null) return;
      const displayDistance = Number(rawDistance);
      if (!Number.isFinite(displayDistance) || displayDistance <= 0) {
        setMessage('Offset distance must be greater than 0.');
        return;
      }
      const modelDistance = displayToModelUnits(
        displayDistance,
        store,
      );
      const offset = createOffsetEntity(
        entity,
        modelDistance,
        point,
        createSketchId(`sketch-${entity.type}`),
      );
      if (!offset) {
        setMessage('Offset supports Line and Polyline only.');
        return;
      }
      setStore((current) => ({
        ...current,
        entities: [...current.entities, offset],
      }));
      setSelectedIds([offset.id]);
      setMessage('Offset applied.');
      return;
    }

    if (tool === 'trim' || tool === 'extend') {
      const mode = effectiveModifyMode(tool, event.shiftKey);
      const nextEntities =
        mode === 'trim'
          ? commitTrim(
              store.entities,
              entity,
              point,
              () => createSketchId('sketch-line'),
            )
          : entity.type === 'line'
            ? commitExtend(store.entities, entity, point)
            : null;
      if (!nextEntities) {
        setMessage(
          mode === 'trim'
            ? t('facilityMap.sketchNoTrimBoundary')
            : t('facilityMap.sketchNoExtendBoundary'),
        );
        return;
      }
      setStore((current) => ({
        ...current,
        entities: nextEntities,
      }));
      setModifyPreview(null);
      setMessage(
        mode === 'trim'
          ? t('facilityMap.sketchTrimApplied')
          : t('facilityMap.sketchExtendApplied'),
      );
      return;
    }
    if (tool !== 'select') return;

    if (event.ctrlKey || event.metaKey) {
      setSelectedIds((current) => toggleSelection(current, entity.id));
      return;
    }

    const dragIds = selectedIds.includes(entity.id)
      ? selectedIds
      : [entity.id];
    setSelectedIds(dragIds);
    dragRef.current = {
      start: point,
      entities: store.entities
        .filter((item) => dragIds.includes(item.id))
        .map((item) => structuredClone(item)),
    };
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

  const editDimension = (dimension: ViewDimension) => {
    const currentDisplayValue = dimension.kind === 'angle'
      ? dimension.value
      : modelUnitsToDisplay(dimension.value, store);
    const promptLabel =
      dimension.kind === 'angle'
        ? t('facilityMap.sketchEnterAngle')
        : dimension.kind === 'radius'
          ? t('facilityMap.sketchEnterRadius')
          : dimension.kind === 'horizontal'
            ? t('facilityMap.sketchEnterWidth')
            : dimension.kind === 'vertical'
              ? t('facilityMap.sketchEnterHeight')
              : dimension.kind === 'diameter'
                ? 'Diameter'
                : t('facilityMap.sketchEnterLength');
    const raw = window.prompt(
      promptLabel,
      currentDisplayValue.toFixed(
        dimension.kind === 'angle'
          ? 1
          : unitPrecision(store.displayUnit),
      ),
    );
    if (raw == null) return;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    if (dimension.kind !== 'angle' && parsed <= 0) return;

    const nextValue = dimension.kind === 'angle'
      ? parsed
      : displayToModelUnits(parsed, store);
    const target = store.entities.find(
      (entity) => entity.id === dimension.entityId,
    );
    if (!target) return;

    const nextEntity = applyDrivingDimension(
      target,
      dimension,
      nextValue,
    );
    if (nextEntity === target) return;

    setStore((current) => ({
      ...current,
      entities: current.entities.map((entity) =>
        entity.id === target.id ? nextEntity : entity,
      ),
      dimensions: upsertDrivingDimension(
        current.dimensions,
        dimension,
        nextValue,
      ),
    }));
    setSelectedDimensionId(dimension.id);
  };

  const constraintSolve = useMemo(
    () => solveSketchConstraints(store.entities, store.constraints),
    [store.constraints, store.entities],
  );

  const viewDimensions = useMemo(() => {
    const persistedById = new Map(
      store.dimensions.map((dimension) => [dimension.id, dimension]),
    );

    return getSketchViewDimensions(store.entities).map((dimension) => {
      const persisted = persistedById.get(dimension.id);
      return {
        ...dimension,
        reference: persisted?.reference ?? false,
        driving: persisted?.driving ?? false,
        hidden: persisted?.hidden ?? false,
      };
    }).filter((dimension) => !dimension.hidden);
  }, [store.dimensions, store.entities]);

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
            style: {
              cursor:
                enabled && tool === 'select'
                  ? 'move'
                  : enabled &&
                      (tool === 'trim' ||
                        tool === 'extend' ||
                        tool === 'break' ||
                        tool === 'offset')
                    ? 'crosshair'
                    : 'default',
            },
            pointerEvents: enabled ? ('all' as const) : ('none' as const),
            onMouseDown: (event: React.MouseEvent<SVGElement>) => handleEntityMouseDown(event, entity),
            onMouseMove: (event: React.MouseEvent<SVGElement>) => {
              if (tool !== 'trim' && tool !== 'extend') return;
              const point = pointFromEvent(event);
              if (!point) return;
              setModifyPreview(
                resolveModifyPreview(entity, point, event.shiftKey),
              );
            },
            onMouseLeave: () => {
              if (tool === 'trim' || tool === 'extend') {
                setModifyPreview(null);
              }
            },
            onMouseUp: handleEntityMouseUp,
          };

          if (entity.type === 'line') {
            return (
              <line
                key={entity.id}
                x1={entity.x1}
                y1={entity.y1}
                x2={entity.x2}
                y2={entity.y2}
                {...common}
              />
            );
          }

          if (entity.type === 'rect') {
            return (
              <rect
                key={entity.id}
                x={entity.x}
                y={entity.y}
                width={entity.w}
                height={entity.h}
                {...common}
              />
            );
          }

          if (entity.type === 'circle') {
            return (
              <circle
                key={entity.id}
                cx={entity.cx}
                cy={entity.cy}
                r={entity.r}
                {...common}
              />
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

        <ConstraintGlyphRenderer
          constraints={constraintSolve.constraints}
          entities={store.entities}
        />

        <DimensionRenderer
          dimensions={viewDimensions}
          document={store}
          enabled={enabled}
          selectedId={selectedDimensionId}
          onSelect={(dimensionId) => {
            setSelectedDimensionId(dimensionId);
            setSelectedIds([]);
          }}
          onEdit={editDimension}
        />

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

        {enabled && modifyPreview && (
          <line
            x1={modifyPreview.from.x}
            y1={modifyPreview.from.y}
            x2={modifyPreview.to.x}
            y2={modifyPreview.to.y}
            stroke={modifyPreview.mode === 'trim' ? '#ef4444' : '#22c55e'}
            strokeWidth={3}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}

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
              ['break', Scissors, 'Break'],
              ['offset', Minus, 'Offset'],
            ] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sketchHistory.cancelTransaction();
                  setTool(id);
                  setDraft(null);
                  resetDynamic();
                  setModifyPreview(null);
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

            {tool === 'select' && selectedIds.length === 1 && (() => {
              const selected = store.entities.find(
                (entity) => entity.id === selectedIds[0],
              );
              if (!selected || selected.type !== 'line') return null;
              const applySingleConstraint = (
                kind: 'horizontal' | 'vertical',
              ) => {
                const id = createSketchId(`constraint-${kind}`);
                const result = kind === 'horizontal'
                  ? applyHorizontalConstraint(store.entities, selected.id, id)
                  : applyVerticalConstraint(store.entities, selected.id, id);
                if (!result) return;
                setStore((current) => ({
                  ...current,
                  entities: result.entities,
                  constraints: [
                    ...current.constraints.filter(
                      (constraint) =>
                        !(
                          constraint.kind === kind &&
                          constraint.entityIds.length === 1 &&
                          constraint.entityIds[0] === selected.id
                        ),
                    ),
                    result.constraint,
                  ],
                }));
              };
              const addFix = () => {
                const result = applyFixConstraint(
                  store.entities,
                  selected.id,
                  createSketchId('constraint-fix'),
                );
                if (!result) return;
                setStore((current) => ({
                  ...current,
                  constraints: [
                    ...current.constraints.filter(
                      (constraint) =>
                        !(
                          constraint.kind === 'fix' &&
                          constraint.entityIds[0] === selected.id
                        ),
                    ),
                    result.constraint,
                  ],
                }));
              };
              return (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applySingleConstraint('horizontal')}
                    className="rounded-md border border-violet-400/30 px-2 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => applySingleConstraint('vertical')}
                    className="rounded-md border border-violet-400/30 px-2 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                  >
                    Vertical
                  </button>
                  <button
                    type="button"
                    onClick={addFix}
                    className="col-span-2 rounded-md border border-violet-400/30 px-2 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                  >
                    Fix
                  </button>
                </div>
              );
            })()}

            {tool === 'select' && selectedIds.length === 2 && (() => {
              const lines = selectedIds
                .map((id) => store.entities.find((entity) => entity.id === id))
                .filter(
                  (entity): entity is LineEntity =>
                    Boolean(entity && entity.type === 'line'),
                );
              if (lines.length !== 2) return null;
              const applyPair = (
                kind: 'coincident' | 'parallel' | 'perpendicular' | 'equal' | 'midpoint',
              ) => {
                const id = createSketchId(`constraint-${kind}`);
                const result =
                  kind === 'coincident'
                    ? applyCoincidentConstraint(store.entities, lines[0].id, lines[1].id, id)
                    : kind === 'parallel'
                      ? applyParallelConstraint(store.entities, lines[0].id, lines[1].id, id)
                      : kind === 'perpendicular'
                        ? applyPerpendicularConstraint(store.entities, lines[0].id, lines[1].id, id)
                        : kind === 'equal'
                          ? applyEqualConstraint(store.entities, lines[0].id, lines[1].id, id)
                          : applyMidpointConstraint(store.entities, lines[0].id, lines[1].id, id);
                if (!result) return;
                setStore((current) => ({
                  ...current,
                  entities: result.entities,
                  constraints: [...current.constraints, result.constraint],
                }));
              };
              return (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(['coincident', 'parallel', 'perpendicular', 'equal', 'midpoint'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => applyPair(kind)}
                      className="rounded-md border border-violet-400/30 px-2 py-2 text-xs capitalize text-violet-300 hover:bg-violet-500/10"
                    >
                      {kind}
                    </button>
                  ))}
                </div>
              );
            })()}

            {tool === 'select' && selectedIds.length === 2 && (() => {
              const pair = selectedIds
                .map((id) => store.entities.find((entity) => entity.id === id))
                .filter(Boolean) as SketchEntity[];
              if (
                pair.length !== 2 ||
                !(
                  (pair[0].type === 'circle' || pair[0].type === 'arc') &&
                  (pair[1].type === 'circle' || pair[1].type === 'arc')
                )
              ) {
                return null;
              }
              const applyRadial = (kind: 'equal' | 'concentric') => {
                const result = kind === 'equal'
                  ? applyEqualConstraint(
                      store.entities,
                      pair[0].id,
                      pair[1].id,
                      createSketchId('constraint-equal'),
                    )
                  : applyConcentricConstraint(
                      store.entities,
                      pair[0].id,
                      pair[1].id,
                      createSketchId('constraint-concentric'),
                    );
                if (!result) return;
                setStore((current) => ({
                  ...current,
                  entities: result.entities,
                  constraints: [...current.constraints, result.constraint],
                }));
              };
              return (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyRadial('equal')}
                    className="rounded-md border border-violet-400/30 px-2 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRadial('concentric')}
                    className="rounded-md border border-violet-400/30 px-2 py-2 text-xs text-violet-300 hover:bg-violet-500/10"
                  >
                    Concentric
                  </button>
                </div>
              );
            })()}

            {tool === 'select' && selectedIds.length >= 2 && (() => {
              const axis = store.entities.find(
                (entity): entity is LineEntity =>
                  entity.id === selectedIds[0] && entity.type === 'line',
              );
              if (!axis) return null;
              return (
                <button
                  type="button"
                  onClick={() => {
                    const mirrored = mirrorSelectedEntities(
                      store.entities,
                      axis.id,
                      selectedIds.slice(1),
                      (entity) => createSketchId(`sketch-${entity.type}`),
                    );
                    if (!mirrored || !mirrored.copies.length) return;
                    setStore((current) => ({
                      ...current,
                      entities: [...current.entities, ...mirrored.copies],
                    }));
                    setSelectedIds(mirrored.ids);
                    setMessage('Mirror applied across first selected line.');
                  }}
                  className="mt-3 w-full rounded-md border border-cyan-400/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10"
                >
                  Mirror across first line
                </button>
              );
            })()}

            {selectedDimensionId && (() => {
              const persisted = store.dimensions.find(
                (dimension) => dimension.id === selectedDimensionId,
              );
              const isReference = persisted?.reference === true;
              return (
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const selected = viewDimensions.find(
                        (dimension) => dimension.id === selectedDimensionId,
                      );
                      if (!selected) return;
                      setStore((current) => ({
                        ...current,
                        dimensions: setDimensionReference(
                          current.dimensions,
                          selected,
                          !isReference,
                        ),
                      }));
                    }}
                    className="inline-flex w-full items-center justify-center rounded-md border border-amber-400/30 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10"
                  >
                    {isReference ? 'Set driving' : 'Set reference'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const selected = viewDimensions.find(
                        (dimension) => dimension.id === selectedDimensionId,
                      );
                      if (!selected) return;
                      setStore((current) => ({
                        ...current,
                        dimensions: hideDimension(
                          current.dimensions,
                          selected,
                        ),
                      }));
                      setSelectedDimensionId('');
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-400/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete dimension
                  </button>
                </div>
              );
            })()}

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const duplicated = duplicateSelectedEntities(
                    store.entities,
                    selectedIds,
                    { x: 10, y: 10 },
                    (entity) => createSketchId(`sketch-${entity.type}`),
                  );
                  setStore((current) => ({
                    ...current,
                    entities: [...current.entities, ...duplicated.entities],
                  }));
                  setSelectedIds(duplicated.ids);
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-sky-400/30 px-3 py-2 text-xs text-sky-300 hover:bg-sky-500/10"
                title="Ctrl/Cmd+D"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy selected
              </button>
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

            <div className="mt-3 rounded-md border border-violet-400/20 bg-violet-500/5 p-2 text-[10px] text-violet-200">
              Constraints: {constraintSolve.status}
              {constraintSolve.status !== 'conflict' && (
                <> · {constraintSolve.converged ? 'converged' : 'iteration limit'}</>
              )}
            </div>

            <div className="mt-3 rounded-md bg-white/5 p-2 text-[10px] text-slate-400">
              {tool === 'trim' || tool === 'extend'
                ? t('facilityMap.sketchTrimExtendHint')
                : tool === 'break'
                  ? 'Click a line to split it at the clicked position.'
                  : tool === 'offset'
                    ? 'Click a line/polyline, then enter offset distance.'
                    : t('facilityMap.sketchDimensionHint')}
            </div>
            {message && <div className="mt-2 text-[10px] text-amber-300">{message}</div>}
          </div>
        </>
      )}
    </div>
  );
}
