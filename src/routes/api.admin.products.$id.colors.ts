/**
 * Admin API endpoints for product color variants management (BLOQUE 4 redesign)
 * POST /api/admin/products/{id}/colors - Create color variant
 * DELETE /api/admin/products/{id}/colors/{colorId} - Delete color variant
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import {
  createColorVariant,
  deleteColorVariant,
  getProductWithOptions,
  listColorVariants,
} from "@/lib/products.server";

interface CreateColorVariantRequest {
  name: string;
  sort_order?: number;
}

/**
 * POST /api/admin/products/{id}/colors
 * Create a new color variant for a product
 */
const POST = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const productId = url.pathname.split("/")[4]; // /api/admin/products/{id}/colors

    if (!productId) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: CreateColorVariantRequest = await request.json();

    if (!body.name) {
      return json({ error: "Missing required field: name" }, { status: 400 });
    }

    // Get product to verify it exists and is rosas-eternas
    const productRes = await getProductWithOptions(productId);
    if (!productRes.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    if (!productRes.data.has_color_variants) {
      return json({ error: "This product does not support color variants" }, { status: 400 });
    }

    // Get current colors to determine sort_order
    const colorsRes = await listColorVariants(productId);
    const nextSort = body.sort_order ?? colorsRes.data?.length ?? 0;

    // Create color variant
    const colorRes = await createColorVariant({
      product_id: productId,
      name: body.name,
      sort_order: nextSort,
      active: true,
    });

    if (!colorRes.success) {
      return json({ error: colorRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.color.create",
      resource: "color_variants",
      recordId: colorRes.data.id,
      metadata: {
        product_id: productId,
        name: body.name,
      },
    });

    return json({ success: true, color: colorRes.data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/colors POST error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/products/{id}/colors/{colorId}
 * Delete a color variant
 */
const DELETE = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[4];
    const colorId = pathParts[6];

    if (!productId || !colorId) {
      return json({ error: "Missing product ID or color ID" }, { status: 400 });
    }

    // Verify product exists
    const productRes = await getProductWithOptions(productId);
    if (!productRes.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Verify color belongs to product
    const color = productRes.data.colors?.find((c: any) => c.id === colorId);
    if (!color) {
      return json({ error: "Color not found" }, { status: 404 });
    }

    // Delete color variant
    const deleteRes = await deleteColorVariant(colorId);

    if (!deleteRes.success) {
      return json({ error: deleteRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.color.delete",
      resource: "color_variants",
      recordId: colorId,
      metadata: {
        product_id: productId,
        color_name: color.name,
      },
    });

    return json({ success: true, message: "Color variant deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/colors/{colorId} DELETE error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/products/$id/colors")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
