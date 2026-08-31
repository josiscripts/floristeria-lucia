/**
 * Product Metadata Synchronization
 * Handles GHL ↔ Supabase sync for product_metadata table
 * Server-side only, never expose to client
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { GHLProduct } from "./ghl/types";
import type { Tables } from "@/integrations/supabase/types";

export interface ProductMetadataInput {
  ghl_product_id: string;
  legacy_catalog_id?: string | null;
  // Core metadata that GHL doesn't persist
  category?: string | null;
  price?: number | null;
  sku?: string | null;
  // Extended metadata
  price_max?: number | null;
  available_colors?: string[] | null;
  badge_label?: string | null;
  rose_step?: number | null;
  requires_quote?: boolean;
  status?: string;
}

/**
 * Create or update product_metadata record
 * Idempotent: uses ghl_product_id as unique constraint
 */
export async function syncProductMetadata(
  input: ProductMetadataInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Check if record exists
    const { data: existing, error: queryError } = await supabaseAdmin
      .from("product_metadata")
      .select("id")
      .eq("ghl_product_id", input.ghl_product_id)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 = not found, which is ok
      throw queryError;
    }

    if (existing) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from("product_metadata")
        .update({
          category: input.category ?? null,
          price_min: input.price ?? null,
          sku: input.sku ?? null,
          legacy_catalog_id: input.legacy_catalog_id,
          price_max: input.price_max,
          available_colors: input.available_colors,
          badge_label: input.badge_label,
          rose_step: input.rose_step,
          requires_quote: input.requires_quote,
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("ghl_product_id", input.ghl_product_id);

      if (updateError) throw updateError;

      console.log(`[ProductMetadata] Updated metadata for ${input.ghl_product_id}`);
      return { success: true, id: existing.id };
    } else {
      // Create new
      const { data: newRecord, error: insertError } = await supabaseAdmin
        .from("product_metadata")
        .insert({
          ghl_product_id: input.ghl_product_id,
          category: input.category ?? null,
          price_min: input.price ?? null,
          sku: input.sku ?? null,
          legacy_catalog_id: input.legacy_catalog_id,
          price_max: input.price_max,
          available_colors: input.available_colors,
          badge_label: input.badge_label,
          rose_step: input.rose_step,
          requires_quote: input.requires_quote,
          status: input.status,
          auto_created: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      console.log(`[ProductMetadata] Created metadata for ${input.ghl_product_id}`);
      return { success: true, id: newRecord?.id };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ProductMetadata] Sync failed for ${input.ghl_product_id}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Soft delete product_metadata via deleted_at
 */
export async function deleteProductMetadata(
  ghlProductId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from("product_metadata")
      .update({
        deleted_at: new Date().toISOString(),
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("ghl_product_id", ghlProductId);

    if (error) throw error;

    console.log(`[ProductMetadata] Soft deleted ${ghlProductId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ProductMetadata] Delete failed for ${ghlProductId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Get product_metadata by GHL product ID
 */
export async function getProductMetadata(ghlProductId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .eq("ghl_product_id", ghlProductId)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ProductMetadata] Fetch failed for ${ghlProductId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Get multiple product_metadata records by GHL product IDs
 * Returns a map for efficient lookup during normalization
 */
export async function getProductMetadataByIds(
  ghlProductIds: string[],
): Promise<Map<string, Tables<"product_metadata">>> {
  try {
    if (ghlProductIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .in("ghl_product_id", ghlProductIds)
      .is("deleted_at", null);

    if (error) {
      throw error;
    }

    const metadataMap = new Map();
    if (data && Array.isArray(data)) {
      data.forEach((record) => {
        metadataMap.set(record.ghl_product_id, {
          price_max: record.price_max,
          available_colors: record.available_colors,
          badge_label: record.badge_label,
          rose_step: record.rose_step,
          requires_quote: record.requires_quote,
        });
      });
    }

    return metadataMap;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ProductMetadata] Fetch multiple failed:`, message);
    return new Map(); // Return empty map on error instead of failing
  }
}

/**
 * Get full product_metadata rows (including deleted/status/audit fields) by GHL product IDs.
 * Unlike getProductMetadataByIds, this includes soft-deleted records and every column,
 * since admin views need to show full state rather than just the customer-facing subset.
 */
export async function getFullProductMetadataByIds(
  ghlProductIds: string[],
): Promise<Map<string, Tables<"product_metadata">>> {
  try {
    if (ghlProductIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .in("ghl_product_id", ghlProductIds);

    if (error) {
      throw error;
    }

    const metadataMap = new Map<string, Tables<"product_metadata">>();
    for (const record of data || []) {
      metadataMap.set(record.ghl_product_id, record);
    }

    return metadataMap;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ProductMetadata] Fetch full multiple failed:`, message);
    return new Map();
  }
}
