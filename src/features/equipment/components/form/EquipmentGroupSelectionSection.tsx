import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useActiveEquipmentGroups } from '@/features/equipment-groups/hooks/useEquipmentGroups';
import type { EquipmentFormData } from '@/features/equipment/types/equipment';
import { useI18n } from '@/i18n';

export default function EquipmentGroupSelectionSection({ form }: { form: UseFormReturn<EquipmentFormData> }) {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { data: groups = [], isLoading } = useActiveEquipmentGroups(currentOrganization?.id);
  const selectedId = form.watch('equipment_group_id');
  const selected = groups.find((group) => group.id === selectedId);
  const classificationConfigured = groups.length > 0;

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('equipmentGroups.classification')}
        </h3>
        <FormField
          control={form.control}
          name="equipment_group_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('equipmentGroups.equipmentGroup')}{classificationConfigured ? ' *' : ''}</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={isLoading || !classificationConfigured}
                  required={classificationConfigured}
                >
                  <option value="">
                    {isLoading
                      ? t('equipmentGroups.loadingGroups')
                      : classificationConfigured
                        ? t('equipmentGroups.selectGroup')
                        : t('equipmentGroups.noGroupsConfigured')}
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name} ({group.code})</option>
                  ))}
                </select>
              </FormControl>
              {selected ? (
                <FormDescription className="space-y-1">
                  {selected.examples && (
                    <span className="block"><strong>{t('equipmentGroups.examples')}:</strong> {selected.examples}</span>
                  )}
                  {selected.management_focus && (
                    <span className="block"><strong>{t('equipmentGroups.management')}:</strong> {selected.management_focus}</span>
                  )}
                  <span className="block">{t('equipmentGroups.codeGenerationHint')}</span>
                </FormDescription>
              ) : classificationConfigured ? (
                <FormDescription>{t('equipmentGroups.selectClassificationHint')}</FormDescription>
              ) : (
                <FormDescription>{t('equipmentGroups.noGroupsHint')}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
