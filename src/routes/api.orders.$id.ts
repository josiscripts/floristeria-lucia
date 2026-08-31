/**
 * API endpoint for a single order
 * GET /api/orders/[id]
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard } from "@/lib/admin/guard.server";

const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing order ID" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found" }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[API] /api/orders/[id] items error:", itemsError.message);
    }

    const { data: events, error: eventsError } = await supabaseAdmin
      .from("webhook_events")
      .select("*")
      .eq("order_id", id)
      .order("received_at", { ascending: false });

    if (eventsError) {
      console.error("[API] /api/orders/[id] events error:", eventsError.message);
    }

    return json(
      {
        order,
        items: items || [],
        events: events || [],
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/orders/[id] GET error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/orders/$id")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
