import { withResolvedEquipmentImages } from '@/services/imageUploadService';
import type { DisplayImageVariantName } from '@/services/displayImageVariantService';
// `EquipmentService.ts`'s `EquipmentWithTeam` (Equipment Row + team +
// team_name) is the shape every real consumer (hooks, work-order equipment
// panels, offline merge) actually imports and uses; `types/equipment.ts`
// declares an independent, effectively-unused `EquipmentWithTeam` missing
// the `team` field this function's callers rely on. Importing the
// authoritative one here removes the double-cast this file used to force
// on every caller in EquipmentService.ts.
import type { EquipmentWithTeam } from '@/features/equipment/services/EquipmentService';

type RowWithTeamJoin = Record<string, unknown> & {
  team?: { name?: string } | null;
};

export function flattenEquipmentRowsWithTeamName<T extends RowWithTeamJoin>(
  rows: T[],
): EquipmentWithTeam[] {
  return (rows || []).map((row) => ({
    ...row,
    team_name: (row.team as { name?: string } | null | undefined)?.name ?? undefined,
    // T is intentionally a loose generic (arbitrary Supabase select() row
    // shapes with a `team` join); callers are responsible for passing rows
    // that actually carry every Equipment Row column.
  })) as unknown as EquipmentWithTeam[];
}

export async function flattenAndResolveEquipmentImages<T extends RowWithTeamJoin>(
  rows: T[],
  options?: { variant?: DisplayImageVariantName },
): Promise<EquipmentWithTeam[]> {
  const flattened = flattenEquipmentRowsWithTeamName(rows);
  return withResolvedEquipmentImages(flattened, {
    variant: options?.variant ?? 'thumb',
  });
}
