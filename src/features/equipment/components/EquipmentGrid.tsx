import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import EquipmentCard from './EquipmentCard';
import EquipmentEmptyState from './EquipmentEmptyState';
import EquipmentTable from './EquipmentTable';
import type { EquipmentViewMode } from './EquipmentCard';
import type { EquipmentPMStatus } from '@/features/equipment/hooks/useEquipmentPMStatus';
import type { SortConfig } from '@/features/equipment/hooks/useEquipmentFiltering';
import { supabase } from '@/integrations/supabase/client';

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
}) => {
  const equipmentIds = useMemo(() => equipment.map((item) => item.id).sort(), [equipment]);
  const { data: managementCodes = [] } = useQuery({
    queryKey: ['equipment-management-codes', equipmentIds],
    enabled: equipmentIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('equipment')
        .select('id, management_code')
        .in('id', equipmentIds);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; management_code: string | null }>;
    },
  });

  const equipmentWithCodes = useMemo(() => {
    const codeById = new Map(managementCodes.map((row) => [row.id, row.management_code]));
    return equipment.map((item) => ({
      ...item,
      management_code: item.management_code ?? codeById.get(item.id) ?? null,
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
