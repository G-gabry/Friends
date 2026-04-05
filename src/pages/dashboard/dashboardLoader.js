import { queryClient } from "@/lib/queryClient";
import { dashboardQueries } from "@/hooks/useDashboardQuery";
import { supabase } from "@/lib/supabase";

export const dashboardLoader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    queryClient.clear();
    return null;
  }

  await queryClient.prefetchQuery(
    dashboardQueries.stats(session.user.id, session),
  );

  return null;
};
