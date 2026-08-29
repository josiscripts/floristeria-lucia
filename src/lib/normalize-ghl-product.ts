/**
 * Normalize GHL Product + Supabase metadata into Frontend Product type
 * Server-side only - no tokens exposed
 */

import type { Product, CategoryId } from "@/data/catalog";
import type { GHLProduct } from "./ghl/types";

interface ProductMetadata {
  price_max?: number | null;
  available_colors?: string[] | null;
  badge_label?: string | null;
  rose_step?: number | null;
  requires_quote?: boolean | null;
}

/**
 * Map GHL category string to Frontend CategoryId
 */
function normalizeCategory(ghlCategory?: string): CategoryId | undefined {
  if (!ghlCategory) return undefined;

  const normalized = ghlCategory.toLowerCase().trim();

  // Direct matches
  const categoryMap: Record<string, CategoryId> = {
    ramos: "ramos",
    "ramos y arreglos florales": "ramos",
    plantas: "plantas",
    "plantas y composiciones": "plantas",
    "rosas-eternas": "rosas-eternas",
    "rosas eternas": "rosas-eternas",
    complementos: "complementos",
    condolencias: "condolencias",
  };

  return categoryMap[normalized];
}

/**
 * Normalize GHL Product + metadata into Frontend Product
 * Handles missing fields gracefully
 */
export function normalizeGHLProduct(
  ghlProduct: GHLProduct,
  metadata?: ProductMetadata | null,
): Product | null {
  // Validate required fields
  if (!ghlProduct.id || !ghlProduct.name || !ghlProduct.description) {
    console.warn("[Normalize] Missing required fields in GHL product", ghlProduct.id);
    return null;
  }

  // Try to map category, fallback if unable
  const category = normalizeCategory(ghlProduct.category);
  if (!category) {
    console.warn(
      "[Normalize] Unable to map category for product",
      ghlProduct.id,
      ghlProduct.category,
    );
    return null;
  }

  // Use GHL price as priceMin (required)
  const priceMin = ghlProduct.price ?? 0;

  // Image: use first from images array or direct image
  const image = ghlProduct.images?.[0] || ghlProduct.image || "/assets/placeholder.jpg";

  // Build normalized product
  const product: Product = {
    id: ghlProduct.id,
    name: ghlProduct.name,
    category,
    priceMin,
    image,
    description: ghlProduct.description,
  };

  // Add optional fields from metadata
  if (metadata?.price_max) {
    product.priceMax = metadata.price_max;
  }

  if (metadata?.badge_label) {
    product.badge = metadata.badge_label;
  }

  if (metadata?.requires_quote) {
    product.quoteOnly = metadata.requires_quote;
  }

  if (metadata?.rose_step) {
    product.roseStep = metadata.rose_step;
  }

  if (metadata?.available_colors && Array.isArray(metadata.available_colors)) {
    product.colors = metadata.available_colors;
  }

  return product;
}

/**
 * Normalize array of GHL Products with metadata
 */
export async function normalizeGHLProducts(
  ghlProducts: GHLProduct[],
  metadataLookup?: (ghlProductId: string) => Promise<ProductMetadata | null>,
): Promise<Product[]> {
  const normalized: Product[] = [];

  for (const ghlProduct of ghlProducts) {
    try {
      // Get metadata if lookup function provided
      let metadata: ProductMetadata | null = null;
      if (metadataLookup) {
        metadata = await metadataLookup(ghlProduct.id);
      }

      const product = normalizeGHLProduct(ghlProduct, metadata);
      if (product) {
        normalized.push(product);
      }
    } catch (error) {
      console.error(
        "[Normalize] Error normalizing product",
        ghlProduct.id,
        error instanceof Error ? error.message : String(error),
      );
      // Continue with next product
    }
  }

  return normalized;
}
