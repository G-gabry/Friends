"use client";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { ChangeStatus } from "./ordersActions";

const handleStatus = async (newStatus, orderId) => {
  const { success, data } = await ChangeStatus(newStatus, orderId);
  if (!(success && data.length > 0)) {
    toast.error("غير مصرح لك");
  }
};
const statuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"];
const statusConfig = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  confirmed: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  preparing: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100",
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
export function UpdateStatus({ children, orderId }) {
  const queryClient = useQueryClient();

  const handleStatus = async (newStatus, id) => {
    const { success, data } = await ChangeStatus(newStatus, id);
    if (!(success && data.length > 0)) {
      toast.error("غير مصرح لك");
    } else {
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["products"]);
    }
  };

  return (
    <ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-fit">
          <DropdownMenuGroup>
            {statuses.map((status) => {
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatus(status, orderId)}
                >
                  <Badge
                    className={`${statusConfig[status] || statusConfig.default}`}
                  >
                    {status === "shipped" && (
                      <Spinner data-icon="inline-start" />
                    )}
                    {statusTranslate[status] || status}
                  </Badge>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
