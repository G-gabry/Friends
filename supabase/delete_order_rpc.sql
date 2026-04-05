-- ============================================================
-- RPC: delete_order_and_restore_stock
-- ============================================================
-- This function safely deletes an order while restoring any 
-- undelivered items back to the product inventory.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_order_and_restore_stock(
    p_order_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item record;
    v_restore_qty integer;
BEGIN
    -- 1. Check if order exists
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. Restore stock for all items in the order
    FOR v_item IN 
        SELECT id, product_id, quantity, COALESCE(returned_quantity, 0) as returned_qty 
        FROM public.order_items 
        WHERE order_id = p_order_id 
    LOOP
        -- Calculate how much stock was actually "out" (total - already returned)
        v_restore_qty := v_item.quantity - v_item.returned_qty;

        IF v_restore_qty > 0 AND v_item.product_id IS NOT NULL THEN
            UPDATE public.products
            SET stock_quantity = stock_quantity + v_restore_qty
            WHERE id = v_item.product_id;
            
            RAISE NOTICE 'Restored % units to product %', v_restore_qty, v_item.product_id;
        END IF;
    END LOOP;

    -- 3. Delete the order (Cascading will handle order_items and shipping)
    DELETE FROM public.orders WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Order deleted and stock restored successfully'
    );
END;
$$;
