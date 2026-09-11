export interface EquipmentGroup {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  examples: string | null;
  management_focus: string | null;
  description: string | null;
  is_active: boolean;
  next_sequence: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentGroupWithCount extends EquipmentGroup {
  equipment_count: number;
}

export interface EquipmentGroupInput {
  code: string;
  name: string;
  examples?: string | null;
  management_focus?: string | null;
  description?: string | null;
  is_active?: boolean;
}
