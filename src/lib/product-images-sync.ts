import { createProductImage, updateProductImage, deleteProductImage } from "./admin/api";

interface ImageRecord {
  id: string;
  image_url: string | null;
  is_primary: boolean;
  sort_order?: number;
}

export async function syncProductImages(
  productId: string,
  originalImages: ImageRecord[],
  updatedImages: ImageRecord[],
) {
  const newImages = updatedImages.filter((img) => img.id.startsWith("temp-"));
  const existingUpdated = updatedImages.filter((img) => !img.id.startsWith("temp-"));
  const deletedIds = originalImages
    .filter((img) => !existingUpdated.find((u) => u.id === img.id))
    .map((img) => img.id);

  const results: { created: any[]; updated: any[]; deleted: any[] } = {
    created: [],
    updated: [],
    deleted: [],
  };

  // Create new images
  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i];
    if (img.image_url) {
      try {
        const res = await createProductImage(productId, img.image_url, img.is_primary);
        results.created.push(res);
      } catch (err) {
        console.error("Error creating image:", err);
      }
    }
  }

  // Update existing images (primary status, sort order)
  for (const img of existingUpdated) {
    const original = originalImages.find((o) => o.id === img.id);
    if (
      original &&
      (original.is_primary !== img.is_primary || original.sort_order !== img.sort_order)
    ) {
      try {
        const res = await updateProductImage(productId, img.id, {
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        });
        results.updated.push(res);
      } catch (err) {
        console.error("Error updating image:", err);
      }
    }
  }

  // Delete removed images
  for (const id of deletedIds) {
    try {
      const res = await deleteProductImage(productId, id);
      results.deleted.push(res);
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  }

  return results;
}
