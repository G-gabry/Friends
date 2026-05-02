import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useBatches, useBatchesStats, usePreparingOrders } from "@/hooks/useBatchesQuery";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Package, Truck, Calendar, DollarSign, ListOrdered, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

const formatDate = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const SHIPPING_ZONES = [
  {
    id: "all",
    label: "جميع المناطق",
    governorates: [],
  },
  {
    id: "zone1",
    label: "منطقة 1 — الدلتا والقناة",
    governorates: ["الدقهلية", "الشرقية", "الغربية", "كفر الشيخ", "المنوفية", "البحيرة", "دمياط", "الإسكندرية", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم", "بني سويف"],
  },
  {
    id: "zone2",
    label: "منطقة 2 — القاهرة الكبرى",
    governorates: ["القاهرة", "الجيزة", "القليوبية"],
  },
  {
    id: "zone3",
    label: "منطقة 3 — الصعيد والحدود",
    governorates: ["المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"],
  },
];

export default function ShippingBatchesPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: batches = [], isLoading: isLoadingBatches } = useBatches();
  const { data: batchesStats = [] } = useBatchesStats();
  const { data: preparingOrders = [], isLoading: isLoadingPreparing } = usePreparingOrders();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectedZone, setSelectedZone] = useState("all");

  // Filter orders by selected zone
  const zoneGovs = SHIPPING_ZONES.find(z => z.id === selectedZone)?.governorates || [];
  const filteredOrders = selectedZone === "all"
    ? preparingOrders
    : preparingOrders.filter(order =>
        zoneGovs.some(gov => (order.customer_address || "").includes(gov))
      );

  const handleSelectAllZone = () => {
    const allIds = new Set(filteredOrders.map(o => o.id));
    setSelectedOrders(allIds);
  };

  const handleDeselectAll = () => setSelectedOrders(new Set());

  const handleZoneClick = (zoneId) => {
    setSelectedZone(zoneId);
    if (zoneId === "all") {
      setSelectedOrders(new Set());
    } else {
      const zoneGovs = SHIPPING_ZONES.find(z => z.id === zoneId)?.governorates || [];
      const zoneOrders = preparingOrders.filter(order =>
        zoneGovs.some(gov => (order.customer_address || "").includes(gov))
      );
      setSelectedOrders(new Set(zoneOrders.map(o => o.id)));
    }
  };

  const handleToggleOrder = (id) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedOrders(newSelection);
  };

  const handleCreateBatch = async () => {
    if (!company.trim() || !date) {
      toast.error("يرجى إدخال اسم الشركة وتاريخ الشحن");
      return;
    }
    if (selectedOrders.size === 0) {
      toast.error("يرجى اختيار طلب واحد على الأقل");
      return;
    }

    setIsSubmitting(true);
    
    // 1. Create the Batch
    const { data: newBatch, error: batchError } = await supabase
      .from("shipment_batches")
      .insert({
        shipping_company: company.trim(),
        date: date,
        created_by: user.id
      })
      .select("id")
      .single();

    if (batchError) {
      toast.error("حدث خطأ أثناء إنشاء كشف الشحن");
      setIsSubmitting(false);
      return;
    }

    // 2. Attach selected orders to the batch and update their status to "in_delivery"
    const orderIds = Array.from(selectedOrders);
    const { error: ordersError } = await supabase
      .from("orders")
      .update({
        batch_id: newBatch.id,
        status: "in_delivery", 
        delivery_status: "pending"
      })
      .in("id", orderIds);

    if (ordersError) {
      toast.error("حدث خطأ أثناء ربط الطلبات بالكشف");
    } else {
      toast.success(t("shipping.create_success") || "تم إنشاء الكشف بنجاح");
      setCreateModalOpen(false);
      setCompany("");
      setDate("");
      setSelectedOrders(new Set());
      queryClient.invalidateQueries(["shipment_batches"]);
      queryClient.invalidateQueries(["shipment_batches_stats"]);
      queryClient.invalidateQueries(["preparing_orders"]);
      queryClient.invalidateQueries(["orders"]);
    }
    setIsSubmitting(false);
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكشف؟ سيتم فك ارتباط الطلبات وإعادتها لحالة (جاري التجهيز).")) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc("delete_shipping_batch", {
        p_batch_id: batchId
      });

      if (error) {
        toast.error("حدث خطأ أثناء حذف الكشف: " + error.message);
      } else {
        toast.success("تم حذف الكشف بنجاح");
        queryClient.invalidateQueries(["shipment_batches"]);
        queryClient.invalidateQueries(["shipment_batches_stats"]);
        queryClient.invalidateQueries(["preparing_orders"]);
        queryClient.invalidateQueries(["orders"]);
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            {t("shipping.title")}
          </h1>
          <p className="text-muted-foreground mt-1">تجميع وإرسال الشحنات للمندوبين</p>
        </div>

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("shipping.create_batch")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("shipping.create_batch")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2 shrink-0">
              <div>
                <Label>{t("shipping.company")}</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("shipping.select_company")} />
              </div>
              <div>
                <Label>{t("shipping.date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {/* Zone Filter */}
            <div className="shrink-0 pb-2 space-y-1.5">
              <Label className="text-sm font-bold">فلتر حسب المنطقة — اضغط لتحديد الكل تلقائياً:</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* All */}
                <button
                  type="button"
                  onClick={() => handleZoneClick("all")}
                  className={`col-span-2 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedZone === "all"
                      ? "border-slate-500 bg-slate-100 text-slate-800"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                  }`}
                >
                  🌐 جميع المناطق ({preparingOrders.length} طلب)
                </button>

                {/* Zone 2 — Greater Cairo */}
                <button
                  type="button"
                  onClick={() => handleZoneClick("zone2")}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedZone === "zone2"
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-blue-100 bg-white text-blue-600 hover:border-blue-400"
                  }`}
                >
                  🏙️ القاهرة الكبرى
                  <span className="block text-xs font-normal opacity-70">القاهرة · الجيزة · القليوبية</span>
                  <span className="block text-xs font-bold mt-1">
                    {preparingOrders.filter(o =>
                      SHIPPING_ZONES.find(z => z.id === "zone2").governorates.some(g => (o.customer_address || "").includes(g))
                    ).length} طلب
                  </span>
                </button>

                {/* Zone 1 — Delta & Canal */}
                <button
                  type="button"
                  onClick={() => handleZoneClick("zone1")}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedZone === "zone1"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-emerald-100 bg-white text-emerald-600 hover:border-emerald-400"
                  }`}
                >
                  🌾 الدلتا والقناة
                  <span className="block text-xs font-normal opacity-70">الإسكندرية · الدقهلية · الشرقية · الغربية والمزيد</span>
                  <span className="block text-xs font-bold mt-1">
                    {preparingOrders.filter(o =>
                      SHIPPING_ZONES.find(z => z.id === "zone1").governorates.some(g => (o.customer_address || "").includes(g))
                    ).length} طلب
                  </span>
                </button>

                {/* Zone 3 — Upper Egypt & Borders */}
                <button
                  type="button"
                  onClick={() => handleZoneClick("zone3")}
                  className={`col-span-2 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all ${
                    selectedZone === "zone3"
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-amber-100 bg-white text-amber-600 hover:border-amber-400"
                  }`}
                >
                  🏔️ الصعيد والحدود
                  <span className="block text-xs font-normal opacity-70">المنيا · أسيوط · سوهاج · قنا · الأقصر · أسوان والمزيد</span>
                  <span className="block text-xs font-bold mt-1">
                    {preparingOrders.filter(o =>
                      SHIPPING_ZONES.find(z => z.id === "zone3").governorates.some(g => (o.customer_address || "").includes(g))
                    ).length} طلب
                  </span>
                </button>
              </div>

              {/* Selection summary */}
              {selectedOrders.size > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 font-semibold">✓ {selectedOrders.size} طلب محدد</span>
                  <button type="button" onClick={handleDeselectAll} className="text-rose-500 hover:text-rose-700 font-medium">
                    إلغاء تحديد الكل
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md bg-muted/20 p-2">
              {isLoadingPreparing ? (
                <div className="p-4 flex justify-center"><Spinner /></div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-white rounded-md mx-2">
                  {preparingOrders.length === 0 ? "لا يوجد طلبات جاهزة حالياً" : "لا توجد طلبات في هذه المنطقة"}
                </div>
              ) : (
                <div className="space-y-2 px-2">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="flex items-center space-x-3 rtl:space-x-reverse bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:border-primary" onClick={() => handleToggleOrder(order.id)}>
                      <Checkbox id={`order-${order.id}`} checked={selectedOrders.has(order.id)} onCheckedChange={() => handleToggleOrder(order.id)} />
                      <div className="flex-1">
                        <Label htmlFor={`order-${order.id}`} className="font-bold text-base cursor-pointer">فاتورة #{order.invoice}</Label>
                        <p className="text-sm text-muted-foreground">{order.customer_name} — {order.customer_address}</p>
                      </div>
                      <div className="font-bold text-primary">
                        {order.total_price} {t("new_order.egp")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2 pt-2 border-t shrink-0">
                <Button variant="outline" onClick={() => { setCreateModalOpen(false); setSelectedZone("all"); setSelectedOrders(new Set()); }}>{t("common.cancel")}</Button>
                <Button onClick={handleCreateBatch} disabled={isSubmitting || selectedOrders.size === 0}>
                   {isSubmitting ? <Spinner className="mr-2" /> : null}
                   {t("shipping.create_batch")} ({selectedOrders.size})
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">{t("shipping.date")}</TableHead>
              <TableHead className="font-bold">{t("shipping.company")}</TableHead>
              <TableHead className="font-bold text-center">التوصيل (ناجح/فاشل)</TableHead>
              <TableHead className="font-bold">الإجمالي المادي</TableHead>
              <TableHead className="text-center font-bold">{t("shipping.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingBatches ? (
               <TableRow><TableCell colSpan={5} className="h-32 text-center"><Spinner /></TableCell></TableRow>
            ) : batches.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">{t("shipping.no_batches")}</TableCell></TableRow>
            ) : (
              batches.map(batch => {
                const stat = batchesStats.find(s => s.batch_id === batch.id) || { total_orders: 0, total_items: 0, delivered_items: 0, returned_items: 0, total_amount: 0 };
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate.format(new Date(batch.date))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                       <p>{batch.shipping_company}</p>
                       <p className="text-xs text-muted-foreground">{batch.profiles?.full_name}</p>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex gap-2 justify-center font-bold">
                          <Badge variant="outline" className="gap-1 bg-slate-50" title="طلبات"><ListOrdered className="w-3 h-3"/>{stat.total_orders}</Badge>
                          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200" title="إجمالي المنتجات">[{stat.total_items}]</Badge>
                          <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200" title="منتجات تم تسليمها"><Truck className="w-3 h-3"/>{stat.delivered_items}</Badge>
                          <Badge variant="outline" className="gap-1 bg-rose-50 text-rose-700 border-rose-200" title="منتجات مرتجعة"><Package className="w-3 h-3"/>{stat.returned_items}</Badge>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-black text-primary flex items-center gap-1"><DollarSign className="w-4 h-4 text-muted-foreground"/> {stat.total_amount?.toLocaleString() || 0} EGP</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" asChild>
                          <Link to={`/dashboard/shipping/${batch.id}`}>{t("shipping.batch_details")}</Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
