import { queryClient } from "@/lib/queryClient";
import { customerQueries } from "@/hooks/useCustomersQuery";

export const customersLoader = async () => {
  await queryClient.ensureQueryData(customerQueries.customers());
  return null;
};
