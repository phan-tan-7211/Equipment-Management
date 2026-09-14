import { useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns3,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  INVENTORY_TABLE_COLUMN_META,
  type InventoryTableColumnKey,
} from '@/features/inventory/components/inventoryTableColumns';
import { useI18n } from '@/i18n';

type InventoryColumnManagerProps = {
  columnVisibility: Record<string, boolean>;
  columnOrder: InventoryTableColumnKey[];
  hasOverrides: boolean;
  onMoveColumn: (key: InventoryTableColumnKey, direction: 'up' | 'down') => void;
  onAddColumn: (key: InventoryTableColumnKey) => void;
  onRemoveColumn: (key: InventoryTableColumnKey) => void;
  onResetColumns: () => void;
  onResetWidths: () => void;
  onResetAll: () => void;
};

export function InventoryColumnManager({
  columnVisibility,
  columnOrder,
  hasOverrides,
  onMoveColumn,
  onAddColumn,
  onRemoveColumn,
  onResetColumns,
  onResetWidths,
  onResetAll,
}: InventoryColumnManagerProps) {
  const { t } = useI18n();
  const { shownColumns, availableColumns } = useMemo(() => {
    const shown = columnOrder.filter((key) => columnVisibility[key] !== false);
    const available = INVENTORY_TABLE_COLUMN_META.filter(
      (meta) => meta.canHide && columnVisibility[meta.key] === false,
    );
    return { shownColumns: shown, availableColumns: available };
  }, [columnOrder, columnVisibility]);
  const getColumnTitle = (key: InventoryTableColumnKey) =>
    t(`inventoryList.columns.${key}`);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          aria-label={t('inventoryList.manageTableColumns')}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t('inventoryList.columnsButton')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns3 className="h-4 w-4" aria-hidden />
            {t('inventoryList.tableColumns')}
          </DialogTitle>
          <DialogDescription>
            {t('inventoryList.tableColumnsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('inventoryList.availableFields')}</p>
            <ScrollArea className="h-56 rounded-md border p-2">
              <div className="space-y-1">
                {availableColumns.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                    {t('inventoryList.allOptionalFieldsShown')}
                  </p>
                ) : (
                  availableColumns.map((meta) => {
                    const title = getColumnTitle(meta.key);
                    return (
                      <div
                        key={meta.key}
                        className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
                      >
                        <span className="flex-1 text-sm">{title}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onAddColumn(meta.key)}
                          aria-label={t('inventoryList.showColumn', { column: title })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('inventoryList.shownFields')}</p>
            <ScrollArea className="h-56 rounded-md border p-2">
              <div className="space-y-1">
                {shownColumns.map((key, index) => {
                  const meta = INVENTORY_TABLE_COLUMN_META.find((c) => c.key === key);
                  if (!meta) return null;
                  const title = getColumnTitle(meta.key);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 rounded-md border bg-card px-2 py-1.5"
                    >
                      <span className="flex-1 text-sm">{title}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => onMoveColumn(key, 'up')}
                        aria-label={t('inventoryList.moveColumnUp', { column: title })}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === shownColumns.length - 1}
                        onClick={() => onMoveColumn(key, 'down')}
                        aria-label={t('inventoryList.moveColumnDown', { column: title })}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      {meta.canHide ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRemoveColumn(key)}
                          aria-label={t('inventoryList.hideColumn', { column: title })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onResetColumns}>
              {t('inventoryList.resetColumns')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onResetWidths}>
              {t('inventoryList.resetWidths')}
            </Button>
            {hasOverrides && (
              <Button type="button" variant="ghost" size="sm" onClick={onResetAll}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden />
                {t('inventoryList.resetAll')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
