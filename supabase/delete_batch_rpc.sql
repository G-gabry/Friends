-- ============================================================
-- RPC: delete_shipping_batch
-- ============================================================
-- This function deletes a shipping batch and safely detaches
-- any linked orders, resetting their status to 'preparing' and
-- resetting all item counts (delivered/returned) to ensure
-- a clean slate for future batches.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_shipping_batch(
    p_batch_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order record;
    v_new_total numeric;
BEGIN
    -- 1. Loop through all orders in this batch to reset them
    FOR v_order IN SELECT id FROM public.orders WHERE batch_id = p_batch_id LOOP
        
        -- A. Reset all items for this order: delivered=0, returned=0
        UPDATE public.order_items
        SET 
            delivered_quantity = 0,
            returned_quantity = 0
        WHERE order_id = v_order.id;

        -- B. Recalculate the ORIGINAL total price (sum of all items at full quantity)
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        INTO v_new_total
        FROM public.order_items
        WHERE order_id = v_order.id;

        -- C. Reset the order itself: status='preparing', delivery='pending', batch_id=null
        UPDATE public.orders
        SET 
            batch_id = NULL,
            status = 'preparing',
            delivery_status = 'pending',
            total_price = v_new_total
        WHERE id = v_order.id;

    END LOOP;

    -- 2. Delete the batch itself
    DELETE FROM public.shipment_batches
    WHERE id = p_batch_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Shipping batch deleted and orders reset successfully'
    );
END;
$$;
