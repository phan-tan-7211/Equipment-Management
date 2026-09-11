import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEquipmentGroup,
  deleteEquipmentGroup,
  listActiveEquipmentGroups,
  listEquipmentGroups,
  setEquipmentGroupActive,
  updateEquipmentGroup,
} from '@/features/equipment-groups/services/equipmentGroupService';
import type { EquipmentGroupInput } from '@/features/equipment-groups/types';

const keys = {
  all: (organizationId: string) => ['equipment-groups', organizationId] as const,
  active: (organizationId: string) => ['equipment-groups', organizationId, 'active'] as const,
};

export function useEquipmentGroups(organizationId?: string) {
  return useQuery({
    queryKey: keys.all(organizationId ?? ''),
    queryFn: () => listEquipmentGroups(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useActiveEquipmentGroups(organizationId?: string) {
  return useQuery({
    queryKey: keys.active(organizationId ?? ''),
    queryFn: () => listActiveEquipmentGroups(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useEquipmentGroupMutations(organizationId?: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    if (!organizationId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.all(organizationId) }),
      queryClient.invalidateQueries({ queryKey: keys.active(organizationId) }),
    ]);
  };

  const create = useMutation({
    mutationFn: (input: EquipmentGroupInput) => createEquipmentGroup(organizationId!, input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: EquipmentGroupInput }) =>
      updateEquipmentGroup(id, input),
    onSuccess: refresh,
  });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setEquipmentGroupActive(id, isActive),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEquipmentGroup(id),
    onSuccess: refresh,
  });

  return { create, update, setActive, remove };
}
