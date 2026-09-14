import React from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MobileToolbarSheetContent } from '@/components/common/MobileToolbarSheetContent';
import { MobileListPersonalizationSheet } from '@/components/common/MobileListPersonalizationSheet';
import { ListSortFieldControls } from '@/components/common/ListSortFieldControls';
import type { ListSortFieldKind } from '@/components/common/listSortFieldKind';
import { InventoryLocationFilterSelect } from '@/features/inventory/components/InventoryLocationFilterSelect';
import type { InventoryFilters } from '@/features/inventory/types/inventory';
import { useI18n } from '@/i18n';

const SORT_FIELDS: {
  value: NonNullable<InventoryFilters['sortBy']>;
  labelKey: string;
  kind: ListSortFieldKind;
}[] = [
  { value: 'name', labelKey: 'inventoryList.sortName', kind: 'text' },
  { value: 'sku', labelKey: 'inventoryList.sortSku', kind: 'text' },
  { value: 'external_id', labelKey: 'inventoryList.sortExternalId', kind: 'text' },
  { value: 'quantity_on_hand', labelKey: 'inventoryList.sortQuantity', kind: 'numeric' },
  { value: 'location', labelKey: 'inventoryList.sortLocationName', kind: 'text' },
  { value: 'status', labelKey: 'inventoryList.sortStatus', kind: 'default' },
];

export interface MobileInventoryToolbarProps {
  filters: InventoryFilters;
  onFilterChange: (patch: Partial<InventoryFilters>) => void;
  onClearFilters: () => void;
  uniqueLocations: string[];
}

const DEFAULT_SORT_BY: NonNullable<InventoryFilters['sortBy']> = 'name';
const DEFAULT_SORT_ORDER: NonNullable<InventoryFilters['sortOrder']> = 'asc';

const MobileInventoryToolbar: React.FC<MobileInventoryToolbarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  uniqueLocations,
}) => {
  const { t } = useI18n();
  const [isPersonalizationOpen, setIsPersonalizationOpen] = React.useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);

  const sortBy = filters.sortBy ?? DEFAULT_SORT_BY;
  const sortOrder = filters.sortOrder ?? DEFAULT_SORT_ORDER;
  const hasNonDefaultSort = sortBy !== DEFAULT_SORT_BY || sortOrder !== DEFAULT_SORT_ORDER;
  const sheetFilterCount = (filters.lowStockOnly ? 1 : 0) + (filters.location ? 1 : 0);
  const sortOptions = SORT_FIELDS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    kind: option.kind,
  }));

  const toggleSortOrder = () => {
    onFilterChange({
      sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSortFieldChange = (value: string) => {
    const next = value as NonNullable<InventoryFilters['sortBy']>;
    onFilterChange({
      sortBy: next,
      sortOrder: sortBy === next ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc',
    });
  };

  const canClearFilters = !!filters.location || filters.lowStockOnly;
  const openFiltersAria = sheetFilterCount > 0
    ? t('inventoryList.openFiltersActive', { count: sheetFilterCount })
    : t('inventoryList.openFilters');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('inventoryList.searchPlaceholderMobile')}
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="h-11 pl-9"
            aria-label={t('inventoryList.searchAriaMobile')}
          />
        </div>

        <MobileListPersonalizationSheet
          open={isPersonalizationOpen}
          onOpenChange={setIsPersonalizationOpen}
          hasNonDefaultSort={hasNonDefaultSort}
          description={t('inventoryList.mobilePersonalizationDescription')}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('inventoryList.sortBy')}
            </p>
            <ListSortFieldControls
              sortField={sortBy}
              sortOrder={sortOrder}
              options={sortOptions}
              onFieldChange={handleSortFieldChange}
              onOrderToggle={toggleSortOrder}
              fieldSelectAriaLabel={t('inventoryList.sortInventoryByField')}
            />
          </div>
        </MobileListPersonalizationSheet>

        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-11 w-11 shrink-0"
              aria-label={openFiltersAria}
            >
              <Filter className="h-4 w-4" aria-hidden />
              {sheetFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {sheetFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <MobileToolbarSheetContent>
            <SheetHeader className="pb-2 text-left">
              <SheetTitle>{t('inventoryList.filterInventory')}</SheetTitle>
              <SheetDescription>
                {t('inventoryList.filterInventoryDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 pb-8 pt-2">
              {uniqueLocations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('inventoryList.locationName')}
                  </p>
                  <InventoryLocationFilterSelect
                    value={filters.location ?? '__all__'}
                    onValueChange={(v) =>
                      onFilterChange({ location: v === '__all__' ? undefined : v })
                    }
                    uniqueLocations={uniqueLocations}
                    triggerClassName="h-11"
                    iconClassName="mr-2 h-4 w-4 shrink-0 text-muted-foreground"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                  <Label htmlFor="low-stock-mobile-sheet" className="text-base font-medium">
                    {t('inventoryList.lowStockOnly')}
                  </Label>
                </div>
                <Switch
                  id="low-stock-mobile-sheet"
                  checked={filters.lowStockOnly}
                  onCheckedChange={(checked) => onFilterChange({ lowStockOnly: checked })}
                />
              </div>

              <Button
                variant="outline"
                className="h-12 w-full touch-manipulation"
                disabled={!canClearFilters}
                onClick={onClearFilters}
              >
                {t('inventoryList.clearAllFilters')}
              </Button>
            </div>
          </MobileToolbarSheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileInventoryToolbar;
