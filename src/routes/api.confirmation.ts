import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables } from "@/integrations/supabase/types";

type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;

interface ConfirmationLoaderData {
  order: OrderRow;
  items: OrderItemRow[];
}

async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId || typeof orderId !== "string") {
      return json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[API] Order not found:", orderId, orderError);
      return json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[API] Failed to fetch order items:", itemsError);
      return json(
        {
          order,
          items: [],
        } as ConfirmationLoaderData,
        { status: 200 },
      );
    }

    return json(
      {
        order,
        items: items || [],
      } as ConfirmationLoaderData,
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/confirmation GET error:", message);
    return json({ error: "Failed to load confirmation" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/confirmation")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
