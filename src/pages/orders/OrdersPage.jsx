import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronDownIcon, Download, Trash2, Printer, Tag } from "lucide-react";

import { useSearchParams, useNavigate } from "react-router-dom";
import { UpdateStatus } from "./UpdateStatus";
import { OrdersFilter } from "./OrdersFilter";
import { toast } from "sonner";
import { ConfirmOrderModal } from "./ConfirmOrderModal";
import { useState, useRef } from "react";
import { InvoicePrint } from "@/components/invoice/InvoicePrint";
import { StickerPrint } from "@/components/invoice/StickerPrint";
import { Checkbox } from "@/components/ui/checkbox";

import { useTranslation } from "react-i18next";

import { useOrders } from "@/hooks/useOrdersQuery";
import { useProfiles, useOrdersItems } from "@/hooks/useOrdersQuery";
import { useBatches } from "@/hooks/useBatchesQuery";
import { exportOrdersToExcel } from "@/lib/exportExcel";

const statusConfig = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  preparing: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100",
  shipped: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  delivered:
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  returned: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
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

const getDateRange = (filter) => {
  const now = new Date();

  switch (filter) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case "yesterday": {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    }
    case "month": {
      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    default:
      return null;
  }
};

import { useQueryClient } from "@tanstack/react-query";

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [confirmOrderOpen, setConfirmOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printType, setPrintType] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(new Set());

  const { data: orders = [] } = useOrders();
  const { data: profiles = [] } = useProfiles();
  const { data: allOrderItems = [] } = useOrdersItems();
  const { data: batches = [] } = useBatches();

  const profilesMap = Object.fromEntries(
    profiles.map((p) => [p.id, p.full_name]),
  );

  const findUserName = (userId) => {
    return profilesMap[userId] ?? "Unknown User";
  };

  const filter = searchParams.get("filter") || "all";
  const employeeFilter = searchParams.get("employee") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const query = searchParams.get("q") || "";

  const getFilteredOrders = (
    orders,
    { filter, employeeFilter, statusFilter, query },
  ) => {
    let result = orders;

    const range = getDateRange(filter);

    if (range) {
      result = result.filter((order) => {
        const date = new Date(order.created_at);
        return date >= range.start && date <= range.end;
      });
    }

    if (employeeFilter !== "all") {
      result = result.filter(
        (order) => profilesMap[order.user_id] === employeeFilter,
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (query) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (order) =>
          order.invoice?.toString().includes(q) ||
          order.customer_name?.toLowerCase().includes(q),
      );
    }
    return result;
  };

  const filteredOrders = getFilteredOrders(orders, {
    filter,
    employeeFilter,
    statusFilter,
    query,
  });

  const dayTotal = formatCurrency.format(
    filteredOrders?.reduce(
      (acc, order) =>
        acc + (order.status === "delivered" ? order.total_price || 0 : 0),
      0,
    ),
  );

  const readyToPrintOrders = selectedForPrint.size > 0 
    ? filteredOrders?.filter(o => selectedForPrint.has(o.id)) || []
    : filteredOrders?.filter(o => o.status === 'confirmed' || o.status === 'preparing') || [];

  const handleToggleSelect = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedForPrint);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForPrint(next);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedForPrint.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedForPrint(new Set());
    } else {
      setSelectedForPrint(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkPrint = (type) => {
    if (readyToPrintOrders.length === 0) {
      toast.warning(t('orders.no_orders_to_print') || "No orders ready to print");
      return;
    }
    setPrintType(type);
    setTimeout(() => {
      window.print();
      setPrintType(null);
      setSelectedForPrint(new Set()); // Clear selection after printing
    }, 300);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <OrdersFilter profiles={profiles} />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleBulkPrint('invoice')} className="gap-2">
            <Printer className="w-4 h-4 ml-1" />
            {t('orders.print_ready')} ({readyToPrintOrders.length})
          </Button>
          <Button variant="default" size="sm" onClick={() => handleBulkPrint('sticker')} className="gap-2">
            <Tag className="w-4 h-4 ml-1" />
            {t('orders.print_stickers')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const success = exportOrdersToExcel(filteredOrders, profiles, allOrderItems, batches);
              if (success) {
                toast.success(t('orders.export_success') || "Orders exported successfully");
              } else {
                toast.error(t('orders.export_error') || "No orders to export");
              }
            }}
          >
            <Download className="w-4 h-4 ml-1" />
            {t('orders.export')}
          </Button>
        </div>
      </div>
      <Table dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <TableCaption>{filteredOrders.length} {t('orders.orders_found')}</TableCaption>

        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className={`w-10 text-center ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
              <Checkbox 
                checked={filteredOrders.length > 0 && selectedForPrint.size === filteredOrders.length}
                onCheckedChange={(checked) => handleSelectAll({ stopPropagation: () => {} })}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className={`w-25 font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-right border-l' : 'text-left border-r'}`}>
              {t('orders.invoice')}
            </TableHead>
            <TableHead className={`font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-right border-l' : 'text-left border-r'}`}>{t('orders.status_header') || "Status"}</TableHead>
            <TableHead className={`font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-right border-l' : 'text-left border-r'}`}>{t('orders.date')}</TableHead>
            <TableHead className={`font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-right border-l' : 'text-left border-r'}`}>{t('orders.customer')}</TableHead>
            <TableHead className={`font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-right border-l' : 'text-left border-r'}`}>{t('orders.employee')}</TableHead>
            <TableHead className={`font-bold text-foreground overflow-hidden ${i18n.language === 'ar' ? 'text-left border-l' : 'text-right border-r'}`}>{t('orders.amount')}</TableHead>
            <TableHead className="text-center font-bold text-foreground">{t('orders.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredOrders?.map((order) => (
            <TableRow
              onClick={() =>
                navigate(`${order.invoice}`, {
                  state: { from: location.search },
                })
              }
              key={order.id}
              className="cursor-pointer group"
            >
              <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                <Checkbox 
                  checked={selectedForPrint.has(order.id)}
                  onCheckedChange={(checked) => handleToggleSelect({ stopPropagation: () => {} }, order.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="font-medium py-3 transition-colors">
                <span className="text-slate-400 group-hover:text-primary transition-colors">
                  #
                </span>
                {order.invoice}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {order.status === "cancelled" || order.status === "returned" ? (
                  <Badge
                    className={`${statusConfig[order.status] || statusConfig.default}`}
                  >
                    {statusTranslate[order.status] || order.status}
                  </Badge>
                ) : (
                  <UpdateStatus orderId={order.id}>
                    <Badge
                      className={`${statusConfig[order.status] || statusConfig.default}`}
                    >
                      {order.status === "delivery" && (
                        <Spinner data-icon="inline-start" />
                      )}
                      {order.status === "shipped" && (
                        <Spinner data-icon="inline-start" />
                      )}
                      {t(`orders.status.${order.status}`) || order.status}
                      <ChevronDownIcon className="mx-1 w-4 h-4" />
                    </Badge>
                  </UpdateStatus>
                )}
              </TableCell>
              <TableCell>
                <div dir="ltr" className="text-right inline-block">
                  {formatDate.format(new Date(order.created_at))}
                </div>
              </TableCell>
              <TableCell>{order.customer_name || '—'}</TableCell>
              <TableCell>{findUserName(order.user_id)}</TableCell>
              <TableCell className="text-left font-bold">
                {formatCurrency.format(order.total_price)}
              </TableCell>
              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                {order.status === "pending" && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-7 text-xs px-3"
                    onClick={() => { setSelectedOrder(order); setConfirmOrderOpen(true); }}
                  >
                    {t('orders.confirm_order')}
                  </Button>
                )}
                {order.status === "confirmed" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs px-3 text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200"
                    onClick={async () => {
                       const { ChangeStatus } = await import("./ordersActions");
                       const { success } = await ChangeStatus("preparing", order.id);
                       if(success) queryClient.invalidateQueries(["orders"]);
                    }}
                  >
                    {t('orders.mark_preparing') || "جاهز للشحن"}
                  </Button>
                )}
                
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(t('orders.confirm_delete_msg') || "هل أنت متأكد من حذف هذا الطلب؟ سيتم استعادة المخزون تلقائياً.")) {
                      const { deleteOrder } = await import("./ordersActions");
                      const { success, error } = await deleteOrder(order.id);
                      if (success) {
                        toast.success(t('orders.delete_success') || "تم حذف الطلب بنجاح");
                        queryClient.invalidateQueries(["orders"]);
                      } else {
                        toast.error(error || "فشل حذف الطلب");
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={7} className={`font-bold ${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>{t('orders.total')}:</TableCell>
            <TableCell className={`font-bold text-lg text-primary ${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>{dayTotal}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <ConfirmOrderModal 
        isOpen={confirmOrderOpen} 
        onClose={() => setConfirmOrderOpen(false)} 
        order={selectedOrder} 
      />

      {/* Hidden Bulk Print Container */}
      {printType && (
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[9999]" dir="rtl">
          {readyToPrintOrders.map(order => (
            <div key={order.id} className="break-after-page mb-8 w-full p-0 m-0">
              {printType === 'invoice' ? (
                <InvoicePrint order={order} orderItems={allOrderItems.filter(i => i.order_id === order.id)} profilesMap={profilesMap} />
              ) : (
                <StickerPrint order={order} orderItems={allOrderItems.filter(i => i.order_id === order.id)} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
