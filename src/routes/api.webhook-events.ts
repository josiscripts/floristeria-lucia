/**
 * API endpoint to list webhook events
 * GET /api/webhook-events
 * Query params:
 *   page?: number (default 1)
 *   limit?: number (default 20, max 100)
 *   eventType?: string
 *   processed?: "true" | "false"
 *   search?: string (matches opportunity_id, or order_id when search looks like a UUID)
 */

import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard } from "@/lib/admin/guard.server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limitParam = parseInt(url.searchParams.get("limit") || "20", 10) || 20;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const eventType = url.searchParams.get("eventType");
    const processedParam = url.searchParams.get("processed");
    const search = url.searchParams.get("search")?.trim();

    let query = supabaseAdmin
      .from("webhook_events")
      .select("*", { count: "exact" })
      .order("received_at", { ascending: false });

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (processedParam === "true") {
      query = query.eq("processed", true);
    } else if (processedParam === "false") {
      query = query.eq("processed", false);
    }

    if (search) {
      const safeSearch = search.replace(/[,()%]/g, "");
      const filters = [`opportunity_id.ilike.%${safeSearch}%`];
      if (UUID_REGEX.test(safeSearch)) {
        filters.push(`order_id.eq.${safeSearch}`);
      }
      query = query.or(filters.join(","));
    }

    query = query.range(skip, skip + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error("[API] /api/webhook-events GET error:", error.message);
      return json({ error: "Failed to fetch webhook events" }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return json(
      {
        events: events || [],
        pagination: { total, page, limit, totalPages },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/webhook-events GET error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
});
