import { useQuery } from "@tanstack/react-query";
import { getOrders, getOrderItems, getProfiles } from "@/lib/supabase";

export const ordersKeys = {
  orders: ["orders"],
  orderItems: ["orderItems"],
  profiles: ["profiles"],
};

export const ordersQueries = {
  orders: () => ({
    queryKey: ordersKeys.orders,
    queryFn: getOrders,
  }),
  orderItems: () => ({
    queryKey: ordersKeys.orderItems,
    queryFn: getOrderItems,
  }),
  profiles: () => ({
    queryKey: ordersKeys.profiles,
    queryFn: getProfiles,
  }),
};

export const useOrders = () => useQuery({
  ...ordersQueries.orders(),
  refetchOnWindowFocus: true,
  staleTime: 1000,
});
export const useOrdersItems = () => useQuery({
  ...ordersQueries.orderItems(),
  refetchOnWindowFocus: true,
  staleTime: 1000,
});
export const useProfiles = () => useQuery({
  ...ordersQueries.profiles(),
  staleTime: 60000,
});
