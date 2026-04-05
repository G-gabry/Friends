import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomersQuery";
import InsertCustomer from "./InsertCustomer";
import EditCustomer from "./EditCustomer";
import DeleteCustomer from "./DeleteCustomer";
import { useTranslation } from "react-i18next";

export default function CustomersPage() {
  const { t, i18n } = useTranslation();
  const { data: customers = [] } = useCustomers();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q),
    );
  }, [customers, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">{t("customers.title")}</h1>
          <Badge variant="secondary" className="ml-1">
            {customers.length}
          </Badge>
        </div>
        <InsertCustomer />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("customers.search_placeholder")}
          className={`px-8 ${i18n.language === 'ar' ? 'pr-8' : 'pl-8'}`}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableCaption className="mb-3">
            {filtered.length === 0
              ? t("customers.no_found")
              : (filtered.length > 1 ? t("customers.showing_plural", { count: filtered.length }) : t("customers.showing", { count: filtered.length }))}
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-foreground w-10">
                #
              </TableHead>
              <TableHead className={`font-bold text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t("customers.columns.name")}</TableHead>
              <TableHead className={`font-bold text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                {t("customers.columns.phone")}
              </TableHead>
              <TableHead className={`font-bold text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                {t("customers.columns.address")}
              </TableHead>
              <TableHead className={`font-bold text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                {t("customers.columns.notes")}
              </TableHead>
              <TableHead className={`font-bold text-foreground ${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>
                {t("customers.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer, index) => (
              <TableRow key={customer.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{customer.phone}</span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {customer.address || "—"}
                </TableCell>
                <TableCell className={`max-w-[150px] truncate text-muted-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {customer.notes || "—"}
                </TableCell>
                <TableCell className={`${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className={`flex gap-2 ${i18n.language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <EditCustomer customer={customer} />
                    <DeleteCustomer customer={customer} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
