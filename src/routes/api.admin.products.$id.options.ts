/**
 * Admin API endpoints for product options management (Supabase-only)
 * POST /api/admin/products/{id}/options - Create option
 * PUT /api/admin/products/{id}/options/{optionId} - Update option
 * DELETE /api/admin/products/{id}/options/{optionId} - Delete option
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import {
  createProductOption,
  updateProductOption,
  deleteProductOption,
  getProductOption,
  getProductWithOptions,
} from "@/lib/products.server";

interface CreateOptionRequest {
  name: string;
  price_amount: number;
  discount_percent?: number;
  stock_quantity?: number | null;
}

interface UpdateOptionRequest {
  name?: string;
  price_amount?: number;
  discount_percent?: number;
  stock_quantity?: number | null;
}

/**
 * POST /api/admin/products/{id}/options
 * Create a new option for a product
 */
const POST = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const productId = url.pathname.split("/")[4]; // /api/admin/products/{id}/options

    if (!productId) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: CreateOptionRequest = await request.json();

    if (!body.name || !body.price_amount) {
      return json({ error: "Missing required fields: name, price_amount" }, { status: 400 });
    }

    // Verify product exists
    const productRes = await getProductWithOptions(productId);
    if (!productRes.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Generate SKU
    const sku = `FL-OPT-${productId.slice(0, 8)}-${Date.now()}`;

    // Create option in Supabase (Supabase-only)
    const optionRes = await createProductOption({
      product_id: productId,
      name: body.name,
      price_amount: body.price_amount,
      discount_percent: body.discount_percent ?? 0,
      stock_quantity: body.stock_quantity ?? null,
      sku,
      active: true,
    });

    if (!optionRes.success) {
      return json({ error: optionRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.option.create",
      resource: "product_options",
      recordId: optionRes.data.id,
      metadata: {
        product_id: productId,
        name: body.name,
        price: body.price_amount,
      },
    });

    return json({ success: true, option: optionRes.data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/options POST error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * PUT /api/admin/products/{id}/options/{optionId}
 * Update a product option
 */
const PUT = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[4];
    const optionId = pathParts[6]; // /api/admin/products/{id}/options/{optionId}

    if (!productId || !optionId) {
      return json({ error: "Missing product ID or option ID" }, { status: 400 });
    }

    const body: UpdateOptionRequest = await request.json();

    // Verify option exists and belongs to product
    const optionRes = await getProductOption(optionId);
    if (!optionRes.success || optionRes.data.product_id !== productId) {
      return json({ error: "Option not found" }, { status: 404 });
    }

    // Update in Supabase (no GHL sync)
    const updateRes = await updateProductOption(optionId, body);

    if (!updateRes.success) {
      return json({ error: updateRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.option.update",
      resource: "product_options",
      recordId: optionId,
      metadata: {
        product_id: productId,
        fields: Object.keys(body),
      },
    });

    return json({ success: true, option: updateRes.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/options/{optionId} PUT error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/products/{id}/options/{optionId}
 * Delete a product option
 */
const DELETE = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[4];
    const optionId = pathParts[6];

    if (!productId || !optionId) {
      return json({ error: "Missing product ID or option ID" }, { status: 400 });
    }

    // Verify option exists and belongs to product
    const optionRes = await getProductOption(optionId);
    if (!optionRes.success || optionRes.data.product_id !== productId) {
      return json({ error: "Option not found" }, { status: 404 });
    }

    // Soft delete
    const deleteRes = await deleteProductOption(optionId);

    if (!deleteRes.success) {
      return json({ error: deleteRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.option.delete",
      resource: "product_options",
      recordId: optionId,
      metadata: { product_id: productId },
    });

    return json({ success: true, message: "Option deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/options/{optionId} DELETE error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/products/$id/options")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
