import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/supabase";

export const customerKeys = {
  customers: ["customers"],
};

export const customerQueries = {
  customers: () => ({
    queryKey: customerKeys.customers,
    queryFn: getCustomers,
  }),
};

export const useCustomers = () => useQuery(customerQueries.customers());
