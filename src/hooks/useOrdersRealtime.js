import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useOrdersRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const timeoutRef = useRef(null);
  const recentInserts = useRef(new Set());

  const triggerRevalidate = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }, 500);
  }, [queryClient]);

  useEffect(() => {
    if (channelRef.current) return;

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast.success(`New Order! Invoice: #${payload.new.invoice}`, {
              id: "order-change",
            });

            recentInserts.current.add(payload.new.id);
            setTimeout(
              () => recentInserts.current.delete(payload.new.id),
              2000,
            );
          } else if (payload.eventType === "UPDATE") {
            if (!recentInserts.current.has(payload.new.id)) {
              toast.info(`Order #${payload.new.invoice} has been updated`, {
                id: "order-change",
              });
            }
          } else if (payload.eventType === "DELETE") {
            toast.warning(`An order was removed`, { id: "order-change" });
          }

          triggerRevalidate();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        triggerRevalidate,
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      clearTimeout(timeoutRef.current);
    };
  }, [triggerRevalidate]);
}
