/**
 * API endpoint for product operations by ID
 * GET /api/products/[id] - Fetch raw product (admin, no category normalization/drop)
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete (deactivate) product
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { getGHLProduct, updateGHLProduct, deleteGHLProduct } from "@/lib/ghl/client.server";
import {
  syncProductMetadata,
  deleteProductMetadata,
  getProductMetadata,
} from "@/lib/product-metadata.server";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import { syncPriceAmount, syncPriceSKU } from "@/lib/price-sync.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";
import type { CategoryId } from "@/data/catalog";

const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const locationId = url.searchParams.get("locationId") || process.env["GHL_LOCATION_ID"];
    const ghlResult = await getGHLProduct(id, locationId ?? undefined);

    if (!("id" in ghlResult)) {
      return json({ error: ghlResult.message, code: ghlResult.code }, { status: 404 });
    }

    const metadataResult = await getProductMetadata(id);

    return json(
      {
        product: ghlResult,
        metadata: metadataResult.success ? metadataResult.data : null,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/products/[id] GET error:", message);
    return json({ error: message, code: "API_ERROR" }, { status: 500 });
  }
});

interface UpdateProductRequest {
  name?: string;
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

const PUT = withAdminGuard(async (request, admin) => {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: UpdateProductRequest = await request.json();

    // Build update payload (only include provided fields)
    const updatePayload: Record<string, unknown> = {};
    if (body.name) updatePayload.name = body.name;
    if (body.description) updatePayload.description = body.description;
    if (body.price !== undefined) updatePayload.price = body.price;
    if (body.category) updatePayload.category = body.category;
    if (body.image) updatePayload.image = body.image;
    if (body.sku) updatePayload.sku = body.sku;

    // Obtener collectionId si cambia la categoría
    if (body.category) {
      const collectionResult = await getGHLCollectionIdForCategory(body.category as CategoryId);
      if (collectionResult.success && collectionResult.collectionId) {
        updatePayload.collectionIds = [collectionResult.collectionId];
      }
    }

    // Update in GHL
    const ghlResult = await updateGHLProduct(id, updatePayload);

    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    // Sync price and SKU to GHL if changed
    const locationId = url.searchParams.get("locationId") || process.env["GHL_LOCATION_ID"];
    const syncErrors: string[] = [];

    if (body.price !== undefined) {
      const priceSync = await syncPriceAmount(id, body.price, "EUR", locationId ?? undefined);
      if (!priceSync.success) {
        syncErrors.push(`Price sync failed: ${priceSync.error}`);
        console.warn(`[API] Price sync failed for ${id}: ${priceSync.error}`);
      }
    }

    if (body.sku !== undefined) {
      const skuSync = await syncPriceSKU(id, body.sku, locationId ?? undefined);
      if (!skuSync.success) {
        syncErrors.push(`SKU sync failed: ${skuSync.error}`);
        console.warn(`[API] SKU sync failed for ${id}: ${skuSync.error}`);
      }
    }

    // Update metadata in Supabase
    const metadataInput: Record<string, any> = {
      ghl_product_id: id,
    };

    if (body.price !== undefined) metadataInput.price = body.price;
    if (body.price_max !== undefined) metadataInput.price_max = body.price_max;
    if (body.sku !== undefined) metadataInput.sku = body.sku;
    if (body.category !== undefined) metadataInput.category = body.category;
    if (body.available_colors !== undefined) metadataInput.available_colors = body.available_colors;
    if (body.badge_label !== undefined) metadataInput.badge_label = body.badge_label;
    if (body.rose_step !== undefined) metadataInput.rose_step = body.rose_step;

    const metadataResult = await syncProductMetadata(metadataInput);

    await logAdminAction({
      userId: admin.user.id,
      action: "product.update",
      resource: "products",
      recordId: id,
      metadata: { fields: Object.keys(updatePayload) },
    });

    return json(
      {
        success: true,
        product: ghlResult,
        metadata: metadataResult,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/products/[id] PUT error:", message);
    return json({ error: message, code: "API_ERROR" }, { status: 500 });
  }
});

const DELETE = withAdminGuard(async (request, admin) => {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    // Soft delete in GHL (set status=inactive)
    const ghlResult = await deleteGHLProduct(id);

    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    // Soft delete in Supabase
    const metadataResult = await deleteProductMetadata(id);

    await logAdminAction({
      userId: admin.user.id,
      action: "product.deactivate",
      resource: "products",
      recordId: id,
    });

    return json(
      {
        success: true,
        product: ghlResult,
        metadata: metadataResult,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("[API] /api/products/[id] DELETE error:", message);
    return json({ error: message, code: "API_ERROR" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/products/$id")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
