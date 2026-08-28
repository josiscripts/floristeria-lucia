import { json } from "@tanstack/react-start";
import { getGHLProducts, testGHLConnection } from "@/lib/ghl/client.server";
import { normalizeGHLProducts } from "@/lib/normalize-ghl-product";
import { getProductMetadataByIds } from "@/lib/product-metadata.server";

export async function GET(request: Request) {
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
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : 100;
    const skip = url.searchParams.get("skip")
      ? parseInt(url.searchParams.get("skip")!)
      : 0;

    const result = await getGHLProducts(locationId, { limit, skip });

    // Check if result is an error
    if ("code" in result && "statusCode" in result) {
      return json(result, { status: result.statusCode || 500 });
    }

    // Normalize products with metadata
    const ghlProducts = result.products || [];
    const ghlProductIds = ghlProducts.map((p: any) => p.id);
    const metadataMap = await getProductMetadataByIds(ghlProductIds);

    const normalizedProducts = await normalizeGHLProducts(
      ghlProducts,
      async (ghlProductId: string) => {
        return metadataMap.get(ghlProductId) || null;
      }
    );

    // Return normalized products in same structure as before for compatibility
    return json(
      {
        products: normalizedProducts,
        total: result.total || normalizedProducts.length,
        pageSize: result.pageSize || normalizedProducts.length,
        currentPage: result.currentPage || 1,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/ghl/products error:", message);
    return json(
      { message, code: "API_ERROR" },
      { status: 500 }
    );
  }
}
