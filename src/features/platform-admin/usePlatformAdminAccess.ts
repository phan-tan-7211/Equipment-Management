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
