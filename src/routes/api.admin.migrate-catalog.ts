/**
 * Hardcoded Catalog → Supabase Migration API
 * POST /api/admin/migrate-catalog
 *
 * Strategy:
 * 1. Read 54 products from src/data/catalog.ts
 * 2. For each product:
 *    a) Create in products table with category
 *    b) Create product_options from priceMin/priceMax (2-3 tiers)
 *    c) Create product_images with URLs from assets
 * 3. Protect Condolencias: Check no orders reference them before deletion
 * 4. Return per-product status and migration summary
 *
 * Status per product: created | updated | already_migrated | failed
 * Condolencias get special handling: only migrate if safe
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import { products as catalogProducts, priceTiers, type CategoryId } from "@/data/catalog";
import { createProduct, createProductOption } from "@/lib/products.server";
import { createProductImage } from "@/lib/product-images.server";
import { generateSKU } from "@/lib/sku-generator.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface MigrationProductResult {
  catalogId: string;
  name: string;
  category: CategoryId;
  status: "created" | "updated" | "already_migrated" | "failed" | "skipped_condolencias_unsafe";
  productId?: string;
  optionsCount?: number;
  imagesCount?: number;
  error?: string;
}

interface CondolenciasCheckResult {
  safe: boolean;
  ordersFound: number;
  message: string;
}

interface MigrateCatalogRequest {
  dryRun?: boolean;
  allowCondolenciasOverwrite?: boolean;
}

interface MigrateCatalogResponse {
  success: boolean;
  dryRun: boolean;
  timestamp: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    already_migrated: number;
    skipped: number;
    failed: number;
  };
  condolenciasCheck: CondolenciasCheckResult;
  results: MigrationProductResult[];
  errors: Array<{ product: string; error: string }>;
}

/**
 * Check if Condolencias products are safe to migrate/overwrite
 * Returns false if any orders reference Condolencias items
 */
async function checkCondolenciasOrderReferences(): Promise<CondolenciasCheckResult> {
  try {
    // Query: Get count of orders that have condolencias products
    const { data: orders, error } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("product_category", "condolencias")
      .limit(1);

    if (error) {
      console.warn("[MIGRATE] Error checking condolencias orders:", error);
      return {
        safe: false,
        ordersFound: 0,
        message: "Unable to verify - treating as unsafe to prevent data loss",
      };
    }

    const orderCount = orders?.length ?? 0;

    return {
      safe: orderCount === 0,
      ordersFound: orderCount,
      message:
        orderCount === 0
          ? "No existing orders found - safe to migrate"
          : `Found ${orderCount} order(s) referencing Condolencias - migration blocked to prevent data loss`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[MIGRATE] Condolencias check failed:", msg);
    return {
      safe: false,
      ordersFound: 0,
      message: `Check failed: ${msg}`,
    };
  }
}

/**
 * Create product_options from priceMin/priceMax
 * Generates 2-3 tier options matching existing price logic
 */
function generateOptionsFromPricing(priceMin: number, priceMax?: number) {
  if (priceMax === undefined || priceMax === priceMin) {
    // Single price tier
    return [
      {
        name: "Estándar",
        price_amount: priceMin,
      },
    ];
  }

  // Multiple tiers
  const mid = Math.round(((priceMin + priceMax) / 2) * 2) / 2;
  return [
    { name: "Estándar", price_amount: priceMin },
    { name: "Especial", price_amount: mid },
    { name: "Premium", price_amount: priceMax },
  ];
}

/**
 * Convert asset image path to public URL
 * Images stored in assets/ need mapping to storage or CDN URL
 */
function getImageUrl(imagePath: string): string | null {
  // Images from catalog.ts are imported from @/assets
  // For now, return placeholder - in production, upload to Supabase Storage
  // Format: /images/{filename}
  const filename = imagePath.split("/").pop();
  if (!filename) return null;

  return `/assets/${filename}`;
}

/**
 * Check if product already exists by name and category
 */
async function findExistingProduct(name: string, category: CategoryId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("name", name)
      .eq("category", category)
      .single();

    return { exists: !error, productId: data?.id };
  } catch {
    return { exists: false, productId: null };
  }
}

const POST = withAdminGuard(async (request, admin) => {
  try {
    const body: MigrateCatalogRequest = await request.json();
    const dryRun = body.dryRun ?? false;
    const allowCondolenciasOverwrite = body.allowCondolenciasOverwrite ?? false;

    console.log(`[MIGRATE_CATALOG] Starting migration (dryRun: ${dryRun})`);
    console.log(`[MIGRATE_CATALOG] Total products to migrate: ${catalogProducts.length}`);

    // Step 1: Check Condolencias safety
    const condolenciasCheck = await checkCondolenciasOrderReferences();
    console.log(`[MIGRATE_CATALOG] Condolencias check:`, condolenciasCheck);

    if (!condolenciasCheck.safe && !allowCondolenciasOverwrite) {
      console.warn("[MIGRATE_CATALOG] Blocking migration due to existing Condolencias orders");
    }

    const results: MigrationProductResult[] = [];
    const errors: Array<{ product: string; error: string }> = [];

    // Step 2: Process each product
    for (const catalogProduct of catalogProducts) {
      const result: MigrationProductResult = {
        catalogId: catalogProduct.id,
        name: catalogProduct.name,
        category: catalogProduct.category,
        status: "created",
      };

      try {
        console.log(`[MIGRATE_CATALOG] Processing: ${catalogProduct.name}`);

        // Condolencias protection
        if (catalogProduct.category === "condolencias") {
          if (!condolenciasCheck.safe && !allowCondolenciasOverwrite) {
            console.log(
              `[MIGRATE_CATALOG] Skipping Condolencias product (orders exist): ${catalogProduct.name}`,
            );
            result.status = "skipped_condolencias_unsafe";
            results.push(result);
            continue;
          }
        }

        // Check if already migrated
        const existing = await findExistingProduct(catalogProduct.name, catalogProduct.category);
        if (existing.exists && existing.productId) {
          console.log(`[MIGRATE_CATALOG] Already migrated: ${catalogProduct.name}`);
          result.status = "already_migrated";
          result.productId = existing.productId;
          results.push(result);
          continue;
        }

        if (dryRun) {
          // Dry run: simulate creation without DB writes
          result.status = "created";
          result.optionsCount = generateOptionsFromPricing(
            catalogProduct.priceMin,
            catalogProduct.priceMax,
          ).length;
          result.imagesCount = 1; // Placeholder
          results.push(result);
          continue;
        }

        // Step 2a: Create product
        const productRes = await createProduct({
          name: catalogProduct.name,
          description: catalogProduct.description,
          category: catalogProduct.category,
          active: true,
          cover_image_url: getImageUrl(catalogProduct.image) || undefined,
          has_color_variants: (catalogProduct.colors?.length ?? 0) > 0,
          sync_status: "pending",
          sync_error: null,
        });

        if (!productRes.success) {
          throw new Error(`Product creation failed: ${productRes.error}`);
        }

        const productId = productRes.data.id;
        console.log(`[MIGRATE_CATALOG] Created product: ${productId}`);

        // Step 2b: Create product options
        const options = generateOptionsFromPricing(
          catalogProduct.priceMin,
          catalogProduct.priceMax,
        );
        let optionsCreated = 0;

        for (let i = 0; i < options.length; i++) {
          const opt = options[i];

          // Generate SKU
          const skuRes = await generateSKU(catalogProduct.category);
          const sku = skuRes.success ? skuRes.sku : `${catalogProduct.id}-${i}`;

          const optionRes = await createProductOption({
            product_id: productId,
            name: opt.name,
            price_amount: opt.price_amount,
            discount_percent: 0,
            stock_quantity: null, // No stock tracking initially
            sku,
            active: true,
          });

          if (optionRes.success) {
            optionsCreated++;
            console.log(`[MIGRATE_CATALOG] Created option: ${opt.name} (${sku})`);
          } else {
            console.warn(
              `[MIGRATE_CATALOG] Failed to create option ${opt.name}: ${optionRes.error}`,
            );
          }
        }

        // Step 2c: Create product images
        let imagesCreated = 0;
        const imageUrl = getImageUrl(catalogProduct.image);
        if (imageUrl && productId) {
          const imageRes = await createProductImage({
            product_id: productId,
            ghl_product_id: "", // Will be updated when synced to GHL
            storage_path: imageUrl,
            url: imageUrl,
            sort_order: 0,
            is_primary: true,
          });

          if (imageRes) {
            imagesCreated++;
            console.log(`[MIGRATE_CATALOG] Created primary image for ${catalogProduct.name}`);
          }
        }

        result.status = "created";
        result.productId = productId;
        result.optionsCount = optionsCreated;
        result.imagesCount = imagesCreated;

        console.log(
          `[MIGRATE_CATALOG] Completed: ${catalogProduct.name} (options: ${optionsCreated}, images: ${imagesCreated})`,
        );
        results.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[MIGRATE_CATALOG] Error processing ${catalogProduct.name}:`, errorMsg);

        result.status = "failed";
        result.error = errorMsg;
        results.push(result);
        errors.push({
          product: catalogProduct.name,
          error: errorMsg,
        });
      }
    }

    // Step 3: Calculate summary
    const summary = {
      total: catalogProducts.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      already_migrated: results.filter((r) => r.status === "already_migrated").length,
      skipped: results.filter((r) => r.status === "skipped_condolencias_unsafe").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    console.log(`[MIGRATE_CATALOG] Summary:`, summary);

    // Step 4: Log admin action
    await logAdminAction({
      userId: admin.user.id,
      action: "catalog.migrate",
      resource: "catalog",
      metadata: {
        dryRun,
        allowCondolenciasOverwrite,
        total: summary.total,
        created: summary.created,
        updated: summary.updated,
        failed: summary.failed,
        condolenciasOrdersFound: condolenciasCheck.ordersFound,
      },
    });

    const response: MigrateCatalogResponse = {
      success: errors.length === 0 || dryRun,
      dryRun,
      timestamp: new Date().toISOString(),
      summary,
      condolenciasCheck,
      results,
      errors,
    };

    return json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] /api/admin/migrate-catalog error:", message);
    return json({ error: message, code: "MIGRATION_ERROR" } as any, { status: 500 });
  }
});

const GET = withAdminGuard(async (request) => {
  try {
    // Health check - show migration readiness status
    const totalInCatalog = catalogProducts.length;
    const { count: productsCount } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: optionsCount } = await supabaseAdmin
      .from("product_options")
      .select("*", { count: "exact", head: true });

    const condolenciasCheck = await checkCondolenciasOrderReferences();

    return json(
      {
        endpoint: "/api/admin/migrate-catalog",
        catalogSize: totalInCatalog,
        supabaseProducts: productsCount || 0,
        supabaseOptions: optionsCount || 0,
        condolenciasOrdersFound: condolenciasCheck.ordersFound,
        migrationNeeded: (productsCount || 0) < totalInCatalog,
        ready: true,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/migrate-catalog")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
