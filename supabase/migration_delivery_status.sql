-- ============================================================
-- MIGRATION: Expand delivery_status + Add return_order_items_to_stock
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the old delivery_status CHECK constraint and add the new one
--    that includes: refused, refused_and_paid, refused_refused
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_status_check
  CHECK (delivery_status IN (
    'pending',
    'delivered',
    'partially_delivered',
    'not_delivered',
    'returned',
    'refused',
    'refused_and_paid',
    'refused_refused',
    'recycled'
  ));

-- ============================================================
-- 2. RPC: return_order_items_to_stock
--    Restores all item quantities back to products.stock_quantity
--    Used when: refused_and_paid, refused_refused (items come back)
-- ============================================================
CREATE OR REPLACE FUNCTION public.return_order_items_to_stock(p_order_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item record;
BEGIN
  FOR v_item IN
    SELECT oi.product_id, oi.quantity, oi.returned_quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    -- Only restore the part not already returned
    UPDATE public.products
    SET stock_quantity = stock_quantity + (v_item.quantity - v_item.returned_quantity)
    WHERE id = v_item.product_id;

    -- Mark all as returned in order_items
    UPDATE public.order_items
    SET
      returned_quantity  = quantity,
      delivered_quantity = 0
    WHERE order_id = p_order_id AND product_id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;
