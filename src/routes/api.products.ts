/**
 * API endpoint for product operations
 * POST /api/products - Create a new product
 */

import { json } from "@tanstack/react-start";
import { createGHLProduct, getGHLProducts } from "@/lib/ghl/client.server";
import { syncProductMetadata, getFullProductMetadataByIds } from "@/lib/product-metadata.server";
import type { GHLProduct } from "@/lib/ghl/types";

interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image?: string;
  sku?: string;
  price_max?: number;
  available_colors?: string[];
  badge_label?: string;
  rose_step?: number;
}

/**
 * GET /api/products
 * Admin listing: raw GHL products (no category normalization/drop) + Supabase metadata.
 * Query params: page, limit (max 100), status ("active" | "inactive"), search (name/sku).
 *
 * Search/pagination are applied in-memory after a single GHL page fetch (limit 100),
 * which is fine for a shop-sized catalog but would need server-side search for a larger one.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get("locationId") || process.env["GHL_LOCATION_ID"];
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim().toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10) || 50;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const needsInMemoryPaging = Boolean(search);
    const fetchOptions: { limit?: number; skip?: number; filter?: Record<string, unknown> } = {
      limit: needsInMemoryPaging ? 100 : limit,
      skip: needsInMemoryPaging ? 0 : skip,
    };
    if (status) fetchOptions.filter = { status };

    const result = await getGHLProducts(locationId ?? undefined, fetchOptions);

    if (!("products" in result)) {
      return json(result, { status: result.statusCode || 500 });
    }

    let products: GHLProduct[] = result.products || [];

    if (status) {
      products = products.filter((p) => p.status === status);
    }

    if (search) {
      products = products.filter((p) =>
        `${p.name || ""} ${p.sku || ""}`.toLowerCase().includes(search),
      );
    }

    const total = needsInMemoryPaging ? products.length : result.total || products.length;

    if (needsInMemoryPaging) {
      products = products.slice(skip, skip + limit);
    }

    const metadataMap = await getFullProductMetadataByIds(products.map((p) => p.id));

    const items = products.map((product) => ({
      ...product,
      metadata: metadataMap.get(product.id) || null,
    }));

    return json(
      {
        products: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/products GET error:", message);
    return json({ error: message, code: "API_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateProductRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return json({ error: "Missing required field: name" }, { status: 400 });
    }

    // Create in GHL first
    const ghlResult = await createGHLProduct({
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      image: body.image,
      sku: body.sku,
      status: "active",
    });

    // Check if GHL creation failed
    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    // Create metadata in Supabase
    const metadataResult = await syncProductMetadata({
      ghl_product_id: ghlResult.id,
      price_max: body.price_max,
      available_colors: body.available_colors,
      badge_label: body.badge_label,
      rose_step: body.rose_step,
      requires_quote: false,
      status: "active",
    });

    if (!metadataResult.success) {
      console.error(`[API] Created GHL product but metadata sync failed: ${ghlResult.id}`);
      // Still return success since GHL product was created
      // Metadata can be synced later
    }

    return json(
      {
        success: true,
        product: {
          id: ghlResult.id,
          ...ghlResult,
        },
        metadata: metadataResult,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/products POST error:", message);
    return json({ error: message, code: "API_ERROR" }, { status: 500 });
  }
}
