import React from 'react';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/i18n';

type InventoryLocationFilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  uniqueLocations: string[];
  triggerClassName?: string;
  iconClassName?: string;
  allLocationsLabel?: string;
};

export function InventoryLocationFilterSelect({
  value,
  onValueChange,
  uniqueLocations,
  triggerClassName,
  iconClassName = 'h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0',
  allLocationsLabel,
}: InventoryLocationFilterSelectProps) {
  const { t } = useI18n();
  const resolvedAllLocationsLabel = allLocationsLabel ?? t('inventoryList.allLocationNames');

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <MapPin className={iconClassName} aria-hidden />
        <SelectValue placeholder={resolvedAllLocationsLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{resolvedAllLocationsLabel}</SelectItem>
        {uniqueLocations.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
