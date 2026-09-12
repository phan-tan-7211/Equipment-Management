
import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { enUS, ko as koLocale, vi as viLocale } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, RefreshCw, Clock, CheckCircle, XCircle, ShieldAlert, LogOut, Users, Building2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SessionStatus = () => {
  const { t, language } = useI18n();
  const dateLocale = language === 'vi' ? viLocale : language === 'ko' ? koLocale : enUS;
  const { sessionData, isLoading, error, refreshSession } = useSession();
  const { user, signOut } = useAuth();

  const getSessionAge = () => {
    if (!sessionData?.lastUpdated) return t('settingsSecurity.unknown');
    return formatDistanceToNow(new Date(sessionData.lastUpdated), { addSuffix: true, locale: dateLocale });
  };

  const getLastSignIn = () => {
    if (!user?.last_sign_in_at) return t('settingsSecurity.unknown');
    return formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true, locale: dateLocale });
  };

  const handleSignOutAllSessions = async () => {
    try {
      const { error: globalSignOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (globalSignOutError) throw globalSignOutError;

      await signOut();
      toast.success(t('settingsSecurity.signedOutAll'));
      window.location.assign('/auth');
    } catch (globalError) {
      toast.error(globalError instanceof Error ? globalError.message : t('settingsSecurity.signOutFailed'));
    }
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-4 w-4 text-destructive" />;
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin text-warning" />;
    if (sessionData) return <CheckCircle className="h-4 w-4 text-success" />;
    return <Database className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('settingsSecurity.sessionStatus')}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void refreshSession()}
                disabled={isLoading}
                aria-label={t('settingsSecurity.sessionRefresh')}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('settingsSecurity.sessionRefresh')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between min-h-8">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">{t('settingsSecurity.sessionData')}</span>
        </div>
        <Badge variant={sessionData ? 'default' : 'secondary'}>
          {sessionData ? t('settingsSecurity.loaded') : t('settingsSecurity.unavailable')}
        </Badge>
      </div>

      {sessionData && (
        <>
          <div className="flex items-center justify-between min-h-8">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settingsSecurity.lastUpdated')}</span>
            </div>
            <span className="text-xs text-muted-foreground">{getSessionAge()}</span>
          </div>

          <div className="flex items-center justify-between min-h-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settingsSecurity.lastSignIn')}</span>
            </div>
            <span className="text-xs text-muted-foreground">{getLastSignIn()}</span>
          </div>

          <div className="flex items-center justify-between min-h-8">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settingsSecurity.organizations')}</span>
            </div>
            <span className="text-sm font-medium">{sessionData.organizations.length}</span>
          </div>

          <div className="flex items-center justify-between min-h-8">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settingsSecurity.teamMemberships')}</span>
            </div>
            <span className="text-sm font-medium">{sessionData.teamMemberships.length}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-1">
                <LogOut className="h-4 w-4 mr-2" />
                {t('settingsSecurity.signOutAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settingsSecurity.signOutTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settingsSecurity.signOutHelp')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('settingsSecurity.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleSignOutAllSessions()}>
                  {t('settingsSecurity.signOutEverywhere')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!error && sessionData && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-md">
          <p className="text-xs text-success">
            {t('settingsSecurity.sessionSuccess')}
          </p>
        </div>
      )}
    </div>
  );
};
