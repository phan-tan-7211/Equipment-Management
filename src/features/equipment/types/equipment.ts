/**
 * Equipment Types - Consolidated type definitions
 * 
 * This file serves as the single source of truth for equipment types.
 * Import from here instead of defining types locally in components/hooks.
 */

import { z } from 'zod';
import { Tables } from '@/integrations/supabase/types';

export type EquipmentStatus = 'active' | 'maintenance' | 'inactive';

export interface EquipmentLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

export interface AssignedLocation {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export type { EffectiveLocation } from '@/utils/effectiveLocation';

export type CustomAttributes = Record<string, string | number | boolean | null>;

const customAttributesSchema = z.record(z.string(), z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
])).optional();

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  timestamp: z.string().optional()
}).optional();

export interface EquipmentValidationMessages {
  equipmentNameRequired: string;
  manufacturerRequired: string;
  modelRequired: string;
  serialRequired: string;
  locationRequired: string;
  workingHoursNonNegative: string;
  teamRequired: string;
  nameRequired: string;
  nameMax: string;
  teamCreatePermission: string;
}

export const defaultEquipmentValidationMessages: EquipmentValidationMessages = {
  equipmentNameRequired: 'Equipment name is required',
  manufacturerRequired: 'Manufacturer is required',
  modelRequired: 'Model is required',
  serialRequired: 'Serial number is required',
  locationRequired: 'Location is required',
  workingHoursNonNegative: 'Working hours cannot be negative',
  teamRequired: 'Team is required',
  nameRequired: 'Name is required',
  nameMax: 'Name must be less than 100 characters',
  teamCreatePermission: 'You must assign equipment to a team where you can create equipment (manager or technician)',
};

export const createEquipmentFormSchema = (
  messages: EquipmentValidationMessages = defaultEquipmentValidationMessages,
) => z.object({
  name: z.string().min(1, messages.equipmentNameRequired),
  manufacturer: z.string().min(1, messages.manufacturerRequired),
  model: z.string().min(1, messages.modelRequired),
  serial_number: z.string().optional(),
  equipment_group_id: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'inactive']),
  location: z.string().min(1, messages.locationRequired),
  installation_date: z.string(),
  warranty_expiration: z.string().optional(),
  last_maintenance: z.string().optional(),
  notes: z.string(),
  custom_attributes: customAttributesSchema,
  image_url: z.string().optional(),
  last_known_location: locationSchema,
  team_id: z.string().optional(),
  default_pm_template_id: z.string().optional(),
  working_hours: z.number().min(0, messages.workingHoursNonNegative).optional().nullable(),
  assigned_location_street: z.string().optional(),
  assigned_location_city: z.string().optional(),
  assigned_location_state: z.string().optional(),
  assigned_location_country: z.string().optional(),
  assigned_location_lat: z.number().optional(),
  assigned_location_lng: z.number().optional(),
  use_team_location: z.boolean().optional()
});

export const equipmentFormSchema = createEquipmentFormSchema();

export interface EquipmentValidationContext {
  userRole: 'owner' | 'admin' | 'manager' | 'member';
  isOrgAdmin: boolean;
  teamMemberships: Array<{ teamId: string; role: string }>;
}

export const createEquipmentValidationSchema = (
  context?: EquipmentValidationContext,
  messages: EquipmentValidationMessages = defaultEquipmentValidationMessages,
) => {
  return createEquipmentFormSchema(messages).refine((data) => {
    if (!context) return true;
    if (context.isOrgAdmin || context.userRole === 'owner') return true;
    if (!data.team_id) return false;

    return context.teamMemberships.some(
      membership => membership.teamId === data.team_id &&
        (membership.role === 'manager' || membership.role === 'technician' || membership.role === 'admin')
    );
  }, {
    message: messages.teamCreatePermission,
    path: ['team_id']
  });
};

export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

export const createQuickEquipmentSchema = (
  messages: EquipmentValidationMessages = defaultEquipmentValidationMessages,
) => z.object({
  manufacturer: z.string().min(1, messages.manufacturerRequired),
  model: z.string().min(1, messages.modelRequired),
  serial_number: z.string().min(1, messages.serialRequired),
  working_hours: z.number().min(0, messages.workingHoursNonNegative).optional().nullable(),
  team_id: z.string().min(1, messages.teamRequired),
  name: z.string().min(1, messages.nameRequired).max(100, messages.nameMax),
});

export const quickEquipmentSchema = createQuickEquipmentSchema();
export type QuickEquipmentFormData = z.infer<typeof quickEquipmentSchema>;

export const generateEquipmentName = (manufacturer: string, model: string): string => {
  const mfr = manufacturer.trim();
  const mdl = model.trim();
  if (!mfr && !mdl) return '';
  if (!mfr) return mdl;
  if (!mdl) return mfr;
  return `${mfr} ${mdl}`;
};

type EquipmentRow = Tables<'equipment'>;

export interface EquipmentRecord extends Omit<EquipmentRow, 'custom_attributes' | 'last_known_location'> {
  custom_attributes?: CustomAttributes | null;
  last_known_location?: EquipmentLocation | null;
  team_name?: string;
  equipment_group_id?: string | null;
  management_code?: string | null;
  assigned_location_street?: string | null;
  assigned_location_city?: string | null;
  assigned_location_state?: string | null;
  assigned_location_country?: string | null;
  assigned_location_lat?: number | null;
  assigned_location_lng?: number | null;
  use_team_location?: boolean;
}

export interface EquipmentWithTeam extends EquipmentRecord {
  team_name?: string;
}

export interface EquipmentFilters {
  status?: EquipmentStatus;
  location?: string;
  manufacturer?: string;
  model?: string;
  team_id?: string | null;
  search?: string;
  userTeamIds?: string[];
  isOrgAdmin?: boolean;
}

export interface EquipmentScan {
  id: string;
  equipment_id: string;
  scanned_by: string;
  scanned_at: string;
  location?: string | null;
  notes?: string | null;
  scannedByName?: string;
}
