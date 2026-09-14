
import React from 'react';
import { useI18n } from '@/i18n';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/useSettings';
import { timezoneOptions } from '@/types/settings';

const PersonalizationSettings = () => {
  const { t } = useI18n();
  const { settings, updateSetting } = useSettings();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-sm font-medium">{t('settingsForms.timezone')}</Label>
        <Select
          value={settings.timezone}
          onValueChange={(value: string) => updateSetting('timezone', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('settingsForms.selectTimezone')} />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateFormat" className="text-sm font-medium">{t('settingsForms.dateFormat')}</Label>
        <Select
          value={settings.dateFormat}
          onValueChange={(value: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MMM dd, yyyy') =>
            updateSetting('dateFormat', value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t('settingsForms.selectDateFormat')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/dd/yyyy">01/15/2024</SelectItem>
            <SelectItem value="dd/MM/yyyy">15/01/2024</SelectItem>
            <SelectItem value="yyyy-MM-dd">2024-01-15</SelectItem>
            <SelectItem value="MMM dd, yyyy">Jan 15, 2024</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PersonalizationSettings;
