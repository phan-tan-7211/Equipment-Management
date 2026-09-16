import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { flexRender, type Cell, type Header, type Table as TanStackTable } from '@tanstack/react-table';
import type { CSSProperties, DragEventHandler, PointerEventHandler, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function DataTableSortableHeaderButton({
  title,
  align,
  active,
  sortOrder,
  onClick,
  hideVisibleTitle = false,
}: {
  title: string;
  align?: 'left' | 'right' | 'center';
  active: boolean;
  sortOrder?: 'asc' | 'desc';
  onClick: () => void;
  hideVisibleTitle?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-1 rounded-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        !align || align === 'left' ? 'justify-start' : undefined,
      )}
      onClick={onClick}
      aria-label={`Sort by ${title}`}
    >
      {hideVisibleTitle ? <span className="sr-only">{title}</span> : <span>{title}</span>}
      <DataTableSortIcon active={active} sortOrder={sortOrder} />
    </button>
  );
}

export function DataTableStaticHeaderLabel({ title }: { title: string }) {
  return <span className="block w-full text-xs font-medium text-muted-foreground">{title}</span>;
}

type ResizableTableSurfaceProps<TData> = {
  table: TanStackTable<TData>;
  tableWidth: number;
  scrollClassName?: string;
  stickyHeader?: boolean;
  getHeaderProps: (header: Header<TData, unknown>) => {
    className: string;
    ariaSort?: 'ascending' | 'descending' | 'none';
    onAutoFit?: () => void;
    style?: CSSProperties;
    draggable?: boolean;
    onDragStart?: DragEventHandler<HTMLTableCellElement>;
    onDragOver?: DragEventHandler<HTMLTableCellElement>;
    onDrop?: DragEventHandler<HTMLTableCellElement>;
    onDragEnd?: DragEventHandler<HTMLTableCellElement>;
    onPointerDown?: PointerEventHandler<HTMLTableCellElement>;
    dataColumnKey?: string;
  };
  getCellClassName: (cell: Cell<TData, unknown>) => string;
  getCellStyle?: (cell: Cell<TData, unknown>) => CSSProperties | undefined;
  renderHeaderActions?: (header: Header<TData, unknown>) => ReactNode;
  getRowClassName?: (rowIndex: number) => string | undefined;
  emptyMessage?: string;
  emptyColSpan?: number;
  emptyCellClassName?: string;
};

export function ResizableTableSurface<TData>({
  table,
  tableWidth,
  scrollClassName = 'overflow-x-auto',
  stickyHeader = false,
  getHeaderProps,
  getCellClassName,
  getCellStyle,
  renderHeaderActions,
  getRowClassName,
  emptyMessage,
  emptyColSpan,
  emptyCellClassName,
}: ResizableTableSurfaceProps<TData>) {
  const rows = table.getRowModel().rows;

  return (
    <div className={scrollClassName}>
      <Table
        withWrapper={false}
        className="table-fixed"
        style={{ width: tableWidth, minWidth: '100%' }}
      >
        <colgroup>
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <col key={header.id} style={{ width: header.getSize() }} />
          ))}
        </colgroup>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const {
                  className,
                  ariaSort,
                  onAutoFit,
                  style,
                  draggable,
                  onDragStart,
                  onDragOver,
                  onDrop,
                  onDragEnd,
                  onPointerDown,
                  dataColumnKey,
                } = getHeaderProps(header);
                const hasPinnedOffset = stickyHeader && style?.left !== undefined;
                const resolvedHeaderStyle = stickyHeader
                  ? { ...style, zIndex: hasPinnedOffset ? 50 : 40 }
                  : style;
                const resolvedDraggable = onDragStart ? true : draggable;
                const resolvedPointerDown = onDragStart ? undefined : onPointerDown;

                return (
                  <TableHead
                    key={header.id}
                    className={stickyHeader ? cn(className, 'sticky top-0 bg-card') : className}
                    aria-sort={ariaSort ?? 'none'}
                    style={resolvedHeaderStyle}
                    draggable={resolvedDraggable}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    onPointerDown={resolvedPointerDown}
                    {...(dataColumnKey ? { 'data-table-column-key': dataColumnKey } : {})}
                  >
                    <div className="group relative min-h-8 min-w-0 pr-6">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {renderHeaderActions?.(header)}
                    </div>
                    <DataTableColumnResizeHandle header={header} onAutoFit={onAutoFit} />
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {emptyMessage && rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={emptyColSpan ?? table.getAllColumns().length}
                className={emptyCellClassName}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={row.id} className={getRowClassName?.(rowIndex)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={getCellClassName(cell)} style={getCellStyle?.(cell)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

type ResizableFixedDataTableProps<TData> = {
  table: TanStackTable<TData>;
  tableWidth: number;
  withTooltipProvider?: boolean;
  scrollClassName?: string;
  cardClassName?: string;
  contentClassName?: string;
  stickyHeader?: boolean;
  getHeaderProps: (header: Header<TData, unknown>) => {
    className: string;
    ariaSort?: 'ascending' | 'descending' | 'none';
    onAutoFit?: () => void;
    style?: CSSProperties;
    draggable?: boolean;
    onDragStart?: DragEventHandler<HTMLTableCellElement>;
    onDragOver?: DragEventHandler<HTMLTableCellElement>;
    onDrop?: DragEventHandler<HTMLTableCellElement>;
    onDragEnd?: DragEventHandler<HTMLTableCellElement>;
    onPointerDown?: PointerEventHandler<HTMLTableCellElement>;
    dataColumnKey?: string;
  };
  getCellClassName: (cell: Cell<TData, unknown>) => string;
  getCellStyle?: (cell: Cell<TData, unknown>) => CSSProperties | undefined;
  renderHeaderActions?: (header: Header<TData, unknown>) => ReactNode;
};

export function ResizableFixedDataTable<TData>({
  table,
  tableWidth,
  withTooltipProvider = false,
  scrollClassName = 'overflow-x-auto',
  cardClassName = 'overflow-hidden',
  contentClassName = 'p-0',
  stickyHeader = false,
  getHeaderProps,
  getCellClassName,
  getCellStyle,
  renderHeaderActions,
}: ResizableFixedDataTableProps<TData>) {
  const content = (
    <Card className={cardClassName}>
      <CardContent className={contentClassName}>
        <ResizableTableSurface
          table={table}
          tableWidth={tableWidth}
          scrollClassName={scrollClassName}
          stickyHeader={stickyHeader}
          getHeaderProps={getHeaderProps}
          getCellClassName={getCellClassName}
          getCellStyle={getCellStyle}
          renderHeaderActions={renderHeaderActions}
        />
      </CardContent>
    </Card>
  );

  if (withTooltipProvider) {
    return <TooltipProvider>{content}</TooltipProvider>;
  }

  return content;
}

export function DataTableSortIcon({
  active,
  sortOrder,
}: {
  active: boolean;
  sortOrder?: 'asc' | 'desc';
}) {
  if (!active) {
    return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden />;
  }

  return sortOrder === 'asc' ? (
    <ArrowUp className="h-3 w-3 shrink-0" aria-hidden />
  ) : (
    <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
  );
}

type DataTableColumnResizeHandleProps<THeader> = {
  header: Header<THeader, unknown>;
  onAutoFit?: () => void;
  className?: string;
};

export function DataTableColumnResizeHandle<THeader>({
  header,
  onAutoFit,
  className,
}: DataTableColumnResizeHandleProps<THeader>) {
  if (!header.column.getCanResize()) {
    return null;
  }

  return (
    <div
      data-slot="column-resize-handle"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        header.getResizeHandler()(event);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
        header.getResizeHandler()(event);
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={
        onAutoFit
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onAutoFit();
            }
          : undefined
      }
      className={cn(
        'absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none',
        onAutoFit ? 'bg-border/45 hover:bg-border/80' : 'w-1 hover:bg-border/80',
        header.column.getIsResizing() && 'bg-primary',
        className,
      )}
      aria-hidden
    />
  );
}

export function DataTableEmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
