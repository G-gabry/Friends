import { useAuth } from "@/hooks/useAuth";

import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Award,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useDashboardStats } from "@/hooks/useDashboardQuery";
import { useTranslation } from "react-i18next";

const fmt = (v) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(v);

const MEDALS = ["🥇", "🥈", "🥉"];
const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

// summary cards
function SummaryCards({ summary, topCashier, t, i18n }) {
  const growth = parseFloat(summary.growthRate);
  const isUp = growth >= 0;

  const cards = [
    {
      title: t("dashboard.monthly_sales"),
      value: fmt(summary.currentMonthSales),
      desc: t("dashboard.monthly_sales_desc"),
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: t("dashboard.total_orders"),
      value: summary.currentMonthOrders,
      desc: t("dashboard.total_orders_desc"),
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: t("dashboard.growth"),
      value: `${isUp ? "+" : ""}${growth.toFixed(1)}%`,
      desc: t("dashboard.growth_desc"),
      icon: isUp ? TrendingUp : TrendingDown,
      color: isUp ? "text-green-500" : "text-red-500",
      bg: isUp ? "bg-green-50" : "bg-red-50",
    },
    {
      title: t("dashboard.top_emp"),
      value: topCashier?.name ?? "—",
      desc: topCashier ? fmt(topCashier.totalSales) : t("dashboard.no_data"),
      icon: Award,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${c.bg}`}>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// yearly bar chart
const barChartConfig = {
  totalSales: { label: "Sales (EGP)", color: "var(--chart-1)" },
};

function YearlyBarChart({ yearlyBreakdown, t }) {
  const data = yearlyBreakdown.map((m) => ({
    ...m,
    month: m.month.slice(0, 3),
  }));

  const totalYearlySales = yearlyBreakdown.reduce(
    (s, m) => s + m.totalSales,
    0,
  );
  const activeMonths = yearlyBreakdown.filter((m) => m.totalSales > 0).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{t("dashboard.yearly_title")}</CardTitle>
        <CardDescription>
          {t("dashboard.yearly_desc", { year: new Date().getFullYear() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <ChartContainer
            config={barChartConfig}
            className="h-65 min-w-125 w-full"
          >
            <BarChart data={data} barSize={28}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent formatter={(value) => fmt(value)} />
                }
              />
              <Bar
                dataKey="totalSales"
                fill="var(--chart-1)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {t("dashboard.total_year", { amount: fmt(totalYearlySales) })}
        </div>
        <div className="text-muted-foreground leading-none">
          {t("dashboard.active_months", { active: activeMonths })}
        </div>
      </CardFooter>
    </Card>
  );
}

// cashier pie chart
function CashierPieChart({ cashierStats, t }) {
  const pieConfig = Object.fromEntries(
    cashierStats.map((c, i) => [
      c.name,
      { label: c.name, color: PIE_COLORS[i % PIE_COLORS.length] },
    ]),
  );

  const pieData = cashierStats.map((c, i) => ({
    name: c.name,
    value: c.totalSales,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const total = cashierStats.reduce((s, c) => s + c.totalSales, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.sales_by_cashier")}</CardTitle>
        <CardDescription>{t("dashboard.sales_cashier_desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={pieConfig} className="h-65 w-full">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => fmt(value)} />
              }
            />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {t("dashboard.total_across", { amount: fmt(total), count: cashierStats.length })}
      </CardFooter>
    </Card>
  );
}

// cashier table 

function CashierTable({ cashierStats, t, i18n }) {
  const sorted = [...cashierStats].sort((a, b) => b.totalSales - a.totalSales);
  const total = cashierStats.reduce((s, c) => s + c.totalSales, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle>{t("dashboard.cashier_performance")}</CardTitle>
          <CardDescription>{t("dashboard.rank_desc")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c, i) => {
              const share =
                total > 0 ? ((c.totalSales / total) * 100).toFixed(1) : "0";
              return (
                <TableRow key={c.name}>
                  <TableCell className="text-lg">
                    {MEDALS[i] ?? i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{c.visitors}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-chart-3">
                    {fmt(c.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-chart-2"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10">
                        {share}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// main page
export default function DashboardPage() {
  const { loading } = useAuth();
  const { data, isError } = useDashboardStats();
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-muted-foreground">
        <p className="text-lg font-medium">{t("dashboard.error_title")}</p>
        <p className="text-sm">
          {t("dashboard.error_desc")}
        </p>
      </div>
    );
  }
  const {
    summary,
    yearlyBreakdown,
    employeeStats = [],
    bestSellers = [],
    lowStockProducts = [],
  } = data;

  // Backwards compat: fallback to cashierStats if employeeStats not present
  const empStats = employeeStats.length > 0 ? employeeStats : (data.cashierStats || []);

  const topEmployee =
    empStats.length > 0
      ? [...empStats].sort(
          (a, b) => (b.totalSales || 0) - (a.totalSales || 0),
        )[0]
      : null;

  return (
      <div className={`flex flex-col gap-6 p-6 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("dashboard.subtitle", { year: new Date().getFullYear() })}
        </p>
      </div>

      <SummaryCards summary={summary} topCashier={topEmployee} t={t} i18n={i18n} />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <YearlyBarChart yearlyBreakdown={yearlyBreakdown} t={t} />
        <CashierPieChart cashierStats={empStats} t={t} />
      </div>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.best_sellers")}</CardTitle>
            <CardDescription>{t("dashboard.best_sellers_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSellers.slice(0, 10).map((product, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {MEDALS[i] || i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{product.totalQty}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">
              {t("dashboard.low_stock")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.low_stock_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.size || "—"}</TableCell>
                    <TableCell>{product.color || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.barcode || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="destructive"
                        className={
                          product.stock_quantity === 0
                            ? "bg-red-600"
                            : "bg-amber-500"
                        }
                      >
                        {product.stock_quantity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CashierTable cashierStats={empStats} t={t} i18n={i18n} />
    </div>
  );
}

