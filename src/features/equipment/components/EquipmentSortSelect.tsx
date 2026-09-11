import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { EQUIPMENT_SORT_OPTIONS } from '@/features/equipment/components/equipmentSortOptions';
import { useI18n } from '@/i18n';

type EquipmentSortSelectProps = {
  compositeValue: string;
  onValueChange: (value: string) => void;
  triggerClassName?: string;
};

export function EquipmentSortSelect({
  compositeValue,
  onValueChange,
  triggerClassName = 'w-[200px]',
}: EquipmentSortSelectProps) {
  const { t } = useI18n();
  return (
    <Select value={compositeValue} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName} aria-label={t('equipmentList.sortEquipment')}>
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EQUIPMENT_SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
