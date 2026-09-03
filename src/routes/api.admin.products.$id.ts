/**
 * Admin API endpoints for product management by ID (BLOQUE 4 redesign)
 * GET /api/admin/products/{id} - Get product with options
 * PUT /api/admin/products/{id} - Update product
 * DELETE /api/admin/products/{id} - Delete product
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import { getProductWithOptions, updateProduct, deleteProduct } from "@/lib/products.server";
import { updateGHLProduct } from "@/lib/ghl/client.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";
import type { CategoryId } from "@/data/catalog";

interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: CategoryId;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
}

/**
 * GET /api/admin/products/{id}
 * Get a single product with all its options and color variants
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
 * Update a product (name, description, category, status, etc.)
 * Note: Use /api/admin/products/{id}/options endpoints for option management
 */
const PUT = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: UpdateProductRequest = await request.json();

    // Check if product exists
    const existing = await getProductWithOptions(id);
    if (!existing.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Update in GHL if name/description/category changed
    const ghlUpdatePayload: Record<string, any> = {};
    if (body.name) ghlUpdatePayload.name = body.name;
    if (body.description) ghlUpdatePayload.description = body.description;
    if (body.category) {
      const collectionResult = await getGHLCollectionIdForCategory(body.category);
      if (collectionResult.success && collectionResult.collectionId) {
        ghlUpdatePayload.collectionIds = [collectionResult.collectionId];
      }
    }

    if (Object.keys(ghlUpdatePayload).length > 0) {
      const ghlResult = await updateGHLProduct(existing.data.ghl_product_id, ghlUpdatePayload);
      if ("code" in ghlResult && "statusCode" in ghlResult) {
        console.warn(`[API] GHL update failed: ${ghlResult.message}`);
        // Don't fail the request, continue with Supabase update
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
 * Does NOT delete from GHL to maintain historical records
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
    if (!existing.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Soft delete in Supabase
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
      metadata: { name: existing.data.name },
    });

    return json({ success: true, message: "Product deleted" }, { status: 200 });
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
