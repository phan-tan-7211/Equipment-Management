import {
  getPMComplianceLevel,
  type EquipmentPMStatus,
} from '@/features/equipment/hooks/useEquipmentPMStatus';

type EquipmentTranslate = (key: string, params?: Record<string, string | number>) => string;

export interface EquipmentCardPmReadout {
  label: string;
  detail: string;
  valueClassName: string;
}

export function getEquipmentCardPmReadout(
  pmStatus: EquipmentPMStatus | null | undefined,
  translate?: EquipmentTranslate,
): EquipmentCardPmReadout {
  const level = getPMComplianceLevel(pmStatus);

  if (level === 'no_interval' || !pmStatus) {
    return {
      label: '—',
      detail: translate ? translate('equipmentFinalize.noPmInterval') : 'No PM interval configured',
      valueClassName: 'text-muted-foreground',
    };
  }

  if (level === 'overdue') {
    const overdueDetail =
      pmStatus.days_overdue != null
        ? translate
          ? translate('equipmentFinalize.daysOverdue', { count: pmStatus.days_overdue })
          : `${pmStatus.days_overdue} days overdue`
        : pmStatus.hours_overdue != null
          ? translate
            ? translate('equipmentFinalize.hoursOverdue', { count: Math.round(pmStatus.hours_overdue) })
            : `${Math.round(pmStatus.hours_overdue)} hrs overdue`
          : translate
            ? translate('equipmentFinalize.overdue')
            : 'Overdue';
    return {
      label: translate ? translate('equipmentFinalize.overdue') : 'Overdue',
      detail: `${pmStatus.template_name} · ${overdueDetail}`,
      valueClassName: 'text-destructive font-medium',
    };
  }

  if (level === 'due_soon') {
    const intervalHint =
      pmStatus.interval_type === 'days'
        ? translate
          ? translate('equipmentFinalize.dayInterval', { count: pmStatus.interval_value })
          : `${pmStatus.interval_value}-day interval`
        : translate
          ? translate('equipmentFinalize.hourInterval', { count: pmStatus.interval_value })
          : `${pmStatus.interval_value}-hr interval`;
    return {
      label: translate ? translate('equipmentFinalize.dueSoon') : 'Due soon',
      detail: `${pmStatus.template_name} · ${intervalHint}`,
      valueClassName: 'text-warning font-medium',
    };
  }

  const intervalHint =
    pmStatus.interval_type === 'days'
      ? translate
        ? translate('equipmentFinalize.dayInterval', { count: pmStatus.interval_value })
        : `${pmStatus.interval_value}-day interval`
      : translate
        ? translate('equipmentFinalize.hourInterval', { count: pmStatus.interval_value })
        : `${pmStatus.interval_value}-hr interval`;

  return {
    label: translate ? translate('equipmentFinalize.current') : 'Current',
    detail: `${pmStatus.template_name} · ${intervalHint}`,
    valueClassName: 'text-success font-medium',
  };
}
