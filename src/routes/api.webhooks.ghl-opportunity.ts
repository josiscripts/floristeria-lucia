/**
 * Webhook endpoint for GoHighLevel opportunity stage change events
 * POST /api/webhooks/ghl-opportunity
 *
 * Supports TWO authentication mechanisms (dual mode):
 *
 * MODE A: Private Integration (Official HighLevel)
 * - Header: X-GHL-Signature (base64-encoded Ed25519 signature)
 * - Payload: Nested structure with webhookId, event, data.newStageId, customFields
 * - Deduplication: via webhookId UNIQUE constraint
 *
 * MODE B: Workflow (Custom HighLevel Workflow)
 * - Header: Authorization: Bearer <token>
 * - Payload: Flat structure with opportunityId, stageName, locationId, timestamp
 * - Deduplication: via (opportunityId + locationId + timestamp) hash
 * - Stage lookup: stageName → order status mapping
 *
 * Security: Ed25519 verification (MODE A) + Bearer token validation (MODE B)
 * Reference: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
 */

import { json } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getOrderStatusFromGHLStage, type GHLOpportunityWebhookPayload } from "@/lib/ghl/types";
import * as crypto from "crypto";

// GHL Configuration Constants
const GHL_PIPELINE_ID = "KHKXOKLuYXPLQlkjc0aq";
const GHL_PIPELINE_NAME = "Pedidos Floristería Lucía";
const GHL_LOCATION_ID = process.env["GHL_LOCATION_ID"] || "";

// Official HighLevel Ed25519 Public Key (from marketplace docs)
// This is the key used to verify all webhook signatures from HighLevel Private Integration
const GHL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

// Workflow Bearer Token (from environment)
const GHL_WORKFLOW_API_TOKEN =
  (process.env as Record<string, string | undefined>)["GHL_WORKFLOW_API_TOKEN"] || "";

// Stage Name to Order Status Mapping (for Workflow mode)
// Maps HighLevel stage names to internal order statuses
const STAGE_NAME_TO_STATUS: Record<string, string> = {
  Recibido: "pending",
  Confirmado: "confirmed",
  Preparando: "preparing",
  Listo: "ready",
  Entregado: "delivered",
  Cancelado: "cancelled",
};

// Get environment variables
const SUPABASE_URL = (process.env as Record<string, string | undefined>)["SUPABASE_URL"] || "";
const SUPABASE_SERVICE_ROLE_KEY =
  (process.env as Record<string, string | undefined>)["SUPABASE_SERVICE_ROLE_KEY"] || "";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Verify webhook signature using Ed25519 (Official HighLevel mechanism)
 * MODE A: Private Integration
 *
 * HighLevel sends X-GHL-Signature header with Ed25519 signature
 * To verify:
 * 1. Take raw request body (before JSON parsing)
 * 2. Get X-GHL-Signature header value (base64-encoded signature)
 * 3. Verify Ed25519 signature using official HighLevel public key
 * 4. If valid, safe to process JSON payload
 *
 * @see https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/
 * @param rawBody - Raw request body as string (UTF-8 encoded)
 * @param signatureHeader - X-GHL-Signature header value (base64-encoded Ed25519 signature)
 * @returns true if signature is valid, false otherwise
 */
function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
): boolean {
  // Signature header is required
  if (!signatureHeader) {
    console.warn("[Webhook] Missing X-GHL-Signature header");
    return false;
  }

  try {
    // Decode signature from base64 (format sent by HighLevel)
    const signatureBuffer = Buffer.from(signatureHeader, "base64");

    // Convert body to Buffer (UTF-8)
    const bodyBuffer = Buffer.from(rawBody, "utf-8");

    // Verify Ed25519 signature using official HighLevel public key
    const isValid = crypto.verify("ed25519", bodyBuffer, GHL_PUBLIC_KEY, signatureBuffer);

    if (!isValid) {
      console.warn("[Webhook] Ed25519 signature verification failed");
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "[Webhook] Signature verification error:",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

/**
 * Verify Bearer token for Workflow mode
 * MODE B: Workflow
 *
 * Validates Authorization header using timing-safe comparison
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns true if token is valid, false otherwise
 */
function verifyBearerToken(authHeader: string | null | undefined): boolean {
  if (!authHeader) {
    console.warn("[Webhook] Missing Authorization header");
    return false;
  }

  if (!GHL_WORKFLOW_API_TOKEN) {
    console.error("[Webhook] GHL_WORKFLOW_API_TOKEN not configured");
    return false;
  }

  try {
    // Extract token from "Bearer <token>" format
    if (!authHeader.startsWith("Bearer ")) {
      console.warn("[Webhook] Invalid Authorization format (expected 'Bearer <token>')");
      return false;
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(GHL_WORKFLOW_API_TOKEN));

    return isValid;
  } catch (error) {
    console.warn(
      "[Webhook] Bearer token verification error:",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

/**
 * Convert flat Workflow payload to internal GHLOpportunityWebhookPayload structure
 * MODE B: Workflow
 *
 * Maps flat workflow payload to nested structure for unified processing
 */
function convertWorkflowPayloadToInternal(
  workflowPayload: Record<string, unknown>,
): GHLOpportunityWebhookPayload {
  // Generate deterministic delivery_id from opportunityId + locationId + timestamp
  // IMPORTANT: This is NOT a guarantee of uniqueness, but best effort for deduplication
  const opportunityId = String(workflowPayload["opportunityId"] || "");
  const locationId = String(workflowPayload["locationId"] || "");
  const timestamp = String(workflowPayload["timestamp"] || new Date().toISOString());
  const deliveryIdHash = Buffer.from(`${opportunityId}:${locationId}:${timestamp}`)
    .toString("base64")
    .substring(0, 40);

  return {
    event: "opportunity.stage_change" as const,
    webhookId: deliveryIdHash, // Generated from payload fields, not workflow-provided
    locationId,
    timestamp,
    data: {
      id: opportunityId,
      contactId: String(workflowPayload["assignedToId"] || ""),
      pipelineId: GHL_PIPELINE_ID,
      oldStageId: "", // Workflow doesn't provide this
      newStageId: "", // Workflow doesn't provide stageId, uses stageName instead
      stageName: String(workflowPayload["stageName"] || ""), // Custom field for Workflow mode
      name: String(workflowPayload["opportunityName"] || ""),
      monetaryValue: Number(workflowPayload["opportunityValue"]) || 0,
      // Workflow doesn't provide customFields
      customFields: undefined,
    },
  };
}

/**
 * Convert stage name to order status (Workflow mode)
 * Maps GHL stage display names to internal order status values
 *
 * @param stageName - Stage name from Workflow (e.g., "Confirmado")
 * @returns order status value or undefined if not mapped
 */
function getOrderStatusFromStageName(stageName: string): string | undefined {
  return STAGE_NAME_TO_STATUS[stageName];
}

/**
 * Find order by GHL opportunity ID or custom field
 *
 * Strategy:
 * 1. Primary: Search by ghl_opportunity_id
 * 2. Fallback: Search by order_id in custom fields (WWKLWHR7EUDeGPi7zlOH)
 * 3. Not used: order_number (too risky, could update wrong order)
 */
async function findOrderByOpportunity(
  opportunityId: string,
  customFields?: Array<{ fieldId: string; value: string | number | boolean | null }>,
): Promise<{ id: string; status: string; updated_at: string } | null> {
  try {
    // Primary search: by ghl_opportunity_id
    const { data: orderByOpp, error: errOpp } = await supabase
      .from("orders")
      .select("id, status, updated_at")
      .eq("ghl_opportunity_id", opportunityId)
      .single();

    if (!errOpp && orderByOpp) {
      return orderByOpp;
    }

    // Fallback search: by custom field containing order UUID
    if (customFields && customFields.length > 0) {
      // Look for custom field ID: WWKLWHR7EUDeGPi7zlOH (contains order_id)
      const orderIdField = customFields.find(
        (field) => field.fieldId === "WWKLWHR7EUDeGPi7zlOH" && field.value,
      );

      if (orderIdField && typeof orderIdField.value === "string") {
        const { data: orderByUUID, error: errUUID } = await supabase
          .from("orders")
          .select("id, status, updated_at")
          .eq("id", orderIdField.value)
          .single();

        if (!errUUID && orderByUUID) {
          return orderByUUID;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[Webhook] Error searching for order:", error);
    return null;
  }
}

/**
 * Process opportunity stage change event
 * Updates order status based on GHL stage mapping
 * Supports both modes:
 * - MODE A (Private Integration): Uses newStageId (UUID)
 * - MODE B (Workflow): Uses stageName (string)
 */
export async function processStageChangeEvent(payload: GHLOpportunityWebhookPayload): Promise<{
  success: boolean;
  orderId?: string;
  previousStatus?: string;
  newStatus?: string;
  error?: string;
}> {
  // Type guard for stage_change event
  if (payload.event !== "opportunity.stage_change") {
    return { success: false, error: "Not a stage_change event" };
  }

  const data = payload.data;
  const { id: opportunityId, pipelineId, newStageId, customFields } = data;
  const stageName = (data as Record<string, unknown>)["stageName"] as string | undefined;

  // Validate pipeline ID
  if (pipelineId !== GHL_PIPELINE_ID) {
    console.warn(
      `[Webhook] Stage change for different pipeline: ${pipelineId} (ignoring, our pipeline: ${GHL_PIPELINE_ID})`,
    );
    return {
      success: false,
      error: `Pipeline ${pipelineId} not configured (expected ${GHL_PIPELINE_ID})`,
    };
  }

  // Map GHL stage to Supabase status (supports both modes)
  let newStatus: string | undefined;

  if (stageName) {
    // MODE B: Workflow mode - map from stageName
    newStatus = getOrderStatusFromStageName(stageName);
    if (!newStatus) {
      console.warn(`[Webhook] Unknown stage name: ${stageName} (not in mapping)`);
      return {
        success: false,
        error: `Stage "${stageName}" not mapped to order status`,
      };
    }
  } else if (newStageId) {
    // MODE A: Private Integration mode - map from newStageId
    newStatus = getOrderStatusFromGHLStage(newStageId);
    if (!newStatus) {
      console.warn(`[Webhook] Unknown stage ID: ${newStageId} (not in mapping)`);
      return {
        success: false,
        error: `Stage ${newStageId} not mapped to order status`,
      };
    }
  } else {
    console.warn("[Webhook] Neither stageName nor newStageId found in payload");
    return {
      success: false,
      error: "No stage identifier found in payload",
    };
  }

  // Find the order
  const order = await findOrderByOpportunity(opportunityId, customFields);
  if (!order) {
    console.warn(
      `[Webhook] Order not found for opportunity: ${opportunityId} (event valid, order not linked)`,
    );
    return {
      success: false,
      error: `Order not found for opportunity ${opportunityId}`,
    };
  }

  const previousStatus = order.status;

  // Update order status
  try {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(`[Webhook] Failed to update order ${order.id}:`, updateError);
      return {
        success: false,
        error: `Failed to update order: ${updateError.message}`,
      };
    }

    return {
      success: true,
      orderId: order.id,
      previousStatus,
      newStatus,
    };
  } catch (error) {
    console.error("[Webhook] Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Record webhook event for audit and deduplication
 */
async function recordWebhookEvent(
  payload: GHLOpportunityWebhookPayload,
  orderId: string | null,
  processed: boolean,
  errorMessage: string | null,
): Promise<void> {
  try {
    // webhookId is the official identifier for deduplication (not deliveryId)
    // If webhookId is missing, we must fail - don't generate UUID
    if (!payload.webhookId) {
      console.error("[Webhook] Missing webhookId in payload - cannot record event safely");
      return;
    }

    const { error } = await supabase.from("webhook_events").insert({
      delivery_id: payload.webhookId, // Using official HighLevel webhookId
      event_type: payload.event,
      opportunity_id: payload.data.id,
      location_id: payload.locationId,
      contact_id: payload.data.contactId || null,
      order_id: orderId,
      payload: payload,
      processed,
      processed_at: processed ? new Date().toISOString() : null,
      error_message: errorMessage,
    });

    if (error) {
      console.error("[Webhook] Failed to record webhook event:", error);
    }
  } catch (error) {
    console.error("[Webhook] Error recording webhook event:", error);
  }
}

/**
 * Main webhook handler - Supports both Private Integration (Ed25519) and Workflow (Bearer) modes
 */
export async function POST(request: Request) {
  let rawBody: string = "";
  let payload: GHLOpportunityWebhookPayload | null = null;
  let webhookId: string | null = null;
  let isWorkflowMode = false;

  try {
    // Step 1: Read raw body
    rawBody = await request.text();

    // Step 2: Detect authentication mode and validate
    const signatureHeader = request.headers.get("x-ghl-signature");
    const authHeader = request.headers.get("authorization");

    let isAuthenticated = false;

    if (signatureHeader) {
      // MODE A: Private Integration with X-GHL-Signature (Ed25519)
      console.log("[Webhook] Detected Private Integration mode (X-GHL-Signature)");
      isAuthenticated = verifyWebhookSignature(rawBody, signatureHeader);
      if (!isAuthenticated) {
        console.warn(
          "[Webhook] Ed25519 signature verification failed from:",
          request.headers.get("x-forwarded-for") || "unknown",
        );
        return json({ error: "Invalid webhook signature" }, { status: 401 });
      }
      isWorkflowMode = false;
    } else if (authHeader) {
      // MODE B: Workflow with Authorization Bearer token
      console.log("[Webhook] Detected Workflow mode (Authorization Bearer)");
      isAuthenticated = verifyBearerToken(authHeader);
      if (!isAuthenticated) {
        console.warn(
          "[Webhook] Bearer token verification failed from:",
          request.headers.get("x-forwarded-for") || "unknown",
        );
        return json({ error: "Unauthorized" }, { status: 403 });
      }
      isWorkflowMode = true;
    } else {
      console.warn("[Webhook] No authentication header found");
      return json({ error: "Missing authentication" }, { status: 401 });
    }

    // Step 3: Parse JSON payload
    let parsedPayload: GHLOpportunityWebhookPayload;

    if (isWorkflowMode) {
      // Parse as flat workflow payload and convert
      const workflowPayload = JSON.parse(rawBody) as Record<string, unknown>;

      // Validate required Workflow fields
      if (!workflowPayload["opportunityId"] || !workflowPayload["locationId"]) {
        console.warn(
          "[Webhook] Invalid Workflow payload structure (missing opportunityId or locationId)",
        );
        return json({ error: "Invalid webhook payload" }, { status: 400 });
      }

      // Validate locationId matches our configuration
      if (GHL_LOCATION_ID && workflowPayload["locationId"] !== GHL_LOCATION_ID) {
        console.warn(
          `[Webhook] LocationId mismatch: ${workflowPayload["locationId"]} (expected ${GHL_LOCATION_ID})`,
        );
        return json({ error: "Invalid location" }, { status: 400 });
      }

      // Validate pipeline name (for Workflow, we get name not ID)
      if (
        workflowPayload["pipelineName"] &&
        workflowPayload["pipelineName"] !== GHL_PIPELINE_NAME
      ) {
        console.warn(
          `[Webhook] Pipeline mismatch: ${workflowPayload["pipelineName"]} (expected ${GHL_PIPELINE_NAME})`,
        );
        return json({ error: "Invalid pipeline" }, { status: 400 });
      }

      // Convert to internal structure
      parsedPayload = convertWorkflowPayloadToInternal(workflowPayload);
    } else {
      // Parse as Private Integration payload
      parsedPayload = JSON.parse(rawBody) as GHLOpportunityWebhookPayload;
    }

    payload = parsedPayload;
    webhookId = payload.webhookId || null;

    // Step 4: Validate payload structure
    if (!payload.event || !payload.locationId || !payload.data?.id) {
      console.warn("[Webhook] Invalid payload structure");
      if (webhookId && payload) {
        await recordWebhookEvent(payload, null, false, "Invalid payload structure");
      }
      return json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // Step 5: Check for duplicate processing via webhookId
    if (webhookId) {
      try {
        const { data: existingEvent } = await supabase
          .from("webhook_events")
          .select("id, processed")
          .eq("delivery_id", webhookId)
          .single();

        if (existingEvent) {
          console.log(
            `[Webhook] Duplicate delivery: ${webhookId} (already processed=${existingEvent.processed})`,
          );
          // Return 200 OK regardless (webhook is idempotent)
          return json(
            {
              success: true,
              message: "Webhook already processed (idempotent)",
              webhookId,
            },
            { status: 200 },
          );
        }
      } catch (error) {
        // No existing event found (expected for first delivery)
        // Continue processing
      }
    }

    // Step 6: Process event based on type
    let processResult: Awaited<ReturnType<typeof processStageChangeEvent>> | null = null;
    let orderId: string | null = null;

    switch (payload.event) {
      case "opportunity.stage_change": {
        processResult = await processStageChangeEvent(payload);
        orderId = processResult.orderId || null;
        break;
      }

      case "opportunity.updated":
      case "opportunity.status_change":
      case "opportunity.created":
      case "opportunity.deleted": {
        // These events are valid but not processed yet
        console.log(`[Webhook] Event received but not processed: ${payload.event}`);
        await recordWebhookEvent(
          payload,
          null,
          false,
          `Event type not yet implemented: ${payload.event}`,
        );
        return json(
          {
            success: true,
            event: payload.event,
            message: "Event acknowledged but not processed (not implemented)",
          },
          { status: 200 },
        );
      }

      default: {
        console.warn(`[Webhook] Unknown event type: ${payload.event}`);
        await recordWebhookEvent(payload, null, false, `Unknown event type: ${payload.event}`);
        return json(
          {
            success: true,
            event: payload.event,
            message: "Unknown event type (acknowledged)",
          },
          { status: 200 },
        );
      }
    }

    // Step 7: Handle processing result
    if (!processResult) {
      return json({ error: "Internal server error" }, { status: 500 });
    }

    if (processResult.success) {
      // Record successful processing
      await recordWebhookEvent(payload, orderId, true, null);

      console.log(
        `[Webhook] Successfully processed: ${payload.event} (order: ${orderId}, status: ${processResult.previousStatus} → ${processResult.newStatus})`,
      );

      return json(
        {
          success: true,
          event: payload.event,
          orderId,
          previousStatus: processResult.previousStatus,
          newStatus: processResult.newStatus,
          webhookId,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    } else {
      // Event valid but not processed (order not found, stage not mapped, etc.)
      await recordWebhookEvent(payload, null, false, processResult.error || "Unknown error");

      console.log(
        `[Webhook] Event valid but not processed: ${payload.event} - ${processResult.error}`,
      );

      // Return 200 OK to acknowledge (don't retry permanent failures)
      return json(
        {
          success: true,
          event: payload.event,
          message: processResult.error,
          webhookId,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }
  } catch (error) {
    // Generic error handling
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[Webhook] Unhandled error:", message, error);

    // Try to record error
    if (payload) {
      await recordWebhookEvent(payload, null, false, `Unhandled error: ${message}`);
    }

    // Return 200 OK to prevent GHL retries on permanent errors
    return json(
      {
        success: false,
        error: message,
        code: "WEBHOOK_ERROR",
        webhookId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
