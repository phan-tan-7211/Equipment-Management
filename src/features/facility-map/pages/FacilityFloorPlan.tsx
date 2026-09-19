import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ImagePlus,
  Layers3,
  MapPin,
  Move,
  RotateCcw,
  Save,
  Search,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

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

type FloorPlanState = {
  name: string;
  building: string;
  floor: string;
  imageDataUrl: string;
  pins: EquipmentPin[];
  overlayPins: OverlayPin[];
  zones: Zone[];
};

const STORAGE_KEY = 'znteqr:facility-floor-plan:dryrun:v2';

const LAYERS: Array<{ id: 'assets' | LayerId; label: string; color: string; emoji: string }> = [
  { id: 'assets', label: 'Assets', color: '#10b981', emoji: '🔧' },
  { id: 'fire', label: 'Fire', color: '#ef4444', emoji: '🔥' },
  { id: 'tornado', label: 'Tornado', color: '#f59e0b', emoji: '🌪️' },
  { id: 'flood', label: 'Flood', color: '#3b82f6', emoji: '💧' },
  { id: 'emergency', label: 'Exits', color: '#22d3ee', emoji: '🚪' },
  { id: 'utility', label: 'Utility', color: '#a78bfa', emoji: '⚡' },
];

const ZONES: Array<{ id: ZoneType; label: string; color: string; emoji: string }> = [
  { id: 'production', label: 'Production', color: '#3b82f6', emoji: '🏭' },
  { id: 'storage', label: 'Storage', color: '#8b5cf6', emoji: '📦' },
  { id: 'utility', label: 'Utility', color: '#06b6d4', emoji: '⚡' },
  { id: 'restricted', label: 'Restricted', color: '#ef4444', emoji: '⛔' },
  { id: 'hazard', label: 'Hazard', color: '#f97316', emoji: '☢️' },
  { id: 'emergency', label: 'Emergency', color: '#22c55e', emoji: '🚨' },
  { id: 'office', label: 'Office', color: '#64748b', emoji: '🏢' },
  { id: 'custom', label: 'Custom', color: '#a855f7', emoji: '📎' },
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
};

const ensurePlanShape = (value: Partial<FloorPlanState>): FloorPlanState => ({
  ...EMPTY_PLAN,
  ...value,
  pins: value.pins ?? [],
  overlayPins: value.overlayPins ?? [],
  zones: value.zones ?? [],
});

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function DemoBlueprint() {
  return (
    <svg
      viewBox="0 0 1200 760"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Demo factory floor plan"
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
        <text x="120" y="105" fontSize="20">LINE A · MACHINING</text>
        <text x="575" y="105" fontSize="20">LINE B · PRESS / ASSEMBLY</text>
        <text x="120" y="400" fontSize="20">UTILITY</text>
        <text x="440" y="400" fontSize="20">WAREHOUSE / QA</text>
      </g>
      <g fill="#64748b" fontFamily="system-ui, sans-serif" fontSize="14">
        <text x="160" y="270">CNC / Milling</text>
        <text x="625" y="270">Press / Assembly</text>
        <text x="155" y="590">Compressor / Utility</text>
        <text x="505" y="590">Storage / Inspection</text>
      </g>
    </svg>
  );
}

export default function FacilityFloorPlan() {
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingEquipmentId, setDraggingEquipmentId] = useState('');
  const [draggingOverlayId, setDraggingOverlayId] = useState('');
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
  const [draftZone, setDraftZone] = useState<Zone | null>(null);
  const pointerStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const savePlan = useCallback((next: FloorPlanState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updatePlan = useCallback((updater: (current: FloorPlanState) => FloorPlanState) => {
    setPlan((current) => {
      const next = updater(current);
      savePlan(next);
      return next;
    });
  }, [savePlan]);

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
    if (draggingEquipmentId || draggingOverlayId || isPanning || zoneStart) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;

    if (selectedEquipmentId) {
      updatePlan((current) => ({
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
      updatePlan((current) => ({
        ...current,
        overlayPins: [...current.overlayPins, { id, layer: placeLayer, ...point }],
      }));
      setSelectedMarkerId(`overlay:${id}`);
    }
  }, [
    draggingEquipmentId,
    draggingOverlayId,
    isPanning,
    placeLayer,
    selectedEquipmentId,
    toPercent,
    updatePlan,
    zoneStart,
  ]);

  const startPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1 || event.shiftKey) {
      event.preventDefault();
      pointerStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
      return;
    }

    if (!zoneTool || event.button !== 0) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;
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

    if (zoneStart && zoneTool) {
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

    if (draggingEquipmentId) {
      setPlan((current) => ({
        ...current,
        pins: current.pins.map((pin) =>
          pin.equipmentId === draggingEquipmentId ? { ...pin, ...point } : pin,
        ),
      }));
      return;
    }

    if (draggingOverlayId) {
      setPlan((current) => ({
        ...current,
        overlayPins: current.overlayPins.map((pin) =>
          pin.id === draggingOverlayId ? { ...pin, ...point } : pin,
        ),
      }));
    }
  };

  const endPointerInteraction = () => {
    if (draftZone && draftZone.w > 0.5 && draftZone.h > 0.5) {
      updatePlan((current) => ({
        ...current,
        zones: [...current.zones, { ...draftZone, id: makeId('zone') }],
      }));
    } else if (draggingEquipmentId || draggingOverlayId) {
      setPlan((current) => {
        savePlan(current);
        return current;
      });
    }

    setZoneStart(null);
    setDraftZone(null);
    setDraggingEquipmentId('');
    setDraggingOverlayId('');
    setIsPanning(false);
  };

  const uploadPlan = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageDataUrl) return;
      updatePlan((current) => ({ ...current, imageDataUrl }));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const deleteSelected = () => {
    if (!selectedMarkerId) return;
    if (selectedMarkerId.startsWith('asset:')) {
      const id = selectedMarkerId.slice('asset:'.length);
      updatePlan((current) => ({
        ...current,
        pins: current.pins.filter((pin) => pin.equipmentId !== id),
      }));
    } else if (selectedMarkerId.startsWith('overlay:')) {
      const id = selectedMarkerId.slice('overlay:'.length);
      updatePlan((current) => ({
        ...current,
        overlayPins: current.overlayPins.filter((pin) => pin.id !== id),
      }));
    } else if (selectedMarkerId.startsWith('zone:')) {
      const id = selectedMarkerId.slice('zone:'.length);
      updatePlan((current) => ({
        ...current,
        zones: current.zones.filter((zone) => zone.id !== id),
      }));
    }
    setSelectedMarkerId('');
  };

  const visibleAssetPins = activeLayer === 'all' || activeLayer === 'assets';
  const visibleOverlayPins =
    activeLayer === 'all'
      ? plan.overlayPins
      : activeLayer === 'assets'
        ? []
        : plan.overlayPins.filter((pin) => pin.layer === activeLayer);

  const placementHint = selectedEquipmentId
    ? 'Click the plan to place the selected equipment'
    : placeLayer
      ? `Click the plan to place ${layerById.get(placeLayer)?.label ?? placeLayer} markers`
      : zoneTool
        ? `Drag on the plan to draw a ${zoneById.get(zoneTool)?.label ?? zoneTool} zone`
        : '';

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="border-b bg-card px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Facility Floor Plan</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              UI prototype only — Trier-style multi-layer floor plan. No Supabase/backend connection yet.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
            <ImagePlus className="h-4 w-4" />
            Upload plan
            <input
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => uploadPlan(event.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => savePlan(plan)}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLayer('all')}
            className={`rounded-full border px-3 py-1.5 text-xs ${activeLayer === 'all' ? 'bg-foreground text-background' : 'bg-background'}`}
          >
            All
          </button>
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`rounded-full border px-3 py-1.5 text-xs ${activeLayer === layer.id ? 'ring-2 ring-ring' : ''}`}
              style={{ borderColor: layer.color, color: layer.color }}
            >
              {layer.emoji} {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-r bg-card p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              value={plan.building}
              onChange={(event) => setPlan((current) => ({ ...current, building: event.target.value }))}
              onBlur={() => savePlan(plan)}
              className="rounded-md border bg-background px-2 py-2 text-xs"
              aria-label="Building"
            />
            <input
              value={plan.floor}
              onChange={(event) => setPlan((current) => ({ ...current, floor: event.target.value }))}
              onBlur={() => savePlan(plan)}
              className="rounded-md border bg-background px-2 py-2 text-xs"
              aria-label="Floor"
            />
          </div>

          <div className="mb-2 text-xs font-semibold">Place equipment</div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search equipment..."
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
            <div className="mb-2 text-xs font-semibold">Safety / utility markers</div>
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
                  {layer.emoji} {layer.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="mb-2 text-xs font-semibold">Draw zones</div>
            <div className="grid grid-cols-2 gap-1.5">
              {ZONES.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => {
                    setZoneTool(zone.id);
                    setSelectedEquipmentId('');
                    setPlaceLayer(null);
                  }}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    zoneTool === zone.id ? 'ring-2 ring-ring' : ''
                  }`}
                  style={{ borderColor: zone.color, color: zone.color }}
                >
                  {zone.emoji} {zone.label}
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
              Delete selected item
            </button>
          )}
        </aside>

        <section className="relative min-h-[640px] overflow-hidden bg-slate-950">
          <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              {plan.building} · {plan.floor}
            </div>
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              <Layers3 className="mr-1 inline h-3.5 w-3.5" />
              {plan.pins.length} assets · {plan.overlayPins.length} markers · {plan.zones.length} zones
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-black/70 p-1.5 text-white backdrop-blur">
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-white/10" onClick={resetView} title="Reset view">
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="mx-1 h-5 w-px bg-white/15" />
            <span className="flex items-center gap-1 px-2 text-[11px] text-white/70">
              <Move className="h-3.5 w-3.5" />
              Shift + drag to pan
            </span>
          </div>

          <div
            ref={canvasRef}
            className={`absolute inset-0 select-none ${
              selectedEquipmentId || placeLayer || zoneTool
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
                <DemoBlueprint />
              )}

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
                    title={meta?.label}
                  >
                    <span
                      className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: meta?.color }}
                    >
                      {meta?.emoji} {meta?.label}
                    </span>
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
                        {item?.status ? ` · ${item.status}` : ''}
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
                      setDraggingOverlayId(pin.id);
                      setSelectedMarkerId(`overlay:${pin.id}`);
                    }}
                    title={meta?.label}
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
