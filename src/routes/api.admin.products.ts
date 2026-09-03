/**
 * Admin API endpoints for product management (BLOQUE 4 redesign)
 * POST /api/admin/products - Create product with options
 * GET /api/admin/products - List all products
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import {
  createProduct,
  createProductOption,
  createColorVariant,
  listProducts,
  getProductWithOptions,
} from "@/lib/products.server";
import { createGHLProduct } from "@/lib/ghl/client.server";
import { generateSKU } from "@/lib/sku-generator.server";
import { ensureProductPrice } from "@/lib/price-sync.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";
import type { CategoryId } from "@/data/catalog";

interface CreateProductWithOptionsRequest {
  name: string;
  description?: string;
  category?: CategoryId;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  options: Array<{
    name: string;
    price_amount: number;
    discount_percent?: number;
    stock_quantity?: number | null;
  }>;
  color_variants?: string[]; // For rosas-eternas
}

/**
 * GET /api/admin/products
 * List all products with their options
 */
const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const active = url.searchParams.get("active");

    const result = await listProducts({
      category: category,
      active: active === "true" ? true : active === "false" ? false : undefined,
      search: search || undefined,
    });

    if (!result.success) {
      return json({ error: result.error }, { status: 500 });
    }

    // Enrich with options and colors
    const products = await Promise.all(
      result.data.map(async (product) => {
        const full = await getProductWithOptions(product.id);
        return full.data || product;
      }),
    );

    return json(
      {
        success: true,
        products,
        total: products.length,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products GET error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * POST /api/admin/products
 * Create a new product with options and color variants
 */
const POST = withAdminGuard(async (request, admin) => {
  try {
    const body: CreateProductWithOptionsRequest = await request.json();

    // Validation
    if (!body.name) {
      return json({ error: "Missing required field: name" }, { status: 400 });
    }

    if (!body.options || body.options.length === 0) {
      return json({ error: "At least one option is required" }, { status: 400 });
    }

    // Step 1: Create product in GHL
    const ghlPayload: Record<string, any> = {
      name: body.name,
      description: body.description || "",
      category: body.category || "",
      status: "active",
    };

    if (body.category) {
      const collectionResult = await getGHLCollectionIdForCategory(body.category);
      if (collectionResult.success && collectionResult.collectionId) {
        ghlPayload.collectionIds = [collectionResult.collectionId];
      }
    }

    const ghlResult = await createGHLProduct(ghlPayload);

    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    const ghlProductId = ghlResult.id;

    // Step 2: Create product in Supabase
    const productRes = await createProduct({
      ghl_product_id: ghlProductId,
      name: body.name,
      description: body.description,
      category: body.category,
      active: body.active ?? true,
      cover_image_url: body.cover_image_url,
      has_color_variants: body.has_color_variants ?? false,
    });

    if (!productRes.success) {
      return json({ error: productRes.error }, { status: 500 });
    }

    const productId = productRes.data.id;

    // Step 3: Create options with GHL prices
    const createdOptions = [];
    for (let i = 0; i < body.options.length; i++) {
      const opt = body.options[i];

      // Generate SKU
      const skuRes = await generateSKU(body.category || "complementos");
      const sku = skuRes.success ? skuRes.sku : `FL-MIX-${i + 1}`;

      // Create price in GHL
      const locationId = process.env["GHL_LOCATION_ID"];
      const priceRes = await ensureProductPrice({
        ghlProductId,
        amount: opt.price_amount,
        currency: "EUR",
        sku,
        priceName: opt.name,
        locationId,
      });

      const ghlPriceId = priceRes.success ? priceRes.ghlPriceId : null;

      // Create option in Supabase
      const optionRes = await createProductOption({
        product_id: productId,
        ghl_price_id: ghlPriceId || undefined,
        name: opt.name,
        price_amount: opt.price_amount,
        discount_percent: opt.discount_percent ?? 0,
        stock_quantity: opt.stock_quantity,
        sku,
        active: true,
      });

      if (optionRes.success) {
        createdOptions.push(optionRes.data);
      }
    }

    // Step 4: Create color variants if applicable
    const createdColors = [];
    if (body.has_color_variants && body.color_variants) {
      for (let i = 0; i < body.color_variants.length; i++) {
        const colorRes = await createColorVariant({
          product_id: productId,
          name: body.color_variants[i],
          sort_order: i,
          active: true,
        });

        if (colorRes.success) {
          createdColors.push(colorRes.data);
        }
      }
    }

    // Step 5: Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.create",
      resource: "products",
      recordId: productId,
      metadata: {
        name: body.name,
        options_count: createdOptions.length,
        colors_count: createdColors.length,
      },
    });

    // Step 6: Return full product
    const fullProduct = await getProductWithOptions(productId);

    return json(
      {
        success: true,
        product: fullProduct.data,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products POST error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/products")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
