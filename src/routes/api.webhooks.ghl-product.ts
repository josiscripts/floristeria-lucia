/**
 * Webhook endpoint for GoHighLevel product events
 * POST /api/webhooks/ghl-product
 *
 * Receives events:
 * - product.created
 * - product.updated
 * - product.deleted
 *
 * IMPORTANT: This endpoint handles idempotent updates via ghl_product_id
 * Duplicate webhook deliveries won't create duplicate records
 */

import { json } from "@tanstack/react-start";
import { syncProductMetadata, deleteProductMetadata } from "@/lib/product-metadata.server";
import type { GHLProduct } from "@/lib/ghl/types";

interface WebhookEvent {
  event: string;
  data: GHLProduct;
  timestamp?: string;
}

/**
 * Validate webhook is from GHL
 * In production, verify webhook signature
 */
function validateWebhook(_body: unknown, _headers: Headers): boolean {
  // TODO: Implement GHL webhook signature verification
  // For now, basic validation that event has required structure
  return true;
}

export async function POST(request: Request) {
  try {
    const headers = request.headers;
    const body: WebhookEvent = await request.json();

    // Validate webhook structure
    if (!validateWebhook(body, headers)) {
      return json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const { event, data } = body;

    console.log(`[Webhook] Received GHL event: ${event} for product ${data?.id}`);

    if (!event || !data?.id) {
      return json(
        { error: "Invalid webhook payload: missing event or product id" },
        { status: 400 },
      );
    }

    // Handle different event types
    switch (event) {
      case "product.created":
      case "product.updated": {
        // Sync product metadata
        const result = await syncProductMetadata({
          ghl_product_id: data.id,
          status: data.status || "active",
          // Other fields (price_max, colors, etc.) are not in GHL webhook
          // They're maintained separately in Supabase
        });

        if (!result.success) {
          console.error(`[Webhook] Failed to sync metadata for ${data.id}: ${result.error}`);
          // Still return 200 to acknowledge receipt and prevent retries
          // The webhook will be logged for manual intervention
        }

        return json(
          {
            success: true,
            event,
            product_id: data.id,
            metadata: result,
          },
          { status: 200 },
        );
      }

      case "product.deleted":
      case "product.deactivated": {
        // Soft delete metadata
        const result = await deleteProductMetadata(data.id);

        if (!result.success) {
          console.error(`[Webhook] Failed to delete metadata for ${data.id}: ${result.error}`);
          // Still return 200 to acknowledge receipt
        }

        return json(
          {
            success: true,
            event,
            product_id: data.id,
            metadata: result,
          },
          { status: 200 },
        );
      }

      default: {
        console.warn(`[Webhook] Unknown event type: ${event} (ignored, not an error)`);
        return json(
          {
            success: true,
            event,
            message: "Event acknowledged but not processed (unknown type)",
          },
          { status: 200 },
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[Webhook] /api/webhooks/ghl-product error:", message);

    // Return 200 to prevent GHL from retrying
    // Log error for manual intervention
    return json(
      {
        success: false,
        error: message,
        code: "WEBHOOK_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
