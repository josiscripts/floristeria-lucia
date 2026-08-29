/**
 * API endpoint for product operations by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete (deactivate) product
 */

import { json } from "@tanstack/react-start";
import { updateGHLProduct, deleteGHLProduct } from "@/lib/ghl/client.server";
import { syncProductMetadata, deleteProductMetadata } from "@/lib/product-metadata.server";

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

export async function PUT(request: Request) {
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

    // Update in GHL
    const ghlResult = await updateGHLProduct(id, updatePayload);

    if ("code" in ghlResult && "statusCode" in ghlResult) {
      return json(
        { error: ghlResult.message, code: ghlResult.code },
        { status: ghlResult.statusCode || 500 },
      );
    }

    // Update metadata in Supabase
    const metadataResult = await syncProductMetadata({
      ghl_product_id: id,
      price_max: body.price_max,
      available_colors: body.available_colors,
      badge_label: body.badge_label,
      rose_step: body.rose_step,
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
}

export async function DELETE(request: Request) {
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
}
