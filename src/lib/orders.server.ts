/**
 * Order Management - Server-side
 * Creates orders and order_items in Supabase
 * Server-side only, never expose tokens to client
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CartLine } from "@/context/ShopContext";
import type { TablesInsert } from "@/integrations/supabase/types";

/**
 * Customer data required to create an order
 */
export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  deliveryDate?: string | null;
  dedicatory?: string | null;
  notes?: string | null;
  cartLines: CartLine[];
  userId?: string | null; // Optional: set by server for authenticated users
}

/**
 * Response from order creation
 */
export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  error?: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]?.replace(/-/g, "") || "20260828";
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${date}-${random}`;
}

/**
 * Validate cart lines
 */
function validateCartLines(cartLines: CartLine[]): string | null {
  if (!cartLines || cartLines.length === 0) {
    return "Cart cannot be empty";
  }

  for (const line of cartLines) {
    if (!line.productId || !line.name) {
      return "Invalid cart line: missing productId or name";
    }
    if (line.qty <= 0) {
      return `Invalid quantity for ${line.name}: must be greater than 0`;
    }
    if (line.price <= 0) {
      return `Invalid price for ${line.name}: must be greater than 0`;
    }
  }

  return null;
}

/**
 * Create an order with order_items in Supabase
 *
 * PRICING NOTE: This function trusts the price from CartLine.
 * The price was calculated by the frontend based on GHL data.
 * For stricter validation, we could re-fetch the product from GHL
 * and recalculate the price, but this adds latency.
 * Current approach validates that price > 0 and is a valid number.
 *
 * If price tampering is a concern, implement:
 * 1. getGHLProduct(productId) to fetch current price
 * 2. Recalculate unit_price from priceMin/priceMax/tiers
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  try {
    // Validate customer data
    if (!request.customerName?.trim()) {
      return { success: false, error: "Customer name is required" };
    }
    if (!request.customerEmail?.trim()) {
      return { success: false, error: "Customer email is required" };
    }
    if (!isValidEmail(request.customerEmail)) {
      return { success: false, error: "Invalid email format" };
    }
    if (!request.customerPhone?.trim()) {
      return { success: false, error: "Customer phone is required" };
    }
    if (!request.address?.trim()) {
      return { success: false, error: "Address is required" };
    }
    if (!request.city?.trim()) {
      return { success: false, error: "City is required" };
    }
    if (!request.postalCode?.trim()) {
      return { success: false, error: "Postal code is required" };
    }

    // Validate cart
    const cartValidation = validateCartLines(request.cartLines);
    if (cartValidation) {
      return { success: false, error: cartValidation };
    }

    // Calculate totals from cart lines
    const subtotal = request.cartLines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const total = subtotal;

    // Create order
    const orderNumber = generateOrderNumber();
    const orderData: TablesInsert<"orders"> = {
      order_number: orderNumber,
      customer_name: request.customerName.trim(),
      customer_email: request.customerEmail.trim(),
      customer_phone: request.customerPhone.trim(),
      address: request.address.trim(),
      city: request.city.trim(),
      postal_code: request.postalCode.trim(),
      country: request.country?.trim() || "ES",
      subtotal,
      total,
      delivery_date: request.deliveryDate || null,
      dedicatory: request.dedicatory?.trim() || null,
      notes: request.notes?.trim() || null,
      status: "pending",
      ghl_contact_id: null,
      user_id: request.userId || null,
    };

    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select("id")
      .single();

    if (orderError) {
      console.error("[Orders] Failed to create order:", orderError);
      return { success: false, error: "Failed to create order in database" };
    }

    if (!orderRow?.id) {
      return { success: false, error: "Order created but no ID returned" };
    }

    // Create order items
    const orderItems: TablesInsert<"order_items">[] = request.cartLines.map((line) => ({
      order_id: orderRow.id,
      ghl_product_id: line.productId,
      product_name: line.name,
      size: line.size,
      quantity: line.qty,
      unit_price: line.price,
      subtotal: line.price * line.qty,
      color: null,
      special_instructions: null,
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);

    if (itemsError) {
      console.error("[Orders] Failed to create order items:", itemsError);
      // Order exists but items weren't created - this is a serious error
      // In production, might want to trigger cleanup or manual review
      return {
        success: false,
        error: "Order created but failed to add items. Please contact support.",
      };
    }

    console.log(`[Orders] Successfully created order ${orderNumber} (${orderRow.id})`);

    return {
      success: true,
      orderId: orderRow.id,
      orderNumber,
      total,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Orders] Unexpected error creating order:", message);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
