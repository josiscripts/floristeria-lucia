import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { getGHLProducts, testGHLConnection } from "@/lib/ghl/client.server";
import { normalizeGHLProducts } from "@/lib/normalize-ghl-product";
import {
  getProductMetadataByIds,
  getFullProductMetadataByIds,
} from "@/lib/product-metadata.server";

async function GET(request: Request) {
  try {
    // Parse URL to check query params
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    // Test connection
    if (action === "test") {
      const result = await testGHLConnection();
      return json(result, { status: result.connected ? 200 : 503 });
    }

    // Fetch products (default action)
    const locationId = url.searchParams.get("locationId") || process.env.GHL_LOCATION_ID;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 100;
    const skip = url.searchParams.get("skip") ? parseInt(url.searchParams.get("skip")!) : 0;

    const result = await getGHLProducts(locationId, { limit, skip });

    // Check if result is an error
    if ("code" in result && "statusCode" in result) {
      return json(result, { status: result.statusCode || 500 });
    }

    // Normalize products with metadata from Supabase
    const ghlProducts = result.products || [];
    const ghlProductIds = ghlProducts.map((p: any) => p.id);
    // Use full metadata (including category, price, sku) for normalization
    const metadataMap = await getFullProductMetadataByIds(ghlProductIds);

    const normalizedProducts = await normalizeGHLProducts(
      ghlProducts,
      async (ghlProductId: string) => {
        const fullMetadata = metadataMap.get(ghlProductId);
        if (!fullMetadata) return null;
        // Map Supabase fields to ProductMetadata interface
        return {
          category: fullMetadata.category,
          price: fullMetadata.price_min, // ✅ CORREGIDO: usar price_min, no price
          sku: fullMetadata.sku,
          price_max: fullMetadata.price_max,
          available_colors: fullMetadata.available_colors as string[] | null,
          badge_label: fullMetadata.badge_label,
          rose_step: fullMetadata.rose_step,
          requires_quote: fullMetadata.requires_quote,
        };
      },
    );

    // Return normalized products in same structure as before for compatibility
    return json(
      {
        products: normalizedProducts,
        total: result.total || normalizedProducts.length,
        pageSize: result.pageSize || normalizedProducts.length,
        currentPage: result.currentPage || 1,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/ghl/products error:", message);
    return json({ message, code: "API_ERROR" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/ghl/products")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
