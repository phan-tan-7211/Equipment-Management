import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { BulkTanstackTableShell } from '@/components/bulk-edit/BulkTanstackTableShell';
import { BulkGridSortableHeader } from '@/components/bulk-edit/BulkGridSortableHeader';
import { getBulkDisplayValue } from '@/hooks/bulkGridDisplayValue';
import { useBulkGridClickToSelect } from '@/hooks/useBulkGridClickToSelect';
import { useBulkGridPendingApply } from '@/hooks/useBulkGridPendingApply';
import { Checkbox } from '@/components/ui/checkbox';
import type { EquipmentRecord } from '@/features/equipment/types/equipment';
import { useI18n } from '@/i18n';

import { BulkApplyConfirmDialog } from './BulkApplyConfirmDialog';
import {
  BulkEditableCell,
  type BulkEditableCellProps,
  type BulkEditableCellSelectOption,
} from './BulkEditableCell';

export interface BulkEquipmentGridProps {
  rows: EquipmentRecord[];
  dirtyRows: Map<string, Partial<EquipmentRecord>>;
  selectedRowIds: Set<string>;
  onSetCellValue: <K extends keyof EquipmentRecord>(
    id: string,
    field: K,
    value: EquipmentRecord[K]
  ) => void;
  onSetCellValueOnRows: <K extends keyof EquipmentRecord>(
    ids: string[],
    field: K,
    value: EquipmentRecord[K]
  ) => void;
  onToggleSelected: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
}

export const BulkEquipmentGrid: React.FC<BulkEquipmentGridProps> = ({
  rows,
  dirtyRows,
  selectedRowIds,
  onSetCellValue,
  onSetCellValueOnRows,
  onToggleSelected,
  onSelectAll,
  onClearSelection,
}) => {
  const { t } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  const statusOptions = useMemo<BulkEditableCellSelectOption[]>(() => [
    { value: 'active', label: t('equipmentBulk.active') },
    { value: 'maintenance', label: t('equipmentBulk.maintenance') },
    { value: 'inactive', label: t('equipmentBulk.inactive') },
  ], [t]);

  const fieldLabels = useMemo<Partial<Record<keyof EquipmentRecord, string>>>(() => ({
    status: t('equipmentBulk.status'),
    manufacturer: t('equipmentBulk.manufacturer'),
    model: t('equipmentBulk.model'),
    serial_number: t('equipmentBulk.serialNumber'),
    working_hours: t('equipmentBulk.hours'),
    location: t('equipmentBulk.location'),
  }), [t]);

  const { cancelPendingSelection, handleRowClick } = useBulkGridClickToSelect(onToggleSelected);

  const {
    pendingApply,
    handleCellChange,
    handleApplyAll,
    handleApplyOne,
    clearPendingApply,
  } = useBulkGridPendingApply<keyof EquipmentRecord>({
    selectedRowIds,
    fieldLabels,
    onSetCellValue: (rowId, field, value) =>
      onSetCellValue(rowId, field, value as EquipmentRecord[keyof EquipmentRecord]),
    onSetCellValueOnRows: (ids, field, value) =>
      onSetCellValueOnRows(ids, field, value as never),
  });

  const getDisplayValue = useCallback(
    <K extends keyof EquipmentRecord>(row: EquipmentRecord, field: K): EquipmentRecord[K] =>
      getBulkDisplayValue(row, field, dirtyRows),
    [dirtyRows]
  );

  const columns = useMemo<ColumnDef<EquipmentRecord>[]>(() => {
    const editableTextCol = (
      key: 'manufacturer' | 'model' | 'serial_number' | 'location',
      title: string,
      extra: Partial<BulkEditableCellProps> = {}
    ): ColumnDef<EquipmentRecord> => ({
      id: key,
      accessorKey: key,
      header: ({ column }) => <BulkGridSortableHeader column={column} title={title} />,
      cell: ({ row }) => (
        <BulkEditableCell
          rowId={row.original.id}
          field={key}
          type="text"
          value={(getDisplayValue(row.original, key) as string | null) ?? null}
          initialValue={(row.original[key] as string | null) ?? null}
          onChange={(next) => handleCellChange(row.original.id, key, next as EquipmentRecord[typeof key])}
          onSelectRow={onToggleSelected}
          onCancelPendingSelect={cancelPendingSelection}
          {...extra}
        />
      ),
      enableSorting: true,
    });

    return [
      {
        id: 'select',
        header: () => {
          const allSelected = rows.length > 0 && rows.every((r) => selectedRowIds.has(r.id));
          const someSelected = rows.some((r) => selectedRowIds.has(r.id));
          const checked: boolean | 'indeterminate' = allSelected
            ? true
            : someSelected
              ? 'indeterminate'
              : false;
          return (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => {
                if (value === true) onSelectAll(rows.map((r) => r.id));
                else onClearSelection();
              }}
              aria-label={t('equipmentBulk.selectAllRows')}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRowIds.has(row.original.id)}
            onCheckedChange={() => onToggleSelected(row.original.id)}
            aria-label={t('equipmentBulk.selectRow', { name: row.original.name })}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <BulkGridSortableHeader column={column} title={t('equipmentBulk.name')} />,
        cell: ({ row }) => (
          <Link
            to={`/dashboard/equipment/${row.original.id}`}
            className="inline-flex min-h-8 items-center font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.name}
          </Link>
        ),
        enableSorting: true,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <BulkGridSortableHeader column={column} title={t('equipmentBulk.status')} />,
        cell: ({ row }) => (
          <BulkEditableCell
            rowId={row.original.id}
            field="status"
            type="select"
            selectOptions={statusOptions}
            value={getDisplayValue(row.original, 'status') as string}
            initialValue={row.original.status}
            formatDisplay={(v) =>
              statusOptions.find((o) => o.value === v)?.label ?? String(v ?? '')
            }
            onChange={(next) =>
              handleCellChange(row.original.id, 'status', next as EquipmentRecord['status'])
            }
            onSelectRow={onToggleSelected}
            onCancelPendingSelect={cancelPendingSelection}
          />
        ),
        enableSorting: true,
      },
      editableTextCol('manufacturer', t('equipmentBulk.manufacturer')),
      editableTextCol('model', t('equipmentBulk.model')),
      editableTextCol('serial_number', t('equipmentBulk.serialNumber'), { mono: true }),
      {
        id: 'working_hours',
        accessorKey: 'working_hours',
        header: ({ column }) => <BulkGridSortableHeader column={column} title={t('equipmentBulk.hours')} align="right" />,
        cell: ({ row }) => (
          <BulkEditableCell
            rowId={row.original.id}
            field="working_hours"
            type="number"
            align="right"
            mono
            value={(getDisplayValue(row.original, 'working_hours') as number | null) ?? null}
            initialValue={row.original.working_hours ?? null}
            formatDisplay={(v) => (typeof v === 'number' ? v.toLocaleString() : '—')}
            onChange={(next) =>
              handleCellChange(row.original.id, 'working_hours', (next as number | null))
            }
            onSelectRow={onToggleSelected}
            onCancelPendingSelect={cancelPendingSelection}
          />
        ),
        enableSorting: true,
      },
      editableTextCol('location', t('equipmentBulk.location')),
      {
        id: 'team_name',
        accessorKey: 'team_name',
        header: ({ column }) => <BulkGridSortableHeader column={column} title={t('equipmentBulk.team')} />,
        cell: ({ row }) =>
          row.original.team_id && row.original.team_name ? (
            <Link
              to={`/dashboard/teams/${row.original.team_id}`}
              className="inline-flex min-h-8 items-center underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.team_name}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: true,
      },
    ];
  }, [
    rows,
    selectedRowIds,
    onToggleSelected,
    onSelectAll,
    onClearSelection,
    getDisplayValue,
    handleCellChange,
    cancelPendingSelection,
    statusOptions,
    t,
  ]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <>
      <BulkTanstackTableShell
        table={table}
        columnCount={columns.length}
        emptyMessage={t('equipmentBulk.empty')}
        selectedRowIds={selectedRowIds}
        getRowId={(row) => row.id}
        isRowDirty={(row) => dirtyRows.has(row.id)}
        onRowClick={handleRowClick}
      />

      <BulkApplyConfirmDialog
        open={pendingApply !== null}
        fieldLabel={pendingApply?.fieldLabel ?? ''}
        selectedCount={selectedRowIds.size}
        onApplyAll={handleApplyAll}
        onApplyOne={handleApplyOne}
        onCancel={clearPendingApply}
      />
    </>
  );
};
