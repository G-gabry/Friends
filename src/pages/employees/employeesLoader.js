import { queryClient } from "@/lib/queryClient";
import { employeesQueries } from "@/hooks/useEmployeesQuery";

export const employeesLoader = async () => {
  await queryClient.ensureQueryData(employeesQueries.profiles());
  return null;
};
