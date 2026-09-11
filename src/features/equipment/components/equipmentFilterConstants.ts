/** Shared equipment filter option values. */

export const EQUIPMENT_STATUS_FILTER_VALUES = [
  'all',
  'active',
  'maintenance',
  'inactive',
  'out_of_service',
] as const;

export const EQUIPMENT_QUICK_FILTERS = [
  { labelKey: 'equipmentList.quickMaintenanceDue', value: 'maintenance-due' },
  { labelKey: 'equipmentList.quickWarrantyExpiring', value: 'warranty-expiring' },
  { labelKey: 'equipmentList.quickRecentlyAdded', value: 'recently-added' },
  { labelKey: 'equipmentList.quickActiveOnly', value: 'active-only' },
] as const;
