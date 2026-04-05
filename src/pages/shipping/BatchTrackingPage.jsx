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

const deliveryStatusConfig = {
  pending: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  partially_delivered: "bg-blue-100 text-blue-700",
  not_delivered: "bg-rose-100 text-rose-700",
  returned: "bg-slate-200 text-slate-800 line-through",
};

const deliveryStatusTranslate = {
  pending: "قيد التوصيل",
  delivered: "تم التسليم",
  partially_delivered: "تسليم جزئي",
  not_delivered: "لم يتم التسليم",
  returned: "مرتجع",
};

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

  const { data: preparingOrders = [], isLoading: isLoadingPreparing } = usePreparingOrders();

  // Stats mapped from items
  const stats = useMemo(() => {
    let deliveredItems = 0;
    let failedItems = 0;
    let totalItems = 0;
    let totalAmount = 0;
    batchOrders.forEach(o => {
      totalAmount += parseFloat(o.total_price || 0);
      const items = allOrderItems.filter(i => i.order_id === o.id);
      items.forEach(i => {
         totalItems += (i.quantity || 0);
         deliveredItems += (i.delivered_quantity || 0);
         // If pending or in delivery, returned might act weird, but ideally returned_quantity is correctly set.
         failedItems += (i.returned_quantity || 0);
      });
    });
    const rate = totalItems > 0 ? ((deliveredItems / totalItems) * 100).toFixed(0) : 0;
    return { totalOrders: batchOrders.length, total: totalItems, delivered: deliveredItems, failed: failedItems, rate, totalAmount };
  }, [batchOrders, allOrderItems]);

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === "partially_delivered") {
       setSelectedOrderForPartial(order);
       setPartialModalOpen(true);
       return;
    }

    const { error } = await supabase.rpc('update_order_delivery_with_items', {
      p_order_id: order.id,
      p_delivery_status: newStatus
    });

    if (error) {
       toast.error(t("shipping.status_update_error") || "Error updating");
    } else {
       toast.success(t("shipping.status_update_success") || "Status updated");
       queryClient.invalidateQueries(["batch_orders", batchId]);
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
    }, 500); // 500ms delay to ensure DOM is ready
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
      .update({
        batch_id: batchId,
        status: "in_delivery", 
        delivery_status: "pending"
      })
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
              <p className="text-muted-foreground mt-1 font-mono text-sm">{currentBatch?.shipping_company} - Batch ID: {batchId}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="py-4"><CardTitle className="text-lg text-muted-foreground">إجمالي الفلوس</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-black text-primary">{stats.totalAmount.toLocaleString()} EGP</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4"><CardTitle className="text-lg text-muted-foreground">إجمالي المنتجات</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black">{stats.total}</p></CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950">
            <CardHeader className="py-4"><CardTitle className="text-lg text-emerald-700 flex items-center gap-2"><PackageCheck className="w-5 h-5"/>{t("shipping.summary.delivered") || "منتجات تم تسليمها"}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black text-emerald-800">{stats.delivered}</p></CardContent>
          </Card>
          <Card className="bg-rose-50 dark:bg-rose-950">
            <CardHeader className="py-4"><CardTitle className="text-lg text-rose-700 flex items-center gap-2"><PackageX className="w-5 h-5"/>{t("shipping.summary.failed") || "منتجات مرتجعة"}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black text-rose-800">{stats.failed}</p></CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="py-4"><CardTitle className="text-lg opacity-80">{t("shipping.summary.success_rate") || "نسبة نجاح التوصيل"}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-black">{stats.rate}%</p></CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-xl border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-32 font-bold">{t("shipping.columns.barcode")}</TableHead>
                <TableHead className="font-bold">{t("shipping.columns.customer")}</TableHead>
                <TableHead className="w-64 font-bold">{t("shipping.columns.address")}</TableHead>
                <TableHead className="font-bold">{t("shipping.columns.total")}</TableHead>
                <TableHead className="w-48 text-center font-bold">{t("shipping.columns.delivery_status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchOrders.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">لا توجد طلبات في هذا الكشف</TableCell></TableRow>
              ) : (
                batchOrders.map((order) => (
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
                      <p className="text-sm line-clamp-2 max-w-[200px]"><MapPin className="w-3 h-3 inline-block -mt-1 text-muted-foreground"/> {order.customer_address}</p>
                    </TableCell>
                    <TableCell className="font-bold text-primary whitespace-nowrap">
                      {order.total_price} EGP
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Select 
                         value={order.delivery_status || "pending"} 
                         onValueChange={(val) => handleStatusChange(order, val)}
                      >
                        <SelectTrigger className={`h-8 font-semibold ${deliveryStatusConfig[order.delivery_status || 'pending']}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{deliveryStatusTranslate["pending"]}</SelectItem>
                          <SelectItem value="delivered">{deliveryStatusTranslate["delivered"]}</SelectItem>
                          <SelectItem value="partially_delivered">{deliveryStatusTranslate["partially_delivered"]}</SelectItem>
                          <SelectItem value="not_delivered">{deliveryStatusTranslate["not_delivered"]}</SelectItem>
                          <SelectItem value="returned">{deliveryStatusTranslate["returned"]}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
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
                لا توجد طلبات جاهزة حالياً (preparing) لإضافتها
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
                    <div className="font-bold text-primary">
                      {order.total_price} {t("new_order.egp") || "جنيه"}
                    </div>
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
              <h2 className="text-xl font-bold">كشف شحنات - شركة: {currentBatch?.shipping_company}</h2>
              <div className="flex justify-between mt-4 pb-4 border-b-2 border-black font-bold">
                 <span>تاريخ اليوم: {new Intl.DateTimeFormat('ar-EG').format(new Date())}</span>
                 <span>عدد الأوردرات: {stats.total}</span>
                 <span className="text-xl">إجمالي فلوس الكشف المنصرفة: {stats.totalAmount.toLocaleString()} جنيه</span>
              </div>
            </div>

            <table className="w-full text-sm border-collapse mb-8 border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 w-12">رقم</th>
                  <th className="border border-black p-2 w-48">العميل / الهاتف</th>
                  <th className="border border-black p-2">العنوان</th>
                  <th className="border border-black p-2 w-64">الأصناف (المنتج - المقاس - الكمية)</th>
                  <th className="border border-black p-2 w-24">المبلغ</th>
                  <th className="border border-black p-2 w-48">موقف التسليم والملاحظات</th>
                  <th className="border border-black p-2 w-24">التوقيع</th>
                </tr>
              </thead>
              <tbody>
                {batchOrders.map((order, idx) => {
                  const items = allOrderItems.filter(i => i.order_id === order.id);
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
                      <td className="border border-black p-2 text-center text-xs font-bold text-muted-foreground">{deliveryStatusTranslate[order.delivery_status || 'pending']}</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  )
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
