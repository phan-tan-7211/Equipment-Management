import { useI18n } from '@/i18n';

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { useSettings } from '@/contexts/useSettings';
import PersonalizationSettings from '@/components/settings/PersonalizationSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import { EmailPrivacySettings } from '@/components/settings/EmailPrivacySettings';
import { SensitivePrivacySettings } from '@/components/settings/SensitivePrivacySettings';
import { SecurityStatus } from '@/components/security/SecurityStatus';
import { SessionStatus } from '@/components/session/SessionStatus';
import NotificationSettings from '@/components/settings/NotificationSettings';
import MFASettings from '@/components/settings/MFASettings';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { isMFAEnabled } from '@/lib/flags';
import { useAppToast } from '@/hooks/useAppToast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/useUser';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useResolvedAvatarUrl } from '@/hooks/useResolvedAvatarUrl';
import Page from '@/components/layout/Page';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { trimmedAvatarPath, userDisplayInitials } from '@/utils/userDisplayInitials';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';


const SettingsContent = () => {
  const { t } = useI18n();
  const { resetSettings } = useSettings();
  const { user } = useAuth();
  const { currentUser } = useUser();
  const { currentOrganization } = useOrganization();
  const { data: headerAvatarUrl, isPending: isHeaderAvatarPending } = useResolvedAvatarUrl(currentUser?.avatar_url);
  const appToast = useAppToast();
  const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false);
  const canManageDsr =
    currentOrganization?.userRole === 'owner' ||
    currentOrganization?.userRole === 'admin';

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('email_private, limit_sensitive_pi')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleResetSettings = () => {
    resetSettings();
    appToast.success({ description: t('settingsPage.resetSuccess') });
  };

  const initials = userDisplayInitials(currentUser?.name);
  const headerAvatarPath = trimmedAvatarPath(currentUser?.avatar_url);
  const isHeaderAvatarResolving =
    isHeaderAvatarPending && headerAvatarPath.length > 0 && !/^https?:\/\//i.test(headerAvatarPath);

  return (
    <div className="space-y-6">
      {/* Page header with user identity */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('settingsPage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('settingsPage.description')}
        </p>
        {currentUser && (
          <div className="flex items-center gap-3 mt-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={headerAvatarUrl || undefined} alt={currentUser.name || ''} />
              <AvatarFallback className="text-xs">
                {isHeaderAvatarResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{currentUser.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar + content layout */}
      <div className="flex flex-col md:flex-row gap-8">
        <SettingsNav />

        <div className="flex-1 min-w-0 divide-y">
          {/* Profile */}
          <section id="profile" className="pb-8 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('settingsPage.profile')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settingsPage.profileDescription')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-5">
                <ProfileSettings />
              </div>
            </div>
          </section>

          {/* Personalization */}
          <section id="personalization" className="py-8 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('settingsPage.personalization')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settingsPage.personalizationDescription')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-5">
                <PersonalizationSettings />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section id="notifications" className="py-8 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('settingsPage.notifications')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settingsPage.notificationsDescription')}
                </p>
              </div>
              <div className="md:col-span-2">
                <NotificationSettings />
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section id="privacy" className="py-8 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('settingsPage.privacy')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settingsPage.privacyDescription')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <EmailPrivacySettings
                  currentEmailPrivate={profile?.email_private || false}
                  onUpdate={() => refetchProfile()}
                />

                <SensitivePrivacySettings
                  currentLimitSensitivePi={(profile as Record<string, unknown>)?.limit_sensitive_pi === true}
                  onUpdate={() => refetchProfile()}
                />

                {/* Privacy Rights */}
                <div className="pt-2 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('settingsPage.privacyRights')}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/privacy-request">{t('settingsPage.submitRequest')}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/privacy-policy">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        {t('settingsPage.viewPolicy')}
                      </Link>
                    </Button>
                    {canManageDsr ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/dsr">{t('settingsPage.dsrCockpit')}</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="py-8 scroll-mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('settingsPage.security')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settingsPage.securityDescription')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-4">
                {isMFAEnabled() ? <MFASettings /> : null}
                <SessionStatus />
                <SecurityStatus />
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <div className="pt-8" id="danger-zone">
            <div className="rounded-lg border border-destructive/50 overflow-hidden">
              <div className="bg-destructive/5 border-b border-destructive/30 px-4 py-3">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('settingsPage.dangerZone')}
                </h3>
              </div>
              <div className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t('settingsPage.resetTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settingsPage.resetDescription')}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetSettings}
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
                  >
                    {t('settingsPage.resetButton')}
                  </Button>
                </div>
              </div>
              <div className="border-t border-destructive/30 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t('settingsPage.deleteTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('settingsPage.deleteDescription')}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteAccountOpen(true)}
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
                  >
                    {t('settingsPage.deleteButton')}
                  </Button>
                </div>
              </div>
            </div>
            <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  return (
    <SettingsProvider>
      <Page maxWidth="7xl" padding="responsive">
        <SettingsContent />
      </Page>
    </SettingsProvider>
  );
};

export default Settings;
