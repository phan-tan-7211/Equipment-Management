import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { SettingsToggleRow } from './SettingsToggleRow';

interface SensitivePrivacySettingsProps {
  currentLimitSensitivePi?: boolean;
  onUpdate?: (limitSensitivePi: boolean) => void;
}

export const SensitivePrivacySettings: React.FC<SensitivePrivacySettingsProps> = ({
  currentLimitSensitivePi = false,
  onUpdate,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [limitSensitivePi, setLimitSensitivePi] = useState(currentLimitSensitivePi);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (newValue: boolean) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ limit_sensitive_pi: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setLimitSensitivePi(newValue);
      onUpdate?.(newValue);

      toast.success(
        newValue
          ? t('settingsForms.gpsDisabled')
          : t('settingsForms.gpsEnabled'),
      );
    } catch (error) {
      console.error('Failed to update sensitive PI preference:', error);
      toast.error(t('settingsForms.sensitivePrivacyFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsToggleRow
      id="limit-sensitive-pi"
      label={t('settingsForms.disableGps')}
      description={t('settingsForms.disableGpsHint')}
      checked={limitSensitivePi}
      onCheckedChange={handleUpdate}
      loading={isLoading}
      icon={<MapPin className="h-4 w-4" />}
    />
  );
};
