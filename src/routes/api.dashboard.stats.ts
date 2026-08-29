/**
 * API endpoint for dashboard statistics
 * GET /api/dashboard/stats
 */

import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function sumTotal(orders: { total: number }[]): number {
  return orders.reduce((sum, order) => sum + (order.total || 0), 0);
}

export async function GET(request: Request) {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from("orders")
      .select("id, status, total, created_at")
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      console.error("[API] /api/dashboard/stats recentOrders error:", recentError.message);
      return json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }

    const orders = recentOrders || [];

    const todayOrders = orders.filter(
      (order) => order.created_at && new Date(order.created_at) >= startOfToday,
    );
    const last7DaysOrders = orders.filter(
      (order) => order.created_at && new Date(order.created_at) >= sevenDaysAgo,
    );

    const { data: statusRows, error: statusError } = await supabaseAdmin
      .from("orders")
      .select("status")
      .is("deleted_at", null);

    if (statusError) {
      console.error("[API] /api/dashboard/stats statusRows error:", statusError.message);
    }

    const statusDistribution: Record<string, number> = {};
    for (const row of statusRows || []) {
      statusDistribution[row.status] = (statusDistribution[row.status] || 0) + 1;
    }

    const { data: recentOrdersList, error: recentListError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentListError) {
      console.error("[API] /api/dashboard/stats recentOrdersList error:", recentListError.message);
    }

    return json(
      {
        today: { orders: todayOrders.length, sales: sumTotal(todayOrders) },
        last7Days: { orders: last7DaysOrders.length, sales: sumTotal(last7DaysOrders) },
        last30Days: { orders: orders.length, sales: sumTotal(orders) },
        statusDistribution,
        recentOrders: recentOrdersList || [],
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/dashboard/stats GET error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
