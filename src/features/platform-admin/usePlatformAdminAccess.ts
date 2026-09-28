import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePlatformAdminAccess() {
  const { user, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ['platform-admin-access', user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('current_user_is_platform_admin');
      if (error) throw error;
      return data === true;
    },
  });

  return {
    isPlatformAdmin: query.data === true,
    isLoading: authLoading || (Boolean(user) && query.isLoading),
    error: query.error,
  };
}

export function usePlatformAdminPendingAccessRequests() {
  const { user } = useAuth();
  const { isPlatformAdmin } = usePlatformAdminAccess();
  const query = useQuery({
    queryKey: ['platform-access-requests', 'pending'],
    enabled: Boolean(user?.id && isPlatformAdmin),
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_list_access_requests', {
        p_status: 'pending',
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    pendingCount: query.data?.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
