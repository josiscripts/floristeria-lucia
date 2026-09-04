/**
 * Complete Admin Product Management API
 * BLOQUE 4 - Full CRUD with GHL Synchronization
 *
 * Endpoints:
 * GET    /api/admin/products - List all products with filters
 * POST   /api/admin/products - Create product with options, images, colors
 * GET    /api/admin/products/:id - Get single product with relations
 * PUT    /api/admin/products/:id - Update product (metadata and relations)
 * DELETE /api/admin/products/:id - Delete product (soft/hard based on order refs)
 *
 * Key Features:
 * - GHL synchronization with sync_status tracking ('pending' | 'synced' | 'error')
 * - Soft delete protection for products with order history
 * - Hard delete cascade for orphaned products
 * - Comprehensive validation and error handling
 * - Product options, images, and color variants management
 * - Non-blocking error handling (GHL sync errors recorded but don't block operations)
 */

import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";
import {
  createProduct,
  createProductOption,
  createColorVariant,
  listProducts,
  getProductWithOptions,
  getProduct,
  updateProduct,
  deleteProduct,
  deleteProductOption,
  deleteColorVariant,
  listProductOptions,
  listColorVariants,
  updateProductOption,
} from "@/lib/products.server";
import {
  createGHLProduct,
  updateGHLProduct,
  deleteGHLProduct,
  getGHLProduct,
} from "@/lib/ghl/client.server";
import { generateSKU } from "@/lib/sku-generator.server";
import { ensureProductPrice } from "@/lib/price-sync.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CategoryId } from "@/data/catalog";

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface ProductOptionInput {
  name: string;
  price_amount: number;
  discount_percent?: number;
  stock_quantity?: number | null;
  sku?: string;
}

interface ProductImageInput {
  url: string;
  alt_text?: string;
  is_primary?: boolean;
  color_variant_id?: string | null;
}

interface ColorVariantInput {
  name: string;
  sort_order?: number;
}

interface CreateProductRequest {
  name: string;
  description?: string;
  category?: CategoryId;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  options: ProductOptionInput[];
  images?: ProductImageInput[];
  color_variants?: ColorVariantInput[];
}

interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: CategoryId;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  // For option/image/color management
  options?: {
    add?: ProductOptionInput[];
    update?: Array<{ id: string } & Partial<ProductOptionInput>>;
    delete?: string[];
  };
  images?: {
    add?: ProductImageInput[];
    delete?: string[];
  };
  color_variants?: {
    add?: ColorVariantInput[];
    delete?: string[];
  };
}

interface SyncResult {
  success: boolean;
  ghlProductId?: string | null;
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  syncStatus?: string;
  syncError?: string | null;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if product has orders referencing it
 */
async function hasProductOrders(productId: string): Promise<boolean> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get product first to get ghl_product_id
    const productRes = await getProduct(productId);
    if (!productRes.success || !productRes.data?.ghl_product_id) {
      return false; // If product doesn't exist, can't have orders
    }

    // Check if any order_items reference this GHL product
    const { data, error } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("ghl_product_id", productRes.data.ghl_product_id);

    if (error) {
      console.error("[ProductAPI] Error checking order references:", error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error("[ProductAPI] Error in hasProductOrders:", error);
    return false;
  }
}

/**
 * Validate product creation input
 */
function validateCreateInput(body: unknown): {
  valid: boolean;
  error?: string;
  data?: CreateProductRequest;
} {
  const req = body as CreateProductRequest;

  if (!req.name || typeof req.name !== "string" || req.name.trim().length === 0) {
    return { valid: false, error: "Product name is required and must be a non-empty string" };
  }

  if (!Array.isArray(req.options) || req.options.length === 0) {
    return { valid: false, error: "At least one option is required" };
  }

  for (let i = 0; i < req.options.length; i++) {
    const opt = req.options[i];
    if (!opt.name || typeof opt.price_amount !== "number" || opt.price_amount <= 0) {
      return {
        valid: false,
        error: `Option ${i + 1}: name and positive price_amount are required`,
      };
    }
  }

  if (req.category) {
    const validCategories: CategoryId[] = [
      "ramos",
      "plantas",
      "rosas-eternas",
      "complementos",
      "condolencias",
    ];
    if (!validCategories.includes(req.category)) {
      return {
        valid: false,
        error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
      };
    }
  }

  return { valid: true, data: req };
}

/**
 * Synchronize product to GHL (create/update)
 * Returns SyncResult with success status and any error details
 */
async function syncProductToGHL(
  product: Database["public"]["Tables"]["products"]["Row"],
  options: Database["public"]["Tables"]["product_options"]["Row"][],
  isUpdate: boolean = false,
): Promise<SyncResult> {
  try {
    const locationId = process.env["GHL_LOCATION_ID"];
    if (!locationId) {
      return {
        success: false,
        error: "GHL_LOCATION_ID not configured",
      };
    }

    // Prepare GHL product payload
    const ghlPayload: Record<string, unknown> = {
      name: product.name,
      description: product.description || "",
      status: product.active ? "active" : "inactive",
    };

    // Add category/collection if available
    if (product.category) {
      const collectionResult = await getGHLCollectionIdForCategory(product.category as CategoryId);
      if (collectionResult.success && collectionResult.collectionId) {
        ghlPayload.collectionIds = [collectionResult.collectionId];
      }
    }

    let ghlProductId = product.ghl_product_id;

    // Step 1: Create or update product in GHL
    if (isUpdate && ghlProductId) {
      // Update existing GHL product
      const ghlResult = await updateGHLProduct(ghlProductId, ghlPayload);
      if ("code" in ghlResult && "statusCode" in ghlResult) {
        const errorMsg = ghlResult.message || "Failed to update GHL product";
        console.warn(`[GHL Sync] Product update failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } else {
      // Create new GHL product
      const ghlResult = await createGHLProduct(ghlPayload, locationId);
      if ("code" in ghlResult && "statusCode" in ghlResult) {
        const errorMsg = ghlResult.message || "Failed to create GHL product";
        console.warn(`[GHL Sync] Product creation failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      ghlProductId = (ghlResult as Record<string, unknown>).id as string;
    }

    // Step 2: Sync prices for each option
    for (const option of options) {
      if (!option.ghl_price_id) {
        // Create new price in GHL
        const priceRes = await ensureProductPrice({
          ghlProductId,
          amount: Number(option.price_amount),
          currency: "EUR",
          sku: option.sku || "",
          priceName: option.name,
          locationId,
        });

        if (priceRes.success && priceRes.ghlPriceId) {
          // Update option with new GHL price ID
          await updateProductOption(option.id, {
            ghl_price_id: priceRes.ghlPriceId,
          });
        }
      }
    }

    return { success: true, ghlProductId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown GHL sync error";
    console.error("[GHL Sync] Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Update product sync status in database
 */
async function updateProductSyncStatus(
  productId: string,
  syncStatus: "pending" | "synced" | "error",
  syncError: string | null = null,
): Promise<void> {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await supabase
      .from("products")
      .update({
        sync_status: syncStatus,
        sync_error: syncError,
      })
      .eq("id", productId);
  } catch (error) {
    console.error("[ProductAPI] Error updating sync status:", error);
  }
}

/**
 * Handle product option changes (add, update, delete)
 */
async function handleOptionChanges(
  productId: string,
  changes: UpdateProductRequest["options"],
  ghlProductId: string | null,
): Promise<{ success: boolean; error?: string }> {
  if (!changes) return { success: true };

  try {
    const locationId = process.env["GHL_LOCATION_ID"];

    // Delete options
    if (changes.delete) {
      for (const optionId of changes.delete) {
        await deleteProductOption(optionId);
      }
    }

    // Update options
    if (changes.update) {
      for (const update of changes.update) {
        const { id, ...updateData } = update;
        await updateProductOption(id, updateData);
      }
    }

    // Add new options
    if (changes.add) {
      for (const newOpt of changes.add) {
        const sku = newOpt.sku || (await generateSKU("complementos")).sku;

        // Create price in GHL if ghlProductId exists
        let ghlPriceId: string | undefined;
        if (ghlProductId && locationId) {
          const priceRes = await ensureProductPrice({
            ghlProductId,
            amount: newOpt.price_amount,
            currency: "EUR",
            sku,
            priceName: newOpt.name,
            locationId,
          });
          if (priceRes.success) {
            ghlPriceId = priceRes.ghlPriceId;
          }
        }

        // Create option in Supabase
        await createProductOption({
          product_id: productId,
          ghl_price_id: ghlPriceId,
          name: newOpt.name,
          price_amount: newOpt.price_amount,
          discount_percent: newOpt.discount_percent ?? 0,
          stock_quantity: newOpt.stock_quantity,
          sku,
          active: true,
        });
      }
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error processing options";
    return { success: false, error: errorMsg };
  }
}

/**
 * Handle product image changes (add, delete)
 */
async function handleImageChanges(
  productId: string,
  changes: UpdateProductRequest["images"],
): Promise<{ success: boolean; error?: string }> {
  if (!changes) return { success: true };

  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Delete images
    if (changes.delete) {
      for (const imageId of changes.delete) {
        await supabase.from("product_images").delete().eq("id", imageId);
      }
    }

    // Add images
    if (changes.add) {
      for (const img of changes.add) {
        await supabase.from("product_images").insert({
          product_id: productId,
          image_url: img.url,
          alt_text: img.alt_text,
          is_primary: img.is_primary ?? false,
          color_variant_id: img.color_variant_id ?? null,
        });
      }
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error processing images";
    return { success: false, error: errorMsg };
  }
}

/**
 * Handle color variant changes (add, delete)
 */
async function handleColorChanges(
  productId: string,
  changes: UpdateProductRequest["color_variants"],
): Promise<{ success: boolean; error?: string }> {
  if (!changes) return { success: true };

  try {
    // Delete colors
    if (changes.delete) {
      for (const colorId of changes.delete) {
        await deleteColorVariant(colorId);
      }
    }

    // Add colors
    if (changes.add) {
      for (let i = 0; i < changes.add.length; i++) {
        await createColorVariant({
          product_id: productId,
          name: changes.add[i].name,
          sort_order: changes.add[i].sort_order ?? i,
          active: true,
        });
      }
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error processing colors";
    return { success: false, error: errorMsg };
  }
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

/**
 * GET /api/admin/products
 * List all products with optional filters
 *
 * Query parameters:
 * - category?: CategoryId - Filter by category
 * - active?: 'true' | 'false' - Filter by active status
 * - search?: string - Search by product name
 * - sync_status?: 'pending' | 'synced' | 'error' - Filter by sync status
 */
const GET = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const active = url.searchParams.get("active");
    const syncStatus = url.searchParams.get("sync_status") ?? undefined;

    const result = await listProducts({
      category,
      active: active === "true" ? true : active === "false" ? false : undefined,
      search: search ?? undefined,
    });

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 500 });
    }

    // Enrich with options and colors
    const products = await Promise.all(
      result.data.map(async (product) => {
        // Apply sync_status filter if provided
        if (syncStatus && product.sync_status !== syncStatus) {
          return null;
        }

        const full = await getProductWithOptions(product.id);
        return full.data ?? product;
      }),
    );

    const filtered = products.filter((p) => p !== null);

    return json(
      {
        success: true,
        products: filtered,
        total: filtered.length,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductAPI] GET /api/admin/products error:", message);
    return json({ success: false, error: message }, { status: 500 });
  }
});

/**
 * POST /api/admin/products
 * Create a new product with options, images, and color variants
 *
 * Request body:
 * {
 *   name: string (required)
 *   description?: string
 *   category?: CategoryId
 *   active?: boolean (default: true)
 *   cover_image_url?: string
 *   has_color_variants?: boolean (default: false)
 *   options: ProductOptionInput[] (required, min 1)
 *   images?: ProductImageInput[]
 *   color_variants?: ColorVariantInput[]
 * }
 */
const POST = withAdminGuard(async (request, admin) => {
  let productId: string | null = null;

  try {
    const body = await request.json();

    // Validate input
    const validation = validateCreateInput(body);
    if (!validation.valid) {
      return json({ success: false, error: validation.error }, { status: 400 });
    }

    const req = validation.data!;

    // Step 1: Create product in Supabase with sync_status='pending'
    const productRes = await createProduct({
      ghl_product_id: null,
      name: req.name,
      description: req.description,
      category: req.category,
      active: req.active ?? true,
      cover_image_url: req.cover_image_url,
      has_color_variants: req.has_color_variants ?? false,
      sync_status: "pending",
      sync_error: null,
    });

    if (!productRes.success) {
      return json({ success: false, error: productRes.error }, { status: 500 });
    }

    productId = productRes.data.id;

    // Step 2: Create options with SKUs
    const createdOptions = [];
    for (const opt of req.options) {
      const skuRes = await generateSKU(req.category ?? "complementos");
      const sku = skuRes.success ? skuRes.sku : `FL-${Date.now()}`;

      const optionRes = await createProductOption({
        product_id: productId,
        name: opt.name,
        price_amount: opt.price_amount,
        discount_percent: opt.discount_percent ?? 0,
        stock_quantity: opt.stock_quantity,
        sku,
        active: true,
      });

      if (optionRes.success) {
        createdOptions.push(optionRes.data);
      }
    }

    // Step 3: Create color variants if applicable
    const createdColors = [];
    if (req.has_color_variants && req.color_variants) {
      for (let i = 0; i < req.color_variants.length; i++) {
        const colorRes = await createColorVariant({
          product_id: productId,
          name: req.color_variants[i].name,
          sort_order: req.color_variants[i].sort_order ?? i,
          active: true,
        });

        if (colorRes.success) {
          createdColors.push(colorRes.data);
        }
      }
    }

    // Step 4: Create images if provided
    if (req.images && req.images.length > 0) {
      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      for (let i = 0; i < req.images.length; i++) {
        const img = req.images[i];
        await supabase.from("product_images").insert({
          product_id: productId,
          image_url: img.url,
          alt_text: img.alt_text,
          is_primary: img.is_primary ?? i === 0,
          color_variant_id: img.color_variant_id ?? null,
        });
      }
    }

    // Step 5: Attempt GHL synchronization (non-blocking)
    let ghlProductId: string | null = null;
    let syncError: string | null = null;

    const syncResult = await syncProductToGHL(productRes.data, createdOptions);
    if (syncResult.success && syncResult.ghlProductId) {
      ghlProductId = syncResult.ghlProductId;

      // Update product with GHL ID and sync_status
      await updateProduct(productId, {});
      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await supabase
        .from("products")
        .update({
          ghl_product_id: ghlProductId,
          sync_status: "synced",
          sync_error: null,
        })
        .eq("id", productId);
    } else {
      syncError = syncResult.error ?? "Unknown sync error";
      await updateProductSyncStatus(productId, "error", syncError);
    }

    // Step 6: Log admin action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.create",
      resource: "products",
      recordId: productId,
      metadata: {
        name: req.name,
        category: req.category,
        options_count: createdOptions.length,
        colors_count: createdColors.length,
        sync_status: ghlProductId ? "synced" : "error",
      },
    });

    // Step 7: Return complete product
    const fullProduct = await getProductWithOptions(productId);

    return json(
      {
        success: true,
        data: fullProduct.data,
        syncStatus: ghlProductId ? "synced" : "error",
        syncError,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductAPI] POST /api/admin/products error:", message);

    // If product was created but sync failed, update sync_status
    if (productId) {
      await updateProductSyncStatus(productId, "error", message);
    }

    return json(
      { success: false, error: message, syncStatus: "error", syncError: message },
      { status: 500 },
    );
  }
});

/**
 * GET /api/admin/products/:id
 * Retrieve a single product with all its relations
 */
const GET_BY_ID = withAdminGuard(async (request) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ success: false, error: "Missing product ID" }, { status: 400 });
    }

    const result = await getProductWithOptions(id);

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 404 });
    }

    return json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductAPI] GET /api/admin/products/:id error:", message);
    return json({ success: false, error: message }, { status: 500 });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product metadata and/or relations (options, images, colors)
 *
 * Supports partial updates:
 * - name, description, category, active, cover_image_url, has_color_variants
 * - options: { add, update, delete }
 * - images: { add, delete }
 * - color_variants: { add, delete }
 */
const PUT = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ success: false, error: "Missing product ID" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateProductRequest;

    // Verify product exists
    const existing = await getProductWithOptions(id);
    if (!existing.success) {
      return json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Step 1: Update product metadata if provided
    const metadataUpdates: Record<string, unknown> = {};
    if (body.name !== undefined) metadataUpdates.name = body.name;
    if (body.description !== undefined) metadataUpdates.description = body.description;
    if (body.category !== undefined) metadataUpdates.category = body.category;
    if (body.active !== undefined) metadataUpdates.active = body.active;
    if (body.cover_image_url !== undefined) metadataUpdates.cover_image_url = body.cover_image_url;
    if (body.has_color_variants !== undefined)
      metadataUpdates.has_color_variants = body.has_color_variants;

    if (Object.keys(metadataUpdates).length > 0) {
      const updateRes = await updateProduct(id, metadataUpdates as UpdateProductRequest);
      if (!updateRes.success) {
        return json({ success: false, error: updateRes.error }, { status: 500 });
      }
    }

    // Step 2: Handle option changes
    if (body.options) {
      const optRes = await handleOptionChanges(id, body.options, existing.data.ghl_product_id);
      if (!optRes.success) {
        return json({ success: false, error: optRes.error }, { status: 500 });
      }
    }

    // Step 3: Handle image changes
    if (body.images) {
      const imgRes = await handleImageChanges(id, body.images);
      if (!imgRes.success) {
        return json({ success: false, error: imgRes.error }, { status: 500 });
      }
    }

    // Step 4: Handle color variant changes
    if (body.color_variants) {
      const colorRes = await handleColorChanges(id, body.color_variants);
      if (!colorRes.success) {
        return json({ success: false, error: colorRes.error }, { status: 500 });
      }
    }

    // Step 5: Re-sync to GHL if metadata changed
    if (Object.keys(metadataUpdates).length > 0 && existing.data.ghl_product_id) {
      const updatedProduct = await getProduct(id);
      if (updatedProduct.success) {
        const options = await listProductOptions(id);
        const syncResult = await syncProductToGHL(
          updatedProduct.data,
          options.data ?? [],
          true,
        );

        if (!syncResult.success) {
          await updateProductSyncStatus(id, "error", syncResult.error);
        } else {
          await updateProductSyncStatus(id, "synced", null);
        }
      }
    }

    // Step 6: Log admin action
    await logAdminAction({
      userId: admin.user.id,
      action: "product.update",
      resource: "products",
      recordId: id,
      metadata: {
        fields: Object.keys(body),
        changes: Object.keys(metadataUpdates),
      },
    });

    // Step 7: Return updated product
    const updated = await getProductWithOptions(id);

    return json({ success: true, data: updated.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductAPI] PUT /api/admin/products/:id error:", message);
    return json({ success: false, error: message }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product with intelligent soft/hard delete logic
 *
 * Deletion strategy:
 * 1. Check if product has order history (via order_items.ghl_product_id)
 * 2. If YES: Soft delete (set deleted_at, deactivate in GHL) - Preserves history
 * 3. If NO: Hard delete (cascade to options, images, colors) - Clean removal
 *
 * Returns:
 * - For soft delete: { success: true, method: 'soft', message: 'Product archived' }
 * - For hard delete: { success: true, method: 'hard', message: 'Product deleted' }
 */
const DELETE = withAdminGuard(async (request, admin) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return json({ success: false, error: "Missing product ID" }, { status: 400 });
    }

    // Verify product exists
    const existing = await getProductWithOptions(id);
    if (!existing.success) {
      return json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const productData = existing.data;
    const hasOrders = await hasProductOrders(id);

    if (hasOrders) {
      // SOFT DELETE: Preserve historical data
      // 1. Mark as deleted in Supabase
      const deleteRes = await deleteProduct(id);
      if (!deleteRes.success) {
        return json({ success: false, error: deleteRes.error }, { status: 500 });
      }

      // 2. Deactivate in GHL (non-blocking)
      if (productData.ghl_product_id) {
        const ghlRes = await deleteGHLProduct(productData.ghl_product_id);
        if ("code" in ghlRes && "statusCode" in ghlRes) {
          console.warn(`[ProductAPI] GHL deactivation failed:`, ghlRes.message);
        }
      }

      // 3. Log action
      await logAdminAction({
        userId: admin.user.id,
        action: "product.delete.soft",
        resource: "products",
        recordId: id,
        metadata: {
          name: productData.name,
          reason: "Product has order history - soft deleted to preserve data",
          ordersReferencing: true,
        },
      });

      return json(
        {
          success: true,
          data: {
            method: "soft",
            message: "Product archived (soft delete) - Order history preserved",
            productId: id,
          },
        },
        { status: 200 },
      );
    } else {
      // HARD DELETE: No order history, safe to cascade delete
      // Note: Database cascading will handle product_options and color_variants
      // Product_images are handled by product_id FK with ON DELETE CASCADE

      const deleteRes = await deleteProduct(id);
      if (!deleteRes.success) {
        return json({ success: false, error: deleteRes.error }, { status: 500 });
      }

      // Remove from GHL (non-blocking)
      if (productData.ghl_product_id) {
        const ghlRes = await deleteGHLProduct(productData.ghl_product_id);
        if ("code" in ghlRes && "statusCode" in ghlRes) {
          console.warn(`[ProductAPI] GHL deletion failed:`, ghlRes.message);
        }
      }

      // Log action
      await logAdminAction({
        userId: admin.user.id,
        action: "product.delete.hard",
        resource: "products",
        recordId: id,
        metadata: {
          name: productData.name,
          reason: "Product has no order history - hard deleted",
          ordersReferencing: false,
        },
      });

      return json(
        {
          success: true,
          data: {
            method: "hard",
            message: "Product permanently deleted",
            productId: id,
          },
        },
        { status: 200 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductAPI] DELETE /api/admin/products/:id error:", message);
    return json({ success: false, error: message }, { status: 500 });
  }
});

// ============================================================
// ROUTE EXPORT
// ============================================================

export const Route = createFileRoute("/api/admin/products/complete")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

export const IDRoute = createFileRoute("/api/admin/products/$id")({
  server: {
    handlers: {
      GET: ({ request }) => GET_BY_ID(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
