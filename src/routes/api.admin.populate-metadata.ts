/**
 * FASE 3A: Admin endpoint to populate product metadata
 * POST: Execute population
 * GET: View current status
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard } from "@/lib/admin/guard.server";
import {
  populateProductMetadataFromCatalog,
  getPopulationStats,
} from "@/lib/admin/populate-product-metadata.server";

/**
 * GET: View population statistics
 */
const GET = withAdminGuard(async (request) => {
  try {
    const stats = await getPopulationStats();
    return json(stats, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

/**
 * POST: Execute population
 * IMPORTANT: This is destructive in that it creates/updates metadata
 */
const POST = withAdminGuard(async (request, admin) => {
  try {
    const result = await populateProductMetadataFromCatalog();
    return json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/populate-metadata error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/populate-metadata")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
