/**
 * Admin API endpoints for product images management (Supabase-only)
 * POST /api/admin/products/{id}/images - Create/add image
 * PUT /api/admin/products/{id}/images/{imageId} - Update image
 * DELETE /api/admin/products/{id}/images/{imageId} - Delete image
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import {
  createProductImage,
  updateProductImage,
  deleteProductImage,
  listProductImages,
  getProductWithOptions,
} from "@/lib/products.server";

interface CreateImageRequest {
  image_url: string;
  is_primary?: boolean;
  sort_order?: number;
  alt_text?: string | null;
  color_variant_id?: string | null;
}

interface UpdateImageRequest {
  image_url?: string;
  is_primary?: boolean;
  sort_order?: number;
  alt_text?: string | null;
  color_variant_id?: string | null;
}

/**
 * POST /api/admin/products/{id}/images
 * Add a new image to a product
 */
const POST = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const productId = url.pathname.split("/")[4]; // /api/admin/products/{id}/images

    if (!productId) {
      return json({ error: "Missing product ID" }, { status: 400 });
    }

    const body: CreateImageRequest = await request.json();

    if (!body.image_url?.trim()) {
      return json({ error: "Image URL is required" }, { status: 400 });
    }

    // Verify product exists
    const productRes = await getProductWithOptions(productId);
    if (!productRes.success) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    // Check max images limit (10)
    const images = productRes.data?.product_images || [];
    if (images.length >= 10) {
      return json({ error: "Maximum 10 images per product" }, { status: 400 });
    }

    // If marking as primary, unmark others
    if (body.is_primary) {
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);
    }

    // Create image
    const imageRes = await createProductImage({
      product_id: productId,
      image_url: body.image_url.trim(),
      is_primary: body.is_primary ?? (images.length === 0), // First image is primary by default
      sort_order: body.sort_order ?? images.length,
      alt_text: body.alt_text || null,
      color_variant_id: body.color_variant_id || null,
    });

    if (!imageRes.success) {
      return json({ error: imageRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.image.create",
      resource: "product_images",
      recordId: imageRes.data?.id || "",
      metadata: {
        product_id: productId,
        image_url: body.image_url,
        is_primary: body.is_primary,
      },
    });

    return json({ success: true, image: imageRes.data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/images POST error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * PUT /api/admin/products/{id}/images/{imageId}
 * Update an image (mark primary, reorder, change URL, alt text)
 */
const PUT = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[4];
    const imageId = pathParts[6]; // /api/admin/products/{id}/images/{imageId}

    if (!productId || !imageId) {
      return json({ error: "Missing product ID or image ID" }, { status: 400 });
    }

    const body: UpdateImageRequest = await request.json();

    // Verify image exists and belongs to product
    const { data: image, error: imageError } = await supabaseAdmin
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .eq("product_id", productId)
      .single();

    if (imageError || !image) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    // If marking as primary, unmark others
    if (body.is_primary === true && !image.is_primary) {
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .neq("id", imageId);
    }

    // Update image
    const updateRes = await updateProductImage(imageId, body);

    if (!updateRes.success) {
      return json({ error: updateRes.error }, { status: 500 });
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.image.update",
      resource: "product_images",
      recordId: imageId,
      metadata: {
        product_id: productId,
        fields: Object.keys(body),
      },
    });

    return json({ success: true, image: updateRes.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/images/{imageId} PUT error:", message);
    return json({ error: message }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/products/{id}/images/{imageId}
 * Delete an image from a product
 */
const DELETE = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[4];
    const imageId = pathParts[6];

    if (!productId || !imageId) {
      return json({ error: "Missing product ID or image ID" }, { status: 400 });
    }

    // Verify image exists and belongs to product
    const { data: image, error: imageError } = await supabaseAdmin
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .eq("product_id", productId)
      .single();

    if (imageError || !image) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    // Delete image
    const deleteRes = await deleteProductImage(imageId);

    if (!deleteRes.success) {
      return json({ error: deleteRes.error }, { status: 500 });
    }

    // If was primary, mark the first remaining image as primary
    if (image.is_primary) {
      const { data: images } = await supabaseAdmin
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (images && images.length > 0) {
        await supabaseAdmin
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", images[0].id);
      }
    }

    // Log action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.image.delete",
      resource: "product_images",
      recordId: imageId,
      metadata: { product_id: productId, was_primary: image.is_primary },
    });

    return json({ success: true, message: "Image deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/products/{id}/images/{imageId} DELETE error:", message);
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/products/$id/images")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
