/**
 * API Endpoint: Upload Product Image
 * POST: Upload an image file to Supabase Storage
 *
 * Validates:
 * - MIME type (JPEG, PNG, WebP only)
 * - File size (max 5MB)
 * - GHL Product ID exists
 *
 * Returns:
 * - storage_path: path in bucket
 * - image_url: public URL
 * - public_url: alias for image_url
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "product-images";

/**
 * Generate a safe storage path for the image
 * Format: {ghlProductId}/{sequence}.{ext}
 */
async function generateStoragePath(ghlProductId: string, mimeType: string): Promise<string> {
  // Get current count of images for this product
  const { count, error: countError } = await supabaseAdmin
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("ghl_product_id", ghlProductId);

  if (countError) {
    console.error("[Upload] Error counting images:", countError);
  }

  const sequence = String((count || 0) + 1).padStart(4, "0");

  // Get extension from MIME type
  const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";

  return `${ghlProductId}/${sequence}.${ext}`;
}

/**
 * Get public URL for a stored image
 */
function getPublicImageUrl(bucketName: string, storagePath: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;
}

/**
 * Handle POST request for image upload
 */
async function POST(req: Request) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const ghlProductId = formData.get("ghlProductId") as string;

    // Validate inputs
    if (!file) {
      return json({ error: "file is required" }, { status: 400 });
    }

    if (!ghlProductId) {
      return json({ error: "ghlProductId is required" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return json(
        { error: `Invalid file type. Allowed: JPEG, PNG, WebP. Got: ${file.type}` },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json(
        { error: `File too large. Max: 5MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 },
      );
    }

    // Check if product exists in GHL (optional but recommended)
    // For now, we'll just trust the ghlProductId exists in our product_metadata
    const { count } = await supabaseAdmin
      .from("product_metadata")
      .select("*", { count: "exact", head: true })
      .eq("ghl_product_id", ghlProductId);

    if (!count) {
      return json({ error: "Product not found. Invalid ghlProductId." }, { status: 404 });
    }

    // Generate storage path
    const storagePath = await generateStoragePath(ghlProductId, file.type);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite if exists
      });

    if (uploadError) {
      console.error("[Upload] Storage upload failed:", uploadError);
      return json({ error: "Failed to upload image to storage" }, { status: 500 });
    }

    if (!data) {
      return json({ error: "Upload returned no data" }, { status: 500 });
    }

    // Generate public URL
    const imageUrl = getPublicImageUrl(BUCKET_NAME, storagePath);

    return json(
      {
        success: true,
        storage_path: storagePath,
        image_url: imageUrl,
        public_url: imageUrl, // Alias
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Upload] Unhandled error:", error);
    return json({ error: "Failed to process upload request" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/upload/product-image")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
