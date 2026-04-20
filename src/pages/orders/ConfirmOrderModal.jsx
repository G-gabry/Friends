import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, ShoppingCart, User, MapPin, Truck } from "lucide-react";

import { SHIPPING_RATES } from "@/lib/shippingRates";
import { useOrdersItems } from "@/hooks/useOrdersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export function ConfirmOrderModal({ isOpen, onClose, order }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer info state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [customGovernorate, setCustomGovernorate] = useState("");
  const [customCity, setCustomCity] = useState("");

  const { data: allItems = [] } = useOrdersItems();
  const { data: products = [] } = useProducts();

  const [editItems, setEditItems] = useState([]);

  // Initialization
  useEffect(() => {
    if (isOpen && order) {
      setCustomerName(order.customer_name || "");
      setCustomerPhone(order.customer_phone || "");

      // Auto-extract address parts if separated by commas (simple heuristic)
      const parts = (order.customer_address || "").split(",").map((s) => s.trim());
      let addr = order.customer_address || "";
      let gov = "";
      let city = "";

      // If we see 3 parts, attempt to reverse engineer Address, City, Gov
      if (parts.length >= 3) {
        gov = parts[parts.length - 1];
        city = parts[parts.length - 2];
        addr = parts.slice(0, parts.length - 2).join(", ");
      }

      // Attempt safe assignment if it exists in our rates:
      let matchedGov = SHIPPING_RATES.find(r => r.governorate === gov);
      let finalGov = matchedGov ? gov : (gov ? "أخرى" : "");
      setSelectedGovernorate(finalGov);
      if (finalGov === "أخرى" && gov && gov !== "أخرى") setCustomGovernorate(gov);

      let matchedCity = matchedGov ? matchedGov.cities.find(c => c.city === city) : null;
      const finalCity = matchedCity ? city : (city ? "أخرى" : "");
      setSelectedCity(finalCity);
      if (finalCity === "أخرى" && city && city !== "أخرى") setCustomCity(city);

      setCustomerAddress(addr);

      // Load Items
      const orderSpecificItems = allItems.filter(i => i.order_id === order.id);
      setEditItems(orderSpecificItems.map(item => ({ ...item })));
    }
  }, [isOpen, order, allItems]);

  // Shipping Calculation
  const governorates = useMemo(() => {
    const names = SHIPPING_RATES.map((r) => r.governorate);
    return [...names, "أخرى"];
  }, []);

  const availableCities = useMemo(() => {
    if (!selectedGovernorate || selectedGovernorate === "أخرى") return [];
    const gov = SHIPPING_RATES.find((r) => r.governorate === selectedGovernorate);
    return gov ? gov.cities : [];
  }, [selectedGovernorate]);

  const shippingCost = useMemo(() => {
    if (!selectedGovernorate) return 0;
    if (selectedGovernorate === "أخرى") return 85;
    const gov = SHIPPING_RATES.find((r) => r.governorate === selectedGovernorate);
    if (!gov) return 85;
    if (!selectedCity || selectedCity === "أخرى") return gov.cities[0]?.price || 85;
    const cityObj = gov.cities.find((c) => c.city === selectedCity);
    return Number(cityObj?.price || 85);
  }, [selectedGovernorate, selectedCity]);

  // Total pieces count
  const totalPieces = useMemo(() => {
    return editItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [editItems]);

  // Tiered pricing: same logic as NewOrder
  // 1pc=550, 2pc=1050, 3pc=1550, 4+=(1550+(n-3)*500)
  const tieredTotal = useMemo(() => {
    if (totalPieces === 0) return 0;
    if (totalPieces === 1) return 550;
    if (totalPieces === 2) return 1050;
    if (totalPieces === 3) return 1550;
    return 1550 + (totalPieces - 3) * 500;
  }, [totalPieces]);

  const discountSaved = useMemo(() => {
    if (totalPieces < 2) return 0;
    return (totalPieces * 550) - tieredTotal;
  }, [totalPieces, tieredTotal]);

  const grandTotal = tieredTotal + shippingCost;

  // Actions
  const handleQuantityChange = (idx, newQ) => {
    const qty = parseInt(newQ) || 1;
    const newItems = [...editItems];
    newItems[idx].quantity = qty > 0 ? qty : 1;
    setEditItems(newItems);
  };

  const handleRemoveItem = (idx) => {
    const newItems = [...editItems];
    newItems.splice(idx, 1);
    setEditItems(newItems);
  };

  const handleConfirm = async () => {
    if (editItems.length === 0) {
      toast.error("لا يمكن تأكيد طلب فارغ");
      return;
    }
    if (!customerName || !customerPhone) {
      toast.error("يرجى إكمال بيانات العميل");
      return;
    }

    setIsSubmitting(true);

    const finalAddress = [
      customerAddress,
      selectedCity === "أخرى" ? customCity : selectedCity,
      selectedGovernorate === "أخرى" ? customGovernorate : selectedGovernorate,
    ].filter(Boolean).join(", ");

    const { data, error } = await supabase.rpc("update_existing_order", {
      p_order_id: order.id,
      p_order_data: {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: finalAddress,
        total_price: grandTotal,
        status: "confirmed",
      },
      p_items_data: editItems.map(item => ({
        product_id: item.product_id,
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.unit_price,
        image_url: item.image_url
      }))
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("حدث خطأ أثناء التأكيد: " + error.message);
    } else {
      toast.success("تم تأكيد الطلب بنجاح");
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["orderItems"]);
      queryClient.invalidateQueries(["products"]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            مراجعة وتأكيد الطلب #{order?.invoice}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
          {/* Column 1: Customer & Shipping */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 border-b pb-2"><User className="w-4 h-4" /> بيانات العميل</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} dir="ltr" className="text-right" />
              </div>
            </div>

            <h3 className="font-bold flex items-center gap-2 border-b pb-2 mt-4"><MapPin className="w-4 h-4" /> عنوان الشحن</h3>
            <div>
              <Label>العنوان التفصيلي</Label>
              <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Governorate */}
              <div>
                <Label>المحافظة</Label>
                <Select value={selectedGovernorate} onValueChange={(v) => { setSelectedGovernorate(v); setSelectedCity(""); setCustomGovernorate(""); setCustomCity(""); }}>
                  <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>
                    {governorates.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {/* City — only show if normal governorate is selected */}
              {selectedGovernorate && selectedGovernorate !== "أخرى" ? (
                <div>
                  <Label>المدينة / المركز</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                    <SelectContent>
                      {availableCities.map((c) => (<SelectItem key={c.city} value={c.city}>{c.city} — {c.price} ج.م</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              ) : selectedGovernorate !== "أخرى" ? (
                <div>
                  <Label>المدينة / المركز</Label>
                  <Select disabled><SelectTrigger><SelectValue placeholder="اختر المحافظة أولاً" /></SelectTrigger></Select>
                </div>
              ) : null}
            </div>

            {/* Custom location row — shown only when أخرى is selected */}
            {selectedGovernorate === "أخرى" && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 space-y-2">
                <p className="text-xs text-orange-700 font-semibold">📍 أدخل بيانات المنطقة يدوياً</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">اسم المحافظة / المنطقة</Label>
                    <Input
                      value={customGovernorate}
                      onChange={(e) => setCustomGovernorate(e.target.value)}
                      placeholder="مثال: شرم الشيخ"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">اسم المدينة / الحي</Label>
                    <Input
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="مثال: النصر"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom city — shown only when city أخرى is selected inside a real governorate */}
            {selectedCity === "أخرى" && selectedGovernorate !== "أخرى" && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                <Label className="text-xs text-orange-700 font-semibold">📍 اسم المدينة / المركز غير الموجود في القائمة</Label>
                <Input
                  className="mt-1"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="اكتب اسم المدينة أو المركز"
                />
              </div>
            )}

            {shippingCost > 0 && (
              <div className="flex justify-between bg-blue-50 text-blue-700 p-3 rounded-md items-center mt-2">
                <span className="flex items-center gap-2 font-bold"><Truck className="w-4 h-4" /> مصاريف الشحن التلقائية</span>
                <span className="font-black">{shippingCost} EGP</span>
              </div>
            )}
          </div>

          {/* Column 2: Order Items */}
          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
            <h3 className="font-bold flex items-center gap-2 border-b pb-2"><ShoppingCart className="w-4 h-4" /> المنتجات المشتراة</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
              {editItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border shadow-sm">
                  <div className="flex-1">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.size || '-'} / {item.color || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      className="w-16 h-8 text-center"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8" onClick={() => handleRemoveItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="w-16 text-left font-bold text-sm">
                    {item.unit_price * item.quantity} ج
                  </div>
                </div>
              ))}
              {editItems.length === 0 && <p className="text-center text-muted-foreground text-sm p-4">الطلب فارغ من المنتجات</p>}
            </div>

            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>سعر القطع ({totalPieces} قطعة)</span>
                <span>{tieredTotal} EGP</span>
              </div>
              {discountSaved > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>🎉 خصم الكمية مُطبّق</span>
                  <span>وفرت {discountSaved} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground text-sm"><span>الشحن</span><span>{shippingCost} EGP</span></div>
              <div className="flex justify-between font-black text-xl pt-1"><span>الإجمالي النهائي</span><span className="text-primary">{grandTotal} EGP</span></div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || editItems.length === 0}>
            {isSubmitting ? <Spinner /> : "تأكيد الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
