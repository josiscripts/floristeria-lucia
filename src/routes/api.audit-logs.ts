/**
 * API endpoint to list administrative audit log entries
 * GET /api/audit-logs — Admin only.
 * Query params:
 *   page?: number (default 1)
 *   limit?: number (default 20, max 100)
 */

import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard } from "@/lib/admin/guard.server";

export const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limitParam = parseInt(url.searchParams.get("limit") || "20", 10) || 20;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const {
      data: logs,
      error,
      count,
    } = await supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error("[API] /api/audit-logs GET error:", error.message);
      return json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return json(
      {
        logs: logs || [],
        pagination: { total, page, limit, totalPages },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/audit-logs GET error:", message);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
});
