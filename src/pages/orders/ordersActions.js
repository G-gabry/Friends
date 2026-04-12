import { supabase } from "@/lib/supabase";

export const handlePlaceOrder = async (
  userId,
  cartItems,
  totalPrice,
  status,
  customerInfo = {},
) => {
  try {
    const { data, error } = await supabase.rpc("place_new_order", {
      order_data: {
        user_id: userId,
        customer_name: customerInfo.customer_name || "",
        customer_phone: customerInfo.customer_phone || "",
        customer_address: customerInfo.customer_address || null,
        customer_id: customerInfo.customer_id || null,
        total_price: totalPrice,
        status: status || "pending",
      },
      items_data: cartItems.flatMap(group => {
        const counts = {};
        group.pieces.forEach(p => {
          counts[p.variant_id] = (counts[p.variant_id] || 0) + 1;
        });

        return Object.entries(counts).map(([varId, qty]) => {
          const variant = group.variants.find(v => String(v.id) === String(varId));
          return {
            product_id: varId,
            quantity: qty,
            unit_price: variant ? variant.price : group.price,
            name: variant ? variant.name : group.name,
            size: variant ? variant.size : null,
            color: variant ? variant.color : null,
            image_url: variant ? variant.image_url : group.image_url,
          };
        });
      }),
    });

    if (error) {
      console.error("Order RPC Error:", error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    console.log("Order placed successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Order unexpected error:", err);
    return { success: false, error: err.message };
  }
};

export const ChangeStatus = async (newStatus, orderId) => {
  // Map order statuses to delivery statuses for stock adjustment
  const statusToDeliveryMap = {
    delivered: "delivered",
    returned: "returned",
    cancelled: "returned", // cancelled = restore stock like a return
  };

  const deliveryStatus = statusToDeliveryMap[newStatus];

  // If this status change should trigger stock adjustment, use the RPC
  if (deliveryStatus) {
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "update_order_delivery_with_items",
        {
          p_order_id: orderId,
          p_delivery_status: deliveryStatus,
          p_items_json: "[]",
        }
      );

      if (rpcError) {
        console.error("Delivery RPC Error:", rpcError.message);
        // Fallback: still update the status column
      }
    } catch (err) {
      console.error("Delivery RPC unexpected error:", err);
    }
  }

  // Always update the order status column
  const { data, error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select();

  if (error) {
    console.error("Status Update Error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
};

export const ChangeDeliveryStatus = async (orderId, deliveryStatus, itemsJson = []) => {
  try {
    const { data, error } = await supabase.rpc(
      "update_order_delivery_with_items",
      {
        p_order_id: orderId,
        p_delivery_status: deliveryStatus,
        p_items_json: JSON.stringify(itemsJson),
      }
    );

    if (error) {
      console.error("Delivery Status RPC Error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Delivery status unexpected error:", err);
    return { success: false, error: err.message };
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const { data, error } = await supabase.rpc(
      "delete_order_and_restore_stock",
      {
        p_order_id: orderId,
      }
    );

    if (error) {
      console.error("Delete Order RPC Error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Delete order unexpected error:", err);
    return { success: false, error: err.message };
  }
};
