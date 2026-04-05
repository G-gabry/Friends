import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const dashboardKeys = {
  stats: (userId, accessToken) => ["dashboard", "stats", userId, accessToken],
};

export const dashboardQueries = {
  stats: (userId, session) => ({
    queryKey: dashboardKeys.stats(userId, session?.access_token),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "get-dashboard-stats",
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (error) console.log(error);
      return data;
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!userId && !!session,
  }),
};
export const useDashboardStats = () => {
  const { user, session } = useAuth();
  return useQuery(dashboardQueries.stats(user?.id, session));
};
