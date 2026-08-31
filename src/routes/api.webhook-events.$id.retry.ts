/**
 * POST /api/webhook-events/[id]/retry
 * Re-runs the existing stage-change processing logic for a stored webhook event.
 * Reuses processStageChangeEvent from the webhook handler itself (no separate retry system).
 * Only "opportunity.stage_change" events are retryable today, since that is the only
 * event type with a processing function to re-invoke.
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { processStageChangeEvent } from "@/routes/api.webhooks.ghl-opportunity";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import type { GHLOpportunityWebhookPayload } from "@/lib/ghl/types";

const POST = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 2];

    if (!id) {
      return json({ error: "Missing webhook event ID" }, { status: 400 });
    }

    const { data: event, error: fetchError } = await supabaseAdmin
      .from("webhook_events")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return json({ error: "Webhook event not found" }, { status: 404 });
    }

    if (event.event_type !== "opportunity.stage_change") {
      return json(
        { error: `Retry not supported for event type "${event.event_type}"` },
        { status: 400 },
      );
    }

    const result = await processStageChangeEvent(
      event.payload as unknown as GHLOpportunityWebhookPayload,
    );

    const { error: updateError } = await supabaseAdmin
      .from("webhook_events")
      .update({
        processed: result.success,
        processed_at: new Date().toISOString(),
        error_message: result.success ? null : result.error || "Retry failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[API] /api/webhook-events/[id]/retry update error:", updateError.message);
    }

    await logAdminAction({
      userId: admin.user.id,
      action: "webhook_event.retry",
      resource: "webhook_events",
      recordId: id,
      metadata: { success: result.success },
    });

    return json({ success: result.success, result }, { status: result.success ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/webhook-events/[id]/retry error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/webhook-events/$id/retry")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
