import React from 'react';
import { FilterPopoverClearAllFooter } from '@/components/filters/FilterPopoverClearAllFooter';
import { FilterPopoverShell } from '@/components/filters/FilterPopoverShell';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { EquipmentFilters } from '@/features/equipment/hooks/useEquipmentFiltering';
import {
  EquipmentLocationSelect,
  EquipmentManufacturerSelect,
  EquipmentStatusSelect,
} from '@/features/equipment/components/EquipmentFilterSelects';
import { EQUIPMENT_QUICK_FILTERS } from '@/features/equipment/components/equipmentFilterConstants';
import { EquipmentStatusRailLegend } from '@/features/equipment/components/EquipmentStatusRailLegend';
import { useI18n } from '@/i18n';

interface FilterOptions {
  manufacturers: string[];
  locations: string[];
}

interface EquipmentFilterPopoverProps {
  filters: EquipmentFilters;
  onFilterChange: (key: keyof EquipmentFilters, value: string) => void;
  onClearFilters: () => void;
  onQuickFilter: (preset: string) => void;
  filterOptions: FilterOptions;
  activeFilterCount: number;
  activeQuickFilter?: string | null;
}

const EquipmentFilterPopover: React.FC<EquipmentFilterPopoverProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onQuickFilter,
  filterOptions,
  activeFilterCount,
  activeQuickFilter,
}) => {
  const { t } = useI18n();
  return (
    <FilterPopoverShell ariaSubject={t('equipment.title')} activeFilterCount={activeFilterCount}>
      {({ close }) => (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t('equipmentList.status')}</span>
            <EquipmentStatusSelect
              value={filters.status}
              onValueChange={(value) => onFilterChange('status', value)}
              placeholder={t('equipmentList.allStatuses')}
              triggerClassName="h-8 text-sm"
            />
          </div>

          <EquipmentStatusRailLegend />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t('equipmentList.manufacturer')}</span>
            <EquipmentManufacturerSelect
              value={filters.manufacturer}
              onValueChange={(value) => onFilterChange('manufacturer', value)}
              manufacturers={filterOptions.manufacturers}
              placeholder={t('equipmentList.allManufacturers')}
              ariaLabel={t('equipmentList.filterByManufacturer')}
              triggerClassName="h-8 text-sm"
              showIcon
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t('equipmentList.location')}</span>
            <EquipmentLocationSelect
              value={filters.location}
              onValueChange={(value) => onFilterChange('location', value)}
              locations={filterOptions.locations}
              placeholder={t('equipmentList.allLocations')}
              ariaLabel={t('equipmentList.filterByLocation')}
              triggerClassName="h-8 text-sm"
              showIcon
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">{t('equipmentList.quickFilters')}</p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_QUICK_FILTERS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onQuickFilter(preset.value)}
                  className={cn(
                    'inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                    activeQuickFilter === preset.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <FilterPopoverClearAllFooter
            activeFilterCount={activeFilterCount}
            onClearFilters={onClearFilters}
            onClose={close}
          />
        </>
      )}
    </FilterPopoverShell>
  );
};

export default EquipmentFilterPopover;
