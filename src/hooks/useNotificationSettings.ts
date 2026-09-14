import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getAuthClaims } from '@/lib/authClaims';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

export interface NotificationSetting {
  id: string;
  user_id: string;
  organization_id: string;
  team_id: string;
  enabled: boolean;
  statuses: string[];
  created_at: string;
  updated_at: string;
}

export interface UserTeamForNotifications {
  organization_id: string;
  organization_name: string;
  team_id: string;
  team_name: string;
  user_role: string;
  has_access: boolean;
}

export const useUserTeamsForNotifications = () => useQuery({
  queryKey: ['user-teams-notifications'],
  queryFn: async () => {
    const claims = await getAuthClaims();
    if (!claims) return [];
    const { data, error } = await supabase.rpc('get_user_teams_for_notifications', { user_uuid: claims.sub });
    if (error) throw error;
    return data as UserTeamForNotifications[];
  },
});

export const useNotificationSettings = () => useQuery({
  queryKey: ['notification-settings'],
  queryFn: async () => {
    const claims = await getAuthClaims();
    if (!claims) return [];
    const { data, error } = await supabase.from('notification_settings').select('*').eq('user_id', claims.sub);
    if (error) throw error;
    return data as NotificationSetting[];
  },
});

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: async ({ organizationId, teamId, enabled, statuses }: { organizationId: string; teamId: string; enabled: boolean; statuses: string[] }) => {
      const claims = await getAuthClaims();
      if (!claims) throw new Error('User not authenticated');
      const { data, error } = await supabase.from('notification_settings').upsert({
        user_id: claims.sub,
        organization_id: organizationId,
        team_id: teamId,
        enabled,
        statuses,
      }, { onConflict: 'user_id,organization_id,team_id' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success(copy.notificationSettingsUpdated);
    },
    onError: (error) => {
      console.error('Error updating notification settings:', error);
      toast.error(copy.notificationSettingsUpdateFailed);
    },
  });
};

export const useRealTimeNotifications = (organizationId: string) => useQuery({
  queryKey: ['notifications', organizationId],
  queryFn: async () => {
    const claims = await getAuthClaims();
    if (!claims) return [];
    const { data: orgNotifications, error: orgError } = await supabase.from('notifications').select('*').eq('organization_id', organizationId).eq('user_id', claims.sub).eq('is_global', false).order('created_at', { ascending: false }).limit(100);
    if (orgError) throw orgError;
    const { data: globalNotifications, error: globalError } = await supabase.from('notifications').select('*').eq('user_id', claims.sub).eq('is_global', true).order('created_at', { ascending: false }).limit(50);
    if (globalError) throw globalError;
    const allNotifications = [...(orgNotifications || []), ...(globalNotifications || [])];
    const createdAtTimestamps = new Map<string, number>();
    for (const notification of allNotifications) createdAtTimestamps.set(notification.id, new Date(notification.created_at).getTime());
    allNotifications.sort((a, b) => (createdAtTimestamps.get(b.id) ?? 0) - (createdAtTimestamps.get(a.id) ?? 0));
    return allNotifications;
  },
  enabled: !!organizationId,
  refetchInterval: false,
});

export const useNotificationSubscription = (organizationId: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const setupSubscription = async () => {
      try {
        const claims = await getAuthClaims();
        if (!claims || !isMounted) return;
        const userId = claims.sub;
        userIdRef.current = userId;
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        await supabase.realtime.setAuth();
        if (!isMounted) return;
        const channel = supabase.channel(`notifications:user:${userId}`, { config: { private: true } })
          .on('broadcast', { event: 'new_notification' }, (payload) => {
            if (!isMounted) return;
            logger.debug('Received notification broadcast', payload);
            queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') logger.debug('Subscribed to notification broadcast channel', { userId });
            else if (status === 'CHANNEL_ERROR') logger.error('Notification broadcast channel error', err);
            else if (status === 'TIMED_OUT') logger.warn('Notification broadcast subscription timed out');
          });
        if (!isMounted) {
          await supabase.removeChannel(channel);
          return;
        }
        channelRef.current = channel;
      } catch (error) {
        logger.error('Error setting up notification subscription', error);
      }
    };
    if (organizationId) setupSubscription();
    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [organizationId, queryClient]);

  return { isSubscribed: !!channelRef.current, userId: userIdRef.current };
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const claims = await getAuthClaims();
      if (!claims) throw new Error('User not authenticated');
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', claims.sub).eq('organization_id', organizationId).eq('read', false);
      if (error) throw error;
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(copy.notificationsMarkedRead);
    },
    onError: (error) => {
      console.error('Error marking notifications as read:', error);
      toast.error(copy.notificationsMarkReadFailed);
    },
  });
};
