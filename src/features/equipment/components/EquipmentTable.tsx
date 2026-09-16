import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Columns3, EyeOff, Forklift, MoreVertical, Pin, PinOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableEmptyState, ResizableFixedDataTable } from '@/components/common/dataTableShared';
import { applyAutoFitColumnWidth, createResizableSortableColumnBase, getDataTableAlignClass, getResizableTableWidth, usePersistedColumnOrder, usePersistedColumnSizing } from '@/components/common/dataTableSharedUtils';
import { DotStatus } from '@/components/ui/dot-status';
import { DEFAULT_VISIBLE_COLUMNS, EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY, EQUIPMENT_TABLE_COLUMN_META, EQUIPMENT_TABLE_COLUMN_ORDER, getDefaultEquipmentColumnSizing, getEquipmentTableColumnMeta, type EquipmentTableColumnKey, type EquipmentTableSortField } from '@/features/equipment/components/equipmentTableColumns';
import type { SortConfig } from '@/features/equipment/hooks/useEquipmentFiltering';
import type { EquipmentPMStatus } from '@/features/equipment/hooks/useEquipmentPMStatus';
import { safeFormatDate } from '@/features/equipment/utils/equipmentHelpers';
import { getEquipmentTableCellDisplayValue, type EquipmentTableRow } from '@/features/equipment/utils/equipmentTableRows';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useEquipmentCardTransition } from '@/features/equipment/transitions/useEquipmentCardTransition';
import { getEquipmentViewTransitionStyle } from '@/features/equipment/transitions/equipmentViewTransitionNames';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { displayableImageSrc } from '@/services/imageUploadService';
import { getEquipmentStatusRailClass } from '@/lib/status-colors';
import { getPreferenceLocalStorage, setPreferenceLocalStorage } from '@/lib/cookieConsent';

const STATUS_COLUMN_KEY: EquipmentTableColumnKey = 'status';
const COLUMN_SIZING_STORAGE_KEY = 'equipqr:equipment-table-column-sizing:v3';
const COLUMN_ORDER_STORAGE_KEY = 'equipqr:equipment-table-column-order:v1';
const PINNED_COLUMNS_STORAGE_PREFIX = 'equipqr:equipment-table-pinned-columns:';
const COLUMN_KEYS: Record<EquipmentTableColumnKey, string> = { status:'equipment.status', name:'equipment.name', manufacturer:'equipment.manufacturer', model:'equipment.model', serial_number:'equipment.serialNumber', working_hours:'equipment.hours', location:'equipment.location', team_name:'equipment.team', last_maintenance:'equipment.lastMaintenanceFull' };
type EquipmentImageHover = { src: string; alt: string; x: number; y: number; size: number };
const IMAGE_HOVER_TRANSITION_MS = 140;

function getImageHoverPosition(clientX: number, clientY: number) {
  const margin = 12;
  const gap = 14;
  const size = Math.min(
    360,
    Math.max(180, window.innerWidth - margin * 2),
    Math.max(180, window.innerHeight - margin * 2),
  );
  let x = clientX + gap;
  let y = clientY - size - gap;

  if (x + size > window.innerWidth - margin) x = clientX - size - gap;
  x = Math.max(margin, Math.min(x, window.innerWidth - size - margin));
  y = Math.max(margin, Math.min(y, window.innerHeight - size - margin));

  return { x, y, size };
}
export interface EquipmentTableProps { equipment: EquipmentTableRow[]; onShowQRCode: (id:string)=>void; pmStatuses?:Map<string,EquipmentPMStatus>; sortConfig?:SortConfig; onSortChange?:(field:string,direction?:'asc'|'desc')=>void; visibleColumns?:Record<string,boolean>; onToggleColumn?:(key:string)=>void; organizationId?:string; }

function readPinnedColumns(storageKey: string): EquipmentTableColumnKey[] {
  const defaultPinned: EquipmentTableColumnKey[] = [STATUS_COLUMN_KEY];
  try {
    const raw = getPreferenceLocalStorage(storageKey);
    if (!raw) return defaultPinned;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultPinned;
    return parsed.filter((key): key is EquipmentTableColumnKey => EQUIPMENT_TABLE_COLUMN_ORDER.includes(key));
  } catch {
    return defaultPinned;
  }
}

function EquipmentColumnHeaderMenu({
  columnKey,
  visibleColumns,
  pinned,
  onToggleColumn,
  onTogglePin,
  onHideColumn,
}: {
  columnKey: EquipmentTableColumnKey;
  visibleColumns: Record<string, boolean>;
  pinned: boolean;
  onToggleColumn: (key: EquipmentTableColumnKey) => void;
  onTogglePin: (key: EquipmentTableColumnKey) => void;
  onHideColumn: (key: EquipmentTableColumnKey) => void;
}) {
  const { t } = useI18n();
  const meta = getEquipmentTableColumnMeta(columnKey);
  if (!meta) return null;
  const label = t(COLUMN_KEYS[columnKey]);
  const canHide = meta.canHide;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 z-20 h-6 w-6 -translate-y-1/2 rounded-md bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={t('equipment.columnOptions', { column: label })}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Columns3 className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{t('equipment.showColumns')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 w-56 overflow-y-auto">
            {EQUIPMENT_TABLE_COLUMN_META.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={visibleColumns[column.key] ?? column.defaultVisible}
                disabled={!column.canHide}
                onCheckedChange={() => onToggleColumn(column.key)}
                onSelect={(event) => event.preventDefault()}
              >
                {t(COLUMN_KEYS[column.key])}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => onTogglePin(columnKey)}>
          {pinned ? <PinOff className="mr-2 h-4 w-4" aria-hidden="true" /> : <Pin className="mr-2 h-4 w-4" aria-hidden="true" />}
          {pinned ? t('equipment.unpinColumn') : t('equipment.pinColumn')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canHide} onSelect={() => onHideColumn(columnKey)}>
          <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('equipment.hideColumn')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({ equipment, onShowQRCode, sortConfig, onSortChange, visibleColumns, onToggleColumn, organizationId }) => {
  const { t } = useI18n();
  const { beginTransition, activeEquipmentId } = useEquipmentCardTransition();
  const { settings } = useUserSettings();
  const [imageHover, setImageHover] = useState<EquipmentImageHover | null>(null);
  const [imageHoverVisible, setImageHoverVisible] = useState(false);
  const imageHoverCloseTimer = useRef<number | null>(null);
  const imageHoverRef = useRef<EquipmentImageHover | null>(null);
  const [columnSizing, setColumnSizing] = usePersistedColumnSizing(COLUMN_SIZING_STORAGE_KEY, getDefaultEquipmentColumnSizing());
  const [columnOrder, setColumnOrder] = usePersistedColumnOrder(COLUMN_ORDER_STORAGE_KEY, [...EQUIPMENT_TABLE_COLUMN_ORDER]);
  const [internalVisibleColumns, setInternalVisibleColumns] = useState<Record<string, boolean>>(() => ({ ...DEFAULT_VISIBLE_COLUMNS }));
  const effectiveVisibleColumns = visibleColumns ?? internalVisibleColumns;
  const pinnedStorageKey = `${PINNED_COLUMNS_STORAGE_PREFIX}${organizationId ?? 'default'}`;
  const [pinnedColumns, setPinnedColumns] = useState<EquipmentTableColumnKey[]>(() => readPinnedColumns(pinnedStorageKey));
  const [draggedColumnId, setDraggedColumnId] = useState<EquipmentTableColumnKey | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<EquipmentTableColumnKey | null>(null);

  useEffect(() => {
    setPinnedColumns(readPinnedColumns(pinnedStorageKey));
  }, [pinnedStorageKey]);

  useEffect(() => {
    setPreferenceLocalStorage(pinnedStorageKey, JSON.stringify(pinnedColumns));
  }, [pinnedColumns, pinnedStorageKey]);

  const clearImageHoverCloseTimer = useCallback(() => {
    if (imageHoverCloseTimer.current === null) return;
    window.clearTimeout(imageHoverCloseTimer.current);
    imageHoverCloseTimer.current = null;
  }, []);

  const closeImageHover = useCallback(() => {
    if (!imageHoverRef.current) return;
    setImageHoverVisible(false);
    if (imageHoverCloseTimer.current !== null) return;
    imageHoverCloseTimer.current = window.setTimeout(() => {
      imageHoverRef.current = null;
      setImageHover(null);
      imageHoverCloseTimer.current = null;
    }, IMAGE_HOVER_TRANSITION_MS);
  }, [clearImageHoverCloseTimer]);

  const openImageHover = useCallback((thumbnail: HTMLElement, clientX: number, clientY: number) => {
    const src = thumbnail.dataset.equipmentImageSrc;
    if (!src || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      closeImageHover();
      return;
    }
    clearImageHoverCloseTimer();
    const nextHover = {
      src,
      alt: thumbnail.dataset.equipmentImageAlt ?? 'Equipment image',
      ...getImageHoverPosition(clientX, clientY),
    };
    imageHoverRef.current = nextHover;
    setImageHoverVisible(true);
    setImageHover(nextHover);
  }, [clearImageHoverCloseTimer, closeImageHover]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target;
      const thumbnail = target instanceof Element
        ? target.closest<HTMLElement>('[data-equipment-thumbnail]')
        : null;
      if (!thumbnail) {
        closeImageHover();
        return;
      }
      openImageHover(thumbnail, event.clientX, event.clientY);
    };

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('mouseleave', closeImageHover, true);
    window.addEventListener('blur', closeImageHover);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('mouseleave', closeImageHover, true);
      window.removeEventListener('blur', closeImageHover);
    };
  }, [closeImageHover, openImageHover]);

  useEffect(() => () => {
    clearImageHoverCloseTimer();
    imageHoverRef.current = null;
  }, [clearImageHoverCloseTimer]);
  const isColumnVisible = useCallback((key:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(key); if(meta&&!meta.canHide)return true; return effectiveVisibleColumns[key]??true; },[effectiveVisibleColumns]);
  const visibleColumnKeys=useMemo(()=>EQUIPMENT_TABLE_COLUMN_ORDER.filter((key)=>isColumnVisible(key)),[isColumnVisible]);
  const orderedColumnKeys=useMemo(()=>{ const visible=new Set(visibleColumnKeys); const saved=columnOrder.filter((key): key is EquipmentTableColumnKey=>visible.has(key as EquipmentTableColumnKey)); const missing=visibleColumnKeys.filter((key)=>!saved.includes(key)); return [...saved,...missing]; },[columnOrder,visibleColumnKeys]);
  const orderedVisibleColumnKeys=useMemo(()=>{ const pinned=pinnedColumns.filter((key)=>orderedColumnKeys.includes(key)); return [...pinned,...orderedColumnKeys.filter((key)=>!pinned.includes(key))]; },[orderedColumnKeys,pinnedColumns]);
  const pinnedLeftOffsets=useMemo(()=>{ const offsets=new Map<EquipmentTableColumnKey,number>(); let left=0; for(const key of orderedVisibleColumnKeys){ if(!pinnedColumns.includes(key)) continue; offsets.set(key,left); const meta=getEquipmentTableColumnMeta(key); left+=columnSizing[key]??meta?.defaultWidth??0; } return offsets; },[columnSizing,orderedVisibleColumnKeys,pinnedColumns]);
  const handleToggleColumn=useCallback((key:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(key); if(!meta||!meta.canHide)return; if(onToggleColumn){ onToggleColumn(key); return; } setInternalVisibleColumns((current)=>({...current,[key]:!(current[key]??meta.defaultVisible)})); },[onToggleColumn]);
  const handleTogglePin=useCallback((key:EquipmentTableColumnKey)=>{ const nextPinned=pinnedColumns.includes(key)?pinnedColumns.filter((column)=>column!==key):[...pinnedColumns,key]; setPinnedColumns(nextPinned); setColumnOrder((current)=>{ const withoutCurrent=current.filter((column)=>column!==key); const lastPinnedIndex=nextPinned.reduce((maxIndex,pinnedKey)=>Math.max(maxIndex,withoutCurrent.indexOf(pinnedKey)),-1); withoutCurrent.splice(lastPinnedIndex+1,0,key); return withoutCurrent; }); },[pinnedColumns,setColumnOrder]);
  const handleHideColumn=useCallback((key:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(key); if(meta?.canHide&&isColumnVisible(key))handleToggleColumn(key); },[handleToggleColumn,isColumnVisible]);
  const handleColumnDragStart=useCallback((event:React.DragEvent<HTMLTableCellElement>,columnId:EquipmentTableColumnKey)=>{ setDraggedColumnId(columnId); setDragOverColumnId(null); event.dataTransfer.effectAllowed='move'; event.dataTransfer.dropEffect='move'; event.dataTransfer.setData('text/plain',columnId); },[]);
  const handleColumnDragOver=useCallback((event:React.DragEvent<HTMLTableCellElement>,columnId:EquipmentTableColumnKey)=>{ if(!draggedColumnId||draggedColumnId===columnId)return; event.preventDefault(); event.dataTransfer.dropEffect='move'; setDragOverColumnId(columnId); },[draggedColumnId]);
  const handleColumnDrop=useCallback((event:React.DragEvent<HTMLTableCellElement>,targetColumnId:EquipmentTableColumnKey)=>{ event.preventDefault(); event.stopPropagation(); const sourceColumnId=draggedColumnId??event.dataTransfer.getData('text/plain') as EquipmentTableColumnKey; if(sourceColumnId&&sourceColumnId!==targetColumnId){ const nextVisibleOrder=[...orderedVisibleColumnKeys]; const sourceIndex=nextVisibleOrder.indexOf(sourceColumnId); const targetIndex=nextVisibleOrder.indexOf(targetColumnId); if(sourceIndex!==-1&&targetIndex!==-1){ nextVisibleOrder.splice(sourceIndex,1); nextVisibleOrder.splice(targetIndex,0,sourceColumnId); const pinned=nextVisibleOrder.filter((key)=>pinnedColumns.includes(key)); const unpinned=nextVisibleOrder.filter((key)=>!pinnedColumns.includes(key)); const nextVisible=[...pinned,...unpinned]; setColumnOrder((current)=>[...nextVisible,...current.filter((key)=>!nextVisible.includes(key))]); } } setDraggedColumnId(null); setDragOverColumnId(null); },[draggedColumnId,orderedVisibleColumnKeys,pinnedColumns,setColumnOrder]);
  const handleColumnDragEnd=useCallback(()=>{ setDraggedColumnId(null); setDragOverColumnId(null); },[]);
  const handleSortClick=useCallback((field:EquipmentTableSortField)=>{ if(!onSortChange)return; const next=sortConfig?.field===field?(sortConfig.direction==='asc'?'desc':'asc'):'asc'; onSortChange(field,next); },[onSortChange,sortConfig]);
  const handleAutoFitColumn=useCallback((columnKey:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(columnKey); if(!meta)return; applyAutoFitColumnWidth(setColumnSizing,columnKey,equipment.map((row)=>getEquipmentTableCellDisplayValue(row,columnKey,settings)),meta); },[equipment,settings,setColumnSizing]);
  const columns=useMemo<ColumnDef<EquipmentTableRow>[]>(()=>{
    const dataColumns=orderedVisibleColumnKeys.map((columnKey)=>{ const rawMeta=getEquipmentTableColumnMeta(columnKey); if(!rawMeta)throw new Error(`Missing equipment table column meta for ${columnKey}`); const meta={...rawMeta,title:t(COLUMN_KEYS[columnKey])}; return { ...createResizableSortableColumnBase(columnKey,columnSizing,meta,{active:sortConfig?.field===meta.sortField,sortOrder:sortConfig?.field===meta.sortField?sortConfig.direction:undefined,onSort:()=>handleSortClick(meta.sortField),hideVisibleTitle:columnKey===STATUS_COLUMN_KEY}), cell:({row})=>{ const item=row.original; switch(columnKey){
      case 'name': { const active=activeEquipmentId===item.id; return <div className="min-w-0"><button type="button" className="block w-full truncate text-left font-medium hover:text-primary" data-equipment-id={item.id} {...(active?{'data-equipment-transition-active':''}:{})} style={getEquipmentViewTransitionStyle('name',active)} onClick={()=>{void beginTransition({equipmentId:item.id,to:`/dashboard/equipment/${item.id}`});}}>{item.name}</button>{item.management_code ? <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{item.management_code}</span> : null}</div>; }
      case 'status': {
        const imageSrc = displayableImageSrc(item.image_url);
        const statusRailClass = getEquipmentStatusRailClass(item.status);
        return (
          <div
            className={cn('relative flex min-h-16 h-full w-full items-center justify-center overflow-hidden bg-muted/30', imageSrc && 'cursor-zoom-in')}
            data-equipment-thumbnail
            data-equipment-image-src={imageSrc || undefined}
            data-equipment-image-alt={imageSrc ? item.name : undefined}
            title={getEquipmentTableCellDisplayValue(item, 'status', settings)}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`${item.name} equipment`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = '/images/ui/placeholder.svg';
                }}
              />
            ) : (
              <Forklift className="h-7 w-7 text-muted-foreground/55" aria-hidden="true" />
            )}
            {statusRailClass ? (
              <span
                className={cn('pointer-events-none absolute inset-y-0 left-0 z-0 w-1', statusRailClass)}
                aria-hidden="true"
              />
            ) : null}
            <DotStatus status={item.status} className="sr-only" />
          </div>
        );
      }
      case 'manufacturer': return <span className="block truncate">{item.manufacturer||'—'}</span>;
      case 'model': return <span className="block truncate">{item.model||'—'}</span>;
      case 'serial_number': return <span className="block truncate font-mono text-sm">{item.serial_number||'—'}</span>;
      case 'working_hours': return <span className="block truncate text-right tabular-nums">{item.working_hours!=null?item.working_hours.toLocaleString():'—'}</span>;
      case 'location': return <span className="block truncate">{item.location||'—'}</span>;
      case 'team_name': return item.team_id&&item.team_name?<Link to={`/dashboard/teams/${item.team_id}`} className="block truncate hover:text-primary" onClick={(e)=>e.stopPropagation()}>{item.team_name}</Link>:<span className="block truncate text-muted-foreground">—</span>;
      case 'last_maintenance': return <span className="block truncate text-right tabular-nums">{!item.last_maintenance?'—':(safeFormatDate(item.last_maintenance,settings)??'—')}</span>;
      default: { const exhaustive:never=columnKey; return exhaustive; }
    }}} as ColumnDef<EquipmentTableRow>; });
    const actionsColumn:ColumnDef<EquipmentTableRow>={id:EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY,size:columnSizing[EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY]??56,minSize:56,maxSize:56,enableResizing:false,header:()=>null,cell:({row})=><div className="flex justify-end"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={()=>onShowQRCode(row.original.id)} aria-label={t('equipment.showQrFor',{name:row.original.name})}><QrCode className="h-4 w-4" aria-hidden="true" /></Button></div>};
    return [...dataColumns,actionsColumn];
  },[activeEquipmentId,beginTransition,columnSizing,handleSortClick,onShowQRCode,orderedVisibleColumnKeys,settings,sortConfig?.direction,sortConfig?.field,t]);
  const table=useReactTable({data:equipment,columns,state:{columnSizing},onColumnSizingChange:setColumnSizing,columnResizeMode:'onChange',enableColumnResizing:true,getCoreRowModel:getCoreRowModel()});
  const tableWidth=getResizableTableWidth(table.getTotalSize());
  if(equipment.length===0)return <DataTableEmptyState message={t('equipment.noTableMatches')} />;
  return <>
    <ResizableFixedDataTable table={table} tableWidth={tableWidth} withTooltipProvider getHeaderProps={(header)=>{ const columnId=header.column.id; const isStatusColumn=columnId===STATUS_COLUMN_KEY; const isActionsColumn=columnId===EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY; const meta=isActionsColumn?undefined:getEquipmentTableColumnMeta(columnId as EquipmentTableColumnKey); const pinnedOffset=pinnedLeftOffsets.get(columnId as EquipmentTableColumnKey); const isPinned=pinnedOffset!==undefined; const isDragged=draggedColumnId===columnId; const isDropTarget=dragOverColumnId===columnId; const reorderable=!isActionsColumn; return {className:cn(getDataTableAlignClass(meta?.align),meta?.mono&&'font-mono tabular-nums',isActionsColumn&&'w-14 px-2','relative select-none',reorderable&&'cursor-grab active:cursor-grabbing',isDragged&&'opacity-50',isDropTarget&&'bg-primary/10 ring-2 ring-inset ring-primary/50',isPinned&&'sticky z-40 isolate bg-card',isPinned&&pinnedOffset===0&&'left-0',isStatusColumn&&'px-2'),style:isPinned?{left:pinnedOffset}:undefined,draggable:reorderable,onDragStart:reorderable?(event)=>handleColumnDragStart(event,columnId as EquipmentTableColumnKey):undefined,onDragOver:reorderable?(event)=>handleColumnDragOver(event,columnId as EquipmentTableColumnKey):undefined,onDrop:reorderable?(event)=>handleColumnDrop(event,columnId as EquipmentTableColumnKey):undefined,onDragEnd:reorderable?handleColumnDragEnd:undefined,ariaSort:meta?.sortable&&sortConfig?.field===meta.sortField?(sortConfig.direction==='asc'?'ascending':'descending'):'none',onAutoFit:isActionsColumn?undefined:()=>handleAutoFitColumn(columnId as EquipmentTableColumnKey)};}} getCellClassName={(cell)=>{ const columnId=cell.column.id; const isActionsColumn=columnId===EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY; const meta=isActionsColumn?undefined:getEquipmentTableColumnMeta(columnId as EquipmentTableColumnKey); const isPinned=pinnedLeftOffsets.has(columnId as EquipmentTableColumnKey); return cn(getDataTableAlignClass(meta?.align),meta?.mono&&'font-mono tabular-nums',isPinned&&'sticky z-30 isolate bg-card',isPinned&&pinnedLeftOffsets.get(columnId as EquipmentTableColumnKey)===0&&'left-0',isActionsColumn&&'w-14 px-2','overflow-hidden');}} getCellStyle={(cell)=>{ const pinnedOffset=pinnedLeftOffsets.get(cell.column.id as EquipmentTableColumnKey); return pinnedOffset===undefined?undefined:{left:pinnedOffset}; }} renderHeaderActions={(header)=>{ const columnId=header.column.id as EquipmentTableColumnKey; if(columnId===EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY)return null; return <EquipmentColumnHeaderMenu columnKey={columnId} visibleColumns={effectiveVisibleColumns} pinned={pinnedLeftOffsets.has(columnId)} onToggleColumn={handleToggleColumn} onTogglePin={handleTogglePin} onHideColumn={handleHideColumn} />;}} />
    {imageHover ? (
      <div
        className={cn(
          'equipment-image-hover-preview pointer-events-none fixed z-[9999] box-border overflow-hidden rounded-xl border border-border bg-white p-2 shadow-2xl transition-[opacity,transform] duration-150 ease-out dark:bg-card',
          imageHoverVisible ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0',
        )}
        data-equipment-image-hover-preview
        aria-hidden="true"
        style={{ left: imageHover.x, top: imageHover.y, width: imageHover.size, height: imageHover.size }}
      >
        <img src={imageHover.src} alt="" className="block h-full w-full rounded-md bg-white object-contain dark:bg-card" />
      </div>
    ) : null}
  </>;
};
export default EquipmentTable;
