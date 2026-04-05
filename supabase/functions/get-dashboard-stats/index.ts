import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing auth header");

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) throw new Error("You are not Allowed");

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "You are not Allowed" }), { status: 403 });
    }

    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Fetch completed/delivered orders for the year
    const { data: allOrders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('total_price, created_at, user_id, profiles!user_id(full_name)')
      .gte('created_at', firstDayOfYear)
      .eq('status', 'delivered');

    if (fetchError) throw fetchError;

    // Fetch best-selling products
    const { data: bestSellers, error: bsError } = await supabaseClient
      .from('order_items')
      .select('product_id, name, quantity, image_url')
      .order('quantity', { ascending: false });

    // Fetch low-stock products
    const { data: lowStockProducts, error: lsError } = await supabaseClient
      .from('products')
      .select('id, name, stock_quantity, size, color, barcode, image_url')
      .lt('stock_quantity', 5)
      .order('stock_quantity', { ascending: true });

    const monthlyStats: Record<string, { month: string, orderCount: number, totalSales: number }> = {};
    const employeeMap: Record<string, { name: string, visitors: number, totalSales: number }> = {};

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    monthNames.forEach(m => {
      monthlyStats[m] = { month: m, orderCount: 0, totalSales: 0 };
    });

    const currentMonthIndex = now.getMonth();
    const lastMonthIndex = currentMonthIndex - 1;

    allOrders?.forEach(order => {
      const orderDate = new Date(order.created_at);
      const monthName = monthNames[orderDate.getMonth()];

      monthlyStats[monthName].orderCount += 1;
      monthlyStats[monthName].totalSales += order.total_price;

      if (orderDate.getMonth() === currentMonthIndex) {
        const name = order.profiles?.full_name || 'unknown';
        if (!employeeMap[name]) employeeMap[name] = { name, visitors: 0, totalSales: 0 };
        employeeMap[name].visitors += 1;
        employeeMap[name].totalSales += order.total_price;
      }
    });

    const currentMonthData = monthlyStats[monthNames[currentMonthIndex]];
    const lastMonthData = lastMonthIndex >= 0 ? monthlyStats[monthNames[lastMonthIndex]] : { totalSales: 0 };

    let growthRate = 0;
    if (lastMonthData.totalSales > 0) {
      growthRate = ((currentMonthData.totalSales - lastMonthData.totalSales) / lastMonthData.totalSales) * 100;
    }

    // Aggregate best sellers by product
    const bestSellerMap: Record<string, { name: string, totalQty: number, image_url: string }> = {};
    bestSellers?.forEach(item => {
      const key = item.product_id || item.name;
      if (!bestSellerMap[key]) {
        bestSellerMap[key] = { name: item.name, totalQty: 0, image_url: item.image_url || '' };
      }
      bestSellerMap[key].totalQty += item.quantity;
    });
    const topProducts = Object.values(bestSellerMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        summary: {
          currentMonthSales: currentMonthData.totalSales,
          currentMonthOrders: currentMonthData.orderCount,
          growthRate: growthRate.toFixed(2),
        },
        yearlyBreakdown: Object.values(monthlyStats),
        employeeStats: Object.values(employeeMap),
        bestSellers: topProducts,
        lowStockProducts: lowStockProducts || [],
        lowStockCount: lowStockProducts?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, details: error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})