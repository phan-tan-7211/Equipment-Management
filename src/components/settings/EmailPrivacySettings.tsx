import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, ChevronRight } from 'lucide-react';
import { SettingsToggleRow } from './SettingsToggleRow';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface EmailPrivacySettingsProps {
  currentEmailPrivate?: boolean;
  onUpdate?: (emailPrivate: boolean) => void;
}

export const EmailPrivacySettings: React.FC<EmailPrivacySettingsProps> = ({
  currentEmailPrivate = false,
  onUpdate
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [emailPrivate, setEmailPrivate] = useState(currentEmailPrivate);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePrivacy = async (newEmailPrivate: boolean) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_private: newEmailPrivate })
        .eq('id', user.id);

      if (error) throw error;

      setEmailPrivate(newEmailPrivate);
      onUpdate?.(newEmailPrivate);

      toast.success(
        newEmailPrivate
          ? t('settingsForms.emailPrivateSuccess')
          : t('settingsForms.emailVisibleSuccess')
      );
    } catch (error) {
      console.error('Failed to update email privacy:', error);
      toast.error(t('settingsForms.emailPrivacyFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <SettingsToggleRow
        id="email-private"
        label={t('settingsForms.hideEmail')}
        description={t('settingsForms.hideEmailHint')}
        checked={emailPrivate}
        onCheckedChange={handleUpdatePrivacy}
        loading={isLoading}
        icon={<Mail className="h-4 w-4" />}
      />

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
          {t('settingsForms.visibilitySettings')}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 pl-6 border-l-2 border-muted text-xs text-muted-foreground space-y-1">
            <p>{t('settingsForms.ownEmailVisible')}</p>
            <p>{t('settingsForms.adminsSeeEmail')}</p>
            <p>
              {emailPrivate
                ? t('settingsForms.membersCannotSeeEmail')
                : t('settingsForms.membersSeeEmail')}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
