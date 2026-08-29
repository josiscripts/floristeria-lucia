/**
 * API endpoint to create orders
 * POST /api/orders
 * Server-side only, token never exposed to client
 */

import { json } from "@tanstack/react-start";
import { createOrder, type CreateOrderRequest } from "@/lib/orders.server";

/**
 * POST /api/orders
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
 */
export async function POST(request: Request) {
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

    // Call server-side order creation
    const result = await createOrder(body as CreateOrderRequest);

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
