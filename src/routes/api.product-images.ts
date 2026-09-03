/**
 * API Endpoint: Product Images Management
 * GET: Retrieve images for a product
 * POST: Create image record (after Storage upload)
 * PATCH: Update image (set primary, reorder)
 * DELETE: Delete image
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import {
  getProductImages,
  getPrimaryProductImage,
  createProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
} from "@/lib/product-images.server";

async function GET({ ghlProductId }: { ghlProductId: string }) {
  if (!ghlProductId) {
    return json({ error: "ghlProductId is required" }, { status: 400 });
  }

  try {
    const images = await getProductImages(ghlProductId);
    return json({ images, total: images.length });
  } catch (error) {
    console.error("[ProductImages API] GET error:", error);
    return json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

async function POST({
  ghlProductId,
  storage_path,
  image_url,
  alt_text,
}: {
  ghlProductId: string;
  storage_path: string;
  image_url?: string;
  alt_text?: string;
}) {
  if (!ghlProductId || !storage_path) {
    return json({ error: "ghlProductId and storage_path are required" }, { status: 400 });
  }

  try {
    // Check if this is the first image for the product
    const existing = await getProductImages(ghlProductId);
    const isFirst = existing.length === 0;

    const image = await createProductImage({
      ghl_product_id: ghlProductId,
      storage_path,
      image_url,
      alt_text,
      sort_order: existing.length,
      is_primary: isFirst, // First image is automatically primary
    });

    if (!image) {
      return json({ error: "Failed to create image record" }, { status: 500 });
    }

    return json({ image }, { status: 201 });
  } catch (error) {
    console.error("[ProductImages API] POST error:", error);
    return json({ error: "Failed to create image" }, { status: 500 });
  }
}

async function PATCH({
  action,
  imageId,
  ghlProductId,
  items,
}: {
  action: string;
  imageId?: string;
  ghlProductId?: string;
  items?: Array<{ id: string; sort_order: number }>;
}) {
  if (!action) {
    return json({ error: "action is required" }, { status: 400 });
  }

  try {
    if (action === "set-primary") {
      if (!imageId || !ghlProductId) {
        return json(
          { error: "imageId and ghlProductId are required for set-primary" },
          { status: 400 },
        );
      }

      const success = await setPrimaryProductImage(imageId, ghlProductId);
      if (!success) {
        return json({ error: "Failed to set primary image" }, { status: 500 });
      }

      const primary = await getPrimaryProductImage(ghlProductId);
      return json({ success: true, primary });
    }

    if (action === "reorder") {
      if (!items || items.length === 0) {
        return json({ error: "items are required for reorder" }, { status: 400 });
      }

      const success = await reorderProductImages(items);
      if (!success) {
        return json({ error: "Failed to reorder images" }, { status: 500 });
      }

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[ProductImages API] PATCH error:", error);
    return json({ error: "Failed to update images" }, { status: 500 });
  }
}

async function DELETE({ imageId }: { imageId: string }) {
  if (!imageId) {
    return json({ error: "imageId is required" }, { status: 400 });
  }

  try {
    const success = await deleteProductImage(imageId);
    if (!success) {
      return json({ error: "Failed to delete image" }, { status: 500 });
    }

    return json({ success: true, deletedId: imageId });
  } catch (error) {
    console.error("[ProductImages API] DELETE error:", error);
    return json({ error: "Failed to delete image" }, { status: 500 });
  }
}

// Parse query params and request body
async function handleRequest(req: Request) {
  const url = new URL(req.url);
  const ghlProductId = url.searchParams.get("ghlProductId");
  const imageId = url.searchParams.get("imageId");
  const action = url.searchParams.get("action");

  if (req.method === "GET") {
    return GET({ ghlProductId: ghlProductId || "" });
  }

  if (req.method === "POST") {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is ok for POST
    }

    return POST({
      ghlProductId: ghlProductId || body.ghlProductId || "",
      storage_path: body.storage_path || "",
      image_url: body.image_url,
      alt_text: body.alt_text,
    });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    return PATCH({
      action: action || body.action || "",
      imageId: imageId || body.imageId,
      ghlProductId: ghlProductId || body.ghlProductId,
      items: body.items,
    });
  }

  if (req.method === "DELETE") {
    return DELETE({ imageId: imageId || "" });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

export const Route = createFileRoute("/api/product-images")({
  server: {
    handlers: {
      GET: ({ request }) => handleRequest(request),
      POST: ({ request }) => handleRequest(request),
      PATCH: ({ request }) => handleRequest(request),
      DELETE: ({ request }) => handleRequest(request),
    },
  },
});
