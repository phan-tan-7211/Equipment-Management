import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MultiSelectActionMenu,
  type MultiSelectActionOption,
} from '@/components/common/MultiSelectActionMenu';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSelectedTeam } from '@/hooks/useSelectedTeam';
import { useEquipmentSummaries } from '@/features/equipment/hooks/useEquipment';
import { useBulkAssignTemplate } from '@/features/equipment/hooks/useEquipmentTemplateManagement';
import { filterEquipmentSummariesBySelectedTeam } from '@/features/equipment/utils/filterEquipmentSummariesBySelectedTeam';

interface PMTemplateEquipmentAssignmentMenuProps {
  templateId: string;
  templateName: string;
  /** Renders the trigger full-width on template cards; inline on detail views. */
  fullWidthTrigger?: boolean;
}

/**
 * Bulk "set as default PM template" picker (issue #1144). Mirrors the daily
 * check-in assignment dropdown: org equipment scoped by the TopBar team
 * selection, with search and select all/none/inverse. Replaces the old
 * TemplateAssignmentDialog. PM templates page is owner/admin-only, so the
 * summaries query always runs with org-admin scope.
 */
export function PMTemplateEquipmentAssignmentMenu({
  templateId,
  templateName,
  fullWidthTrigger = false,
}: PMTemplateEquipmentAssignmentMenuProps) {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { selectedTeamId } = useSelectedTeam();
  const { data: equipmentSummaries = [], isLoading } = useEquipmentSummaries(
    currentOrganization?.id,
    { isOrgAdmin: true },
  );
  const bulkAssignTemplate = useBulkAssignTemplate();

  const scopedEquipment = useMemo(
    () => filterEquipmentSummariesBySelectedTeam(equipmentSummaries, selectedTeamId),
    [equipmentSummaries, selectedTeamId],
  );

  const assignedCount = useMemo(
    () => scopedEquipment.filter((item) => item.default_pm_template_id === templateId).length,
    [scopedEquipment, templateId],
  );

  const triggerLabel =
    assignedCount === 0 ? t('pmTemplates.list.applyToEquipment') : t('pmTemplates.list.assignedEquipment', { count: assignedCount });

  const options = useMemo<MultiSelectActionOption[]>(() => {
    return scopedEquipment.map((item) => ({
      id: item.id,
      label: item.name,
      sublabel: `${item.serial_number ? t('pmTemplates.list.unitNumber', { number: item.serial_number }) : t('pmTemplates.list.noSerialNumber')} · ${item.team_name ?? t('pmTemplates.list.unassigned')}`,
      searchText: [item.manufacturer ?? '', item.model ?? '', item.location ?? ''].join(' '),
      lockedNote: item.default_pm_template_id === templateId ? t('pmTemplates.list.currentDefault') : undefined,
    }));
  }, [scopedEquipment, templateId, t]);

  return (
    <MultiSelectActionMenu
      idPrefix={`pm-assign-${templateId}`}
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={fullWidthTrigger ? 'w-full' : undefined}
          disabled={bulkAssignTemplate.isPending}
          title={t('pmTemplates.list.assignmentTooltip')}
        >
          <Wrench className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      }
      title={t('pmTemplates.list.applyTemplateTitle', { name: templateName })}
      description={t('pmTemplates.list.assignmentDescription')}
      options={options}
      isLoading={isLoading}
      isPending={bulkAssignTemplate.isPending}
      searchPlaceholder={t('pmTemplates.list.searchEquipment')}
      loadingText={t('pmTemplates.list.loadingEquipment')}
      emptyText={t('pmTemplates.list.noEquipmentInTeam')}
      noMatchText={t('pmTemplates.list.noEquipmentMatch')}
      actionLabel={() => t(bulkAssignTemplate.isPending ? 'pmTemplates.list.applying' : 'pmTemplates.list.applyTemplate')}
      onAction={async (equipmentIds) => {
        await bulkAssignTemplate.mutateAsync({ equipmentIds, templateId });
      }}
      align={fullWidthTrigger ? 'start' : 'end'}
    />
  );
}
