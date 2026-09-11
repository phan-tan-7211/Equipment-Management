import React from 'react';
import { ListSortPopover } from '@/components/common/ListSortPopover';
import type { SortConfig } from '@/features/equipment/hooks/useEquipmentFiltering';
import { EQUIPMENT_SORT_OPTIONS } from '@/features/equipment/components/equipmentSortOptions';
import { useI18n } from '@/i18n';

interface EquipmentSortPopoverProps {
  sortConfig: SortConfig;
  onSortChange: (field: string, direction?: 'asc' | 'desc') => void;
}

const EquipmentSortPopover: React.FC<EquipmentSortPopoverProps> = ({
  sortConfig,
  onSortChange,
}) => {
  const { t } = useI18n();
  const compositeValue = `${sortConfig.field}:${sortConfig.direction}`;
  const localizedOptions = EQUIPMENT_SORT_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
  const currentLabel =
    localizedOptions.find((option) => option.value === compositeValue)?.label ??
    localizedOptions.find((option) => option.value.startsWith(`${sortConfig.field}:`))?.label ??
    sortConfig.field;

  return (
    <ListSortPopover
      sortOptions={localizedOptions}
      compositeValue={compositeValue}
      currentLabel={currentLabel}
      onSelect={(value) => {
        const [field, direction] = value.split(':') as [string, 'asc' | 'desc'];
        onSortChange(field, direction);
      }}
      ariaLabel={t('equipmentList.sortEquipment')}
      labelMaxWidthClass="max-w-[140px]"
    />
  );
};

export default EquipmentSortPopover;
