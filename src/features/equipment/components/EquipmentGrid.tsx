import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import EquipmentCard from './EquipmentCard';
import EquipmentEmptyState from './EquipmentEmptyState';
import EquipmentTable from './EquipmentTable';
import type { EquipmentViewMode } from './EquipmentCard';
import type { EquipmentPMStatus } from '@/features/equipment/hooks/useEquipmentPMStatus';
import type {
  EquipmentColumnFilterOptions,
  SortConfig,
} from '@/features/equipment/hooks/useEquipmentFiltering';
import type {
  EquipmentColumnFilterKey,
  EquipmentColumnFilters,
} from '@/features/equipment/services/EquipmentService';
import { supabase } from '@/integrations/supabase/client';
import { getCustomAttributeValue, stringifyCustomAttributeValue } from '@/features/equipment/utils/customAttributeDisplay';

interface Equipment {
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
  management_code?: string | null;
  custom_attributes?: Record<string, unknown> | null;
  management_responsible_primary?: string | null;
  management_responsible_secondary?: string | null;
}

interface EquipmentGridProps {
  equipment: Equipment[];
  searchQuery: string;
  statusFilter: string;
  organizationName: string;
  canCreate: boolean;
  onShowQRCode: (id: string) => void;
  onAddEquipment: () => void;
  onClearFilters?: () => void;
  viewMode?: EquipmentViewMode;
  pmStatuses?: Map<string, EquipmentPMStatus>;
  sortConfig?: SortConfig;
  onSortChange?: (field: string, direction?: 'asc' | 'desc') => void;
  /** Forwarded to `EquipmentTable` when `viewMode === 'table'`. */
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (key: string) => void;
  organizationId?: string;
  columnFilterOptions?: EquipmentColumnFilterOptions;
  columnFilters?: EquipmentColumnFilters;
  onColumnFilterChange?: (key: EquipmentColumnFilterKey, values: string[]) => void;
}

const EquipmentGrid: React.FC<EquipmentGridProps> = ({
  equipment,
  searchQuery,
  statusFilter,
  organizationName,
  canCreate,
  onShowQRCode,
  onAddEquipment,
  onClearFilters,
  viewMode = 'grid',
  pmStatuses,
  sortConfig,
  onSortChange,
  visibleColumns,
  onToggleColumn,
  organizationId,
  columnFilterOptions,
  columnFilters,
  onColumnFilterChange,
}) => {
  const equipmentIds = useMemo(() => equipment.map((item) => item.id).sort(), [equipment]);
  const { data: managementCodes = [] } = useQuery({
    queryKey: ['equipment-management-codes', equipmentIds, viewMode],
    enabled: equipmentIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('equipment')
        .select(viewMode === 'table' ? 'id, management_code, custom_attributes' : 'id, management_code')
        .in('id', equipmentIds);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; management_code: string | null; custom_attributes?: Record<string, unknown> | null }>;
    },
  });

  const equipmentWithCodes = useMemo(() => {
    const codeById = new Map(managementCodes.map((row) => [row.id, row.management_code]));
    const attributesById = new Map(managementCodes.map((row) => [row.id, row.custom_attributes ?? null]));
    return equipment.map((item) => ({
      ...item,
      management_code: item.management_code ?? codeById.get(item.id) ?? null,
      custom_attributes: item.custom_attributes ?? attributesById.get(item.id) ?? null,
      management_responsible_primary: stringifyCustomAttributeValue(getCustomAttributeValue(item.custom_attributes ?? attributesById.get(item.id), 'managementResponsiblePrimary')) || null,
      management_responsible_secondary: stringifyCustomAttributeValue(getCustomAttributeValue(item.custom_attributes ?? attributesById.get(item.id), 'managementResponsibleSecondary')) || null,
    }));
  }, [equipment, managementCodes]);

  if (equipment.length === 0) {
    return (
      <EquipmentEmptyState
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        organizationName={organizationName}
        canCreate={canCreate}
        onAddEquipment={onAddEquipment}
        onClearFilters={onClearFilters}
      />
    );
  }

  if (viewMode === 'table') {
    return (
      <EquipmentTable
        equipment={equipmentWithCodes}
        onShowQRCode={onShowQRCode}
        pmStatuses={pmStatuses}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
        visibleColumns={visibleColumns}
        onToggleColumn={onToggleColumn}
        organizationId={organizationId}
        columnFilterOptions={columnFilterOptions}
        columnFilters={columnFilters}
        onColumnFilterChange={onColumnFilterChange}
      />
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-2 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {equipmentWithCodes.map((item, index) => (
        <div key={item.id} className="min-w-0 md:cv-auto-lg md:h-full">
          <EquipmentCard
            equipment={item}
            onShowQRCode={onShowQRCode}
            viewMode="grid"
            pmStatus={pmStatuses?.get(item.id)}
            listIndex={index}
          />
        </div>
      ))}
    </div>
  );
};

export default EquipmentGrid;
