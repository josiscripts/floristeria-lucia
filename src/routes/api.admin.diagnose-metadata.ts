import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGHLProducts } from "@/lib/ghl/client.server";
import { getFullProductMetadataByIds } from "@/lib/product-metadata.server";

async function GET() {
  try {
    // Get GHL products
    const ghlResult = await getGHLProducts(undefined, { limit: 10 });
    if (!("products" in ghlResult)) {
      return json({ error: "Failed to fetch GHL" }, { status: 500 });
    }

    const ghlProducts = ghlResult.products || [];
    const ghlIds = ghlProducts.map((p) => p.id);

    // Try to get metadata
    const metadata = await getFullProductMetadataByIds(ghlIds);

    // Verify by querying Supabase directly
    const { data: directData, error: directError } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .in("ghl_product_id", ghlIds.slice(0, 5));

    return json({
      ghlProducts: ghlProducts.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
      })),
      metadataFromFunction: {
        total: metadata.size,
        sample: Array.from(metadata.entries())
          .slice(0, 2)
          .map(([id, record]) => ({
            ghlId: id,
            category: record.category,
            price_min: record.price_min,
            sku: record.sku,
          })),
      },
      directSupabaseQuery: {
        error: directError?.message,
        records: directData?.slice(0, 3).map((r) => ({
          ghlId: r.ghl_product_id,
          category: r.category,
          price_min: r.price_min,
          sku: r.sku,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/admin/diagnose-metadata")({
  server: {
    handlers: {
      GET: ({ request }) => GET(),
    },
  },
});
