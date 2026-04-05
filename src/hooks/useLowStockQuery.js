import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useLowStock = () =>
  useQuery({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, size, color")
        .lt("stock_quantity", 5)
        .order("stock_quantity", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // refresh every 5 minutes
  });
