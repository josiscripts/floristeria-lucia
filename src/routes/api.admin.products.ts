/**
 * Admin API endpoints for product management (Supabase-only)
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
import { generateSKU } from "@/lib/sku-generator.server";

interface CreateProductWithOptionsRequest {
  name: string;
  description?: string;
  category_id?: string; // FK to categories table
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  options: Array<{
    name: string;
    price_amount: number;
    discount_percent?: number;
    stock_quantity?: number | null;
  }>;
  color_variants?: string[];
}

/**
 * GET /api/admin/products
 * List all products with their options and images
 */
const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const category_id = url.searchParams.get("category_id") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const active = url.searchParams.get("active");

    const result = await listProducts({
      category_id: category_id,
      active: active === "true" ? true : active === "false" ? false : undefined,
      search: search || undefined,
    });

    if (!result.success) {
      return json({ error: result.error }, { status: 500 });
    }

    // Enrich with options, images, and colors
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
    if (!body.name?.trim()) {
      return json({ error: "Product name is required" }, { status: 400 });
    }

    if (!body.options || body.options.length === 0) {
      return json({ error: "At least one price option is required" }, { status: 400 });
    }

    for (const opt of body.options) {
      if (!opt.name?.trim()) {
        return json({ error: "Option name is required" }, { status: 400 });
      }
      if (typeof opt.price_amount !== "number" || opt.price_amount <= 0) {
        return json({ error: "Option price must be > 0" }, { status: 400 });
      }
    }

    // Create product in Supabase
    const productRes = await createProduct({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      category_id: body.category_id || null,
      active: body.active ?? true,
      cover_image_url: body.cover_image_url || null,
      has_color_variants: body.has_color_variants ?? false,
      ghl_product_id: null, // Supabase-only product
    });

    if (!productRes.success) {
      return json({ error: productRes.error }, { status: 500 });
    }

    const productId = productRes.data.id;

    // Create price options
    const createdOptions = [];
    for (let i = 0; i < body.options.length; i++) {
      const opt = body.options[i];

      // Generate SKU for this option
      const skuRes = await generateSKU(body.category_id || "complementos");
      const sku = skuRes.success ? skuRes.sku : `FL-OPT-${productId.slice(0, 8)}-${i}`;

      // Create option in Supabase
      const optionRes = await createProductOption({
        product_id: productId,
        name: opt.name.trim(),
        price_amount: opt.price_amount,
        discount_percent: opt.discount_percent ?? 0,
        stock_quantity: opt.stock_quantity ?? null,
        sku,
        active: true,
      });

      if (optionRes.success) {
        createdOptions.push(optionRes.data);
      }
    }

    // Create color variants if applicable
    const createdColors = [];
    if (body.has_color_variants && body.color_variants?.length) {
      for (let i = 0; i < body.color_variants.length; i++) {
        const colorRes = await createColorVariant({
          product_id: productId,
          name: body.color_variants[i].trim(),
          sort_order: i,
          active: true,
        });

        if (colorRes.success) {
          createdColors.push(colorRes.data);
        }
      }
    }

    // Log admin action
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

    // Return full product with all relations
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
