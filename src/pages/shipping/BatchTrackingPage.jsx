import React, { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBatches, useBatchOrders, usePreparingOrders } from "@/hooks/useBatchesQuery";
import { useProfiles, useOrdersItems } from "@/hooks/useOrdersQuery";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Printer, MapPin, Tag, Truck, ArrowLeft, ArrowRight, PackageCheck, PackageX, Banknote, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartialDeliveryModal } from "./PartialDeliveryModal";

// ─────────────────────────────────────────────
// Shipping cost lookup from order address
// ─────────────────────────────────────────────
const CAIRO_GOVS   = ["القاهرة", "الجيزة", "القليوبية"];
const DELTA_GOVS   = ["الدقهلية", "الشرقية", "الغربية", "كفر الشيخ", "المنوفية", "البحيرة", "دمياط", "الإسكندرية", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف"];
const SAEED_GOVS   = ["المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"];

function getShippingCost(address = "") {
  if (CAIRO_GOVS.some(g => address.includes(g)))  return 60;
  if (DELTA_GOVS.some(g => address.includes(g)))  return 65;
  if (SAEED_GOVS.some(g => address.includes(g)))  return 85;
  return 65; // default fallback
}

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const deliveryStatusConfig = {
  pending:             "bg-amber-100 text-amber-700",
  delivered:           "bg-emerald-100 text-emerald-700",
  partially_delivered: "bg-blue-100 text-blue-700",
  not_delivered:       "bg-rose-100 text-rose-700",
  returned:            "bg-slate-200 text-slate-800 line-through",
  refused:             "bg-red-100 text-red-700",
  refused_and_paid:    "bg-orange-100 text-orange-700",
  refused_refused:     "bg-red-200 text-red-900",
  recycled:            "bg-purple-100 text-purple-700",
};

const deliveryStatusTranslate = {
  pending:             "قيد التوصيل",
  delivered:           "تم التسليم",
  partially_delivered: "تسليم جزئي",
  not_delivered:       "لم يتم التسليم",
  returned:            "مرتجع تدوير",
  refused:             "رفض",
  refused_and_paid:    "رفض ودفع شحن",
  refused_refused:     "رفض ورفض",
  recycled:            "تدوير",
};

// ─────────────────────────────────────────────
// Calculate the net amount we collect per order
// ─────────────────────────────────────────────
function calcOrderAmount(order) {
  const price    = parseFloat(order.total_price || 0);
  const shipping = getShippingCost(order.customer_address || "");
  const status   = order.delivery_status;

  if (status === "delivered" || status === "partially_delivered") {
    // Shipping office collects from customer, keeps their fee, gives us the rest
    return price - shipping;
  }
  if (status === "refused_and_paid") {
    // Customer paid the shipping fee directly to shipping company → we get 0, products come back
    return 0;
  }
  if (status === "refused_refused") {
    // We pay 35 EGP penalty to shipping office
    return -35;
  }
  // returned, refused, not_delivered, recycled, pending → 0
  return 0;
}

// ─────────────────────────────────────────────
// Display amount string per row
// ─────────────────────────────────────────────
function displayAmount(order) {
  const amount = calcOrderAmount(order);
  if (amount === 0) return "0 EGP";
  if (amount < 0)   return `${amount} EGP`; // shows negative e.g. -65
  return `${amount.toLocaleString()} EGP`;
}

export default function BatchTrackingPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data: batches = [] } = useBatches();
  const { data: batchOrders = [], isLoading } = useBatchOrders(batchId);
  const { data: allOrderItems = [] } = useOrdersItems();
  
  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [addOrdersModalOpen, setAddOrdersModalOpen] = useState(false);
  const [selectedOrderForPartial, setSelectedOrderForPartial] = useState(null);
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  // Track which orders are currently being updated to show inline spinner
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  const { data: preparingOrders = [], isLoading: isLoadingPreparing } = usePreparingOrders();

  // ─── Stats ────────────────────────────────
  const stats = useMemo(() => {
    let deliveredItems = 0;
    let failedItems    = 0;
    let totalItems     = 0;
    let totalAmount    = 0;

    batchOrders.forEach(o => {
      totalAmount += calcOrderAmount(o);

      const items = allOrderItems.filter(i => i.order_id === o.id);
      items.forEach(i => {
        totalItems     += (i.quantity || 0);
        deliveredItems += (i.delivered_quantity || 0);
        failedItems    += (i.returned_quantity  || 0);
      });
    });

    const rate = totalItems > 0 ? ((deliveredItems / totalItems) * 100).toFixed(0) : 0;
    return {
      totalOrders: batchOrders.length,
      total: totalItems,
      delivered: deliveredItems,
      failed: failedItems,
      rate,
      totalAmount,
    };
  }, [batchOrders, allOrderItems]);

  // ─── Status change ────────────────────────
  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === "partially_delivered") {
      setSelectedOrderForPartial(order);
      setPartialModalOpen(true);
      return;
    }

    // Mark this order as updating (for UI feedback)
    setUpdatingOrders(prev => new Set(prev).add(order.id));

    let mainStatus = "shipped";
    if (newStatus === "delivered" || newStatus === "partially_delivered") {
      mainStatus = "delivered";
    } else if (["returned", "refused", "refused_and_paid", "refused_refused", "not_delivered"].includes(newStatus)) {
      mainStatus = "returned";
    }

    let updateError = null;

    // Statuses that need simple direct DB update (no item-level tracking)
    const simpleStatuses = ["refused", "refused_and_paid", "refused_refused", "recycled"];

    if (simpleStatuses.includes(newStatus)) {
      const { error } = await supabase
        .from("orders")
        .update({
          delivery_status: newStatus,
          status: mainStatus,
        })
        .eq("id", order.id);
      updateError = error;

      // For refused_and_paid and refused_refused → return items to stock
      if (!error && (newStatus === "refused_and_paid" || newStatus === "refused_refused")) {
        const { error: stockError } = await supabase.rpc("return_order_items_to_stock", {
          p_order_id: order.id,
        });
        if (stockError) {
          console.warn("Stock return error:", stockError.message);
          // Don't block the UI update for this — just warn
        }
      }
    } else {
      // For delivered, returned, not_delivered, pending → use the RPC that handles item quantities
      await supabase.from("orders").update({ status: mainStatus }).eq("id", order.id);
      const { error } = await supabase.rpc("update_order_delivery_with_items", {
        p_order_id: order.id,
        p_delivery_status: newStatus,
      });
      updateError = error;
    }

    setUpdatingOrders(prev => {
      const next = new Set(prev);
      next.delete(order.id);
      return next;
    });

    if (updateError) {
      toast.error(t("shipping.status_update_error") || "حدث خطأ أثناء التحديث: " + updateError.message);
    } else {
      toast.success(t("shipping.status_update_success") || "تم تحديث الحالة");
      // Invalidate so React Query re-fetches fresh data automatically
      queryClient.invalidateQueries(["batch_orders", batchId]);
      queryClient.invalidateQueries(["shipment_batches_stats"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["products"]);
    }
  };

  const currentBatch = batches.find(b => b.id === batchId);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleExportBatchToExcel = async () => {
    const { exportBatchToExcel } = await import("@/lib/exportExcel");
    exportBatchToExcel(currentBatch, batchOrders, allOrderItems);
    toast.success("تم التصدير بنجاح");
  };

  const handleAddOrdersToBatch = async () => {
    if (selectedToAdd.size === 0) return;
    setIsSubmitting(true);
    const orderIds = Array.from(selectedToAdd);
    const { error } = await supabase
      .from("orders")
      .update({ batch_id: batchId, status: "shipped", delivery_status: "pending" })
      .in("id", orderIds);

    if (error) {
      toast.error("حدث خطأ أثناء إضافة الطلبات");
    } else {
      toast.success("تمت إضافة الطلبات للكشف بنجاح");
      setAddOrdersModalOpen(false);
      setSelectedToAdd(new Set());
      queryClient.invalidateQueries(["batch_orders", batchId]);
      queryClient.invalidateQueries(["orders"]);
    }
    setIsSubmitting(false);
  };

  const handleToggleAddOrder = (id) => {
    const next = new Set(selectedToAdd);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedToAdd(next);
  };

  if (isLoading) return <div className="p-8 text-center flex justify-center"><Spinner /></div>;

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6 print:hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              {i18n.language === 'ar' ? <ArrowRight /> : <ArrowLeft />}
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Truck className="w-8 h-8 text-primary" />
                {t("shipping.batch_details") || "تفاصيل كشف الشحن"}
              </h1>
              <p className="text-muted-foreground mt-1 font-mono text-sm">{currentBatch?.shipping_company} — Batch ID: {batchId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddOrdersModalOpen(true)} className="gap-2 shrink-0 border-primary text-primary hover:bg-primary/5">
              <Plus className="w-4 h-4 ml-1" /> إضافة طلبات
            </Button>
            <Button variant="outline" onClick={handleExportBatchToExcel} className="gap-2 shrink-0">
              تصدير Excel
            </Button>
            <Button onClick={handlePrint} className="gap-2 shrink-0">
              <Printer className="w-4 h-4" /> الطباعة
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg text-muted-foreground">إجمالي الفلوس</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-black ${stats.totalAmount >= 0 ? "text-primary" : "text-rose-600"}`}>
                {stats.totalAmount.toLocaleString()} EGP
              </p>
              <p className="text-xs text-muted-foreground mt-1">بعد خصم الشحن والمرتجعات</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4"><CardTitle className="text-lg text-muted-foreground">إجمالي المنتجات</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black">{stats.total}</p></CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950">
            <CardHeader className="py-4">
              <CardTitle className="text-lg text-emerald-700 flex items-center gap-2">
                <PackageCheck className="w-5 h-5"/>{t("shipping.summary.delivered") || "تم تسليمها"}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-black text-emerald-800">{stats.delivered}</p></CardContent>
          </Card>
          <Card className="bg-rose-50 dark:bg-rose-950">
            <CardHeader className="py-4">
              <CardTitle className="text-lg text-rose-700 flex items-center gap-2">
                <PackageX className="w-5 h-5"/>{t("shipping.summary.failed") || "مرتجعة"}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-black text-rose-800">{stats.failed}</p></CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="py-4"><CardTitle className="text-lg opacity-80">{t("shipping.summary.success_rate") || "نسبة النجاح"}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black">{stats.rate}%</p></CardContent>
          </Card>
        </div>

        {/* Shipping cost legend */}
        <div className="flex gap-3 text-xs font-semibold flex-wrap">
          <span className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full">🏙️ القاهرة / الجيزة / القليوبية = 60 EGP شحن</span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full">🌾 الدلتا = 65 EGP شحن</span>
          <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full">🏔️ الصعيد = 85 EGP شحن</span>
          <span className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full">رفض ورفض = -35 EGP</span>
        </div>

        {/* Orders table */}
        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-32 font-bold">{t("shipping.columns.barcode")}</TableHead>
                <TableHead className="font-bold">{t("shipping.columns.customer")}</TableHead>
                <TableHead className="w-64 font-bold">{t("shipping.columns.address")}</TableHead>
                <TableHead className="font-bold">المبلغ الصافي</TableHead>
                <TableHead className="w-52 text-center font-bold">{t("shipping.columns.delivery_status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchOrders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">لا توجد طلبات في هذا الكشف</TableCell></TableRow>
              ) : (
                batchOrders.map((order) => {
                  const amount    = calcOrderAmount(order);
                  const isUpdating = updatingOrders.has(order.id);
                  return (
                    <TableRow key={order.id} className="group">
                      <TableCell className="font-medium font-mono">
                        <div className="text-slate-400">#</div>
                        {order.invoice}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold">{order.customer_name}</p>
                        <p className="text-muted-foreground text-xs" dir="ltr">{order.customer_phone}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-[200px]">
                          <MapPin className="w-3 h-3 inline-block -mt-1 text-muted-foreground"/> {order.customer_address}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                          شحن: {getShippingCost(order.customer_address)} EGP
                        </p>
                      </TableCell>
                      <TableCell className={`font-black whitespace-nowrap ${amount < 0 ? "text-rose-600" : amount > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {displayAmount(order)}
                        {order.delivery_status !== "pending" && (
                          <p className="text-xs font-normal text-muted-foreground">
                            (سعر الأوردر: {order.total_price} EGP)
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {isUpdating ? (
                          <div className="flex justify-center"><Spinner /></div>
                        ) : (
                          <Select
                            value={order.delivery_status || "pending"}
                            onValueChange={(val) => handleStatusChange(order, val)}
                          >
                            <SelectTrigger className={`h-8 font-semibold ${deliveryStatusConfig[order.delivery_status || "pending"]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{deliveryStatusTranslate["pending"]}</SelectItem>
                              <SelectItem value="delivered">{deliveryStatusTranslate["delivered"]}</SelectItem>
                              <SelectItem value="partially_delivered">{deliveryStatusTranslate["partially_delivered"]}</SelectItem>
                              <SelectItem value="not_delivered">{deliveryStatusTranslate["not_delivered"]}</SelectItem>
                              <SelectItem value="returned">{deliveryStatusTranslate["returned"]}</SelectItem>
                              <SelectItem value="refused">{deliveryStatusTranslate["refused"]}</SelectItem>
                              <SelectItem value="refused_and_paid">{deliveryStatusTranslate["refused_and_paid"]}</SelectItem>
                              <SelectItem value="refused_refused">{deliveryStatusTranslate["refused_refused"]}</SelectItem>
                              <SelectItem value="recycled">{deliveryStatusTranslate["recycled"]}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PartialDeliveryModal
        isOpen={partialModalOpen}
        onClose={() => setPartialModalOpen(false)}
        order={selectedOrderForPartial}
        orderItems={allOrderItems.filter(i => i.order_id === selectedOrderForPartial?.id)}
      />

      {/* Add Orders Modal */}
      <Dialog open={addOrdersModalOpen} onOpenChange={setAddOrdersModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl">إضافة طلبات جديدة لهذا الكشف</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md bg-muted/20 p-2 my-4">
            {isLoadingPreparing ? (
              <div className="p-8 flex justify-center"><Spinner /></div>
            ) : preparingOrders.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground bg-white rounded-md">
                لا توجد طلبات جاهزة حالياً لإضافتها
              </div>
            ) : (
              <div className="space-y-2">
                {preparingOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center space-x-3 rtl:space-x-reverse bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:border-primary"
                    onClick={() => handleToggleAddOrder(order.id)}
                  >
                    <Checkbox
                      id={`add-${order.id}`}
                      checked={selectedToAdd.has(order.id)}
                      onCheckedChange={() => handleToggleAddOrder(order.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`add-${order.id}`} className="font-bold text-base cursor-pointer">فاتورة #{order.invoice}</Label>
                      <p className="text-sm text-muted-foreground">{order.customer_name} — {order.customer_address}</p>
                    </div>
                    <div className="font-bold text-primary">{order.total_price} {t("new_order.egp") || "جنيه"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOrdersModalOpen(false)}>{t("common.cancel") || "إلغاء"}</Button>
            <Button onClick={handleAddOrdersToBatch} disabled={isSubmitting || selectedToAdd.size === 0}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              إضافة للكشف ({selectedToAdd.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Print Layout */}
      {isPrinting && (
        <div className="hidden print:block p-8 bg-white text-black min-h-screen rtl" dir="rtl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black mb-2">Friends Wear</h1>
            <h2 className="text-xl font-bold">كشف شحنات — شركة: {currentBatch?.shipping_company}</h2>
            <div className="flex justify-between mt-4 pb-4 border-b-2 border-black font-bold">
              <span>تاريخ اليوم: {new Intl.DateTimeFormat('ar-EG').format(new Date())}</span>
              <span>عدد الأوردرات: {stats.totalOrders}</span>
              <span className="text-xl">الإجمالي الصافي: {stats.totalAmount.toLocaleString()} جنيه</span>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8 border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-12">رقم</th>
                <th className="border border-black p-2 w-48">العميل / الهاتف</th>
                <th className="border border-black p-2">العنوان</th>
                <th className="border border-black p-2 w-64">الأصناف</th>
                <th className="border border-black p-2 w-24">سعر الأوردر</th>
                <th className="border border-black p-2 w-24">المبلغ الصافي</th>
                <th className="border border-black p-2 w-36">الحالة</th>
                <th className="border border-black p-2 w-24">التوقيع</th>
              </tr>
            </thead>
            <tbody>
              {batchOrders.map((order, idx) => {
                const items = allOrderItems.filter(i => i.order_id === order.id);
                const amount = calcOrderAmount(order);
                return (
                  <tr key={order.id} className="break-inside-avoid">
                    <td className="border border-black p-2 font-bold text-center">{idx + 1}</td>
                    <td className="border border-black p-2">
                      <div className="font-bold">{order.customer_name}</div>
                      <div dir="ltr" className="text-right">{order.customer_phone}</div>
                    </td>
                    <td className="border border-black p-2 text-xs">{order.customer_address}</td>
                    <td className="border border-black p-2 text-xs leading-relaxed">
                      <ul className="list-disc list-inside">
                        {items.map((item, i) => (
                          <li key={i}>{item.name} ({item.size}) &times; {item.quantity}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-black p-2 font-bold text-center">{order.total_price} ج</td>
                    <td className={`border border-black p-2 font-bold text-center ${amount < 0 ? "text-red-700" : ""}`}>
                      {amount} ج
                    </td>
                    <td className="border border-black p-2 text-center text-xs font-bold">
                      {deliveryStatusTranslate[order.delivery_status || "pending"]}
                    </td>
                    <td className="border border-black p-2"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between mt-12 px-12 font-bold">
            <p>توقيع مسؤول المخزن /</p>
            <p>توقيع مندوب شركة الشحن /</p>
          </div>
        </div>
      )}
    </>
  );
}
