import { useI18n } from '@/i18n/I18nProvider';
import { format as formatDate } from 'date-fns';
import { enUS, ko as koLocale, vi as viLocale } from 'date-fns/locale';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMFA } from '@/hooks/useMFA';
import { useSimpleOrganizationSafe } from '@/hooks/useSimpleOrganization';
import { useAppToast } from '@/hooks/useAppToast';
import { ShieldCheck, ShieldOff, Trash2, Loader2 } from 'lucide-react';
import MFAEnrollment from '@/components/auth/MFAEnrollment';

const MFA_REQUIRED_ROLES = ['owner', 'admin'] as const;

const MFASettings: React.FC = () => {
  const { t, language } = useI18n();
  const { factors, isEnrolled, isLoading, unenrollFactor, refreshMFAStatus } = useMFA();
  const orgContext = useSimpleOrganizationSafe();
  const toast = useAppToast();
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [removingFactorId, setRemovingFactorId] = useState<string | null>(null);

  const userRole = orgContext?.currentOrganization?.userRole;
  const isMFARequired = MFA_REQUIRED_ROLES.includes(
    userRole as (typeof MFA_REQUIRED_ROLES)[number]
  );

  const verifiedFactors = factors.filter((f) => f.status === 'verified');

  const handleRemoveFactor = useCallback(async (factorId: string) => {
    setRemovingFactorId(factorId);
    const { error } = await unenrollFactor(factorId);
    setRemovingFactorId(null);

    if (error) {
      toast.error({
        title: t('settingsSecurity.removeFailed'),
        description: t('settingsSecurity.removeFailedHelp'),
      });
    } else {
      toast.success({
        title: t('settingsSecurity.authenticatorRemoved'),
        description: t('settingsSecurity.mfaDisabled'),
      });
    }
  }, [unenrollFactor, toast, t]);

  const handleEnrollmentComplete = useCallback(async () => {
    setShowEnrollment(false);
    await refreshMFAStatus();
  }, [refreshMFAStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4" role="status" aria-label={t('settingsSecurity.loadingMfa')}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showEnrollment) {
    return (
      <div className="rounded-lg border p-4">
        <MFAEnrollment
          onComplete={handleEnrollmentComplete}
          onSkip={() => setShowEnrollment(false)}
          isRequired={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEnrolled ? (
            <ShieldCheck className="h-5 w-5 text-primary" />
          ) : (
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{t('settingsSecurity.mfaTitle')}</span>
        </div>
        <Badge variant={isEnrolled ? 'default' : 'secondary'}>
          {isEnrolled ? t('settingsSecurity.enabled') : t('settingsSecurity.disabled')}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('settingsSecurity.mfaHelp')}
        {isMFARequired ? (
          <span className="block mt-1 text-primary font-medium">
            {t('settingsSecurity.requiredForRole', { role: t(`settingsSecurity.${userRole === 'owner' ? 'roleOwner' : 'roleAdmin'}`) })}
          </span>
        ) : null}
      </p>

      {isEnrolled ? (
        <div className="space-y-3">
          {verifiedFactors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {factor.friendly_name || t('settingsSecurity.authenticatorApp')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('settingsSecurity.addedDate', { date: formatDate(new Date(factor.created_at), 'P', { locale: language === 'vi' ? viLocale : language === 'ko' ? koLocale : enUS }) })}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={removingFactorId === factor.id || isMFARequired}
                    aria-label={t('settingsSecurity.removeAuthenticator')}
                  >
                    {removingFactorId === factor.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settingsSecurity.removeAuthenticatorTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settingsSecurity.removeAuthenticatorHelp')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('settingsSecurity.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemoveFactor(factor.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('settingsSecurity.remove')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {isMFARequired ? (
            <p className="text-xs text-muted-foreground">
              {t('settingsSecurity.mfaRequiredHelp')}
            </p>
          ) : null}
        </div>
      ) : (
        <Button onClick={() => setShowEnrollment(true)} size="sm">
          {t('settingsSecurity.setupMfa')}
        </Button>
      )}
    </div>
  );
};

export default MFASettings;
