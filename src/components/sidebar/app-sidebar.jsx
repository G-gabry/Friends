"use client";

import * as React from "react";
import {
  LifeBuoy,
  Send,
  Settings2,
  SquareTerminal,
  ClipboardList,
  ScrollTextIcon,
  ShirtIcon,
  UsersIcon,
  BellRing,
  Truck,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useLowStock } from "@/hooks/useLowStockQuery";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function AppSidebar({ ...props }) {
  const { user } = useAuth();
  const { data: lowStockItems = [] } = useLowStock();
  const { t, i18n } = useTranslation();

  const data = {
    user: {
      name: user?.full_name || "Admin",
      email: user?.email || "",
      avatar: "",
    },
    navMain: [
      {
        icon: ScrollTextIcon,
        title: t("sidebar.orders"),
        url: "../dashboard/orders",
        isLike: true,
      },
      {
        icon: Truck,
        title: t("sidebar.shipping_batches"),
        url: "../dashboard/shipping",
        isLike: true,
      },
      {
        title: t("sidebar.new_order"),
        icon: ClipboardList,
        url: "../dashboard/orders/new",
        isLike: true,
      },
      {
        icon: UsersIcon,
        title: t("sidebar.customers") || "Customers",
        url: "../dashboard/customers",
        isLike: true,
      },
      {
        title: t("sidebar.dashboard") || "Management",
        icon: SquareTerminal,
        isActive: true,
        show: (role) => role === "admin",
        items: [
          {
            title: t("sidebar.products"),
            url: "../dashboard/products",
          },
          {
            title: t("sidebar.employees"),
            url: "../dashboard/employees",
          },
        ],
      },
    ],
  };

  const sidebarItems = data.navMain.filter((item) =>
    item.show ? item.show(user.role) : true,
  );

  return (
    <Sidebar variant="inset" side={i18n.language === 'ar' ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="../dashboard">
                <div className="size-8 rounded-[3px] overflow-hidden flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm">
                  FW
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Friends Wear</span>
                  <span className="truncate text-xs">
                    Internal Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Low Stock Notification Bell */}
        {lowStockItems.length > 0 && (
          <Link
            to="../dashboard"
            className="flex items-center gap-2 px-3 py-1.5 mt-1 rounded-md text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
          >
            <div className="relative">
              <BellRing className="w-4 h-4" />
              <Badge className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white justify-center">
                {lowStockItems.length}
              </Badge>
            </div>
            <span className="text-xs font-medium ml-2">Low Stock Items</span>
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
