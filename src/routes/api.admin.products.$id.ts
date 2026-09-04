/**
 * Admin API endpoints for product management by ID (Supabase-only)
 * GET /api/admin/products/{id} - Get product with options
 * PUT /api/admin/products/{id} - Update product
 * DELETE /api/admin/products/{id} - Soft delete product
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import { getProductWithOptions, updateProduct, deleteProduct } from "@/lib/products.server";

interface UpdateProductRequest {
  name?: string;
  description?: string;
  category_id?: string | null; // FK to categories
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
}

/**
 * GET /api/admin/products/{id}
 * Get a single product with all its options, images, and color variants
 */
const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const result = await getProductWithOptions(id);

    if (!result.success) {
      return json({ error: result.error }, { status: 404 });
    }

    return json({ success: true, product: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id} GET error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * PUT /api/admin/products/{id}
 * Update a product (name, description, category, status, color variants, etc.)
 */
const PUT = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: UpdateProductRequest = await request.json();

    // Validate product exists
    const existing = await getProductWithOptions(id);
    if (!existing.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Validate category_id if provided
    if (body.category_id) {
      const { data: category, error: catError } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("id", body.category_id)
        .single();

      if (catError || !category) {
        return json({ error: "Invalid category ID" }, { status: 400 });
      }
    }

    // Update in Supabase
    const updateRes = await updateProduct(id, body);

    if (!updateRes.success) {
      return json({ error: updateRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.update",
      resource: "products",
      recordId: id,
      metadata: { fields: Object.keys(body) },
    });

    // Return updated product
    const updated = await getProductWithOptions(id);

    return json({ success: true, product: updated.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id} PUT error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/products/{id}
 * Soft delete a product (set deleted_at)
 * Protects products with historical orders and Condolencias category
 */
const DELETE = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    // Check if product exists
    const existing = await getProductWithOptions(id);
    if (!existing.success || !existing.data) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    const product = existing.data;

    // Protection 1: Check if product belongs to Condolencias category
    // Condolencias must be protected (can only soft delete, never hard delete)
    if (product?.category_id) {
      const { data: category } = await supabaseAdmin
        .from("categories")
        .select("slug")
        .eq("id", product.category_id)
        .single();

      // Allow soft delete but log clearly
      if (category?.slug === "condolencias") {
        console.info(`[API] Soft deleting Condolencias product: ${product?.id}`);
      }
    }

    // Protection 2: Check for historical orders referencing this product
    const { data: orders, error: orderError } = await supabaseAdmin
      .from("order_items")
      .select("id, order_id")
      .eq("product_id", id)
      .limit(1);

    if (!orderError && orders && orders.length > 0) {
      // Product has order history - only soft delete allowed, never hard delete
      console.info(`[API] Product ${id} has historical orders. Using safe soft delete.`);
    }

    // Perform soft delete (set deleted_at)
    const deleteRes = await deleteProduct(id);

    if (!deleteRes.success) {
      return json({ error: deleteRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.delete",
      resource: "products",
      recordId: id,
      metadata: {
        name: product.name,
        category_id: product.category_id,
        has_orders: orders && orders.length > 0,
      },
    });

    return json({ success: true, message: "Product deleted (soft delete)" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id} DELETE error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/products/$id")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
