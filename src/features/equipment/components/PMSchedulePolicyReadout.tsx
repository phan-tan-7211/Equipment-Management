import type {
  PMSchedulePolicyDisplay,
  PMSchedulePolicyDisplayPrimary,
  PMSchedulePolicyDisplaySecondary,
} from '@/features/pm-templates/services/pmIntervalPolicyService';
import { useI18n } from '@/i18n';

type PMSchedulePolicyReadoutProps = {
  display: PMSchedulePolicyDisplay;
  className?: string;
};

export function PMSchedulePolicyReadout({ display, className }: PMSchedulePolicyReadoutProps) {
  const { t } = useI18n();

  const renderPrimary = (primary: PMSchedulePolicyDisplayPrimary): string => {
    switch (primary.kind) {
      case 'interval':
        return primary.intervalType === 'hours'
          ? t('equipmentPM.everyHours', { count: primary.value })
          : t('equipmentPM.everyDays', { count: primary.value });
      case 'no_recurring_pm':
        return t('equipmentPM.noRecurringPM');
      case 'loading':
        return t('equipmentPM.loading');
      case 'no_schedule_configured':
        return t('equipmentPM.noScheduleConfigured');
      case 'inherited_schedule':
        return t('equipmentPM.inheritedSchedule');
    }
  };

  const renderSecondary = (secondary: PMSchedulePolicyDisplaySecondary): string => {
    switch (secondary.kind) {
      case 'equipment_override':
        return t('equipmentPM.equipmentOverride');
      case 'team_source':
        return secondary.teamName
          ? t('equipmentPM.fromTeam', { name: secondary.teamName })
          : t('equipmentPM.fromTeamSchedule');
      case 'template_source':
        return secondary.templateName
          ? t('equipmentPM.fromTemplate', { name: secondary.templateName })
          : t('equipmentPM.fromTemplateSchedule');
      case 'pm_template_source':
        return secondary.templateName
          ? t('equipmentPM.fromPMTemplate', { name: secondary.templateName })
          : t('equipmentPM.fromPMTemplateDefault');
      case 'inherit_source':
        return secondary.teamName
          ? t('equipmentPM.inheritsFromTeam', { name: secondary.teamName })
          : t('equipmentPM.inheritsFromTeamOrTemplate');
    }
  };

  return (
    <div className={className ?? 'flex min-w-0 flex-col gap-0.5'}>
      <span className="text-base text-foreground">{renderPrimary(display.primary)}</span>
      {display.secondary ? (
        <span className="text-sm text-muted-foreground">{renderSecondary(display.secondary)}</span>
      ) : null}
    </div>
  );
}
