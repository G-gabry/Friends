import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All Orders" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];



export function OrdersFilter({ profiles = [] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  const dateFilter = searchParams.get("filter") || "all";
  const employeeFilter = searchParams.get("employee") || "all";
  const statusFilter = searchParams.get("status") || "all";

  const [localFilters, setLocalFilters] = useState({
    filter: dateFilter,
    employee: employeeFilter,
    status: statusFilter || "all",
  });

  const handleOpenChange = (open) => {
    if (open) {
      setLocalFilters({
        filter: dateFilter,
        employee: employeeFilter,
        status: statusFilter,
      });
    }
  };

  const applyFilters = () => {
    sessionStorage.setItem("ordersFilter", JSON.stringify(localFilters));
    setSearchParams((prev) => {
      prev.set("filter", localFilters.filter);
      prev.set("employee", localFilters.employee);
      prev.set("status", localFilters.status);
      return prev;
    });
  };
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("ordersFilter"));
    if (saved) {
      setSearchParams((prev) => {
        prev.set("filter", saved.filter);
        prev.set("employee", saved.employee);
        prev.set("status", saved.status);
        return prev;
      });
    }
  }, [setSearchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams((prev) => {
        if (searchValue) {
          prev.set("q", searchValue);
        } else {
          prev.delete("q");
        }
        return prev;
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, setSearchParams]);

  const activeCount = [
    dateFilter !== "today",
    employeeFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setLocalFilters({
      filter: "today",
      employee: "all",
      status: "all",
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-1 md:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by invoice or customer..."
          className="pl-8"
        />
      </div>

      {/* Filters Sheet */}
      <Sheet onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 md:w-auto w-full">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="size-5 p-0 justify-center">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="overflow-y-auto overflow-x-hidden">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Narrow down orders by date, employee, or status.
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 auto-rows-min gap-6 px-4">
            {/* Date — Toggle Buttons */}
            <div className="grid gap-3">
              <Label>Date</Label>
              <div className="flex flex-wrap gap-2">
                {DATE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={
                      localFilters.filter === opt.value ? "default" : "outline"
                    }
                    onClick={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        filter: opt.value,
                      }))
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Employee — Select */}
            <div className="grid gap-3">
              <Label>Employee</Label>
              <Select
                value={localFilters.employee}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, employee: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.full_name}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status — Radio */}
            <div className="grid gap-3">
              <Label>Status</Label>
              <RadioGroup
                value={localFilters.status}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({ ...prev, status: value }))
                }
                className="flex flex-col gap-2"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`status-${opt.value}`}
                    />
                    <Label
                      htmlFor={`status-${opt.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <SheetFooter>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
                Reset filters
              </Button>
            )}
            <SheetClose asChild>
              <Button onClick={applyFilters}>Done</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
