import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { Globe, Shield, Lock } from 'lucide-react';
import type { ChecklistTemplateEditorTemplate } from '@/features/organization/components/checklistTemplateEditorTypes';

type ChecklistTemplateSettingsFieldsProps = {
  template?: ChecklistTemplateEditorTemplate | null;
  templateName: string;
  templateDescription: string;
  intervalEnabled: boolean;
  intervalValue: number | null;
  intervalType: 'days' | 'hours';
  intervalError: string | null;
  autoSaveStatus: 'saving' | 'saved' | 'error' | 'offline';
  lastSaved: Date | undefined;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIntervalEnabledChange: (checked: boolean) => void;
  onIntervalValueChange: (value: number | null) => void;
  onIntervalTypeChange: (value: 'days' | 'hours') => void;
};

export function ChecklistTemplateSettingsFields({
  template,
  templateName,
  templateDescription,
  intervalEnabled,
  intervalValue,
  intervalType,
  intervalError,
  autoSaveStatus,
  lastSaved,
  onNameChange,
  onDescriptionChange,
  onIntervalEnabledChange,
  onIntervalValueChange,
  onIntervalTypeChange,
}: ChecklistTemplateSettingsFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="templateName">{t('pmTemplates.editor.name')}</Label>
        <Input
          id="templateName"
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('pmTemplates.editor.namePlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="templateDescription">{t('pmTemplates.editor.description')}</Label>
        <Textarea
          id="templateDescription"
          value={templateDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('pmTemplates.editor.descriptionPlaceholder')}
          rows={2}
        />
      </div>
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="intervalToggle" className="text-sm font-medium">
              {t('pmTemplates.editor.interval')}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('pmTemplates.editor.intervalDescription')}
            </p>
          </div>
          <Switch
            id="intervalToggle"
            checked={intervalEnabled}
            onCheckedChange={onIntervalEnabledChange}
          />
        </div>
        {intervalEnabled && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 max-w-[200px]">
                <Label htmlFor="intervalValue" className="text-xs">
                  {t('pmTemplates.editor.every')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="intervalValue"
                    type="number"
                    min={1}
                    value={intervalValue ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      onIntervalValueChange(val);
                    }}
                    placeholder={t('pmTemplates.editor.intervalPlaceholder')}
                    className={intervalError ? 'border-destructive' : ''}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {intervalType === 'hours' ? t('pmTemplates.editor.workingHours') : t('pmTemplates.editor.calendarDays')}
                  </span>
                </div>
                {intervalError && <p className="text-xs text-destructive mt-1">{intervalError}</p>}
              </div>
              <RadioGroup
                value={intervalType}
                onValueChange={(val) => onIntervalTypeChange(val as 'days' | 'hours')}
                className="flex gap-4 pb-1"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="days" id="interval-days" />
                  <Label htmlFor="interval-days" className="text-sm font-normal cursor-pointer">
                    {t('pmTemplates.editor.calendarDays')}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="hours" id="interval-hours" />
                  <Label htmlFor="interval-hours" className="text-sm font-normal cursor-pointer">
                    {t('pmTemplates.editor.workingHours')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </div>
      {template && (
        <div className="flex items-center gap-2">
          {!template.organization_id && (
            <Badge variant="secondary">
              <Globe className="w-3 h-3 mr-1" />
              {t('pmTemplates.editor.global')}
            </Badge>
          )}
          {template.organization_id && <Badge variant="secondary">{t('pmTemplates.view.organization')}</Badge>}
          {template.is_protected && (
            <Badge variant="outline">
              <Shield className="w-3 h-3 mr-1" />
              {t('pmTemplates.view.protected')}
            </Badge>
          )}
          {!template.is_protected && !template.organization_id && (
            <Badge variant="outline">
              <Lock className="w-3 h-3 mr-1" />
              {t('pmTemplates.view.readOnly')}
            </Badge>
          )}
          <SaveStatus status={autoSaveStatus} lastSaved={lastSaved} labels={{
            saving: t('pmTemplates.editor.saving'),
            saved: t('pmTemplates.editor.saved'),
            savedAt: (time) => t('pmTemplates.editor.savedAt', { time }),
            error: t('pmTemplates.editor.saveFailed'),
            offline: t('pmTemplates.editor.offline'),
            ready: t('pmTemplates.editor.ready'),
            justNow: t('pmTemplates.editor.justNow'),
            minutesAgo: (count) => t('pmTemplates.editor.minutesAgo', { count }),
          }} />
        </div>
      )}
    </div>
  );
}
