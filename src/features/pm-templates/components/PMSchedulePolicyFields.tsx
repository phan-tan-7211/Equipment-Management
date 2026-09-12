import React, { useId } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PMIntervalType, PMSchedulePolicyFormState } from '@/features/pm-templates/services/pmIntervalPolicyService';
import { useI18n } from '@/i18n';

type PMSchedulePolicyFieldsProps = {
  value: PMSchedulePolicyFormState;
  onChange: (next: PMSchedulePolicyFormState) => void;
  inheritLabel?: string;
  intervalError?: string | null;
  disabled?: boolean;
  /** Omit card chrome when embedded in an inline equipment field editor. */
  compact?: boolean;
};

export function PMSchedulePolicyFields({
  value,
  onChange,
  inheritLabel,
  intervalError,
  disabled = false,
  compact = false,
}: PMSchedulePolicyFieldsProps) {
  const { t } = useI18n();
  const idBase = useId();
  const inheritId = `${idBase}-inherit`;
  const customId = `${idBase}-custom`;
  const noneId = `${idBase}-none`;
  const intervalValueId = `${idBase}-interval-value`;
  const daysId = `${idBase}-days`;
  const hoursId = `${idBase}-hours`;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-3 rounded-md border p-4'}>
      {!compact && (
        <div>
          <Label className="text-sm font-medium">{t('equipmentPM.schedule')}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('equipmentPM.scheduleDescription')}
          </p>
        </div>
      )}

      <RadioGroup
        value={value.mode}
        onValueChange={(mode) =>
          onChange({
            ...value,
            mode: mode as PMSchedulePolicyFormState['mode'],
          })
        }
        className="space-y-2"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="inherit" id={inheritId} />
          <Label htmlFor={inheritId} className="font-normal cursor-pointer">
            {inheritLabel ?? t('equipmentPM.inheritSchedule')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="custom" id={customId} />
          <Label htmlFor={customId} className="font-normal cursor-pointer">
            {t('equipmentPM.customInterval')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="none" id={noneId} />
          <Label htmlFor={noneId} className="font-normal cursor-pointer">
            {t('equipmentPM.noRecurringPM')}
          </Label>
        </div>
      </RadioGroup>

      {value.mode === 'custom' && (
        <div className="flex flex-wrap items-end gap-4 pt-1">
          <div className="flex-1 max-w-50">
            <Label htmlFor={intervalValueId} className="text-xs">
              {t('equipmentPM.every')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={intervalValueId}
                type="number"
                min={1}
                value={value.intervalValue ?? ''}
                onChange={(e) => {
                  const parsed = e.target.value ? parseInt(e.target.value, 10) : null;
                  onChange({ ...value, intervalValue: parsed });
                }}
                placeholder={t('equipmentPM.intervalPlaceholder')}
                className={intervalError ? 'border-destructive' : ''}
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {value.intervalType === 'hours'
                  ? t('equipmentPM.workingHours')
                  : t('equipmentPM.calendarDays')}
              </span>
            </div>
            {intervalError && <p className="text-xs text-destructive mt-1">{intervalError}</p>}
          </div>
          <RadioGroup
            value={value.intervalType}
            onValueChange={(val) => onChange({ ...value, intervalType: val as PMIntervalType })}
            className="flex gap-4 pb-1"
            disabled={disabled}
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="days" id={daysId} />
              <Label htmlFor={daysId} className="text-sm font-normal cursor-pointer">
                {t('equipmentPM.calendarDays')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="hours" id={hoursId} />
              <Label htmlFor={hoursId} className="text-sm font-normal cursor-pointer">
                {t('equipmentPM.workingHours')}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
