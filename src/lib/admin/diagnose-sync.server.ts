/**
 * BLOQUE 4: Pre-sync diagnosis and verification
 * Analyzes current state of Supabase + GHL before catalog synchronization
 * Server-side only
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGHLProducts } from "@/lib/ghl/client.server";
import { products as catalogProducts } from "@/data/catalog";

export interface DiagnosticReport {
  timestamp: string;
  catalog: {
    total: number;
    byCategory: Record<string, number>;
  };
  supabase: {
    total_metadata_records: number;
    with_ghl_product_id: number;
    with_ghl_price_id: number;
    with_legacy_catalog_id: number;
    with_sku: number;
    duplicates: {
      by_ghl_product_id: Array<{ ghl_product_id: string; count: number }>;
      by_sku: Array<{ sku: string; count: number }>;
      by_legacy_catalog_id: Array<{ legacy_catalog_id: string; count: number }>;
    };
  };
  ghl: {
    total_products: number;
    total_active: number;
    total_inactive: number;
    error?: string;
  };
  sync_readiness: {
    can_proceed: boolean;
    issues: string[];
    warnings: string[];
  };
}

export async function diagnoseSyncState(): Promise<DiagnosticReport> {
  console.log("[DIAGNOSE] Starting pre-sync diagnosis...");

  // Step 1: Analyze catalog.ts
  const byCategory: Record<string, number> = {};
  for (const product of catalogProducts) {
    byCategory[product.category] = (byCategory[product.category] || 0) + 1;
  }

  console.log(`[DIAGNOSE] Catalog analysis: ${catalogProducts.length} products`);

  // Step 2: Analyze Supabase metadata
  const { data: allMetadata, error: metaError } = await supabaseAdmin
    .from("product_metadata")
    .select("*");

  const supabaseStats = {
    total_metadata_records: 0,
    with_ghl_product_id: 0,
    with_ghl_price_id: 0,
    with_legacy_catalog_id: 0,
    with_sku: 0,
    duplicates: {
      by_ghl_product_id: [] as Array<{ ghl_product_id: string; count: number }>,
      by_sku: [] as Array<{ sku: string; count: number }>,
      by_legacy_catalog_id: [] as Array<{ legacy_catalog_id: string; count: number }>,
    },
  };

  if (!metaError && allMetadata) {
    supabaseStats.total_metadata_records = allMetadata.length;

    // Count fields
    let withGhlId = 0;
    let withPriceId = 0;
    let withLegacyId = 0;
    let withSku = 0;

    const ghlIdMap = new Map<string, number>();
    const skuMap = new Map<string, number>();
    const legacyIdMap = new Map<string, number>();

    for (const meta of allMetadata) {
      if (meta.ghl_product_id) {
        withGhlId++;
        ghlIdMap.set(meta.ghl_product_id, (ghlIdMap.get(meta.ghl_product_id) || 0) + 1);
      }
      if (meta.ghl_price_id) {
        withPriceId++;
      }
      if (meta.legacy_catalog_id) {
        withLegacyId++;
        legacyIdMap.set(meta.legacy_catalog_id, (legacyIdMap.get(meta.legacy_catalog_id) || 0) + 1);
      }
      if (meta.sku) {
        withSku++;
        skuMap.set(meta.sku, (skuMap.get(meta.sku) || 0) + 1);
      }
    }

    supabaseStats.with_ghl_product_id = withGhlId;
    supabaseStats.with_ghl_price_id = withPriceId;
    supabaseStats.with_legacy_catalog_id = withLegacyId;
    supabaseStats.with_sku = withSku;

    // Find duplicates
    for (const [ghlId, count] of ghlIdMap.entries()) {
      if (count > 1) {
        supabaseStats.duplicates.by_ghl_product_id.push({ ghl_product_id: ghlId, count });
      }
    }
    for (const [sku, count] of skuMap.entries()) {
      if (count > 1) {
        supabaseStats.duplicates.by_sku.push({ sku, count });
      }
    }
    for (const [legacyId, count] of legacyIdMap.entries()) {
      if (count > 1) {
        supabaseStats.duplicates.by_legacy_catalog_id.push({
          legacy_catalog_id: legacyId,
          count,
        });
      }
    }
  }

  console.log(`[DIAGNOSE] Supabase metadata records: ${supabaseStats.total_metadata_records}`);
  console.log(`[DIAGNOSE] Records with ghl_product_id: ${supabaseStats.with_ghl_product_id}`);
  console.log(`[DIAGNOSE] Records with ghl_price_id: ${supabaseStats.with_ghl_price_id}`);
  console.log(`[DIAGNOSE] Records with legacy_catalog_id: ${supabaseStats.with_legacy_catalog_id}`);
  console.log(`[DIAGNOSE] Records with sku: ${supabaseStats.with_sku}`);

  // Step 3: Analyze GHL products
  const ghlStats = {
    total_products: 0,
    total_active: 0,
    total_inactive: 0,
  };

  const ghlFetch = await getGHLProducts(undefined, { limit: 500 });
  if ("products" in ghlFetch) {
    ghlStats.total_products = ghlFetch.products?.length || 0;
    ghlStats.total_active = (ghlFetch.products || []).filter(
      (p: any) => p.status === "active",
    ).length;
    ghlStats.total_inactive = (ghlFetch.products || []).filter(
      (p: any) => p.status === "inactive",
    ).length;

    console.log(`[DIAGNOSE] GHL products: ${ghlStats.total_products}`);
    console.log(`[DIAGNOSE]   - Active: ${ghlStats.total_active}`);
    console.log(`[DIAGNOSE]   - Inactive: ${ghlStats.total_inactive}`);
  }

  // Step 4: Determine sync readiness
  const issues: string[] = [];
  const warnings: string[] = [];

  if (supabaseStats.duplicates.by_ghl_product_id.length > 0) {
    issues.push(
      `CRITICAL: ${supabaseStats.duplicates.by_ghl_product_id.length} duplicate ghl_product_ids found`,
    );
  }

  if (supabaseStats.duplicates.by_sku.length > 0) {
    issues.push(`CRITICAL: ${supabaseStats.duplicates.by_sku.length} duplicate SKUs found`);
  }

  if (supabaseStats.duplicates.by_legacy_catalog_id.length > 0) {
    issues.push(
      `CRITICAL: ${supabaseStats.duplicates.by_legacy_catalog_id.length} duplicate legacy_catalog_ids found`,
    );
  }

  if (supabaseStats.total_metadata_records > catalogProducts.length * 2) {
    warnings.push(
      `Metadata records (${supabaseStats.total_metadata_records}) exceed 2x catalog size (${catalogProducts.length * 2})`,
    );
  }

  if (supabaseStats.with_legacy_catalog_id < catalogProducts.length) {
    warnings.push(
      `Only ${supabaseStats.with_legacy_catalog_id}/${catalogProducts.length} products have legacy_catalog_id mapped`,
    );
  }

  const canProceed = issues.length === 0;

  console.log(`[DIAGNOSE] Sync readiness: ${canProceed ? "OK" : "BLOCKED"}`);
  if (issues.length > 0) {
    console.error(`[DIAGNOSE] Critical issues:`, issues);
  }
  if (warnings.length > 0) {
    console.warn(`[DIAGNOSE] Warnings:`, warnings);
  }

  return {
    timestamp: new Date().toISOString(),
    catalog: {
      total: catalogProducts.length,
      byCategory,
    },
    supabase: supabaseStats,
    ghl: ghlStats,
    sync_readiness: {
      can_proceed: canProceed,
      issues,
      warnings,
    },
  };
}
