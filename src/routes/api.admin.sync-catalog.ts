/**
 * BLOQUE 4: Sincronización segura e idempotente del catálogo
 * POST /api/admin/sync-catalog
 *
 * Sincroniza 54 productos de catalog.ts con GHL + Supabase
 * - Crear nuevos productos en GHL si no existen
 * - Actualizar productos existentes si cambios detectados
 * - Crear precios con SKUs
 * - Guardar metadata en Supabase
 * - Manejar errores por producto sin fallar todo
 * - Garantizar idempotencia (segunda ejecución no crea duplicados)
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import { products as catalogProducts, type CategoryId } from "@/data/catalog";
import { createGHLProduct, updateGHLProduct, getGHLProducts } from "@/lib/ghl/client.server";
import { syncProductMetadata } from "@/lib/product-metadata.server";
import { ensureProductPrice } from "@/lib/price-sync.server";
import { generateSKU } from "@/lib/sku-generator.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";

interface SyncResult {
  id: string;
  name: string;
  status: "created" | "updated" | "already_synchronized" | "failed";
  ghlProductId?: string;
  ghlPriceId?: string;
  sku?: string;
  error?: string;
}

interface SyncCatalogRequest {
  dryRun?: boolean;
  startFrom?: number;
  limit?: number;
}

interface SyncCatalogResponse {
  success: boolean;
  dryRun: boolean;
  summary: {
    total: number;
    created: number;
    updated: number;
    already_synchronized: number;
    failed: number;
  };
  results: SyncResult[];
  errors: Array<{ product: string; error: string }>;
}

const POST = withAdminGuard(async (request, admin) => {
  try {
    const body: SyncCatalogRequest = await request.json();
    const dryRun = body.dryRun ?? false;
    const startFrom = body.startFrom ?? 0;
    const limit = body.limit ?? catalogProducts.length;

    console.log(`[SYNC_CATALOG] Starting sync (dryRun: ${dryRun})`);
    console.log(`[SYNC_CATALOG] Total products in catalog: ${catalogProducts.length}`);

    const results: SyncResult[] = [];
    const errors: Array<{ product: string; error: string }> = [];

    // Slice products to sync based on startFrom and limit
    const productsToSync = catalogProducts.slice(startFrom, startFrom + limit);

    console.log(`[SYNC_CATALOG] Processing ${productsToSync.length} products`);

    // Fetch all GHL products once for idempotency checks
    const ghlFetch = await getGHLProducts(undefined, { limit: 500 });
    const ghlProducts: Record<string, any> = {};
    if ("products" in ghlFetch) {
      for (const prod of ghlFetch.products || []) {
        // Index by product ID for quick lookup
        ghlProducts[prod.id] = prod;
      }
    }

    // Fetch Supabase metadata for idempotency checks
    const { data: existingMetadata, error: metaError } = await supabaseAdmin
      .from("product_metadata")
      .select("*");

    const metadataByLegacyId: Record<string, any> = {};
    const metadataByGHLId: Record<string, any> = {};

    if (!metaError && existingMetadata) {
      for (const meta of existingMetadata) {
        if (meta.legacy_catalog_id) {
          metadataByLegacyId[meta.legacy_catalog_id] = meta;
        }
        if (meta.ghl_product_id) {
          metadataByGHLId[meta.ghl_product_id] = meta;
        }
      }
    }

    // Process each product
    for (const catalogProduct of productsToSync) {
      const result: SyncResult = {
        id: catalogProduct.id,
        name: catalogProduct.name,
        status: "created",
      };

      try {
        console.log(`[SYNC_CATALOG] Processing: ${catalogProduct.name}`);

        // Step 1: Check if already exists in Supabase by legacy_catalog_id
        const existingMeta = metadataByLegacyId[catalogProduct.id];

        if (existingMeta?.ghl_product_id) {
          // Already synchronized - check if needs update
          console.log(`[SYNC_CATALOG] Already exists: ${existingMeta.ghl_product_id}`);

          const ghlProduct = ghlProducts[existingMeta.ghl_product_id];

          // Check if GHL product needs update
          const needsUpdate =
            ghlProduct?.name !== catalogProduct.name ||
            ghlProduct?.description !== catalogProduct.description;

          if (needsUpdate && !dryRun) {
            // Update in GHL
            const updatePayload: Record<string, any> = {
              name: catalogProduct.name,
              description: catalogProduct.description,
              status: "active",
            };

            const updateResult = await updateGHLProduct(
              existingMeta.ghl_product_id,
              updatePayload,
            );

            if ("code" in updateResult && "statusCode" in updateResult) {
              throw new Error(`GHL update failed: ${updateResult.message}`);
            }

            console.log(`[SYNC_CATALOG] Updated GHL product: ${existingMeta.ghl_product_id}`);
            result.status = "updated";
          } else {
            result.status = "already_synchronized";
          }

          result.ghlProductId = existingMeta.ghl_product_id;
          result.ghlPriceId = existingMeta.ghl_price_id;
          result.sku = existingMeta.sku;
        } else {
          // Step 2: Create new product in GHL
          if (!dryRun) {
            // Generate SKU
            const skuResult = await generateSKU(catalogProduct.category);
            const sku = skuResult.success ? skuResult.sku : null;

            // Get collection ID for category
            let collectionIds: string[] | undefined;
            const collectionResult = await getGHLCollectionIdForCategory(
              catalogProduct.category as CategoryId,
            );
            if (collectionResult.success && collectionResult.collectionId) {
              collectionIds = [collectionResult.collectionId];
            }

            // Create product in GHL
            const ghlPayload: Record<string, any> = {
              name: catalogProduct.name,
              description: catalogProduct.description,
              price: catalogProduct.priceMin,
              category: catalogProduct.category,
              sku,
              status: "active",
              productType: "PHYSICAL",
            };

            if (collectionIds) {
              ghlPayload.collectionIds = collectionIds;
            }

            const ghlResult = await createGHLProduct(ghlPayload);

            if ("code" in ghlResult && "statusCode" in ghlResult) {
              throw new Error(`GHL creation failed: ${ghlResult.message}`);
            }

            const ghlProductId = ghlResult.id;
            console.log(`[SYNC_CATALOG] Created GHL product: ${ghlProductId}`);

            // Step 3: Create price in GHL
            let ghlPriceId: string | null = null;
            const priceResult = await ensureProductPrice({
              ghlProductId,
              amount: catalogProduct.priceMin,
              currency: "EUR",
              sku,
              priceName: catalogProduct.name,
            });

            if (priceResult.success) {
              ghlPriceId = priceResult.ghlPriceId ?? null;
              console.log(
                `[SYNC_CATALOG] Created price for ${ghlProductId}: ${ghlPriceId}`,
              );
            } else {
              console.warn(`[SYNC_CATALOG] Price creation failed: ${priceResult.error}`);
            }

            // Step 4: Save metadata in Supabase
            const metadataResult = await syncProductMetadata({
              ghl_product_id: ghlProductId,
              legacy_catalog_id: catalogProduct.id,
              category: catalogProduct.category,
              price: catalogProduct.priceMin,
              price_max: catalogProduct.priceMax ?? null,
              sku: sku,
              badge_label: catalogProduct.badge ?? null,
              available_colors: catalogProduct.colors ?? null,
              rose_step: catalogProduct.roseStep ?? null,
              status: "active",
            });

            if (!metadataResult.success) {
              throw new Error(`Metadata sync failed: ${metadataResult.error}`);
            }

            result.status = "created";
            result.ghlProductId = ghlProductId;
            result.ghlPriceId = ghlPriceId;
            result.sku = sku;

            console.log(`[SYNC_CATALOG] Completed: ${catalogProduct.name}`);
          } else {
            // DRY RUN: simulate creation
            const skuResult = await generateSKU(catalogProduct.category);
            result.status = "created";
            result.ghlProductId = "DRY_RUN_ID";
            result.ghlPriceId = "DRY_RUN_PRICE_ID";
            result.sku = skuResult.success ? skuResult.sku : null;
          }
        }

        results.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[SYNC_CATALOG] Error processing ${catalogProduct.name}:`, errorMsg);

        result.status = "failed";
        result.error = errorMsg;
        results.push(result);
        errors.push({
          product: catalogProduct.name,
          error: errorMsg,
        });
      }
    }

    // Calculate summary
    const summary = {
      total: productsToSync.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      already_synchronized: results.filter((r) => r.status === "already_synchronized").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    console.log(`[SYNC_CATALOG] Summary:`, summary);

    // Log admin action
    await logAdminAction({
      userId: admin.user.id,
      action: "catalog.sync",
      resource: "catalog",
      metadata: {
        dryRun,
        total: summary.total,
        created: summary.created,
        updated: summary.updated,
        failed: summary.failed,
      },
    });

    const response: SyncCatalogResponse = {
      success: errors.length === 0,
      dryRun,
      summary,
      results,
      errors,
    };

    return json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/sync-catalog error:", message);
    return json(
      { error: message, code: "API_ERROR" } as any,
      { status: 500 },
    );
  }
});

const GET = withAdminGuard(async (request) => {
  try {
    // Health check for sync endpoint
    const totalInCatalog = catalogProducts.length;
    const { count: metadataCount } = await supabaseAdmin
      .from("product_metadata")
      .select("*", { count: "exact", head: true });

    const ghlFetch = await getGHLProducts(undefined, { limit: 1 });
    const ghlStatus = "products" in ghlFetch ? "connected" : "error";

    return json(
      {
        endpoint: "/api/admin/sync-catalog",
        catalogSize: totalInCatalog,
        supabaseMetadata: metadataCount || 0,
        ghlStatus,
        ready: ghlStatus === "connected",
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/sync-catalog")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
