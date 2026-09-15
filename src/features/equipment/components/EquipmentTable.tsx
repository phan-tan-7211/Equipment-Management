import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Forklift, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableEmptyState, ResizableFixedDataTable } from '@/components/common/dataTableShared';
import { applyAutoFitColumnWidth, createResizableSortableColumnBase, getDataTableAlignClass, getResizableTableWidth, usePersistedColumnSizing } from '@/components/common/dataTableSharedUtils';
import { DotStatus } from '@/components/ui/dot-status';
import { EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY, EQUIPMENT_TABLE_COLUMN_ORDER, getDefaultEquipmentColumnSizing, getEquipmentTableColumnMeta, type EquipmentTableColumnKey, type EquipmentTableSortField } from '@/features/equipment/components/equipmentTableColumns';
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

const STATUS_COLUMN_KEY: EquipmentTableColumnKey = 'status';
const COLUMN_SIZING_STORAGE_KEY = 'equipqr:equipment-table-column-sizing:v3';
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
export interface EquipmentTableProps { equipment: EquipmentTableRow[]; onShowQRCode: (id:string)=>void; pmStatuses?:Map<string,EquipmentPMStatus>; sortConfig?:SortConfig; onSortChange?:(field:string,direction?:'asc'|'desc')=>void; visibleColumns?:Record<string,boolean>; }

const EquipmentTable: React.FC<EquipmentTableProps> = ({ equipment, onShowQRCode, sortConfig, onSortChange, visibleColumns }) => {
  const { t } = useI18n();
  const { beginTransition, activeEquipmentId } = useEquipmentCardTransition();
  const { settings } = useUserSettings();
  const [imageHover, setImageHover] = useState<EquipmentImageHover | null>(null);
  const [imageHoverVisible, setImageHoverVisible] = useState(false);
  const imageHoverCloseTimer = useRef<number | null>(null);
  const [columnSizing, setColumnSizing] = usePersistedColumnSizing(COLUMN_SIZING_STORAGE_KEY, getDefaultEquipmentColumnSizing());

  const clearImageHoverCloseTimer = useCallback(() => {
    if (imageHoverCloseTimer.current === null) return;
    window.clearTimeout(imageHoverCloseTimer.current);
    imageHoverCloseTimer.current = null;
  }, []);

  const closeImageHover = useCallback(() => {
    setImageHoverVisible(false);
    if (imageHoverCloseTimer.current !== null) return;
    imageHoverCloseTimer.current = window.setTimeout(() => {
      setImageHover(null);
      imageHoverCloseTimer.current = null;
    }, IMAGE_HOVER_TRANSITION_MS);
  }, [clearImageHoverCloseTimer]);

  const openImageHover = useCallback((item: EquipmentTableRow, event: React.PointerEvent) => {
    const src = displayableImageSrc(item.image_url);
    if (!src || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    clearImageHoverCloseTimer();
    setImageHoverVisible(true);
    setImageHover({ src, alt: `${item.name} equipment`, ...getImageHoverPosition(event.clientX, event.clientY) });
  }, [clearImageHoverCloseTimer]);
  const moveImageHover = useCallback((item: EquipmentTableRow, event: React.PointerEvent) => {
    const src = displayableImageSrc(item.image_url);
    if (!src) return;
    setImageHover((current) => current?.src === src ? { ...current, ...getImageHoverPosition(event.clientX, event.clientY) } : current);
  }, []);

  useEffect(() => {
    if (!imageHover) return;

    const closeWhenPointerLeavesThumbnail = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('[data-equipment-thumbnail]')) {
        closeImageHover();
      }
    };

    document.addEventListener('pointermove', closeWhenPointerLeavesThumbnail, true);
    document.addEventListener('mouseleave', closeImageHover, true);
    window.addEventListener('blur', closeImageHover);
    return () => {
      document.removeEventListener('pointermove', closeWhenPointerLeavesThumbnail, true);
      document.removeEventListener('mouseleave', closeImageHover, true);
      window.removeEventListener('blur', closeImageHover);
    };
  }, [closeImageHover, imageHover]);

  useEffect(() => () => clearImageHoverCloseTimer(), [clearImageHoverCloseTimer]);
  const isColumnVisible = useCallback((key:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(key); if(meta&&!meta.canHide)return true; return visibleColumns?.[key]??true; },[visibleColumns]);
  const visibleColumnKeys=useMemo(()=>EQUIPMENT_TABLE_COLUMN_ORDER.filter((key)=>isColumnVisible(key)),[isColumnVisible]);
  const handleSortClick=useCallback((field:EquipmentTableSortField)=>{ if(!onSortChange)return; const next=sortConfig?.field===field?(sortConfig.direction==='asc'?'desc':'asc'):'asc'; onSortChange(field,next); },[onSortChange,sortConfig]);
  const handleAutoFitColumn=useCallback((columnKey:EquipmentTableColumnKey)=>{ const meta=getEquipmentTableColumnMeta(columnKey); if(!meta)return; applyAutoFitColumnWidth(setColumnSizing,columnKey,equipment.map((row)=>getEquipmentTableCellDisplayValue(row,columnKey,settings)),meta); },[equipment,settings,setColumnSizing]);
  const columns=useMemo<ColumnDef<EquipmentTableRow>[]>(()=>{
    const dataColumns=visibleColumnKeys.map((columnKey)=>{ const rawMeta=getEquipmentTableColumnMeta(columnKey); if(!rawMeta)throw new Error(`Missing equipment table column meta for ${columnKey}`); const meta={...rawMeta,title:t(COLUMN_KEYS[columnKey])}; return { ...createResizableSortableColumnBase(columnKey,columnSizing,meta,{active:sortConfig?.field===meta.sortField,sortOrder:sortConfig?.field===meta.sortField?sortConfig.direction:undefined,onSort:()=>handleSortClick(meta.sortField),hideVisibleTitle:columnKey===STATUS_COLUMN_KEY}), cell:({row})=>{ const item=row.original; switch(columnKey){
      case 'name': { const active=activeEquipmentId===item.id; return <div className="min-w-0"><button type="button" className="block w-full truncate text-left font-medium hover:text-primary" data-equipment-id={item.id} {...(active?{'data-equipment-transition-active':''}:{})} style={getEquipmentViewTransitionStyle('name',active)} onClick={()=>{void beginTransition({equipmentId:item.id,to:`/dashboard/equipment/${item.id}`});}}>{item.name}</button>{item.management_code ? <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{item.management_code}</span> : null}</div>; }
      case 'status': {
        const imageSrc = displayableImageSrc(item.image_url);
        const statusRailClass = getEquipmentStatusRailClass(item.status);
        return (
          <div
            className={cn('relative flex min-h-16 h-full w-full items-center justify-center overflow-hidden bg-muted/30', imageSrc && 'cursor-zoom-in')}
            data-equipment-thumbnail
            onPointerEnter={(event) => openImageHover(item, event)}
            onPointerMove={(event) => moveImageHover(item, event)}
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
                className={cn('pointer-events-none absolute inset-y-0 left-0 z-10 w-1', statusRailClass)}
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
  },[activeEquipmentId,beginTransition,columnSizing,handleSortClick,moveImageHover,onShowQRCode,openImageHover,settings,sortConfig?.direction,sortConfig?.field,t,visibleColumnKeys]);
  const table=useReactTable({data:equipment,columns,state:{columnSizing},onColumnSizingChange:setColumnSizing,columnResizeMode:'onEnd',enableColumnResizing:true,getCoreRowModel:getCoreRowModel()});
  const tableWidth=getResizableTableWidth(table.getTotalSize());
  if(equipment.length===0)return <DataTableEmptyState message={t('equipment.noTableMatches')} />;
  return <>
    <ResizableFixedDataTable table={table} tableWidth={tableWidth} withTooltipProvider getHeaderProps={(header)=>{ const columnId=header.column.id; const isStatusColumn=columnId===STATUS_COLUMN_KEY; const isActionsColumn=columnId===EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY; const meta=isActionsColumn?undefined:getEquipmentTableColumnMeta(columnId as EquipmentTableColumnKey); return {className:cn(getDataTableAlignClass(meta?.align),meta?.mono&&'font-mono tabular-nums',isActionsColumn&&'w-14 px-2','relative select-none',isStatusColumn&&'sticky left-0 z-20 bg-card px-2'),ariaSort:meta?.sortable&&sortConfig?.field===meta.sortField?(sortConfig.direction==='asc'?'ascending':'descending'):'none',onAutoFit:isActionsColumn?undefined:()=>handleAutoFitColumn(columnId as EquipmentTableColumnKey)};}} getCellClassName={(cell)=>{ const columnId=cell.column.id; const isStatusColumn=columnId===STATUS_COLUMN_KEY; const isActionsColumn=columnId===EQUIPMENT_TABLE_ACTIONS_COLUMN_KEY; const meta=isActionsColumn?undefined:getEquipmentTableColumnMeta(columnId as EquipmentTableColumnKey); return cn(getDataTableAlignClass(meta?.align),meta?.mono&&'font-mono tabular-nums',isStatusColumn&&'sticky left-0 z-10 bg-card p-0 align-middle',isActionsColumn&&'w-14 px-2','overflow-hidden');}} />
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
