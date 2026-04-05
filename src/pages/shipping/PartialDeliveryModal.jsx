import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export function PartialDeliveryModal({ isOpen, onClose, order, orderItems }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize quantities
  React.useEffect(() => {
    if (orderItems && isOpen) {
      const initial = {};
      orderItems.forEach(item => {
        initial[item.id] = item.delivered_quantity ?? item.quantity;
      });
      setQuantities(initial);
    }
  }, [orderItems, isOpen]);

  const handleQuantityChange = (id, value, max) => {
    let val = parseInt(value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > max) val = max;
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const itemsJson = Object.keys(quantities).map(id => ({
      id,
      delivered_quantity: quantities[id]
    }));

    const { error } = await supabase.rpc('update_order_delivery_with_items', {
      p_order_id: order.id,
      p_delivery_status: 'partially_delivered',
      p_items_json: itemsJson
    });

    if (error) {
      toast.error(t("shipping.status_update_error") || "Error updating status");
    } else {
      toast.success(t("shipping.status_update_success") || "Partial delivery recorded");
      queryClient.invalidateQueries(["batch_orders"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["products"]);
      onClose();
    }
    setIsSubmitting(false);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>تسليم جزئي - طلب #{order.invoice}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          <p className="text-sm text-muted-foreground">قم بتحديد الكمية التي تم تسليمها فعلياً لكل منتج. الكميات المرفوضة سيتم إعادتها للمخزون.</p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {orderItems?.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="flex-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-muted-foreground text-left" dir="ltr">{item.size} - {item.color}</p>
                  <p className="text-xs text-primary font-bold">إجمالي مطلوب: {item.quantity}</p>
                </div>
                <div className="flex flex-col gap-1 items-end w-32">
                  <Label className="text-xs">تم التسليم</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max={item.quantity}
                    value={quantities[item.id] ?? ''} 
                    onChange={e => handleQuantityChange(item.id, e.target.value, item.quantity)}
                    className="text-center font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>{t("common.cancel") || "إلغاء"}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
             حفظ وتحديث العهدة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
