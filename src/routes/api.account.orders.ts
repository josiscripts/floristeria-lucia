/**
 * API endpoint: Get authenticated user's orders
 * GET /api/account/orders
 *
 * Requires authentication. Returns only orders belonging to the authenticated user.
 * Uses RLS to ensure user can only see their own orders.
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables } from "@/integrations/supabase/types";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;

interface UserOrdersResponse {
  orders: (OrderRow & { items: OrderItemRow[] })[];
  error?: string;
}

const GET = async (request: Request): Promise<Response> => {
  try {
    // Extract authentication token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify JWT and get user
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Get user's orders (RLS will enforce ownership)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[API] /api/account/orders error:", ordersError);
      return json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Get order items for all orders
    const orderIds = (orders || []).map((order) => order.id);
    const itemsByOrder = new Map<string, OrderItemRow[]>();

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("[API] /api/account/orders items error:", itemsError);
      } else {
        for (const item of items || []) {
          const list = itemsByOrder.get(item.order_id) || [];
          list.push(item);
          itemsByOrder.set(item.order_id, list);
        }
      }
    }

    const ordersWithItems = (orders || []).map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) || [],
    }));

    return json({ orders: ordersWithItems }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/account/orders error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/account/orders")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
