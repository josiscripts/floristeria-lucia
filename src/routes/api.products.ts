/**
 * API endpoint for product operations
 * POST /api/products - Create a new product
 */

import { json } from "@tanstack/react-start";
import { createGHLProduct } from "@/lib/ghl/client.server";
import { syncProductMetadata } from "@/lib/product-metadata.server";

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
