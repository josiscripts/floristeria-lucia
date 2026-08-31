import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { getGHLProduct } from "@/lib/ghl/client.server";
import { normalizeGHLProduct } from "@/lib/normalize-ghl-product";
import { getProductMetadata } from "@/lib/product-metadata.server";

async function GET(request: Request) {
  try {
    // Extract product ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
      return json({ message: "Product ID is required", code: "MISSING_ID" }, { status: 400 });
    }

    // Get locationId from query params or env
    const locationId = url.searchParams.get("locationId") || process.env.GHL_LOCATION_ID;

    // Fetch product from GHL
    const ghlProduct = await getGHLProduct(productId, locationId);

    // Check if result is an error
    if ("code" in ghlProduct && "message" in ghlProduct) {
      const statusCode = ghlProduct.statusCode || 404;
      return json(ghlProduct, { status: statusCode });
    }

    // Get metadata from Supabase
    const metadataResult = await getProductMetadata(productId);
    const metadata = metadataResult.success ? metadataResult.data : null;

    // Normalize product
    const normalizedProduct = normalizeGHLProduct(ghlProduct, metadata || undefined);

    if (!normalizedProduct) {
      return json({ message: "Product data invalid", code: "INVALID_PRODUCT" }, { status: 400 });
    }

    return json(normalizedProduct, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/ghl/products/[id] error:", message);
    return json({ message, code: "API_ERROR" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/ghl/products/$id")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
