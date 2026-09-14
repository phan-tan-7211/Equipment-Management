import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MultiSelectActionMenu,
  type MultiSelectActionOption,
} from '@/components/common/MultiSelectActionMenu';
import type { OperatorChecklistTemplate } from '@/features/operator-check-ins/services/operatorChecklistTemplatesService';
import type { EquipmentOperatorCheckinAssignment } from '@/features/operator-check-ins/services/operatorCheckinSettingsService';

interface EquipmentOperatorCheckinTemplateAssignmentMenuProps {
  equipmentId: string;
  equipmentName: string;
  templates: OperatorChecklistTemplate[];
  assignments: EquipmentOperatorCheckinAssignment[];
  assignedCount: number;
  isTemplatesLoading: boolean;
  isAssignmentsLoading: boolean;
  isAssigning: boolean;
  onAssignTemplateIds: (templateIds: string[]) => void | Promise<void>;
}

export function EquipmentOperatorCheckinTemplateAssignmentMenu({
  equipmentId,
  equipmentName,
  templates,
  assignments,
  assignedCount,
  isTemplatesLoading,
  isAssignmentsLoading,
  isAssigning,
  onAssignTemplateIds,
}: EquipmentOperatorCheckinTemplateAssignmentMenuProps) {
  const { t } = useI18n();
  const assignedTemplateIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.template_id)),
    [assignments],
  );

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const options = useMemo<MultiSelectActionOption[]>(
    () =>
      activeTemplates.map((template) => {
        const fieldCount = template.template_data.dataFields?.length ?? 0;
        const itemCount = template.template_data.checklistItems?.length ?? 0;
        return {
          id: template.id,
          label: template.name,
          sublabel: `${t(fieldCount === 1 ? 'operatorEquipment.dataFieldCount' : 'operatorEquipment.dataFieldCountPlural', { count: fieldCount })} · ${t(itemCount === 1 ? 'operatorEquipment.checklistItemCount' : 'operatorEquipment.checklistItemCountPlural', { count: itemCount })}`,
          searchText: template.description ?? '',
          lockedNote: assignedTemplateIds.has(template.id) ? t('operatorEquipment.assigned') : undefined,
        };
      }),
    [activeTemplates, assignedTemplateIds, t],
  );

  const unassignedCount = useMemo(
    () => activeTemplates.filter((template) => !assignedTemplateIds.has(template.id)).length,
    [activeTemplates, assignedTemplateIds],
  );

  return (
    <MultiSelectActionMenu
      idPrefix={`equipment-checkin-assign-${equipmentId}`}
      trigger={
        <Button type="button" variant="outline" size="sm" disabled={isAssigning}>
          <Plus className="mr-2 h-4 w-4" />
          {t('operatorEquipment.assignChecklists')}
          {assignedCount > 0 ? (
            <Badge variant="secondary" className="ml-2 font-normal">
              {t('operatorEquipment.assignedBadge', { count: assignedCount })}
            </Badge>
          ) : null}
        </Button>
      }
      title={t('operatorEquipment.assignTo', { name: equipmentName })}
      description={
        unassignedCount > 0
          ? t(unassignedCount === 1 ? 'operatorEquipment.chooseTemplates' : 'operatorEquipment.chooseTemplatesPlural', { count: unassignedCount })
          : t('operatorEquipment.allTemplatesAssigned')
      }
      options={options}
      isLoading={isTemplatesLoading || isAssignmentsLoading}
      isPending={isAssigning}
      searchPlaceholder={t('operatorEquipment.searchTemplates')}
      loadingText={t('operatorEquipment.loadingTemplates')}
      emptyText={t('operatorEquipment.noTemplates')}
      noMatchText={t('operatorEquipment.noTemplatesMatch')}
      actionLabel={(count) =>
        isAssigning
          ? t('operatorEquipment.assigning')
          : t(count === 1 ? 'operatorEquipment.assignChecklist' : 'operatorEquipment.assignChecklistPlural')
      }
      onAction={onAssignTemplateIds}
      align="start"
    />
  );
}
