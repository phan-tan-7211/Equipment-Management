import { useMemo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MultiSelectActionMenu,
  type MultiSelectActionOption,
} from '@/components/common/MultiSelectActionMenu';
import type { EquipmentSummary } from '@/features/equipment/services/EquipmentService';
import type { EquipmentOperatorCheckinAssignment } from '@/features/operator-check-ins/services/operatorCheckinSettingsService';

interface OperatorTemplateEquipmentAssignmentMenuProps {
  templateId: string;
  templateName: string;
  equipment: EquipmentSummary[];
  assignments: EquipmentOperatorCheckinAssignment[];
  isEquipmentLoading: boolean;
  isAssignmentsLoading: boolean;
  isAssigning: boolean;
  onAssignEquipmentIds: (equipmentIds: string[]) => void | Promise<void>;
}

export function OperatorTemplateEquipmentAssignmentMenu({
  templateId,
  templateName,
  equipment,
  assignments,
  isEquipmentLoading,
  isAssignmentsLoading,
  isAssigning,
  onAssignEquipmentIds,
}: OperatorTemplateEquipmentAssignmentMenuProps) {
  const { t } = useI18n();
  const assignedEquipmentIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.template_id === templateId)
          .map((assignment) => assignment.equipment_id),
      ),
    [assignments, templateId],
  );

  const options = useMemo<MultiSelectActionOption[]>(
    () =>
      equipment.map((item) => ({
        id: item.id,
        label: item.name,
        sublabel: `${item.serial_number ? t('operatorEquipment.unit', { serial: item.serial_number }) : t('operatorEquipment.noSerial')} · ${item.team_name ?? t('operatorEquipment.unassigned')}`,
        searchText: item.location ?? '',
        lockedNote: assignedEquipmentIds.has(item.id) ? t('operatorEquipment.assigned') : undefined,
      })),
    [equipment, assignedEquipmentIds, t],
  );

  return (
    <MultiSelectActionMenu
      idPrefix={`assign-${templateId}`}
      trigger={
        <Button type="button" variant="outline" size="sm" disabled={isAssigning}>
          <Truck className="mr-2 h-4 w-4" />
          {t('operatorEquipment.assignEquipment')}
        </Button>
      }
      title={t('operatorEquipment.assignTemplate', { name: templateName })}
      description={t('operatorEquipment.chooseEquipment')}
      options={options}
      isLoading={isEquipmentLoading || isAssignmentsLoading}
      isPending={isAssigning}
      searchPlaceholder={t('operatorEquipment.searchEquipment')}
      loadingText={t('operatorEquipment.loadingEquipment')}
      emptyText={t('operatorEquipment.noEquipment')}
      noMatchText={t('operatorEquipment.noEquipmentMatch')}
      actionLabel={() => (isAssigning ? t('operatorEquipment.assigning') : t('operatorEquipment.assignChecklist'))}
      onAction={onAssignEquipmentIds}
    />
  );
}
