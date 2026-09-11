import { supabase } from '@/integrations/supabase/client';
import { requireAuthUserIdFromClaims } from '@/lib/authClaims';

export type PMIntervalPolicyScopeType = 'equipment' | 'team' | 'template';
export type PMScheduleMode = 'custom' | 'none';
export type PMIntervalType = 'days' | 'hours';

export type PMIntervalPolicyRow = {
  id: string;
  organization_id: string;
  scope_type: PMIntervalPolicyScopeType;
  equipment_id: string | null;
  team_id: string | null;
  pm_template_id: string | null;
  policy_slot: string;
  schedule_mode: PMScheduleMode;
  interval_value: number | null;
  interval_type: PMIntervalType | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PMSchedulePolicyFormMode = 'inherit' | 'custom' | 'none';

export type PMSchedulePolicyFormState = {
  mode: PMSchedulePolicyFormMode;
  intervalValue: number | null;
  intervalType: PMIntervalType;
};

export type EffectivePMIntervalPolicy = {
  scheduleMode: 'custom' | 'none' | 'unconfigured';
  intervalValue: number | null;
  intervalType: PMIntervalType | null;
  source:
    | 'equipment_policy'
    | 'team_policy'
    | 'template_policy'
    | 'template_default'
    | 'unconfigured';
  templateName?: string | null;
};

export type PMSchedulePolicyDisplayPrimary =
  | { kind: 'interval'; value: number; intervalType: PMIntervalType }
  | { kind: 'no_recurring_pm' }
  | { kind: 'loading' }
  | { kind: 'no_schedule_configured' }
  | { kind: 'inherited_schedule' };

export type PMSchedulePolicyDisplaySecondary =
  | { kind: 'equipment_override' }
  | { kind: 'team_source'; teamName?: string | null }
  | { kind: 'template_source'; templateName?: string | null }
  | { kind: 'pm_template_source'; templateName?: string | null }
  | { kind: 'inherit_source'; teamName?: string | null };

export type PMSchedulePolicyDisplay = {
  primary: PMSchedulePolicyDisplayPrimary;
  secondary: PMSchedulePolicyDisplaySecondary | null;
};

function getInheritedSourceDisplay(
  effective: EffectivePMIntervalPolicy,
  teamName?: string | null
): PMSchedulePolicyDisplaySecondary | null {
  switch (effective.source) {
    case 'team_policy':
      return { kind: 'team_source', teamName };
    case 'template_policy':
      return { kind: 'template_source', templateName: effective.templateName };
    case 'template_default':
      return { kind: 'pm_template_source', templateName: effective.templateName };
    case 'equipment_policy':
      return null;
    case 'unconfigured':
      return { kind: 'inherit_source', teamName };
  }
}

export function getPMSchedulePolicyDisplay(
  policy: PMIntervalPolicyRow | null | undefined,
  options?: {
    teamName?: string | null;
    inheritedEffective?: EffectivePMIntervalPolicy | null;
    inheritedEffectiveLoading?: boolean;
  }
): PMSchedulePolicyDisplay {
  const form = policyRowToFormState(policy);

  if (form.mode === 'none') {
    return {
      primary: { kind: 'no_recurring_pm' },
      secondary: { kind: 'equipment_override' },
    };
  }

  if (form.mode === 'custom' && form.intervalValue) {
    return {
      primary: {
        kind: 'interval',
        value: form.intervalValue,
        intervalType: form.intervalType,
      },
      secondary: { kind: 'equipment_override' },
    };
  }

  if (options?.inheritedEffectiveLoading) {
    return { primary: { kind: 'loading' }, secondary: null };
  }

  const effective = options?.inheritedEffective;

  if (effective?.scheduleMode === 'custom' && effective.intervalValue && effective.intervalType) {
    return {
      primary: {
        kind: 'interval',
        value: effective.intervalValue,
        intervalType: effective.intervalType,
      },
      secondary: getInheritedSourceDisplay(effective, options?.teamName),
    };
  }

  if (effective?.scheduleMode === 'none') {
    return {
      primary: { kind: 'no_recurring_pm' },
      secondary: getInheritedSourceDisplay(effective, options?.teamName),
    };
  }

  if (effective?.scheduleMode === 'unconfigured') {
    return {
      primary: { kind: 'no_schedule_configured' },
      secondary: getInheritedSourceDisplay(effective, options?.teamName),
    };
  }

  return {
    primary: { kind: 'inherited_schedule' },
    secondary: { kind: 'inherit_source', teamName: options?.teamName },
  };
}

export function policyRowToFormState(
  policy: PMIntervalPolicyRow | null | undefined
): PMSchedulePolicyFormState {
  if (!policy) {
    return { mode: 'inherit', intervalValue: null, intervalType: 'days' };
  }
  if (policy.schedule_mode === 'none') {
    return { mode: 'none', intervalValue: null, intervalType: 'days' };
  }
  return {
    mode: 'custom',
    intervalValue: policy.interval_value,
    intervalType: policy.interval_type ?? 'days',
  };
}

type ScopeTarget =
  | { scopeType: 'equipment'; equipmentId: string }
  | { scopeType: 'team'; teamId: string }
  | { scopeType: 'template'; templateId: string };

function scopeFilters(target: ScopeTarget) {
  switch (target.scopeType) {
    case 'equipment':
      return { scope_type: 'equipment' as const, equipment_id: target.equipmentId };
    case 'team':
      return { scope_type: 'team' as const, team_id: target.teamId };
    case 'template':
      return { scope_type: 'template' as const, pm_template_id: target.templateId };
  }
}

type ScopeFilterResult = ReturnType<typeof scopeFilters>;

function applyScopeTargetFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  filters: ScopeFilterResult,
): T {
  if (filters.scope_type === 'equipment') {
    return query.eq('equipment_id', filters.equipment_id);
  }
  if (filters.scope_type === 'team') {
    return query.eq('team_id', filters.team_id);
  }
  return query.eq('pm_template_id', filters.pm_template_id);
}

function mapEffectivePolicyRow(
  row: {
    interval_value: number | null;
    interval_type: string | null;
    source: string;
    schedule_mode: string;
    template_name?: string | null;
  } | null
): EffectivePMIntervalPolicy | null {
  if (!row) {
    return null;
  }

  const scheduleMode =
    row.schedule_mode === 'custom' || row.schedule_mode === 'none'
      ? row.schedule_mode
      : 'unconfigured';
  const intervalType =
    row.interval_type === 'hours' || row.interval_type === 'days'
      ? row.interval_type
      : null;
  const source = row.source as EffectivePMIntervalPolicy['source'];

  return {
    scheduleMode,
    intervalValue: row.interval_value,
    intervalType,
    source,
    templateName: row.template_name ?? null,
  };
}

export const pmIntervalPolicyService = {
  async getEffectivePolicyForEquipment(
    equipmentId: string
  ): Promise<EffectivePMIntervalPolicy | null> {
    const { data, error } = await supabase.rpc('get_effective_pm_interval_policy_for_equipment', {
      p_equipment_id: equipmentId,
    });
    if (error) throw error;
    const row = data?.[0];
    return mapEffectivePolicyRow(row ?? null);
  },

  async getPolicy(
    organizationId: string,
    target: ScopeTarget
  ): Promise<PMIntervalPolicyRow | null> {
    const filters = scopeFilters(target);
    let query = supabase
      .from('pm_interval_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('policy_slot', 'default');

    query = applyScopeTargetFilter(query, filters);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return (data as PMIntervalPolicyRow | null) ?? null;
  },

  async upsertPolicy(
    organizationId: string,
    target: ScopeTarget,
    form: PMSchedulePolicyFormState
  ): Promise<PMIntervalPolicyRow | null> {
    const userId = await requireAuthUserIdFromClaims();
    const filters = scopeFilters(target);

    if (form.mode === 'inherit') {
      await this.deletePolicy(organizationId, target);
      return null;
    }

    const payload = {
      organization_id: organizationId,
      scope_type: filters.scope_type,
      equipment_id: filters.scope_type === 'equipment' ? filters.equipment_id : null,
      team_id: filters.scope_type === 'team' ? filters.team_id : null,
      pm_template_id: filters.scope_type === 'template' ? filters.pm_template_id : null,
      policy_slot: 'default',
      schedule_mode: form.mode === 'none' ? 'none' : 'custom',
      interval_value: form.mode === 'custom' ? form.intervalValue : null,
      interval_type: form.mode === 'custom' ? form.intervalType : null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getPolicy(organizationId, target);

    if (existing) {
      const { data, error } = await supabase
        .from('pm_interval_policies')
        .update(payload)
        .eq('id', existing.id)
        .eq('organization_id', organizationId)
        .select()
        .single();
      if (error) throw error;
      return data as PMIntervalPolicyRow;
    }

    const { data, error } = await supabase
      .from('pm_interval_policies')
      .insert({ ...payload, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data as PMIntervalPolicyRow;
  },

  async deletePolicy(organizationId: string, target: ScopeTarget): Promise<void> {
    const filters = scopeFilters(target);
    let query = supabase
      .from('pm_interval_policies')
      .delete()
      .eq('organization_id', organizationId)
      .eq('policy_slot', 'default');

    query = applyScopeTargetFilter(query, filters);

    const { error } = await query;
    if (error) throw error;
  },
};
