import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Circle,
  Eye,
  Focus,
  ImagePlus,
  Layers3,
  ListFilter,
  MapPin,
  Minus,
  MousePointer2,
  Maximize2,
  Minimize2,
  Move,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Square,
  Trash2,
  Type,
  Undo2,
  Ruler,
  Eraser,
  Wrench,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useI18n } from '@/i18n';

type EquipmentRow = {
  id: string;
  name: string | null;
  status: string | null;
};

const DEMO_EQUIPMENT: EquipmentRow[] = [
  { id: 'CEV-CNC-001', name: 'CNC Machine 01', status: 'Active' },
  { id: 'CEV-CNC-002', name: 'CNC Machine 02', status: 'Active' },
  { id: 'CEV-PRS-003', name: 'Press Machine 03', status: 'Maintenance' },
  { id: 'CEV-CMP-002', name: 'Air Compressor 02', status: 'Active' },
  { id: 'CEV-INJ-004', name: 'Injection Machine 04', status: 'Inactive' },
  { id: 'CEV-OLD-009', name: 'Legacy Tester 09', status: 'Retired' },
];

const DEMO_BUILDINGS = ['Main Building', 'Warehouse Building'];
const DEMO_FLOORS = ['Floor 1', 'Floor 2', 'Roof'];

type EquipmentPin = {
  equipmentId: string;
  x: number;
  y: number;
};

type LayerId = 'fire' | 'tornado' | 'flood' | 'emergency' | 'utility';
type ZoneType =
  | 'production'
  | 'storage'
  | 'utility'
  | 'restricted'
  | 'hazard'
  | 'emergency'
  | 'office'
  | 'custom';

type OverlayPin = {
  id: string;
  layer: LayerId;
  x: number;
  y: number;
};

type Zone = {
  id: string;
  type: ZoneType;
  x: number;
  y: number;
  w: number;
  h: number;
};

type DrawTool = 'select' | 'pan' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'ruler' | 'erase';
type Annotation = {
  id: string;
  type: Exclude<DrawTool, 'select' | 'pan' | 'erase'>;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text?: string;
};

type FloorPlanState = {
  name: string;
  building: string;
  floor: string;
  imageDataUrl: string;
  pins: EquipmentPin[];
  overlayPins: OverlayPin[];
  zones: Zone[];
  annotations: Annotation[];
};

const STORAGE_KEY = 'znteqr:facility-floor-plan:dryrun:v3';

const LAYERS: Array<{ id: 'assets' | LayerId; labelKey: string; color: string; emoji: string }> = [
  { id: 'assets', labelKey: 'facilityMap.assets', color: '#10b981', emoji: '🔧' },
  { id: 'fire', labelKey: 'facilityMap.fire', color: '#ef4444', emoji: '🔥' },
  { id: 'tornado', labelKey: 'facilityMap.tornado', color: '#f59e0b', emoji: '🌪️' },
  { id: 'flood', labelKey: 'facilityMap.flood', color: '#3b82f6', emoji: '💧' },
  { id: 'emergency', labelKey: 'facilityMap.exits', color: '#22d3ee', emoji: '🚪' },
  { id: 'utility', labelKey: 'facilityMap.utility', color: '#a78bfa', emoji: '⚡' },
];

const ZONES: Array<{ id: ZoneType; labelKey: string; color: string; emoji: string }> = [
  { id: 'production', labelKey: 'facilityMap.production', color: '#3b82f6', emoji: '🏭' },
  { id: 'storage', labelKey: 'facilityMap.storage', color: '#8b5cf6', emoji: '📦' },
  { id: 'utility', labelKey: 'facilityMap.utility', color: '#06b6d4', emoji: '⚡' },
  { id: 'restricted', labelKey: 'facilityMap.restricted', color: '#ef4444', emoji: '⛔' },
  { id: 'hazard', labelKey: 'facilityMap.hazard', color: '#f97316', emoji: '☢️' },
  { id: 'emergency', labelKey: 'facilityMap.emergency', color: '#22c55e', emoji: '🚨' },
  { id: 'office', labelKey: 'facilityMap.office', color: '#64748b', emoji: '🏢' },
  { id: 'custom', labelKey: 'facilityMap.custom', color: '#a855f7', emoji: '📎' },
];

const statusColor = (status?: string | null) => {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
      return '#22c55e';
    case 'maintenance':
    case 'maintenance needed':
      return '#eab308';
    case 'inactive':
      return '#94a3b8';
    case 'retired':
      return '#ef4444';
    default:
      return '#38bdf8';
  }
};

const statusTranslationKey = (status?: string | null) => {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
      return 'facilityMap.statusActive';
    case 'maintenance':
    case 'maintenance needed':
      return 'facilityMap.statusMaintenance';
    case 'inactive':
      return 'facilityMap.statusInactive';
    case 'retired':
      return 'facilityMap.statusRetired';
    default:
      return 'facilityMap.statusUnknown';
  }
};

const EMPTY_PLAN: FloorPlanState = {
  name: 'Plant 1 - Main Facility',
  building: 'Main Building',
  floor: 'Floor 1',
  imageDataUrl: '',
  pins: [
    { equipmentId: 'CEV-CNC-001', x: 24, y: 29 },
    { equipmentId: 'CEV-CNC-002', x: 39, y: 31 },
    { equipmentId: 'CEV-PRS-003', x: 67, y: 32 },
    { equipmentId: 'CEV-CMP-002', x: 20, y: 71 },
    { equipmentId: 'CEV-INJ-004', x: 76, y: 70 },
  ],
  overlayPins: [
    { id: 'fire-demo-1', layer: 'fire', x: 51, y: 22 },
    { id: 'exit-demo-1', layer: 'emergency', x: 88, y: 52 },
    { id: 'utility-demo-1', layer: 'utility', x: 36, y: 78 },
  ],
  zones: [
    { id: 'zone-prod', type: 'production', x: 11, y: 14, w: 36, h: 29 },
    { id: 'zone-storage', type: 'storage', x: 57, y: 14, w: 31, h: 29 },
    { id: 'zone-utility', type: 'utility', x: 11, y: 58, w: 28, h: 25 },
    { id: 'zone-hazard', type: 'hazard', x: 56, y: 57, w: 33, h: 26 },
  ],
  annotations: [
    { id: 'route-demo', type: 'arrow', x1: 18, y1: 50, x2: 46, y2: 50 },
    { id: 'note-demo', type: 'text', x1: 71, y1: 50, x2: 71, y2: 50, text: 'QA HOLD' },
  ],
};

const demoLayoutFor = (building: string, floor: string): FloorPlanState => {
  const base = clonePlan(EMPTY_PLAN);
  base.building = building;
  base.floor = floor;
  base.imageDataUrl = '';

  if (building === 'Warehouse Building') {
    base.pins = [
      { equipmentId: 'CEV-CMP-002', x: 23, y: 28 },
      { equipmentId: 'CEV-INJ-004', x: 70, y: 31 },
      { equipmentId: 'CEV-OLD-009', x: 64, y: 70 },
    ];
    base.overlayPins = [
      { id: 'wh-exit', layer: 'emergency', x: 90, y: 48 },
      { id: 'wh-fire', layer: 'fire', x: 48, y: 18 },
    ];
    base.zones = [
      { id: 'wh-storage', type: 'storage', x: 10, y: 12, w: 42, h: 33 },
      { id: 'wh-qa', type: 'restricted', x: 57, y: 56, w: 31, h: 24 },
    ];
    base.annotations = [
      { id: 'wh-flow', type: 'arrow', x1: 18, y1: 52, x2: 82, y2: 52 },
      { id: 'wh-note', type: 'text', x1: 60, y1: 50, x2: 60, y2: 50, text: 'QA' },
    ];
    return base;
  }

  if (floor === 'Floor 2') {
    base.pins = [
      { equipmentId: 'CEV-CNC-001', x: 28, y: 34 },
      { equipmentId: 'CEV-PRS-003', x: 61, y: 35 },
      { equipmentId: 'CEV-OLD-009', x: 72, y: 69 },
    ];
    base.overlayPins = [
      { id: 'f2-fire', layer: 'fire', x: 51, y: 22 },
      { id: 'f2-exit', layer: 'emergency', x: 88, y: 50 },
    ];
    base.zones = [
      { id: 'f2-production', type: 'production', x: 13, y: 15, w: 36, h: 31 },
      { id: 'f2-office', type: 'office', x: 57, y: 14, w: 30, h: 25 },
      { id: 'f2-restricted', type: 'restricted', x: 58, y: 58, w: 29, h: 23 },
    ];
    base.annotations = [
      { id: 'f2-route', type: 'line', x1: 20, y1: 53, x2: 80, y2: 53 },
    ];
    return base;
  }

  if (floor === 'Roof') {
    base.pins = [
      { equipmentId: 'CEV-CMP-002', x: 25, y: 34 },
      { equipmentId: 'CEV-INJ-004', x: 68, y: 34 },
    ];
    base.overlayPins = [
      { id: 'roof-utility', layer: 'utility', x: 44, y: 70 },
      { id: 'roof-flood', layer: 'flood', x: 76, y: 68 },
    ];
    base.zones = [
      { id: 'roof-utility-zone', type: 'utility', x: 12, y: 17, w: 35, h: 29 },
      { id: 'roof-hazard-zone', type: 'hazard', x: 56, y: 17, w: 31, h: 29 },
    ];
    base.annotations = [
      { id: 'roof-note', type: 'text', x1: 44, y1: 52, x2: 44, y2: 52, text: 'HVAC / MEP' },
    ];
    return base;
  }

  return base;
};

const ensurePlanShape = (value: Partial<FloorPlanState>): FloorPlanState => ({
  ...EMPTY_PLAN,
  ...value,
  pins: value.pins ?? [],
  overlayPins: value.overlayPins ?? [],
  zones: value.zones ?? [],
  annotations: value.annotations ?? [],
});

const clonePlan = (plan: FloorPlanState): FloorPlanState =>
  JSON.parse(JSON.stringify(plan)) as FloorPlanState;

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function DemoBlueprint({ t }: { t: (key: string) => string }) {
  return (
    <svg
      viewBox="0 0 1200 760"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-label={t('facilityMap.demoPlanAria')}
    >
      <rect width="1200" height="760" fill="#f8fafc" />
      <g stroke="#94a3b8" strokeWidth="2" fill="none">
        <rect x="85" y="75" width="1030" height="610" />
        <path d="M85 365H1115M530 75V365M650 365V685" />
        <rect x="115" y="115" width="365" height="205" />
        <rect x="575" y="115" width="490" height="205" />
        <rect x="115" y="410" width="260" height="220" />
        <rect x="435" y="410" width="630" height="220" />
      </g>
      <g fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5">
        <rect x="160" y="165" width="105" height="62" rx="6" />
        <rect x="315" y="165" width="105" height="62" rx="6" />
        <rect x="625" y="165" width="130" height="66" rx="6" />
        <rect x="810" y="165" width="130" height="66" rx="6" />
        <rect x="155" y="470" width="165" height="84" rx="6" />
        <rect x="505" y="470" width="150" height="84" rx="6" />
        <rect x="710" y="470" width="150" height="84" rx="6" />
        <rect x="900" y="470" width="115" height="84" rx="6" />
      </g>
      <g fill="#334155" fontFamily="system-ui, sans-serif" fontWeight="700">
        <text x="120" y="105" fontSize="20">{t('facilityMap.lineMachining')}</text>
        <text x="575" y="105" fontSize="20">{t('facilityMap.linePressAssembly')}</text>
        <text x="120" y="400" fontSize="20">{t('facilityMap.utility')}</text>
        <text x="440" y="400" fontSize="20">{t('facilityMap.warehouseQa')}</text>
      </g>
      <g fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="14">
        <text x="160" y="270">{t('facilityMap.cncMilling')}</text>
        <text x="625" y="270">{t('facilityMap.pressAssembly')}</text>
        <text x="155" y="590">{t('facilityMap.compressorUtility')}</text>
        <text x="505" y="590">{t('facilityMap.storageInspection')}</text>
      </g>
    </svg>
  );
}

export default function FacilityFloorPlan() {
  const { t } = useI18n();
  const [plan, setPlan] = useState<FloorPlanState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? ensurePlanShape(JSON.parse(raw) as Partial<FloorPlanState>) : EMPTY_PLAN;
    } catch {
      return EMPTY_PLAN;
    }
  });
  const [equipment] = useState<EquipmentRow[]>(DEMO_EQUIPMENT);
  const [query, setQuery] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState('');
  const [activeLayer, setActiveLayer] = useState<'all' | 'assets' | LayerId>('all');
  const [placeLayer, setPlaceLayer] = useState<LayerId | null>(null);
  const [zoneTool, setZoneTool] = useState<ZoneType | null>(null);
  const [drawTool, setDrawTool] = useState<DrawTool>('select');
  const [annotationText, setAnnotationText] = useState('NOTE');
  const [editMode, setEditMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [draggingZoneId, setDraggingZoneId] = useState('');
  const [resizingZoneId, setResizingZoneId] = useState('');
  const [draggingEquipmentId, setDraggingEquipmentId] = useState('');
  const [draggingOverlayId, setDraggingOverlayId] = useState('');
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
  const [draftZone, setDraftZone] = useState<Zone | null>(null);
  const [draftAnnotation, setDraftAnnotation] = useState<Annotation | null>(null);
  const [undoStack, setUndoStack] = useState<FloorPlanState[]>([]);
  const [redoStack, setRedoStack] = useState<FloorPlanState[]>([]);
  const pointerStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragStartPlanRef = useRef<FloorPlanState | null>(null);
  const annotationStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoneInteractionRef = useRef<{ startX: number; startY: number; zone: Zone } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const savePlan = useCallback((next: FloorPlanState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const commitPlan = useCallback((updater: (current: FloorPlanState) => FloorPlanState) => {
    setPlan((current) => {
      const next = updater(current);
      setUndoStack((stack) => [...stack.slice(-29), clonePlan(current)]);
      setRedoStack([]);
      savePlan(next);
      return next;
    });
  }, [savePlan]);

  const undo = () => {
    setUndoStack((stack) => {
      const previous = stack[stack.length - 1];
      if (!previous) return stack;
      setPlan((current) => {
        setRedoStack((redo) => [...redo.slice(-29), clonePlan(current)]);
        savePlan(previous);
        return clonePlan(previous);
      });
      return stack.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((stack) => {
      const next = stack[stack.length - 1];
      if (!next) return stack;
      setPlan((current) => {
        setUndoStack((undoHistory) => [...undoHistory.slice(-29), clonePlan(current)]);
        savePlan(next);
        return clonePlan(next);
      });
      return stack.slice(0, -1);
    });
  };

  const filteredEquipment = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return equipment.filter((item) => {
      if (!needle) return true;
      return `${item.name ?? ''} ${item.id} ${item.status ?? ''}`.toLowerCase().includes(needle);
    });
  }, [equipment, query]);

  const equipmentById = useMemo(
    () => new Map(equipment.map((item) => [item.id, item])),
    [equipment],
  );

  const selectedEquipment = useMemo(() => {
    if (!selectedMarkerId.startsWith('asset:')) return null;
    return equipmentById.get(selectedMarkerId.slice('asset:'.length)) ?? null;
  }, [equipmentById, selectedMarkerId]);

  const unplacedEquipment = useMemo(
    () => filteredEquipment.filter((item) => !plan.pins.some((pin) => pin.equipmentId === item.id)),
    [filteredEquipment, plan.pins],
  );

  const layerById = useMemo(() => new Map(LAYERS.map((layer) => [layer.id, layer])), []);
  const zoneById = useMemo(() => new Map(ZONES.map((zone) => [zone.id, zone])), []);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const localX = (clientX - rect.left - pan.x) / zoom;
    const localY = (clientY - rect.top - pan.y) / zoom;
    return {
      x: Math.max(0, Math.min(100, (localX / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (localY / rect.height) * 100)),
    };
  }, [pan.x, pan.y, zoom]);

  const placeAt = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || draggingEquipmentId || draggingOverlayId || isPanning || zoneStart) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;

    if (selectedEquipmentId) {
      commitPlan((current) => ({
        ...current,
        pins: [
          ...current.pins.filter((pin) => pin.equipmentId !== selectedEquipmentId),
          { equipmentId: selectedEquipmentId, ...point },
        ],
      }));
      setSelectedMarkerId(`asset:${selectedEquipmentId}`);
      setSelectedEquipmentId('');
      return;
    }

    if (placeLayer) {
      const id = makeId(placeLayer);
      commitPlan((current) => ({
        ...current,
        overlayPins: [...current.overlayPins, { id, layer: placeLayer, ...point }],
      }));
      setSelectedMarkerId(`overlay:${id}`);
    }
  }, [
    commitPlan,
    draggingEquipmentId,
    draggingOverlayId,
    editMode,
    isPanning,
    placeLayer,
    selectedEquipmentId,
    toPercent,
    zoneStart,
  ]);

  const startPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1 || event.shiftKey || (editMode && drawTool === 'pan')) {
      event.preventDefault();
      pointerStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
      return;
    }

    if (!editMode || event.button !== 0) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;

    if (['line', 'arrow', 'rect', 'circle', 'ruler'].includes(drawTool)) {
      event.preventDefault();
      annotationStartRef.current = point;
      setDraftAnnotation({
        id: 'draft-annotation',
        type: drawTool as Annotation['type'],
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
      });
      return;
    }

    if (drawTool === 'text') {
      event.preventDefault();
      commitPlan((current) => ({
        ...current,
        annotations: [
          ...current.annotations,
          {
            id: makeId('text'),
            type: 'text',
            x1: point.x,
            y1: point.y,
            x2: point.x,
            y2: point.y,
            text: annotationText || t('facilityMap.defaultNote'),
          },
        ],
      }));
      return;
    }

    if (!zoneTool) return;
    event.preventDefault();
    setZoneStart(point);
    setDraftZone({
      id: 'draft',
      type: zoneTool,
      x: point.x,
      y: point.y,
      w: 0,
      h: 0,
    });
  };

  const onPointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const start = pointerStart.current;
      setPan({
        x: start.panX + (event.clientX - start.x),
        y: start.panY + (event.clientY - start.y),
      });
      return;
    }

    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;

    if (draftAnnotation && annotationStartRef.current && editMode) {
      setDraftAnnotation((current) => current ? { ...current, x2: point.x, y2: point.y } : current);
      return;
    }

    if (zoneStart && zoneTool && editMode) {
      setDraftZone({
        id: 'draft',
        type: zoneTool,
        x: Math.min(zoneStart.x, point.x),
        y: Math.min(zoneStart.y, point.y),
        w: Math.abs(point.x - zoneStart.x),
        h: Math.abs(point.y - zoneStart.y),
      });
      return;
    }

    if (draggingZoneId && zoneInteractionRef.current && editMode) {
      const start = zoneInteractionRef.current;
      const dx = point.x - start.startX;
      const dy = point.y - start.startY;
      setPlan((current) => ({
        ...current,
        zones: current.zones.map((zone) =>
          zone.id === draggingZoneId
            ? {
                ...zone,
                x: Math.max(0, Math.min(100 - zone.w, start.zone.x + dx)),
                y: Math.max(0, Math.min(100 - zone.h, start.zone.y + dy)),
              }
            : zone,
        ),
      }));
      return;
    }

    if (resizingZoneId && zoneInteractionRef.current && editMode) {
      const start = zoneInteractionRef.current;
      const dx = point.x - start.startX;
      const dy = point.y - start.startY;
      setPlan((current) => ({
        ...current,
        zones: current.zones.map((zone) =>
          zone.id === resizingZoneId
            ? {
                ...zone,
                w: Math.max(3, Math.min(100 - zone.x, start.zone.w + dx)),
                h: Math.max(3, Math.min(100 - zone.y, start.zone.h + dy)),
              }
            : zone,
        ),
      }));
      return;
    }

    if (draggingEquipmentId && editMode) {
      setPlan((current) => ({
        ...current,
        pins: current.pins.map((pin) =>
          pin.equipmentId === draggingEquipmentId ? { ...pin, ...point } : pin,
        ),
      }));
      return;
    }

    if (draggingOverlayId && editMode) {
      setPlan((current) => ({
        ...current,
        overlayPins: current.overlayPins.map((pin) =>
          pin.id === draggingOverlayId ? { ...pin, ...point } : pin,
        ),
      }));
    }
  };

  const endPointerInteraction = () => {
    if (draftAnnotation) {
      const dx = Math.abs(draftAnnotation.x2 - draftAnnotation.x1);
      const dy = Math.abs(draftAnnotation.y2 - draftAnnotation.y1);
      if (dx > 0.3 || dy > 0.3) {
        commitPlan((current) => ({
          ...current,
          annotations: [...current.annotations, { ...draftAnnotation, id: makeId('annotation') }],
        }));
      }
    } else if (draftZone && draftZone.w > 0.5 && draftZone.h > 0.5) {
      commitPlan((current) => ({
        ...current,
        zones: [...current.zones, { ...draftZone, id: makeId('zone') }],
      }));
    } else if ((draggingEquipmentId || draggingOverlayId || draggingZoneId || resizingZoneId) && dragStartPlanRef.current) {
      const before = dragStartPlanRef.current;
      setUndoStack((stack) => [...stack.slice(-29), clonePlan(before)]);
      setRedoStack([]);
      setPlan((current) => {
        savePlan(current);
        return current;
      });
    }

    dragStartPlanRef.current = null;
    annotationStartRef.current = null;
    setDraftAnnotation(null);
    setZoneStart(null);
    setDraftZone(null);
    setDraggingEquipmentId('');
    setDraggingOverlayId('');
    setDraggingZoneId('');
    setResizingZoneId('');
    zoneInteractionRef.current = null;
    setIsPanning(false);
  };

  const uploadPlan = (file?: File) => {
    if (!file || !editMode) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageDataUrl) return;
      commitPlan((current) => ({ ...current, imageDataUrl }));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const fitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const switchDemoLocation = (building: string, floor: string) => {
    const next = demoLayoutFor(building, floor);
    setUndoStack((stack) => [...stack.slice(-29), clonePlan(plan)]);
    setRedoStack([]);
    setPlan(next);
    savePlan(next);
    setSelectedMarkerId('');
    setSelectedEquipmentId('');
    setPlaceLayer(null);
    setZoneTool(null);
    setDrawTool('select');
    fitView();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX = (pointerX - pan.x) / zoom;
    const worldY = (pointerY - pan.y) / zoom;
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.max(0.5, Math.min(3, zoom * factor));
    setZoom(nextZoom);
    setPan({
      x: pointerX - worldX * nextZoom,
      y: pointerY - worldY * nextZoom,
    });
  };

  const deleteSelected = () => {
    if (!selectedMarkerId || !editMode) return;
    if (selectedMarkerId.startsWith('asset:')) {
      const id = selectedMarkerId.slice('asset:'.length);
      commitPlan((current) => ({
        ...current,
        pins: current.pins.filter((pin) => pin.equipmentId !== id),
      }));
    } else if (selectedMarkerId.startsWith('overlay:')) {
      const id = selectedMarkerId.slice('overlay:'.length);
      commitPlan((current) => ({
        ...current,
        overlayPins: current.overlayPins.filter((pin) => pin.id !== id),
      }));
    } else if (selectedMarkerId.startsWith('zone:')) {
      const id = selectedMarkerId.slice('zone:'.length);
      commitPlan((current) => ({
        ...current,
        zones: current.zones.filter((zone) => zone.id !== id),
      }));
    }
    setSelectedMarkerId('');
  };

  const switchMode = (nextEditMode: boolean) => {
    setEditMode(nextEditMode);
    setSelectedEquipmentId('');
    setPlaceLayer(null);
    setZoneTool(null);
    setZoneStart(null);
    setDraftZone(null);
    setDrawTool('select');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') {
        setSelectedEquipmentId('');
        setSelectedMarkerId('');
        setPlaceLayer(null);
        setZoneTool(null);
        setDrawTool('select');
        setDraftZone(null);
        setDraftAnnotation(null);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        fitView();
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedMarkerId && editMode) {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const visibleAssetPins = activeLayer === 'all' || activeLayer === 'assets';
  const visibleOverlayPins =
    activeLayer === 'all'
      ? plan.overlayPins
      : activeLayer === 'assets'
        ? []
        : plan.overlayPins.filter((pin) => pin.layer === activeLayer);

  const placementHint = selectedEquipmentId
    ? t('facilityMap.clickPlaceEquipment')
    : placeLayer
      ? t('facilityMap.clickPlaceMarker', { name: t(layerById.get(placeLayer)?.labelKey ?? 'facilityMap.utility') })
      : zoneTool
        ? t('facilityMap.dragDrawZone', { name: t(zoneById.get(zoneTool)?.labelKey ?? 'facilityMap.custom') })
        : '';

  return (
    <div className={`flex min-h-full flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-[100] h-screen' : ''}`}>
      <div className="border-b bg-card px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{t('facilityMap.title')}</h1>
              <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t('facilityMap.prototypeBadge')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t('facilityMap.subtitle')}</p>
          </div>

          <div className="flex items-center rounded-md border bg-background p-1">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${!editMode ? 'bg-foreground text-background' : 'hover:bg-accent'}`}
            >
              <Eye className="h-3.5 w-3.5" />
              {t('facilityMap.viewMode')}
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs ${editMode ? 'bg-foreground text-background' : 'hover:bg-accent'}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('facilityMap.editMode')}
            </button>
          </div>

          <button
            type="button"
            onClick={undo}
            disabled={!undoStack.length}
            className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-40"
            title={t('facilityMap.undo')}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!redoStack.length}
            className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-40"
            title={t('facilityMap.redo')}
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {editMode && (
            <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              {([
                ['select', MousePointer2, 'facilityMap.toolSelect'],
                ['pan', Move, 'facilityMap.toolPan'],
                ['line', Minus, 'facilityMap.toolLine'],
                ['arrow', ArrowRight, 'facilityMap.toolArrow'],
                ['rect', Square, 'facilityMap.toolRectangle'],
                ['circle', Circle, 'facilityMap.toolCircle'],
                ['text', Type, 'facilityMap.toolText'],
                ['ruler', Ruler, 'facilityMap.toolRuler'],
                ['erase', Eraser, 'facilityMap.toolErase'],
              ] as const).map(([tool, Icon, key]) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => {
                    setDrawTool(tool);
                    setPlaceLayer(null);
                    setZoneTool(null);
                    setSelectedEquipmentId('');
                  }}
                  className={`rounded p-1.5 ${drawTool === tool ? 'bg-foreground text-background' : 'hover:bg-accent'}`}
                  title={t(key)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          {editMode && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
              <ImagePlus className="h-4 w-4" />
              {t('facilityMap.uploadPlan')}
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => uploadPlan(event.target.files?.[0])}
              />
            </label>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => savePlan(plan)}
          >
            <Save className="h-4 w-4" />
            {t('facilityMap.save')}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLegend((value) => !value)}
            className="mr-1 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs"
          >
            <ListFilter className="h-3.5 w-3.5" />
            {t('facilityMap.legend')}
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('all')}
            className={`rounded-full border px-3 py-1.5 text-xs ${activeLayer === 'all' ? 'bg-foreground text-background' : 'bg-background'}`}
          >
            {t('facilityMap.all')}
          </button>
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${activeLayer === layer.id ? 'ring-2 ring-ring' : ''}`}
              style={{ borderColor: layer.color, color: layer.color }}
            >
              {layer.emoji} {t(layer.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid min-h-0 flex-1 grid-cols-1 ${editMode ? 'lg:grid-cols-[300px_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
        {editMode && (
          <aside className="border-r bg-card p-3">
            <div className="mb-2 text-xs font-semibold">{t('facilityMap.location')}</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <select
                value={plan.building}
                onChange={(event) => switchDemoLocation(event.target.value, plan.floor)}
                className="rounded-md border bg-background px-2 py-2 text-xs"
                aria-label={t('facilityMap.building')}
              >
                {DEMO_BUILDINGS.map((building) => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
              <select
                value={plan.floor}
                onChange={(event) => switchDemoLocation(plan.building, event.target.value)}
                className="rounded-md border bg-background px-2 py-2 text-xs"
                aria-label={t('facilityMap.floor')}
              >
                {DEMO_FLOORS.map((floor) => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            <div className="mb-2 text-xs font-semibold">{t('facilityMap.placeEquipment')}</div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('facilityMap.searchEquipment')}
                className="w-full rounded-md border bg-background py-2 pl-8 pr-2 text-sm"
              />
            </div>

            <div className="max-h-48 space-y-1 overflow-auto pr-1">
              {unplacedEquipment.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedEquipmentId(item.id);
                    setPlaceLayer(null);
                    setZoneTool(null);
                    setDrawTool('select');
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left transition hover:bg-accent ${
                    selectedEquipmentId === item.id ? 'border-primary bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColor(item.status) }}
                    />
                    <span className="truncate text-sm font-medium">{item.name || item.id}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-semibold">{t('facilityMap.safetyUtilityMarkers')}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {LAYERS.filter((layer) => layer.id !== 'assets').map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => {
                      setPlaceLayer(layer.id as LayerId);
                      setSelectedEquipmentId('');
                      setZoneTool(null);
                    }}
                    className={`rounded-md border px-2 py-2 text-xs ${
                      placeLayer === layer.id ? 'ring-2 ring-ring' : ''
                    }`}
                    style={{ borderColor: layer.color, color: layer.color }}
                  >
                    {layer.emoji} {t(layer.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-semibold">{t('facilityMap.drawingTools')}</div>
              <div className="rounded-md border bg-muted/30 p-2 text-[11px] text-muted-foreground">
                {t('facilityMap.drawingHint')}
              </div>
              {drawTool === 'text' && (
                <input
                  value={annotationText}
                  onChange={(event) => setAnnotationText(event.target.value)}
                  className="mt-2 w-full rounded-md border bg-background px-2 py-2 text-xs"
                  placeholder={t('facilityMap.textPlaceholder')}
                />
              )}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-semibold">{t('facilityMap.drawZones')}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setZoneTool(zone.id);
                      setSelectedEquipmentId('');
                      setPlaceLayer(null);
                      setDrawTool('select');
                    }}
                    className={`rounded-md border px-2 py-2 text-xs ${
                      zoneTool === zone.id ? 'ring-2 ring-ring' : ''
                    }`}
                    style={{ borderColor: zone.color, color: zone.color }}
                  >
                    {zone.emoji} {t(zone.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {placementHint && (
              <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-2 text-xs">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {placementHint}
              </div>
            )}

            {selectedMarkerId && (
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
                onClick={deleteSelected}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('facilityMap.deleteSelected')}
              </button>
            )}
          </aside>
        )}

        <section className="relative min-h-[640px] overflow-hidden bg-slate-950">
          <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              {plan.building} · {plan.floor}
            </div>
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              <Layers3 className="mr-1 inline h-3.5 w-3.5" />
              {t('facilityMap.itemsSummary', { assets: plan.pins.length, markers: plan.overlayPins.length, zones: plan.zones.length })}
            </div>
            <div className={`rounded-md border px-3 py-2 text-xs backdrop-blur ${
              editMode ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
            }`}>
              {editMode ? t('facilityMap.editing') : t('facilityMap.viewing')}
            </div>
          </div>

          {showLegend && (
            <div className="absolute bottom-20 right-3 z-25 w-56 rounded-xl border border-white/10 bg-slate-950/85 p-3 text-white shadow-xl backdrop-blur">
              <div className="mb-2 text-xs font-semibold">{t('facilityMap.legend')}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                {[
                  ['#22c55e', t('facilityMap.statusActive')],
                  ['#eab308', t('facilityMap.statusMaintenance')],
                  ['#94a3b8', t('facilityMap.statusInactive')],
                  ['#ef4444', t('facilityMap.statusRetired')],
                ].map(([color, label]) => (
                  <div key={String(label)} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: String(color) }} />
                    <span className="truncate text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 pt-2 text-[10px]">
                {ZONES.slice(0, 6).map((zone) => (
                  <div key={zone.id} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: zone.color }} />
                    <span className="truncate text-slate-300">{t(zone.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute bottom-20 left-3 z-20 h-28 w-44 overflow-hidden rounded-lg border border-white/10 bg-white shadow-xl">
            <div className="absolute inset-0 bg-slate-100">
              {plan.zones.map((zone) => (
                <div
                  key={zone.id}
                  className="absolute rounded-[2px]"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.w}%`,
                    height: `${zone.h}%`,
                    backgroundColor: `${zoneById.get(zone.type)?.color ?? '#64748b'}35`,
                    border: `1px solid ${zoneById.get(zone.type)?.color ?? '#64748b'}`,
                  }}
                />
              ))}
              {plan.pins.map((pin) => (
                <span
                  key={pin.equipmentId}
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                />
              ))}
              <div
                className="absolute border-2 border-sky-500/80 bg-sky-400/10"
                style={{
                  left: `${Math.max(0, Math.min(82, 8 - pan.x / 80))}%`,
                  top: `${Math.max(0, Math.min(72, 8 - pan.y / 80))}%`,
                  width: `${Math.max(18, 84 / zoom)}%`,
                  height: `${Math.max(22, 84 / zoom)}%`,
                }}
              />
            </div>
            <div className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] text-white">
              {t('facilityMap.miniMap')}
            </div>
          </div>

          {selectedEquipment && (
            <div className="absolute right-3 top-3 z-30 w-72 rounded-xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: statusColor(selectedEquipment.status) }}
                >
                  <Wrench className="h-5 w-5 text-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{selectedEquipment.name}</div>
                  <div className="text-[11px] text-slate-400">{selectedEquipment.id}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-white/5 p-2">
                  <div className="text-slate-400">{t('facilityMap.status')}</div>
                  <div className="mt-1 font-medium">{t(statusTranslationKey(selectedEquipment.status))}</div>
                </div>
                <div className="rounded-md bg-white/5 p-2">
                  <div className="text-slate-400">{t('facilityMap.openWorkOrders')}</div>
                  <div className="mt-1 font-medium">{selectedEquipment.status === 'Maintenance' ? '2' : '0'}</div>
                </div>
                <div className="col-span-2 rounded-md bg-white/5 p-2">
                  <div className="text-slate-400">{t('facilityMap.nextPm')}</div>
                  <div className="mt-1 font-medium">{t('facilityMap.nextPmDemo')}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10">
                  {t('facilityMap.viewEquipment')}
                </button>
                <button type="button" className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200">
                  {t('facilityMap.createWorkOrder')}
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-black/70 p-1.5 text-white backdrop-blur">
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title={t('facilityMap.zoomOut')}>
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} title={t('facilityMap.zoomIn')}>
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={fitView} title={t('facilityMap.fitView')}>
              <Focus className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={fitView} title={t('facilityMap.resetView')}>
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-2 hover:bg-white/10"
              onClick={() => setIsFullscreen((value) => !value)}
              title={isFullscreen ? t('facilityMap.exitFullscreen') : t('facilityMap.fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <span className="mx-1 h-5 w-px bg-white/15" />
            <span className="flex items-center gap-1 px-2 text-[11px] text-white/70">
              <Move className="h-3.5 w-3.5" />
              {t('facilityMap.shiftDragPan')}
            </span>
          </div>

          <div
            ref={canvasRef}
            className={`absolute inset-0 select-none ${
              editMode && (selectedEquipmentId || placeLayer || zoneTool || !['select', 'pan'].includes(drawTool))
                ? 'cursor-crosshair'
                : isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-default'
            }`}
            onClick={placeAt}
            onMouseDown={startPointer}
            onMouseMove={onPointerMove}
            onMouseUp={endPointerInteraction}
            onMouseLeave={endPointerInteraction}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 origin-top-left"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {plan.imageDataUrl ? (
                <img
                  src={plan.imageDataUrl}
                  alt={plan.name}
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              ) : (
                <DemoBlueprint t={t} />
              )}

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ pointerEvents: drawTool === 'erase' ? 'auto' : 'none' }}
              >
                <defs>
                  <marker id="facility-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="#f43f5e" />
                  </marker>
                </defs>
                {[...plan.annotations, ...(draftAnnotation ? [draftAnnotation] : [])].map((annotation) => {
                  const isDraft = annotation.id === 'draft-annotation';
                  const common = {
                    stroke: annotation.type === 'ruler' ? '#22d3ee' : '#f43f5e',
                    strokeWidth: isDraft ? 0.35 : 0.28,
                    vectorEffect: 'non-scaling-stroke' as const,
                    opacity: isDraft ? 0.7 : 1,
                    pointerEvents: drawTool === 'erase' && !isDraft ? 'stroke' : 'none',
                    onClick: (event: React.MouseEvent<SVGElement>) => {
                      if (drawTool !== 'erase' || isDraft) return;
                      event.stopPropagation();
                      commitPlan((current) => ({
                        ...current,
                        annotations: current.annotations.filter((item) => item.id !== annotation.id),
                      }));
                    },
                  };

                  if (annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'ruler') {
                    const distance = Math.hypot(annotation.x2 - annotation.x1, annotation.y2 - annotation.y1);
                    return (
                      <g key={annotation.id}>
                        <line
                          x1={annotation.x1}
                          y1={annotation.y1}
                          x2={annotation.x2}
                          y2={annotation.y2}
                          {...common}
                          markerEnd={annotation.type === 'arrow' ? 'url(#facility-arrow-head)' : undefined}
                          strokeDasharray={annotation.type === 'ruler' ? '1 0.7' : undefined}
                        />
                        {annotation.type === 'ruler' && (
                          <text
                            x={(annotation.x1 + annotation.x2) / 2}
                            y={(annotation.y1 + annotation.y2) / 2 - 1}
                            fill="#0e7490"
                            fontSize="2.2"
                            textAnchor="middle"
                          >
                            {distance.toFixed(1)}%
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (annotation.type === 'rect') {
                    return (
                      <rect
                        key={annotation.id}
                        x={Math.min(annotation.x1, annotation.x2)}
                        y={Math.min(annotation.y1, annotation.y2)}
                        width={Math.abs(annotation.x2 - annotation.x1)}
                        height={Math.abs(annotation.y2 - annotation.y1)}
                        fill="#f43f5e18"
                        {...common}
                      />
                    );
                  }

                  if (annotation.type === 'circle') {
                    const rx = Math.abs(annotation.x2 - annotation.x1) / 2;
                    const ry = Math.abs(annotation.y2 - annotation.y1) / 2;
                    return (
                      <ellipse
                        key={annotation.id}
                        cx={(annotation.x1 + annotation.x2) / 2}
                        cy={(annotation.y1 + annotation.y2) / 2}
                        rx={rx}
                        ry={ry}
                        fill="#f43f5e18"
                        {...common}
                      />
                    );
                  }

                  return (
                    <text
                      key={annotation.id}
                      x={annotation.x1}
                      y={annotation.y1}
                      fill="#be123c"
                      fontSize="2.5"
                      fontWeight="700"
                      style={{ pointerEvents: drawTool === 'erase' ? 'auto' : 'none', cursor: 'pointer' }}
                      onClick={(event) => {
                        if (drawTool !== 'erase' || isDraft) return;
                        event.stopPropagation();
                        commitPlan((current) => ({
                          ...current,
                          annotations: current.annotations.filter((item) => item.id !== annotation.id),
                        }));
                      }}
                    >
                      {annotation.text}
                    </text>
                  );
                })}
              </svg>

              {plan.zones.map((zone) => {
                const meta = zoneById.get(zone.type);
                const selected = selectedMarkerId === `zone:${zone.id}`;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    className={`absolute rounded-md border-2 text-left ${
                      selected ? 'ring-2 ring-white' : ''
                    }`}
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.w}%`,
                      height: `${zone.h}%`,
                      borderColor: meta?.color,
                      backgroundColor: `${meta?.color ?? '#64748b'}22`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMarkerId(`zone:${zone.id}`);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (!editMode || drawTool !== 'select') return;
                      dragStartPlanRef.current = clonePlan(plan);
                      zoneInteractionRef.current = { startX: zone.x, startY: zone.y, zone: { ...zone } };
                      const point = toPercent(event.clientX, event.clientY);
                      if (point) zoneInteractionRef.current = { startX: point.x, startY: point.y, zone: { ...zone } };
                      setDraggingZoneId(zone.id);
                      setSelectedMarkerId(`zone:${zone.id}`);
                    }}
                    title={meta ? t(meta.labelKey) : undefined}
                  >
                    <span
                      className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: meta?.color }}
                    >
                      {meta?.emoji} {meta ? t(meta.labelKey) : ''}
                    </span>
                    {editMode && selected && drawTool === 'select' && (
                      <span
                        className="absolute bottom-[-5px] right-[-5px] h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-slate-950"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          dragStartPlanRef.current = clonePlan(plan);
                          const point = toPercent(event.clientX, event.clientY);
                          if (!point) return;
                          zoneInteractionRef.current = { startX: point.x, startY: point.y, zone: { ...zone } };
                          setResizingZoneId(zone.id);
                        }}
                        title={t('facilityMap.resizeZone')}
                      />
                    )}
                  </button>
                );
              })}

              {draftZone && (() => {
                const meta = zoneById.get(draftZone.type);
                return (
                  <div
                    className="pointer-events-none absolute rounded-md border-2 border-dashed"
                    style={{
                      left: `${draftZone.x}%`,
                      top: `${draftZone.y}%`,
                      width: `${draftZone.w}%`,
                      height: `${draftZone.h}%`,
                      borderColor: meta?.color,
                      backgroundColor: `${meta?.color ?? '#64748b'}1f`,
                    }}
                  />
                );
              })()}

              {visibleAssetPins && plan.pins.map((pin) => {
                const item = equipmentById.get(pin.equipmentId);
                const selected = selectedMarkerId === `asset:${pin.equipmentId}`;
                return (
                  <button
                    key={pin.equipmentId}
                    type="button"
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMarkerId(`asset:${pin.equipmentId}`);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (!editMode) return;
                      dragStartPlanRef.current = clonePlan(plan);
                      setDraggingEquipmentId(pin.equipmentId);
                      setSelectedMarkerId(`asset:${pin.equipmentId}`);
                    }}
                    title={item?.name ?? pin.equipmentId}
                  >
                    <div style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'center' }}>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-slate-950 shadow-xl ${
                          selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''
                        }`}
                        style={{ backgroundColor: statusColor(item?.status) }}
                      >
                        <MapPin className="h-5 w-5 text-slate-950" />
                      </div>
                      <div className="pointer-events-none absolute left-1/2 top-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-1 text-[10px] text-white shadow group-hover:block">
                        {item?.name ?? pin.equipmentId}
                        {item?.status ? ` · ${t(statusTranslationKey(item.status))}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}

              {visibleOverlayPins.map((pin) => {
                const meta = layerById.get(pin.layer);
                const selected = selectedMarkerId === `overlay:${pin.id}`;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMarkerId(`overlay:${pin.id}`);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (!editMode) return;
                      dragStartPlanRef.current = clonePlan(plan);
                      setDraggingOverlayId(pin.id);
                      setSelectedMarkerId(`overlay:${pin.id}`);
                    }}
                    title={meta ? t(meta.labelKey) : undefined}
                  >
                    <div style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'center' }}>
                      <div
                        className={`flex h-9 min-w-9 items-center justify-center rounded-full border-[3px] border-slate-950 px-2 text-base shadow-xl ${
                          selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''
                        }`}
                        style={{ backgroundColor: meta?.color }}
                      >
                        {meta?.emoji}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
