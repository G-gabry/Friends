import { useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, User, CreditCard, Calendar, Hash, Truck, Printer, Tag } from "lucide-react";
import ShippingForm from "./ShippingForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { InvoicePrint } from "@/components/invoice/InvoicePrint";
import { StickerPrint } from "@/components/invoice/StickerPrint";

import { useOrders } from "@/hooks/useOrdersQuery";
import { useOrdersItems } from "@/hooks/useOrdersQuery";
import { useProfiles } from "@/hooks/useOrdersQuery";
import { useTranslation } from "react-i18next";

const statusVariantMap = {
  pending: "secondary",
  shipped: "secondary",
  delivered: "default",
  returned: "outline",
  cancelled: "outline",
};
const statusConfig = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  shipped: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  delivered:
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  returned: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusTranslate = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  preparing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  returned: "مرتجع",
  cancelled: "ملغي",
  default: "غير معروف",
};

const formatDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const formatCurrency = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
});

export default function OrderDetails() {
  const { orderInvoice } = useParams();
  const { t, i18n } = useTranslation();

  const { data: orders = [] } = useOrders();
  const { data: orderItems = [] } = useOrdersItems();
  const { data: profiles = [] } = useProfiles();

  const profilesMap = Object.fromEntries(
    profiles.map((p) => [p.id, p.full_name]),
  );
  const ordersMap = Object.fromEntries(
    orders.map((order) => [order.invoice, order]),
  );

  const findOrder = ordersMap[orderInvoice] ?? null;
  const findUserName = profilesMap[findOrder?.user_id] ?? "Unknown User";

  const findOrderItems = orderItems.filter(
    (item) => item.order_id === findOrder?.id,
  );

  const totalQuantity = findOrderItems.reduce(
    (acc, item) => acc + item.quantity || 0,
    0,
  );

  const [printConfig, setPrintConfig] = useState(null);

  const handlePrint = (type) => {
    if (!findOrder) {
      console.warn("Print aborted: order data is null or missing.");
      toast.error("لا يمكن طباعة كشف فارغ");
      return;
    }
    
    console.log("------- PRINT DEBUG -------");
    console.log("Type:", type);
    console.log("Order Data:", findOrder);
    console.log("Order Items:", findOrderItems);
    
    setPrintConfig(type);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setPrintConfig(null);
      }, 200);
    });
  };

  // Fetch shipping info for this order
  const { data: shippingData } = useQuery({
    queryKey: ["shipping", findOrder?.id],
    queryFn: async () => {
      if (!findOrder?.id) return null;
      const { data } = await supabase
        .from("shipping")
        .select("*")
        .eq("order_id", findOrder.id)
        .maybeSingle();
      return data;
    },
    enabled: !!findOrder?.id,
  });

  if (!findOrder)
    return (
      <div className="p-8 text-center text-muted-foreground font-bold">
        الطلب غير موجود
      </div>
    );

  const statusVariant = statusVariantMap[findOrder.status] ?? "secondary";

  return (
    <>
    <div
      className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 print:hidden"
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("order.order_details")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("order.order_details_desc")}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => handlePrint('invoice')} className="gap-2">
            <Printer className="w-4 h-4" />
            {t("order.print_invoice")}
          </Button>
          <Button variant="default" size="sm" onClick={() => handlePrint('sticker')} className="gap-2">
            <Tag className="w-4 h-4" />
            {t("order.print_sticker")}
          </Button>

          <Badge
            variant={statusVariant}
            className={`px-4 py-1 text-sm rounded-full ${statusConfig[findOrder.status] || statusConfig.default} mx-4`}
          >
            {statusTranslate[findOrder.status] || findOrder.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hash className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {t("order.invoice_number")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              #{findOrder.invoice}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {t("order.order_date")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground" dir="ltr">
              {formatDate.format(new Date(findOrder.created_at))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
              {t("new_order.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency.format(findOrder.total_price)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground font-bold">
              <Package className="w-5 h-5 text-muted-foreground mr-1 rtl:mr-0 rtl:ml-1" />
              {t("order.attached_products")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-right">{t("sidebar.products")}</TableHead>
                  <TableHead className="text-center">{t("order.quantity")}</TableHead>
                  <TableHead className="text-center">{t("product.price")}</TableHead>
                  <TableHead className="text-left">{t("product.subtotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findOrderItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                          {item?.image_url ? (
                            <img
                              src={item?.image_url}
                              alt={item?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                              IMG
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 w-50">
                          <p className="font-semibold text-foreground">
                            {item?.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground wrap-break-word max-w-58 whitespace-normal ">
                              Notes: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-medium italic text-foreground">
                      {item.quantity}
                    </TableCell>

                    <TableCell className="text-center text-muted-foreground">
                      {formatCurrency.format(item.unit_price)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-foreground">
                      {formatCurrency.format(item.quantity * item.unit_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-muted-foreground mr-1 rtl:mr-0 rtl:ml-1" />
                {t("new_order.customer_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{t("shipping.created_by")}</span>
                <span className="font-semibold text-foreground">
                  {findUserName}
                </span>
              </div>
              <Separator />
              {findOrder.customer_name && (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t("new_order.name")}</span>
                    <span className="font-semibold text-foreground">
                      {findOrder.customer_name}
                    </span>
                  </div>
                  <Separator />
                </>
              )}
              {findOrder.customer_phone && (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t("new_order.phone")}</span>
                    <span className="font-semibold text-foreground text-left" dir="ltr">
                      {findOrder.customer_phone}
                    </span>
                  </div>
                  <Separator />
                </>
              )}
              {findOrder.customer_address && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">{t("new_order.address")}</span>
                  <span className="font-semibold text-foreground text-left max-w-[60%]">
                    {findOrder.customer_address}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-foreground text-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs tracking-wider font-bold text-muted-foreground">
                {t("new_order.order_summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>عدد العناصر</span>
                <span className="font-medium px-2">{totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span>مصاريف الشحن</span>
                <span className="px-2">مشمولة ضمن الإجمالي</span>
              </div>
              <Separator className="bg-muted-foreground/20 my-2" />
              <div className="flex justify-between items-end pt-1">
                <span className="text-base font-medium">{t("new_order.total")}</span>
                <span className="text-2xl font-bold text-chart-3 px-2">
                  {formatCurrency.format(findOrder.total_price)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                  <Truck className="w-4 h-4" /> {t("new_order.shipping")}
                </CardTitle>
                <ShippingForm
                  orderId={findOrder.id}
                  existingShipping={shippingData}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {shippingData ? (
                <>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">اسم الشركة</span>
                    <span className="font-semibold px-2">
                      {shippingData.company_name}
                    </span>
                  </div>
                  {shippingData.tracking_number && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">رقم الشحنة</span>
                      <span className="font-mono text-sm px-2">
                        {shippingData.tracking_number}
                      </span>
                    </div>
                  )}
                  {shippingData.phone && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">هاتف التواصل</span>
                      <span className="px-2" dir="ltr">{shippingData.phone}</span>
                    </div>
                  )}
                  {shippingData.shipped_at && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">تاريخ الشحن</span>
                      <span className="text-xs px-2" dir="ltr">
                        {formatDate.format(new Date(shippingData.shipped_at))}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-3">
                  لم يتم إضافة بيانات شحن
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    
    {/* Printable Layers */}
    {printConfig && (
      <div className="hidden print:block w-full bg-white text-black" dir="rtl">
          {printConfig === 'invoice' && (
            <InvoicePrint order={findOrder} orderItems={findOrderItems} profilesMap={profilesMap} />
          )}
          {printConfig === 'sticker' && (
             <StickerPrint order={findOrder} orderItems={findOrderItems} />
          )}
      </div>
    )}
    </>
  );
}
