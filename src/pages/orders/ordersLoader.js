import { queryClient } from "@/lib/queryClient";
import { ordersQueries } from "@/hooks/useOrdersQuery";

export const ordersLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(ordersQueries.orders()),
    queryClient.ensureQueryData(ordersQueries.orderItems()),
    queryClient.ensureQueryData(ordersQueries.profiles()),
  ]);
  return null;
};
