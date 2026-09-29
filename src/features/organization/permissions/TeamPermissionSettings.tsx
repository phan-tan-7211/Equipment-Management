import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/i18n';
import { logger } from '@/utils/logger';
import { permissionMatrixCopy } from './permissionMatrix';

const CONFIGURABLE_TEAM_ROLES = ['manager', 'technician', 'requestor', 'viewer'] as const;
const CONFIGURABLE_PERMISSION_KEYS = [
  'equipment.create',
  'equipment.update',
  'equipment.delete',
  'work_order.delete',
  'team.update',
  'team.members.manage',
  'team.delete',
] as const;
type ConfigurableTeamRole = (typeof CONFIGURABLE_TEAM_ROLES)[number];
type ConfigurablePermissionKey = (typeof CONFIGURABLE_PERMISSION_KEYS)[number];

const ACTION_FOR_KEY = {
  'equipment.create': 'createEquipment',
  'equipment.update': 'updateEquipment',
  'equipment.delete': 'deleteEquipment',
  'work_order.delete': 'deleteWorkOrders',
  'team.update': 'updateTeams',
  'team.members.manage': 'manageTeamMembers',
  'team.delete': 'deleteTeams',
} as const satisfies Record<ConfigurablePermissionKey, string>;

type Setting = { team_role: string; permission_key: string; allowed: boolean; is_default: boolean };

const settingsQueryKey = (organizationId: string) => ['team-permission-settings', organizationId] as const;

export function TeamPermissionSettings({ organizationId, canEdit }: { organizationId: string; canEdit: boolean }) {
  const { language } = useI18n();
  const copy = permissionMatrixCopy[language];
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: settingsQueryKey(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_permission_settings', { p_organization_id: organizationId });
      if (error) throw error;
      return (data ?? []) as Setting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { role: ConfigurableTeamRole; key: ConfigurablePermissionKey; allowed: boolean | null }) => {
      const { error } = await supabase.rpc('set_team_permission_override', {
        p_organization_id: organizationId,
        p_team_role: input.role,
        p_permission_key: input.key,
        p_allowed: input.allowed,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey(organizationId) });
      toast.success(copy.customSaved);
    },
    onError: (error) => {
      logger.error('Team permission update failed', error);
      toast.error(copy.customSaveFailed);
    },
  });

  const find = (role: ConfigurableTeamRole, key: ConfigurablePermissionKey) =>
    settingsQuery.data?.find((s) => s.team_role === role && s.permission_key === key);
  const hasOverrides = settingsQuery.data?.some((s) => !s.is_default) ?? false;

  const resetAll = async () => {
    for (const s of settingsQuery.data ?? []) {
      if (!s.is_default) {
        await updateMutation.mutateAsync({
          role: s.team_role as ConfigurableTeamRole,
          key: s.permission_key as ConfigurablePermissionKey,
          allowed: null,
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            {copy.customTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{canEdit ? copy.customDescriptionOwner : copy.customDescriptionAdmin}</p>
        </div>
        {canEdit && hasOverrides ? (
          <Button variant="outline" size="sm" disabled={updateMutation.isPending} onClick={() => { void resetAll(); }}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {copy.customReset}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {settingsQuery.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : settingsQuery.isError ? (
          <p className="text-sm text-destructive">{copy.customLoadFailed}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th scope="col" className="px-3 py-2 text-left font-medium">{copy.actionColumn}</th>
                  {CONFIGURABLE_TEAM_ROLES.map((role) => (
                    <th key={role} scope="col" className="px-2 py-2 text-center font-medium">{copy.roles[role]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONFIGURABLE_PERMISSION_KEYS.map((key) => (
                  <tr key={key} className="border-b last:border-b-0">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {copy.actions[ACTION_FOR_KEY[key]]}
                    </th>
                    {CONFIGURABLE_TEAM_ROLES.map((role) => {
                      const setting = find(role, key);
                      const label = `${copy.roles[role]}: ${copy.actions[ACTION_FOR_KEY[key]]}`;
                      return (
                        <td key={role} className="px-2 py-2 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <Checkbox
                              aria-label={label}
                              checked={setting?.allowed ?? false}
                              disabled={!canEdit || updateMutation.isPending}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ role, key, allowed: checked === true })
                              }
                            />
                            {setting && !setting.is_default ? (
                              <span className="text-[10px] font-medium uppercase text-amber-500">{copy.customChanged}</span>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{copy.customFootnote}</p>
      </CardContent>
    </Card>
  );
}
