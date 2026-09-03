/**
 * SKU Generator for Floristería Lucía
 * Generates unique product SKUs based on category
 * Server-side only
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CategoryId } from "@/data/catalog";

/**
 * Category to SKU prefix mapping
 * Format: FL-PREFIX-NNNN
 * Examples: FL-RAM-0001, FL-PLN-0002, FL-ROS-0003
 *
 * Prefixes:
 * - ramos (bouquets) → RAM
 * - plantas (plants) → PLN
 * - complementos (accessories) → COM
 * - condolencias (condolences) → CON
 * - rosas-eternas (preserved roses) → ROS
 */
const CATEGORY_PREFIXES: Record<CategoryId | string, string> = {
  ramos: "RAM",
  plantas: "PLN",
  complementos: "COM",
  condolencias: "CON",
  "rosas-eternas": "ROS",
};

/**
 * Generate a unique SKU for a product based on category
 *
 * Strategy:
 * 1. Query existing SKUs with same prefix
 * 2. Find highest sequence number
 * 3. Increment by 1
 * 4. Format as FL-PREFIX-NNNN
 *
 * This ensures:
 * - Deterministic generation
 * - No collisions under normal conditions
 * - Safe for concurrent requests (Supabase UNIQUE constraint prevents duplicates)
 */
export async function generateSKU(
  category: CategoryId | string | null | undefined,
): Promise<{ success: boolean; sku?: string; error?: string }> {
  try {
    if (!category || typeof category !== "string") {
      return {
        success: false,
        error: `Invalid category: ${category}. Valid categories: ${Object.keys(CATEGORY_PREFIXES).join(", ")}`,
      };
    }

    const prefix: string | undefined = CATEGORY_PREFIXES[category];
    if (!prefix) {
      return {
        success: false,
        error: `Unknown category: ${category}. Valid categories: ${Object.keys(CATEGORY_PREFIXES).join(", ")}`,
      };
    }

    // Query all SKUs with this prefix to find the next sequence number
    const { data: existingSkus, error: queryError } = await supabaseAdmin
      .from("product_metadata")
      .select("sku")
      .like("sku", `FL-${prefix as string}-%`)
      .is("deleted_at", null);

    if (queryError && queryError.code !== "PGRST116") {
      throw queryError;
    }

    // Extract sequence numbers from existing SKUs
    const sequenceNumbers: number[] = [];
    if (existingSkus && Array.isArray(existingSkus)) {
      for (const row of existingSkus) {
        if (row.sku) {
          // SKU format: FL-PREFIX-NNNN
          const match = row.sku.match(/^FL-\w+-(\d+)$/);
          if (match) {
            sequenceNumbers.push(parseInt(match[1], 10));
          }
        }
      }
    }

    // Find next sequence number
    // Safe approach: use max + 1
    // If no SKUs exist, start at 1
    const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    const nextSequence = maxSequence + 1;

    // Format as FL-PREFIX-NNNN (5 digits with leading zeros)
    const sku = `FL-${prefix}-${String(nextSequence).padStart(4, "0")}`;

    console.log(`[SKUGenerator] Generated SKU for category ${category}: ${sku}`);
    return { success: true, sku };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SKUGenerator] Generation failed for category ${category}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Get the prefix for a category
 */
export function getCategoryPrefix(category: CategoryId | string | null | undefined): string | null {
  if (!category) return null;
  return CATEGORY_PREFIXES[category] || null;
}

/**
 * Validate if a SKU follows the expected format
 */
export function isValidSKU(sku: string | null | undefined): boolean {
  if (!sku || typeof sku !== "string") return false;
  // Format: FL-PREFIX-NNNN where PREFIX is 3 letters and NNNN is 4 digits
  return /^FL-[A-Z]{3}-\d{4}$/.test(sku);
}

/**
 * Extract category from SKU (reverse lookup)
 * Returns the category if SKU matches the format for that category
 */
export function extractCategoryFromSKU(sku: string | null | undefined): CategoryId | null {
  if (!sku || !isValidSKU(sku)) return null;

  // Extract prefix from FL-PREFIX-NNNN
  const match = sku.match(/^FL-([A-Z]{3})-\d{4}$/);
  if (!match) return null;

  const prefix = match[1];

  // Find category by prefix
  for (const [category, categoryPrefix] of Object.entries(CATEGORY_PREFIXES)) {
    if (categoryPrefix === prefix) {
      return category as CategoryId;
    }
  }

  return null;
}
