import { supabase } from '@/integrations/supabase/client';
import type { EquipmentGroup, EquipmentGroupInput, EquipmentGroupWithCount } from '@/features/equipment-groups/types';

// The generated Supabase type file is intentionally not refreshed in this branch yet.
// Another active branch/session is changing shared i18n/equipment files; keeping this
// new module structurally typed minimizes merge conflicts. Regenerate DB types once
// those changes have landed.
const db = supabase as any;

function normalizeInput(input: EquipmentGroupInput) {
  return {
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    examples: input.examples?.trim() || null,
    management_focus: input.management_focus?.trim() || null,
    description: input.description?.trim() || null,
    ...(typeof input.is_active === 'boolean' ? { is_active: input.is_active } : {}),
  };
}

export async function listEquipmentGroups(
  organizationId: string,
): Promise<EquipmentGroupWithCount[]> {
  const [{ data: groups, error: groupsError }, { data: equipmentRows, error: equipmentError }] =
    await Promise.all([
      db
        .from('equipment_groups')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true }),
      db
        .from('equipment')
        .select('equipment_group_id')
        .eq('organization_id', organizationId),
    ]);

  if (groupsError) throw groupsError;
  if (equipmentError) throw equipmentError;

  const counts = new Map<string, number>();
  for (const row of equipmentRows ?? []) {
    if (!row.equipment_group_id) continue;
    counts.set(row.equipment_group_id, (counts.get(row.equipment_group_id) ?? 0) + 1);
  }

  return ((groups ?? []) as EquipmentGroup[]).map((group) => ({
    ...group,
    equipment_count: counts.get(group.id) ?? 0,
  }));
}

export async function listActiveEquipmentGroups(
  organizationId: string,
): Promise<EquipmentGroup[]> {
  const { data, error } = await db
    .from('equipment_groups')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as EquipmentGroup[];
}

export async function createEquipmentGroup(
  organizationId: string,
  input: EquipmentGroupInput,
): Promise<EquipmentGroup> {
  const { data, error } = await db
    .from('equipment_groups')
    .insert({ organization_id: organizationId, ...normalizeInput(input) })
    .select('*')
    .single();

  if (error) throw error;
  return data as EquipmentGroup;
}

export async function updateEquipmentGroup(
  groupId: string,
  input: EquipmentGroupInput,
): Promise<EquipmentGroup> {
  const { data, error } = await db
    .from('equipment_groups')
    .update(normalizeInput(input))
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) throw error;
  return data as EquipmentGroup;
}

export async function setEquipmentGroupActive(
  groupId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await db
    .from('equipment_groups')
    .update({ is_active: isActive })
    .eq('id', groupId);

  if (error) throw error;
}

export async function deleteEquipmentGroup(groupId: string): Promise<void> {
  const { error } = await db.from('equipment_groups').delete().eq('id', groupId);
  if (error) throw error;
}
