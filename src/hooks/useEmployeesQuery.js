import { useQuery } from "@tanstack/react-query";
import { getProfiles } from "@/lib/supabase";

export const employeesKeys = {
  profiles: ["profiles"],
};

export const employeesQueries = {
  profiles: () => ({
    queryKey: employeesKeys.profiles,
    queryFn: getProfiles,
  }),
};
export const useProfiles = () => useQuery(employeesQueries.profiles());
