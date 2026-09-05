/**
 * API endpoint for product operations
 * POST /api/products - Create a new product
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import type { CategoryId } from "@/data/catalog";

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
 * Admin listing: Supabase products as source of truth.
 * Query params: page, limit (max 100), status ("active" | "inactive"), search (name/sku).
 * Filters: active=true AND deleted_at IS NULL (via RLS)
 */
const GET = withAdminGuard(async (request) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env["SUPABASE_URL"] || "",
      process.env["SUPABASE_SERVICE_ROLE_KEY"] || "",
    );

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim().toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10) || 50;
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const PRODUCTS_SELECT = "*, product_options(id, name, price_amount, sku, sort_order)";

    let query = supabase
      .from("products")
      .select(PRODUCTS_SELECT, { count: "exact" })
      .eq("active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    if (status === "inactive") {
      query = supabase
        .from("products")
        .select(PRODUCTS_SELECT, { count: "exact" })
        .eq("active", false)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (search) {
        query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
      }
    }

    query = query.range(skip, skip + limit - 1);

    const { data: products, count, error } = await query;

    if (error) {
      console.error("[API] Supabase query error:", error);
      return json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
    }

    const total = count ?? 0;

    const items = (products || []).map((product: any) => ({
      ...product,
      metadata: null,
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
});

const POST = withAdminGuard(async (request, admin) => {
  try {
    const body: CreateProductRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return json({ error: "Missing required field: name" }, { status: 400 });
    }

    // Generate SKU if not provided
    let finalSku = body.sku;
    if (!finalSku && body.category) {
      const skuGenResult = await generateSKU(body.category);
      if (skuGenResult.success) {
        finalSku = skuGenResult.sku;
      }
    }

    // Obtener collectionId si existe mapping de categoría
    let collectionIds: string[] | undefined;
    if (body.category) {
      const collectionResult = await getGHLCollectionIdForCategory(body.category as CategoryId);
      if (collectionResult.success && collectionResult.collectionId) {
        collectionIds = [collectionResult.collectionId];
      }
    }

    // Create in GHL first
    const ghlPayload: Record<string, any> = {
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      image: body.image,
      sku: finalSku,
      status: "active",
    };

    if (collectionIds) {
      ghlPayload.collectionIds = collectionIds;
    }

    const ghlResult = await createGHLProduct(ghlPayload);

    // Check if GHL creation failed
    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    // Ensure product has price in GHL (creates Price record with SKU)
    const locationId = url.searchParams.get("locationId") || process.env["GHL_LOCATION_ID"];
    let ghlPriceId: string | null = null;
    let priceError: string | null = null;

    if (body.price !== undefined || finalSku) {
      const priceResult = await ensureProductPrice({
        ghlProductId: ghlResult.id,
        amount: body.price ?? 0,
        currency: "EUR",
        sku: finalSku,
        priceName: body.name,
        locationId: locationId ?? undefined,
      });

      if (priceResult.success) {
        ghlPriceId = priceResult.ghlPriceId ?? null;
      } else {
        priceError = priceResult.error ?? "Unknown price sync error";
        console.warn(`[API] Price sync failed: ${priceError}`);
      }
    }

    // Create metadata in Supabase - critical fields that GHL doesn't persist
    const metadataInput: Record<string, any> = {
      ghl_product_id: ghlResult.id,
      // Store category and price in metadata since GHL doesn't persist them
      category: body.category ?? null,
      price: body.price ?? null,
      price_max: body.price_max ?? null,
      sku: finalSku ?? null,
      ghl_price_id: ghlPriceId,
      requires_quote: false,
      status: "active",
    };

    // Add optional fields only if provided
    if (body.available_colors !== undefined) metadataInput.available_colors = body.available_colors;
    if (body.badge_label !== undefined) metadataInput.badge_label = body.badge_label;
    if (body.rose_step !== undefined) metadataInput.rose_step = body.rose_step;

    const metadataResult = await syncProductMetadata(metadataInput as any);

    if (!metadataResult.success) {
      console.error(`[API] Created GHL product but metadata sync failed: ${ghlResult.id}`);
      // Still return success since GHL product was created
      // Metadata can be synced later
    }

    await logAdminAction({
      userId: admin.user.id,
      action: "product.create",
      resource: "products",
      recordId: (ghlResult as { id: string }).id,
      metadata: { name: body.name },
    });

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
});

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
