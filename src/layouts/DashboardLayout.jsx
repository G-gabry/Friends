import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, Link, useLocation } from "react-router-dom";
import React from "react";

import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";

import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function DashboardLayout() {
  useOrdersRealtime();

  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <SidebarProvider className="print:block">
      <div className="print:hidden">
        <AppSidebar />
      </div>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-mx-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />

            <Breadcrumb>
              <BreadcrumbList>
                {pathnames.map((value, index) => {
                  const isLast = index === pathnames.length - 1;
                  const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                  const label = value.charAt(0).toUpperCase() + value.slice(1);

                  return (
                    <React.Fragment key={to}>
                      <BreadcrumbItem className="">
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={to}>{label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator className="" />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className=" flex relative flex-1 flex-col gap-4 p-4 pt-0 print:m-0 print:p-0">
          <div className="print:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <Outlet />
          <Toaster position="top-center" richColors closeButton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
