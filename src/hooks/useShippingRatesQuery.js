import { useQuery } from "@tanstack/react-query";
import { getShippingRates } from "@/lib/supabase";

export const getShippingRatesQueryKey = () => ["shipping_rates"];

export const useShippingRates = () => {
  return useQuery({
    queryKey: getShippingRatesQueryKey(),
    queryFn: getShippingRates,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
