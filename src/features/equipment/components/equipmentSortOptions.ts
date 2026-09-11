import type { ListSortFieldKind } from '@/components/common/listSortFieldKind';

export type EquipmentSortFieldOption = {
  value: string;
  labelKey: string;
  kind: ListSortFieldKind;
  defaultOrder: 'asc' | 'desc';
};

export type EquipmentSortOption = {
  value: string;
  labelKey: string;
};

/** Field-only options for mobile Personalize list (direction is toggled separately). */
export const EQUIPMENT_SORT_FIELD_OPTIONS: EquipmentSortFieldOption[] = [
  { value: 'name', labelKey: 'equipmentList.sortName', kind: 'text', defaultOrder: 'asc' },
  { value: 'working_hours', labelKey: 'equipmentList.sortHours', kind: 'numeric', defaultOrder: 'desc' },
  { value: 'last_maintenance', labelKey: 'equipmentList.sortLastMaintenance', kind: 'default', defaultOrder: 'desc' },
  { value: 'updated_at', labelKey: 'equipmentList.sortLastUpdated', kind: 'default', defaultOrder: 'desc' },
  { value: 'status', labelKey: 'equipmentList.sortStatus', kind: 'default', defaultOrder: 'asc' },
  { value: 'location', labelKey: 'equipmentList.sortLocation', kind: 'text', defaultOrder: 'asc' },
  { value: 'manufacturer', labelKey: 'equipmentList.sortManufacturer', kind: 'text', defaultOrder: 'asc' },
  { value: 'created_at', labelKey: 'equipmentList.sortCreatedDate', kind: 'default', defaultOrder: 'desc' },
  { value: 'warranty_expiration', labelKey: 'equipmentList.sortWarrantyExpiration', kind: 'default', defaultOrder: 'asc' },
];

/** Composite options for desktop sort popover / select. */
export const EQUIPMENT_SORT_OPTIONS: EquipmentSortOption[] = [
  { value: 'name:asc', labelKey: 'equipmentList.sortNameAsc' },
  { value: 'name:desc', labelKey: 'equipmentList.sortNameDesc' },
  { value: 'working_hours:desc', labelKey: 'equipmentList.sortHoursDesc' },
  { value: 'working_hours:asc', labelKey: 'equipmentList.sortHoursAsc' },
  { value: 'last_maintenance:desc', labelKey: 'equipmentList.sortLastMaintenanceDesc' },
  { value: 'updated_at:desc', labelKey: 'equipmentList.sortLastUpdatedDesc' },
  { value: 'status:asc', labelKey: 'equipmentList.sortStatusAsc' },
  { value: 'location:asc', labelKey: 'equipmentList.sortLocationAsc' },
  { value: 'manufacturer:asc', labelKey: 'equipmentList.sortManufacturerAsc' },
  { value: 'created_at:desc', labelKey: 'equipmentList.sortRecentlyAdded' },
  { value: 'warranty_expiration:asc', labelKey: 'equipmentList.sortWarrantyExpirationAsc' },
];

export function getEquipmentSortFieldDefaultOrder(field: string): 'asc' | 'desc' {
  return (
    EQUIPMENT_SORT_FIELD_OPTIONS.find((option) => option.value === field)?.defaultOrder ?? 'asc'
  );
}
