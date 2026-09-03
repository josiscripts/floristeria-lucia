/**
 * Category to GHL Collection Mapping
 * Handles mapping between Supabase product categories and GHL collectionIds
 * Server-side only, never expose to client
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables } from "@/integrations/supabase/types";
import type { CategoryId } from "@/data/catalog";

export interface CategoryCollectionMapping {
  id: string;
  category: CategoryId;
  ghl_collection_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get GHL collectionId for a specific category
 */
export async function getGHLCollectionIdForCategory(
  category: CategoryId,
): Promise<{ success: boolean; collectionId?: string | null; error?: string }> {
  try {
    const { data, error } = await (supabaseAdmin
      .from("category_to_ghl_collection" as any)
      .select("ghl_collection_id")
      .eq("category", category)
      .single() as any);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      throw error;
    }

    if (!data) {
      return { success: false, error: `Category not found: ${category}` };
    }

    return { success: true, collectionId: data.ghl_collection_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CategoryCollection] Fetch failed for ${category}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Get all category to collection mappings
 */
export async function getCategoryCollectionMapping(): Promise<{
  success: boolean;
  mappings?: CategoryCollectionMapping[];
  error?: string;
}> {
  try {
    const { data, error } = await (supabaseAdmin
      .from("category_to_ghl_collection" as any)
      .select("*")
      .order("category") as any);

    if (error) {
      throw error;
    }

    return {
      success: true,
      mappings: data as CategoryCollectionMapping[],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CategoryCollection] Fetch all failed:`, message);
    return { success: false, error: message };
  }
}

/**
 * Set GHL collectionId for a category
 * Validates that collectionId is not empty
 */
export async function setGHLCollectionIdForCategory(
  category: CategoryId,
  ghlCollectionId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate
    if (ghlCollectionId !== null && typeof ghlCollectionId !== "string") {
      return { success: false, error: "ghlCollectionId must be a string or null" };
    }

    if (typeof ghlCollectionId === "string" && ghlCollectionId.trim().length === 0) {
      return { success: false, error: "ghlCollectionId cannot be empty string" };
    }

    const { error } = await (supabaseAdmin
      .from("category_to_ghl_collection" as any)
      .update({
        ghl_collection_id: ghlCollectionId,
        updated_at: new Date().toISOString(),
      })
      .eq("category", category) as any);

    if (error) {
      throw error;
    }

    console.log(
      `[CategoryCollection] Updated mapping for ${category}: ${ghlCollectionId || "NULL"}`,
    );
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CategoryCollection] Update failed for ${category}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Check if a category has a valid collectionId mapping
 */
export async function isCategoryMapped(
  category: CategoryId,
): Promise<{ success: boolean; isMapped?: boolean; error?: string }> {
  try {
    const result = await getGHLCollectionIdForCategory(category);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, isMapped: result.collectionId !== null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CategoryCollection] Check failed for ${category}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Get all unmapped categories
 */
export async function getUnmappedCategories(): Promise<{
  success: boolean;
  categories?: CategoryId[];
  error?: string;
}> {
  try {
    const { data, error } = await (supabaseAdmin
      .from("category_to_ghl_collection" as any)
      .select("category")
      .is("ghl_collection_id", null)
      .order("category") as any);

    if (error) {
      throw error;
    }

    const categories = (data || []).map((row: any) => row.category as CategoryId);
    return { success: true, categories };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CategoryCollection] Get unmapped failed:`, message);
    return { success: false, error: message };
  }
}
