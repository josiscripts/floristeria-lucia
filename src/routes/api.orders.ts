/**
 * API endpoint to create orders
 * POST /api/orders
 * Server-side only, token never exposed to client
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { createOrder, type CreateOrderRequest } from "@/lib/orders.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard } from "@/lib/admin/guard.server";
import type { Tables } from "@/integrations/supabase/types";

/**
 * GET /api/orders — Admin only.
 * Query params:
 *   page?: number (default 1)
 *   limit?: number (default 20, max 100)
 *   status?: string
 *   search?: string (matches order_number, customer_name, customer_email, customer_phone)
 *   fromDate?: string (ISO date, filters created_at >=)
 *   toDate?: string (ISO date, filters created_at <=)
 */
const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limitParam = parseInt(url.searchParams.get("limit") || "20", 10) || 20;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim();
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }

    if (toDate) {
      query = query.lte("created_at", toDate);
    }

    if (search) {
      const safeSearch = search.replace(/[,()%]/g, "");
      query = query.or(
        `order_number.ilike.%${safeSearch}%,customer_name.ilike.%${safeSearch}%,customer_email.ilike.%${safeSearch}%,customer_phone.ilike.%${safeSearch}%`,
      );
    }

    query = query.range(skip, skip + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("[API] /api/orders GET error:", error.message);
      return json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const orderIds = (orders || []).map((order) => order.id);
    const itemsByOrder = new Map<string, Tables<"order_items">[]>();

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("[API] /api/orders GET items error:", itemsError.message);
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

    const total = count || 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return json(
      {
        orders: ordersWithItems,
        pagination: { total, page, limit, totalPages },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/orders GET error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
});

/**
 * POST /api/orders — Público: usado por el checkout de la tienda.
 * Request body:
 * {
 *   customerName: string,
 *   customerEmail: string,
 *   customerPhone: string,
 *   address: string,
 *   city: string,
 *   postalCode: string,
 *   country?: string (default: "ES"),
 *   deliveryDate?: string | null,
 *   dedicatory?: string | null,
 *   notes?: string | null,
 *   cartLines: Array<{
 *     productId: string,
 *     name: string,
 *     size: string,
 *     category?: string,
 *     price: number,
 *     image: string,
 *     qty: number,
 *     key: string
 *   }>
 * }
 *
 * Authenticated users will have their order associated with their user_id.
 * Unauthenticated users will have user_id = NULL.
 */
async function POST(request: Request) {
  try {
    const body: Partial<CreateOrderRequest> = await request.json();

    // Validate request structure
    if (!body.customerName || !body.customerEmail || !body.customerPhone) {
      return json({ success: false, error: "Missing required customer fields" }, { status: 400 });
    }

    if (!body.address || !body.city || !body.postalCode) {
      return json({ success: false, error: "Missing required address fields" }, { status: 400 });
    }

    if (!Array.isArray(body.cartLines) || body.cartLines.length === 0) {
      return json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    // Extract authenticated user from request headers (if available)
    // The Authorization header should contain JWT token from Supabase
    let userId: string | null = null;
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        // Verify JWT and extract user ID
        // Using supabaseAdmin to verify the token
        const token = authHeader.substring(7);
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user?.id) {
          userId = data.user.id;
        }
      }
    } catch (authError) {
      // Auth extraction failed - user remains null, order will be anonymous
      console.debug("[API] Auth extraction failed, proceeding with anonymous order");
    }

    // Call server-side order creation with userId
    const orderRequest: CreateOrderRequest = body as CreateOrderRequest;
    orderRequest.userId = userId;

    const result = await createOrder(orderRequest);

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error || "Failed to create order",
        },
        { status: 400 },
      );
    }

    return json(
      {
        success: true,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/orders POST error:", message);
    return json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
