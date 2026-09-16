import type { EquipmentTableColumnKey } from '@/features/equipment/components/equipmentTableColumns';
import {
  getStatusDisplayInfo,
  safeFormatDate,
} from '@/features/equipment/utils/equipmentHelpers';
import type { UserSettings } from '@/types/settings';

export interface EquipmentTableRow {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  last_maintenance?: string;
  image_url?: string;
  team_name?: string;
  team_id?: string | null;
  working_hours?: number | null;
  management_code?: string | null;
  custom_attributes?: Record<string, unknown> | null;
  management_responsible_primary?: string | null;
  management_responsible_secondary?: string | null;
  [key: string]: unknown;
}

export function getEquipmentTableCellDisplayValue(
  row: EquipmentTableRow,
  columnKey: EquipmentTableColumnKey,
  settings?: UserSettings,
): string {
  switch (columnKey) {
    case 'name':
      return row.management_code ? `${row.name} ${row.management_code}` : row.name;
    case 'status':
      return getStatusDisplayInfo(row.status).label;
    case 'manufacturer':
      return row.manufacturer || '—';
    case 'model':
      return row.model || '—';
    case 'serial_number':
      return row.serial_number || '—';
    case 'working_hours':
      return row.working_hours != null ? row.working_hours.toLocaleString() : '—';
    case 'location':
      return row.location || '—';
    case 'team_name':
      return row.team_name || '—';
    case 'last_maintenance':
      if (!row.last_maintenance) return '—';
      return safeFormatDate(row.last_maintenance, settings) ?? '—';
    case 'management_responsible_primary':
      return row.management_responsible_primary || '—';
    case 'management_responsible_secondary':
      return row.management_responsible_secondary || '—';
    default: {
      const exhaustive: never = columnKey;
      return exhaustive;
    }
  }
}
