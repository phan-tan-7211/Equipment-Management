import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ImagePlus,
  Layers3,
  MapPin,
  Move,
  RotateCcw,
  Save,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type EquipmentRow = {
  id: string;
  name: string | null;
  status: string | null;
};

type Pin = {
  equipmentId: string;
  x: number;
  y: number;
};

type FloorPlanState = {
  name: string;
  building: string;
  floor: string;
  imageDataUrl: string;
  pins: Pin[];
};

const STORAGE_KEY = 'znteqr:facility-floor-plan:dryrun:v1';

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
  pins: [],
};

export default function FacilityFloorPlan() {
  const [plan, setPlan] = useState<FloorPlanState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FloorPlanState) : EMPTY_PLAN;
    } catch {
      return EMPTY_PLAN;
    }
  });
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [selectedPinId, setSelectedPinId] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingPinId, setDraggingPinId] = useState<string>('');
  const pointerStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from('equipment')
      .select('id,name,status')
      .order('name', { ascending: true })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('[FacilityFloorPlan] equipment query failed', error);
          return;
        }
        setEquipment((data ?? []) as EquipmentRow[]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const savePlan = useCallback((next = plan) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [plan]);

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

  const placeSelected = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedEquipmentId || draggingPinId || isPanning) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;

    setPlan((current) => {
      const next = {
        ...current,
        pins: [
          ...current.pins.filter((pin) => pin.equipmentId !== selectedEquipmentId),
          { equipmentId: selectedEquipmentId, ...point },
        ],
      };
      savePlan(next);
      return next;
    });
    setSelectedPinId(selectedEquipmentId);
    setSelectedEquipmentId('');
  }, [draggingPinId, isPanning, savePlan, selectedEquipmentId, toPercent]);

  const startPan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 1 && !event.shiftKey) return;
    event.preventDefault();
    pointerStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setIsPanning(true);
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

    if (!draggingPinId) return;
    const point = toPercent(event.clientX, event.clientY);
    if (!point) return;
    setPlan((current) => ({
      ...current,
      pins: current.pins.map((pin) =>
        pin.equipmentId === draggingPinId ? { ...pin, ...point } : pin,
      ),
    }));
  };

  const endPointerInteraction = () => {
    if (draggingPinId) {
      setPlan((current) => {
        savePlan(current);
        return current;
      });
    }
    setDraggingPinId('');
    setIsPanning(false);
  };

  const uploadPlan = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageDataUrl) return;
      setPlan((current) => {
        const next = { ...current, imageDataUrl };
        savePlan(next);
        return next;
      });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const removeSelectedPin = () => {
    if (!selectedPinId) return;
    setPlan((current) => {
      const next = { ...current, pins: current.pins.filter((pin) => pin.equipmentId !== selectedPinId) };
      savePlan(next);
      return next;
    });
    setSelectedPinId('');
  };

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
              Trier OS floor-plan workflow adapted for ZNTEQR: upload blueprint, place equipment, drag pins, save layout.
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
            onClick={() => savePlan()}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r bg-card p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              value={plan.building}
              onChange={(event) => setPlan((current) => ({ ...current, building: event.target.value }))}
              onBlur={() => savePlan()}
              className="rounded-md border bg-background px-2 py-2 text-xs"
              aria-label="Building"
            />
            <input
              value={plan.floor}
              onChange={(event) => setPlan((current) => ({ ...current, floor: event.target.value }))}
              onBlur={() => savePlan()}
              className="rounded-md border bg-background px-2 py-2 text-xs"
              aria-label="Floor"
            />
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search equipment..."
              className="w-full rounded-md border bg-background py-2 pl-8 pr-2 text-sm"
            />
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Unplaced equipment</span>
            <span>{unplacedEquipment.length}</span>
          </div>

          <div className="max-h-[55vh] space-y-1 overflow-auto pr-1">
            {unplacedEquipment.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedEquipmentId(item.id)}
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
                <div className="mt-1 truncate text-[11px] text-muted-foreground">{item.id}</div>
              </button>
            ))}
          </div>

          {selectedEquipmentId && (
            <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-2 text-xs">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Click the blueprint to place the selected equipment.
            </div>
          )}

          {selectedPinId && (
            <button
              type="button"
              className="mt-3 w-full rounded-md border border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
              onClick={removeSelectedPin}
            >
              Remove selected pin
            </button>
          )}
        </aside>

        <section className="relative min-h-[620px] overflow-hidden bg-slate-950">
          <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              {plan.building} · {plan.floor}
            </div>
            <div className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
              <Layers3 className="mr-1 inline h-3.5 w-3.5" />
              {plan.pins.length} assets placed
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
              selectedEquipmentId ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'
            }`}
            onClick={placeSelected}
            onMouseDown={startPan}
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
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.13),transparent_50%)]">
                  <div className="max-w-md rounded-xl border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/70">
                    <ImagePlus className="mx-auto mb-3 h-10 w-10" />
                    <div className="font-medium text-white">Upload a plant blueprint or floor-plan image</div>
                    <div className="mt-2 text-xs">
                      Then choose equipment on the left and click its physical position on the plan.
                    </div>
                  </div>
                </div>
              )}

              {plan.pins.map((pin) => {
                const item = equipmentById.get(pin.equipmentId);
                const selected = selectedPinId === pin.equipmentId;
                return (
                  <button
                    key={pin.equipmentId}
                    type="button"
                    className="group absolute -translate-x-1/2 -translate-y-full"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedPinId(pin.equipmentId);
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      setDraggingPinId(pin.equipmentId);
                      setSelectedPinId(pin.equipmentId);
                    }}
                    title={item?.name ?? pin.equipmentId}
                  >
                    <div
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-slate-950 shadow-xl transition ${
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
