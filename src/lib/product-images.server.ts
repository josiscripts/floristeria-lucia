/**
 * Product Images Management
 * Handles retrieval and basic operations on product images
 * Images are stored in Supabase Storage, metadata in product_images table
 */

import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { Database } from '@/integrations/supabase/types';

type ProductImage = Database['public']['Tables']['product_images']['Row'];
type ProductImageInsert = Database['public']['Tables']['product_images']['Insert'];
type ProductImageUpdate = Database['public']['Tables']['product_images']['Update'];

/**
 * Get all images for a product, ordered by sort_order
 */
export async function getProductImages(ghlProductId: string): Promise<ProductImage[]> {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('*')
    .eq('ghl_product_id', ghlProductId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`[ProductImages] Error fetching images for ${ghlProductId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get the primary (main) image for a product
 */
export async function getPrimaryProductImage(ghlProductId: string): Promise<ProductImage | null> {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('*')
    .eq('ghl_product_id', ghlProductId)
    .eq('is_primary', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected
    console.error(`[ProductImages] Error fetching primary image for ${ghlProductId}:`, error);
  }

  return data || null;
}

/**
 * Create a new product image record after upload to Storage
 */
export async function createProductImage(
  input: ProductImageInsert & { ghl_product_id: string; storage_path: string }
): Promise<ProductImage | null> {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .insert([
      {
        ...input,
        sort_order: input.sort_order ?? 0,
        is_primary: input.is_primary ?? false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(`[ProductImages] Error creating image for ${input.ghl_product_id}:`, error);
    return null;
  }

  return data;
}

/**
 * Delete a product image
 */
export async function deleteProductImage(imageId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    console.error(`[ProductImages] Error deleting image ${imageId}:`, error);
    return false;
  }

  return true;
}

/**
 * Set a specific image as the primary image for a product
 * Automatically unsets any other primary images for that product
 */
export async function setPrimaryProductImage(
  imageId: string,
  ghlProductId: string
): Promise<boolean> {
  // Step 1: Unset all other primary images for this product
  const { error: unsetError } = await supabaseAdmin
    .from('product_images')
    .update({ is_primary: false })
    .eq('ghl_product_id', ghlProductId)
    .neq('id', imageId);

  if (unsetError) {
    console.error(`[ProductImages] Error unsetting primary images:`, unsetError);
    return false;
  }

  // Step 2: Set the specified image as primary
  const { error: setError } = await supabaseAdmin
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (setError) {
    console.error(`[ProductImages] Error setting primary image:`, setError);
    return false;
  }

  return true;
}

/**
 * Reorder product images by sort_order
 * Input: array of {id, sort_order}
 */
export async function reorderProductImages(
  items: Array<{ id: string; sort_order: number }>
): Promise<boolean> {
  // Update each item's sort_order
  for (const item of items) {
    const { error } = await supabaseAdmin
      .from('product_images')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);

    if (error) {
      console.error(`[ProductImages] Error reordering image ${item.id}:`, error);
      return false;
    }
  }

  return true;
}

/**
 * Get the next sort_order for a new image in a product
 */
export async function getNextSortOrder(ghlProductId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('sort_order')
    .eq('ghl_product_id', ghlProductId)
    .order('sort_order', { ascending: false })
    .limit(1);

  if (error) {
    console.error(`[ProductImages] Error getting next sort order:`, error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return (data[0].sort_order || 0) + 1;
}

/**
 * Delete all images for a product (cascade delete)
 * Use with caution - typically called when a product is being removed
 */
export async function deleteAllProductImages(ghlProductId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('ghl_product_id', ghlProductId);

  if (error) {
    console.error(`[ProductImages] Error deleting all images for ${ghlProductId}:`, error);
    return false;
  }

  return true;
}

/**
 * Get count of images for a product
 */
export async function getProductImageCount(ghlProductId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('ghl_product_id', ghlProductId);

  if (error) {
    console.error(`[ProductImages] Error counting images:`, error);
    return 0;
  }

  return count || 0;
}
