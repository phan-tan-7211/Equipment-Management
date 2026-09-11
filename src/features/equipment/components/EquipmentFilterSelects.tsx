import React from 'react';
import { Building, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EQUIPMENT_STATUS_FILTER_VALUES } from '@/features/equipment/components/equipmentFilterConstants';
import { useI18n } from '@/i18n';

export type EquipmentStatusSelectLabels = {
  all: string;
  active: string;
  maintenance: string;
  inactive: string;
  out_of_service: string;
};

type EquipmentStatusSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  triggerId?: string;
  triggerClassName?: string;
  labels?: EquipmentStatusSelectLabels;
  leadingIcon?: React.ReactNode;
};

export function EquipmentStatusSelect({
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  triggerId,
  triggerClassName,
  labels,
  leadingIcon,
}: EquipmentStatusSelectProps) {
  const { t } = useI18n();
  const resolvedLabels: EquipmentStatusSelectLabels = labels ?? {
    all: t('equipmentList.allStatus'),
    active: t('equipmentList.active'),
    maintenance: t('equipmentList.maintenance'),
    inactive: t('equipmentList.inactive'),
    out_of_service: t('equipmentList.outOfService'),
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={triggerId}
        className={triggerClassName}
        aria-label={ariaLabel ?? t('equipmentList.filterByStatus')}
      >
        {leadingIcon}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {EQUIPMENT_STATUS_FILTER_VALUES.map((statusValue) => (
          <SelectItem key={statusValue} value={statusValue}>
            {resolvedLabels[statusValue]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type EquipmentManufacturerSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  manufacturers: string[];
  placeholder?: string;
  ariaLabel?: string;
  triggerId?: string;
  triggerClassName?: string;
  allLabel?: string;
  showIcon?: boolean;
};

export function EquipmentManufacturerSelect({
  value,
  onValueChange,
  manufacturers,
  placeholder,
  ariaLabel,
  triggerId,
  triggerClassName,
  allLabel,
  showIcon = false,
}: EquipmentManufacturerSelectProps) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={triggerId}
        className={triggerClassName}
        aria-label={ariaLabel ?? t('equipmentList.manufacturer')}
      >
        {showIcon ? (
          <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
        ) : (
          <Building className="h-4 w-4 mr-2" />
        )}
        <SelectValue placeholder={placeholder ?? t('equipmentList.manufacturer')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel ?? t('equipmentList.allManufacturers')}</SelectItem>
        {manufacturers.map((manufacturer) => (
          <SelectItem key={manufacturer} value={manufacturer}>
            {manufacturer}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type EquipmentLocationSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  locations: string[];
  placeholder?: string;
  ariaLabel?: string;
  triggerId?: string;
  triggerClassName?: string;
  allLabel?: string;
  showIcon?: boolean;
};

export function EquipmentLocationSelect({
  value,
  onValueChange,
  locations,
  placeholder,
  ariaLabel,
  triggerId,
  triggerClassName,
  allLabel,
  showIcon = false,
}: EquipmentLocationSelectProps) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={triggerId}
        className={triggerClassName}
        aria-label={ariaLabel ?? t('equipmentList.location')}
      >
        {showIcon ? (
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
        ) : (
          <MapPin className="h-4 w-4 mr-2" />
        )}
        <SelectValue placeholder={placeholder ?? t('equipmentList.location')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel ?? t('equipmentList.allLocations')}</SelectItem>
        {locations.map((location) => (
          <SelectItem key={location} value={location}>
            {location}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
