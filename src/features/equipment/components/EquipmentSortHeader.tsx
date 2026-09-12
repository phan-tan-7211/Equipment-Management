import React from 'react';
import { GridTableViewModeToggle } from '@/components/common/GridTableViewModeToggle';
import { SortConfig } from '@/features/equipment/hooks/useEquipmentFiltering';
import type { EquipmentViewMode } from './EquipmentCard';
import { EQUIPMENT_SORT_OPTIONS } from '@/features/equipment/components/equipmentSortOptions';
import { EquipmentSortSelect } from '@/features/equipment/components/EquipmentSortSelect';
import { useI18n } from '@/i18n';

interface EquipmentSortHeaderProps {
  sortConfig: SortConfig;
  onSortChange: (field: string, direction?: 'asc' | 'desc') => void;
  resultCount: number;
  totalCount: number;
  viewMode?: EquipmentViewMode;
  onViewModeChange?: (mode: EquipmentViewMode) => void;
}

const EquipmentSortHeader: React.FC<EquipmentSortHeaderProps> = ({
  sortConfig,
  onSortChange,
  resultCount,
  totalCount,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const { t } = useI18n();
  const compositeValue = `${sortConfig.field}:${sortConfig.direction}`;
  const currentOption =
    EQUIPMENT_SORT_OPTIONS.find((option) => option.value === compositeValue) ??
    EQUIPMENT_SORT_OPTIONS.find((option) => option.value.startsWith(`${sortConfig.field}:`));
  const currentLabel = currentOption ? t(currentOption.labelKey) : sortConfig.field;

  const handleCompositeChange = (value: string) => {
    const [field, direction] = value.split(':') as [string, 'asc' | 'desc'];
    onSortChange(field, direction);
  };

  return (
    <div className="mb-4 flex items-center justify-between md:mb-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {t('equipmentList.sortedSummary', {
          label: currentLabel,
          shown: resultCount,
          total: totalCount,
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        {t('equipmentList.showingSummary', { shown: resultCount, total: totalCount })}
      </div>
      <div className="flex items-center gap-2">
        <EquipmentSortSelect
          compositeValue={compositeValue}
          onValueChange={handleCompositeChange}
        />

        {onViewModeChange && (
          <GridTableViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            gridValue="grid"
            tableValue="table"
          />
        )}
      </div>
    </div>
  );
};

export default EquipmentSortHeader;
