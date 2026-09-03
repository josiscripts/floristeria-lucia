/**
 * FASE 3A: Populate product_metadata for all 68 GHL products
 * Matches with catalog.ts and generates SKUs
 * Server-side only - never expose to client
 */

import { getGHLProducts } from "@/lib/ghl/client.server";
import { syncProductMetadata } from "@/lib/product-metadata.server";
import { products as catalogProducts } from "@/data/catalog";
import type { CategoryId } from "@/data/catalog";

interface MatchResult {
  type: "matched" | "orphan" | "corrupt";
  ghlId: string;
  ghlName: string;
  catalogId?: string;
  catalogName?: string;
  category?: CategoryId | null;
  price?: number | null;
  sku?: string;
  reason?: string;
}

/**
 * Normalize string for comparison: lowercase, trim, remove accents
 */
function normalizeString(str: string): string {
  if (!str) return "";
  return str.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Match GHL product with catalog.ts entry
 */
function matchWithCatalog(
  ghlProduct: any,
  catalogProducts: any[],
): { catalogProduct?: any; confidence: "exact" | "high" | "low" | "none" } {
  const ghlName = ghlProduct.name || "";

  // Exact match by name
  const exactMatch = catalogProducts.find(
    (p) => normalizeString(p.name) === normalizeString(ghlName),
  );
  if (exactMatch) return { catalogProduct: exactMatch, confidence: "exact" };

  // High confidence: name contains catalog name
  const highMatch = catalogProducts.find((p) => {
    const catNorm = normalizeString(p.name);
    const ghlNorm = normalizeString(ghlName);
    return ghlNorm.includes(catNorm) || catNorm.includes(ghlNorm);
  });
  if (highMatch) return { catalogProduct: highMatch, confidence: "high" };

  // Low confidence: first word matches
  const firstWordMatch = catalogProducts.find((p) => {
    const ghlFirst = normalizeString(ghlName).split(" ")[0];
    const catFirst = normalizeString(p.name).split(" ")[0];
    return ghlFirst === catFirst && ghlFirst.length > 3;
  });
  if (firstWordMatch) return { catalogProduct: firstWordMatch, confidence: "low" };

  return { confidence: "none" };
}

/**
 * Generate SKU for a product
 * Format: FL-{CAT}-{NUM}
 * Example: FL-RAM-0001
 */
function generateSKU(category: CategoryId | null | undefined, index: number): string {
  if (!category) {
    return "FL-XXX-0000";
  }

  const categoryMap: Record<CategoryId, string> = {
    ramos: "RAM",
    plantas: "PLA",
    "rosas-eternas": "ROS",
    complementos: "COM",
    condolencias: "CON",
  };

  const catCode = categoryMap[category] || "XXX";
  const num = String(index + 1).padStart(4, "0");
  return `FL-${catCode}-${num}`;
}

/**
 * Main population function
 */
export async function populateProductMetadataFromCatalog(): Promise<{
  total: number;
  matched: MatchResult[];
  orphans: MatchResult[];
  corrupt: MatchResult[];
  skuDuplicates: string[];
  summary: {
    totalGHL: number;
    totalMatched: number;
    totalOrphans: number;
    totalCorrupt: number;
    totalWithCategory: number;
    totalWithPrice: number;
    totalWithSKU: number;
  };
}> {
  console.log("[PopulateMetadata] Starting population process...\n");

  // Step 1: Get all GHL products
  const result = await getGHLProducts(undefined, { limit: 500 });
  if (!("products" in result)) {
    throw new Error("Failed to fetch GHL products");
  }

  const ghlProducts = result.products || [];
  console.log(`[PopulateMetadata] Found ${ghlProducts.length} products in GHL`);

  // Step 2: Validate GHL products (check for corrupt IDs)
  const corrupt: MatchResult[] = [];
  const validGHLProducts = ghlProducts.filter((p) => {
    if (!p.id || p.id === "undefined" || p.id === "") {
      corrupt.push({
        type: "corrupt",
        ghlId: p._id || "unknown",
        ghlName: p.name || "unknown",
        reason: "Missing or invalid id",
      });
      return false;
    }
    return true;
  });

  console.log(`[PopulateMetadata] Valid products: ${validGHLProducts.length}`);
  if (corrupt.length > 0) {
    console.log(`[PopulateMetadata] Corrupt products: ${corrupt.length}`);
  }

  // Step 3: Match products and generate metadata
  const matched: MatchResult[] = [];
  const orphans: MatchResult[] = [];
  const skuMap = new Map<string, number>();
  let skuIndex = 1;

  for (const ghlProd of validGHLProducts) {
    const match = matchWithCatalog(ghlProd, catalogProducts);

    if (match.confidence !== "none" && match.catalogProduct) {
      // Matched product
      const catalogProd = match.catalogProduct;
      const sku = generateSKU(catalogProd.category as CategoryId, skuIndex++);

      matched.push({
        type: "matched",
        ghlId: ghlProd.id,
        ghlName: ghlProd.name,
        catalogId: catalogProd.id,
        catalogName: catalogProd.name,
        category: catalogProd.category as CategoryId,
        price: catalogProd.priceMin,
        sku,
      });

      skuMap.set(sku, (skuMap.get(sku) || 0) + 1);

      console.log(`  ✓ Matched: "${ghlProd.name}" → ${catalogProd.category}`);
    } else {
      // Orphan product
      orphans.push({
        type: "orphan",
        ghlId: ghlProd.id,
        ghlName: ghlProd.name,
        category: null,
        price: null,
        reason: "No match in catalog.ts",
      });

      console.log(`  ⚠ Orphan: "${ghlProd.name}" (no match)`);
    }
  }

  // Step 4: Check for SKU duplicates
  const skuDuplicates = Array.from(skuMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([sku]) => sku);

  console.log(`\n[PopulateMetadata] Summary:`);
  console.log(`  Matched: ${matched.length}`);
  console.log(`  Orphans: ${orphans.length}`);
  console.log(`  Corrupt: ${corrupt.length}`);
  console.log(`  SKU Duplicates: ${skuDuplicates.length}`);

  // Step 5: Persist to Supabase
  console.log(`\n[PopulateMetadata] Syncing to Supabase...`);

  const syncResults = await Promise.allSettled([
    // Matched products
    ...matched.map((m) =>
      syncProductMetadata({
        ghl_product_id: m.ghlId,
        category: m.category,
        price: m.price,
        sku: m.sku,
        legacy_catalog_id: m.catalogId,
        status: "active",
      }),
    ),
    // Orphan products (no category/price/sku)
    ...orphans.map((o) =>
      syncProductMetadata({
        ghl_product_id: o.ghlId,
        category: null,
        price: null,
        sku: null,
        status: "needs_review",
      }),
    ),
  ]);

  const syncSuccesses = syncResults.filter((r) => r.status === "fulfilled").length;
  const syncFailures = syncResults.filter((r) => r.status === "rejected").length;

  console.log(`[PopulateMetadata] Synced: ${syncSuccesses} success, ${syncFailures} failures`);

  return {
    total: ghlProducts.length,
    matched,
    orphans,
    corrupt,
    skuDuplicates,
    summary: {
      totalGHL: ghlProducts.length,
      totalMatched: matched.length,
      totalOrphans: orphans.length,
      totalCorrupt: corrupt.length,
      totalWithCategory: matched.length,
      totalWithPrice: matched.length,
      totalWithSKU: matched.length,
    },
  };
}

/**
 * Get current statistics
 */
export async function getPopulationStats() {
  const result = await getGHLProducts(undefined, { limit: 500 });
  if (!("products" in result)) {
    return { error: "Failed to fetch products" };
  }

  const ghlProducts = result.products || [];

  return {
    totalGHL: ghlProducts.length,
    validIds: ghlProducts.filter((p) => p.id && p.id !== "undefined").length,
    missingIds: ghlProducts.filter((p) => !p.id || p.id === "undefined" || p.id === "").length,
  };
}
