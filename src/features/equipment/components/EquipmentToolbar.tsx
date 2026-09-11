import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GridTableViewModeToggle } from '@/components/common/GridTableViewModeToggle';
import { ToolbarSearchInput } from '@/components/common/ToolbarSearchInput';
import EquipmentFilterPopover from './EquipmentFilterPopover';
import EquipmentSortPopover from './EquipmentSortPopover';
import EquipmentImportMenu from './EquipmentImportMenu';
import EquipmentDownloadMenu from './EquipmentDownloadMenu';
import type { EquipmentListToolbarProps } from '@/features/equipment/components/equipmentFilterTypes';
import type { EquipmentFilters } from '@/features/equipment/hooks/useEquipmentFiltering';
import { useI18n } from '@/i18n';

type EquipmentToolbarProps = EquipmentListToolbarProps;

const EquipmentToolbar: React.FC<EquipmentToolbarProps> = ({
  filters, sortConfig, onFilterChange, onClearFilters, onQuickFilter, onSortChange,
  filterOptions, hasActiveFilters, activeQuickFilter, viewMode, onViewModeChange,
  canImport = false, canExport = false, onImportCsv, equipment = [], columnPicker,
}) => {
  const { t } = useI18n();
  const activeFilterCount = [
    filters.status !== 'all', filters.manufacturer !== 'all', filters.location !== 'all',
    !!(filters.maintenanceDateFrom || filters.maintenanceDateTo),
    !!(filters.installationDateFrom || filters.installationDateTo), filters.warrantyExpiring,
  ].filter(Boolean).length;
  const showRightControls = canImport || canExport;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ToolbarSearchInput value={filters.search} onChange={(value) => onFilterChange('search', value)} placeholder={t('equipment.searchPlaceholder')} ariaLabel={t('equipment.searchAria')} />
          <Separator orientation="vertical" className="h-5" />
          <EquipmentFilterPopover filters={filters} onFilterChange={onFilterChange} onClearFilters={onClearFilters} onQuickFilter={onQuickFilter} filterOptions={filterOptions} activeFilterCount={activeFilterCount} activeQuickFilter={activeQuickFilter} />
          {viewMode !== 'table' && <EquipmentSortPopover sortConfig={sortConfig} onSortChange={onSortChange} />}
          {columnPicker}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showRightControls && <>{canImport && <EquipmentImportMenu onImportCsv={onImportCsv ?? (() => {})} />}{canExport && <EquipmentDownloadMenu equipment={equipment} />}</>}
          {showRightControls && <Separator orientation="vertical" className="hidden md:block h-5" />}
          <GridTableViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} gridValue="grid" tableValue="table" />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-xs text-muted-foreground">{t('equipment.active')}:</span>
          {filters.status !== 'all' && <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">{t('equipment.status')}: {filters.status.replace('_', ' ')}<button onClick={() => onFilterChange('status', 'all')} className="ml-0.5 hover:text-foreground" aria-label={t('equipment.clearStatusFilter')}><X className="h-3 w-3" /></button></Badge>}
          {filters.manufacturer !== 'all' && <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">{filters.manufacturer}<button onClick={() => onFilterChange('manufacturer', 'all')} className="ml-0.5 hover:text-foreground" aria-label={t('equipment.clearManufacturerFilter')}><X className="h-3 w-3" /></button></Badge>}
          {filters.location !== 'all' && <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">{filters.location}<button onClick={() => onFilterChange('location', 'all')} className="ml-0.5 hover:text-foreground" aria-label={t('equipment.clearLocationFilter')}><X className="h-3 w-3" /></button></Badge>}
          {filters.warrantyExpiring && <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">{t('equipment.warrantyExpiring')}<button onClick={() => onFilterChange('warrantyExpiring' as keyof EquipmentFilters, 'false')} className="ml-0.5 hover:text-foreground" aria-label={t('equipment.clearWarrantyFilter')}><X className="h-3 w-3" /></button></Badge>}
          <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onClearFilters}>{t('equipment.clearAll')}</Button>
        </div>
      )}
    </div>
  );
};

export default EquipmentToolbar;
