import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function fetchDashboardStats() {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const currentMonthIndex = now.getMonth();
  const lastMonthIndex = currentMonthIndex - 1;

  // 1. All delivered orders this year with employee info
  const { data: allOrders = [], error: ordersError } = await supabase
    .from("orders")
    .select("total_price, created_at, user_id, profiles!user_id(full_name)")
    .gte("created_at", firstDayOfYear)
    .eq("status", "delivered");

  if (ordersError) throw ordersError;

  // 2. Best selling products
  const { data: bestSellersRaw = [] } = await supabase
    .from("order_items")
    .select("product_id, name, quantity, image_url")
    .order("quantity", { ascending: false });

  // 3. Low stock products
  const { data: lowStockProducts = [] } = await supabase
    .from("products")
    .select("id, name, stock_quantity, size, color, barcode, image_url")
    .lt("stock_quantity", 5)
    .order("stock_quantity", { ascending: true });

  // Build monthly stats
  const monthlyStats = {};
  monthNames.forEach((m) => {
    monthlyStats[m] = { month: m, orderCount: 0, totalSales: 0 };
  });

  const employeeMap = {};
  allOrders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const monthName = monthNames[orderDate.getMonth()];
    monthlyStats[monthName].orderCount += 1;
    monthlyStats[monthName].totalSales += Number(order.total_price || 0);

    if (orderDate.getMonth() === currentMonthIndex) {
      const name = order.profiles?.full_name || "unknown";
      if (!employeeMap[name]) employeeMap[name] = { name, visitors: 0, totalSales: 0 };
      employeeMap[name].visitors += 1;
      employeeMap[name].totalSales += Number(order.total_price || 0);
    }
  });

  const currentMonthData = monthlyStats[monthNames[currentMonthIndex]];
  const lastMonthData =
    lastMonthIndex >= 0 ? monthlyStats[monthNames[lastMonthIndex]] : { totalSales: 0 };

  let growthRate = 0;
  if (lastMonthData.totalSales > 0) {
    growthRate =
      ((currentMonthData.totalSales - lastMonthData.totalSales) /
        lastMonthData.totalSales) *
      100;
  }

  // Aggregate best sellers
  const bestSellerMap = {};
  bestSellersRaw.forEach((item) => {
    const key = item.product_id || item.name;
    if (!bestSellerMap[key]) {
      bestSellerMap[key] = { name: item.name, totalQty: 0, image_url: item.image_url || "" };
    }
    bestSellerMap[key].totalQty += item.quantity;
  });
  const bestSellers = Object.values(bestSellerMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 10);

  return {
    summary: {
      currentMonthSales: currentMonthData.totalSales,
      currentMonthOrders: currentMonthData.orderCount,
      growthRate: growthRate.toFixed(2),
    },
    yearlyBreakdown: Object.values(monthlyStats),
    employeeStats: Object.values(employeeMap),
    bestSellers,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
  };
}

export const dashboardKeys = {
  stats: () => ["dashboard", "stats"],
};

export const dashboardQueries = {
  stats: () => ({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 2,
  }),
};

export const useDashboardStats = () => {
  return useQuery(dashboardQueries.stats());
};
