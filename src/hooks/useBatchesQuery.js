import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useBatches = () => {
  return useQuery({
    queryKey: ["shipment_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipment_batches")
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching batches:", error);
        throw error;
      }
      return data;
    },
  });
};

export const useBatchesStats = () => {
  return useQuery({
    queryKey: ["shipment_batches_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipment_batches_stats").select("*");
      if (error) throw error;
      return data || [];
    }
  });
};

export const useBatchOrders = (batchId) => {
  return useQuery({
    queryKey: ["batch_orders", batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, invoice, customer_name, customer_phone, customer_address, 
          total_price, status, delivery_status
        `)
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching batch orders:", error);
        throw error;
      }
      return data;
    },
    enabled: !!batchId,
  });
};

export const usePreparingOrders = () => {
  return useQuery({
    queryKey: ["preparing_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, invoice, customer_name, customer_address, total_price")
        .eq("status", "preparing")
        .is("batch_id", null)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }
      return data;
    },
  });
};
