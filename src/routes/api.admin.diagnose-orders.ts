import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard } from "@/lib/admin/guard.server";

export interface OrderDiagnostics {
  timestamp: string;
  summary: {
    total_orders: number;
    active_orders: number;
    deleted_orders: number;
    status_distribution: Record<string, number>;
  };
  orders: Array<{
    id: string;
    order_number: string;
    customer_email: string;
    status: string;
    created_at: string;
    user_id: string | null;
    deleted_at: string | null;
    item_count: number;
    ghl_contact_id: string | null;
  }>;
  ghl_sync: {
    synced_with_ghl: number;
    not_synced: number;
  };
}

const GET = withAdminGuard(async () => {
  try {
    // 1. Get all orders (including deleted for comparison)
    const { data: allOrders, error: allOrdersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (allOrdersError) throw allOrdersError;

    // 2. Get active orders only
    const { data: activeOrders, error: activeOrdersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (activeOrdersError) throw activeOrdersError;

    // 3. Get order items for each active order
    const activeOrderIds = (activeOrders || []).map((o) => o.id);
    const itemsByOrder = new Map<string, number>();

    if (activeOrderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select("id, order_id");

      if (!itemsError && items) {
        for (const item of items) {
          itemsByOrder.set(item.order_id, (itemsByOrder.get(item.order_id) || 0) + 1);
        }
      }
    }

    // 4. Calculate status distribution
    const statusCount: Record<string, number> = {};
    for (const order of activeOrders || []) {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    }

    // 5. Count GHL synced orders
    const syncedCount = (activeOrders || []).filter((o) => o.ghl_contact_id).length;
    const notSyncedCount = (activeOrders || []).length - syncedCount;

    // 6. Build response
    const diagnostics: OrderDiagnostics = {
      timestamp: new Date().toISOString(),
      summary: {
        total_orders: allOrders?.length || 0,
        active_orders: activeOrders?.length || 0,
        deleted_orders: (allOrders?.length || 0) - (activeOrders?.length || 0) || 0,
        status_distribution: statusCount,
      },
      orders: (activeOrders || []).map((order) => ({
        id: order.id,
        order_number: order.order_number,
        customer_email: order.customer_email,
        status: order.status,
        created_at: order.created_at,
        user_id: order.user_id,
        deleted_at: order.deleted_at,
        item_count: itemsByOrder.get(order.id) || 0,
        ghl_contact_id: order.ghl_contact_id,
      })),
      ghl_sync: {
        synced_with_ghl: syncedCount,
        not_synced: notSyncedCount,
      },
    };

    return json(diagnostics, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/diagnose-orders error:", message);
    return json({ error: "Diagnosis failed", details: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/diagnose-orders")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
