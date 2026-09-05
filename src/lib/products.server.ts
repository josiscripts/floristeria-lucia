/**
 * Product management library for BLOQUE 4 redesign
 * Handles database operations for products, options, and color variants
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ============================================================
// PRODUCTS
// ============================================================

export interface CreateProductInput {
  ghl_product_id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null; // legacy text column - the public catalog filters/reads by this
  category_id?: string | null; // FK to categories (normalized, not yet used by the public catalog)
  active?: boolean;
  cover_image_url?: string | null;
  has_color_variants?: boolean;
}

export async function createProduct(input: CreateProductInput) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: input.name,
          description: input.description || null,
          category: input.category || null,
          category_id: input.category_id || null,
          active: input.active ?? true,
          cover_image_url: input.cover_image_url || null,
          has_color_variants: input.has_color_variants ?? false,
          ghl_product_id: input.ghl_product_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] createProduct error:", message);
    return { success: false, error: message };
  }
}

export async function getProduct(productId: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] getProduct error:", message);
    return { success: false, error: message };
  }
}

export async function getProductByGHLId(ghlProductId: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("ghl_product_id", ghlProductId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] getProductByGHLId error:", message);
    return { success: false, error: message };
  }
}

export async function listProducts(filters?: {
  category?: string;
  active?: boolean;
  search?: string;
}) {
  try {
    let query = supabase.from("products").select("*").is("deleted_at", null);

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.active !== undefined) {
      query = query.eq("active", filters.active);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] listProducts error:", message);
    return { success: false, error: message };
  }
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string | null;
  category_id?: string | null;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  try {
    // Build update object with only defined fields
    const updates: Partial<{
      name: string;
      description: string;
      category: string | null;
      category_id: string | null;
      active: boolean;
      cover_image_url: string;
      has_color_variants: boolean;
    }> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.category_id !== undefined) updates.category_id = input.category_id;
    if (input.active !== undefined) updates.active = input.active;
    if (input.cover_image_url !== undefined) updates.cover_image_url = input.cover_image_url;
    if (input.has_color_variants !== undefined)
      updates.has_color_variants = input.has_color_variants;

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] updateProduct error:", message);
    return { success: false, error: message };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] deleteProduct error:", message);
    return { success: false, error: message };
  }
}

// ============================================================
// PRODUCT OPTIONS
// ============================================================

export interface CreateProductOptionInput {
  product_id: string;
  ghl_price_id?: string | null;
  name: string;
  price_amount: number;
  discount_percent?: number;
  stock_quantity?: number | null;
  sku?: string;
  active?: boolean;
}

export async function createProductOption(input: CreateProductOptionInput) {
  try {
    const { data, error } = await supabase
      .from("product_options")
      .insert({
        product_id: input.product_id,
        ghl_price_id: input.ghl_price_id || null,
        name: input.name,
        price_amount: input.price_amount,
        discount_percent: input.discount_percent ?? 0,
        stock_quantity: input.stock_quantity ?? null,
        sku: input.sku || null,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ProductsLib] createProductOption error:", message, { error });
    return { success: false, error: message };
  }
}

export async function getProductOption(optionId: string) {
  try {
    const { data, error } = await supabase
      .from("product_options")
      .select("*")
      .eq("id", optionId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] getProductOption error:", message);
    return { success: false, error: message };
  }
}

export async function listProductOptions(productId: string) {
  try {
    const { data, error } = await supabase
      .from("product_options")
      .select("*")
      .eq("product_id", productId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] listProductOptions error:", message);
    return { success: false, error: message };
  }
}

export interface UpdateProductOptionInput {
  name?: string;
  price_amount?: number;
  discount_percent?: number;
  stock_quantity?: number | null;
  sku?: string;
  ghl_price_id?: string | null;
  active?: boolean;
}

export async function updateProductOption(optionId: string, input: UpdateProductOptionInput) {
  try {
    // Build update object with only defined fields
    const updates: Partial<{
      name: string;
      price_amount: number;
      discount_percent: number;
      stock_quantity: number | null;
      sku: string;
      ghl_price_id: string | null;
      active: boolean;
    }> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.price_amount !== undefined) updates.price_amount = input.price_amount;
    if (input.discount_percent !== undefined) updates.discount_percent = input.discount_percent;
    if (input.stock_quantity !== undefined) updates.stock_quantity = input.stock_quantity;
    if (input.sku !== undefined) updates.sku = input.sku;
    if (input.ghl_price_id !== undefined) updates.ghl_price_id = input.ghl_price_id;
    if (input.active !== undefined) updates.active = input.active;

    const { data, error } = await supabase
      .from("product_options")
      .update(updates)
      .eq("id", optionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] updateProductOption error:", message);
    return { success: false, error: message };
  }
}

export async function deleteProductOption(optionId: string) {
  try {
    const { data, error } = await supabase
      .from("product_options")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", optionId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] deleteProductOption error:", message);
    return { success: false, error: message };
  }
}

// ============================================================
// COLOR VARIANTS
// ============================================================

export interface CreateColorVariantInput {
  product_id: string;
  name: string;
  sort_order?: number;
  active?: boolean;
}

export async function createColorVariant(input: CreateColorVariantInput) {
  try {
    const { data, error } = await supabase
      .from("color_variants")
      .insert({
        product_id: input.product_id,
        name: input.name,
        sort_order: input.sort_order ?? 0,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] createColorVariant error:", message);
    return { success: false, error: message };
  }
}

export async function listColorVariants(productId: string) {
  try {
    const { data, error } = await supabase
      .from("color_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] listColorVariants error:", message);
    return { success: false, error: message };
  }
}

export interface UpdateColorVariantInput {
  name?: string;
  sort_order?: number;
  active?: boolean;
}

export async function updateColorVariant(colorVariantId: string, input: UpdateColorVariantInput) {
  try {
    const updates: Partial<{
      name: string;
      sort_order: number;
      active: boolean;
    }> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.active !== undefined) updates.active = input.active;

    const { data, error } = await supabase
      .from("color_variants")
      .update(updates)
      .eq("id", colorVariantId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] updateColorVariant error:", message);
    return { success: false, error: message };
  }
}

export async function deleteColorVariant(colorVariantId: string) {
  try {
    const { data, error } = await supabase
      .from("color_variants")
      .update({ active: false })
      .eq("id", colorVariantId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] deleteColorVariant error:", message);
    return { success: false, error: message };
  }
}

// ============================================================
// PRODUCT WITH RELATIONS
// ============================================================

// ============================================================
// PRODUCT IMAGES
// ============================================================

export interface CreateProductImageInput {
  product_id: string;
  image_url: string;
  is_primary?: boolean;
  sort_order?: number;
  alt_text?: string | null;
  color_variant_id?: string | null;
}

export async function createProductImage(input: CreateProductImageInput) {
  try {
    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: input.product_id,
        image_url: input.image_url,
        is_primary: input.is_primary ?? false,
        sort_order: input.sort_order ?? 0,
        alt_text: input.alt_text || null,
        color_variant_id: input.color_variant_id || null,
        ghl_product_id: null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] createProductImage error:", message);
    return { success: false, error: message };
  }
}

export async function listProductImages(productId: string) {
  try {
    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] listProductImages error:", message);
    return { success: false, error: message };
  }
}

export interface UpdateProductImageInput {
  image_url?: string;
  is_primary?: boolean;
  sort_order?: number;
  alt_text?: string | null;
  color_variant_id?: string | null;
}

export async function updateProductImage(imageId: string, input: UpdateProductImageInput) {
  try {
    const updates: Partial<{
      image_url: string;
      is_primary: boolean;
      sort_order: number;
      alt_text: string | null;
      color_variant_id: string | null;
    }> = {};

    if (input.image_url !== undefined) updates.image_url = input.image_url;
    if (input.is_primary !== undefined) updates.is_primary = input.is_primary;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.alt_text !== undefined) updates.alt_text = input.alt_text;
    if (input.color_variant_id !== undefined) updates.color_variant_id = input.color_variant_id;

    const { data, error } = await supabase
      .from("product_images")
      .update(updates)
      .eq("id", imageId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] updateProductImage error:", message);
    return { success: false, error: message };
  }
}

export async function deleteProductImage(imageId: string) {
  try {
    const { data, error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] deleteProductImage error:", message);
    return { success: false, error: message };
  }
}

// ============================================================
// PRODUCT WITH RELATIONS
// ============================================================

export async function getProductWithOptions(productId: string) {
  try {
    const productRes = await getProduct(productId);
    if (!productRes.success) throw new Error(productRes.error);

    const optionsRes = await listProductOptions(productId);
    const colorsRes = productRes.data.has_color_variants
      ? await listColorVariants(productId)
      : { success: true, data: [] };
    const imagesRes = await listProductImages(productId);

    return {
      success: true,
      data: {
        ...productRes.data,
        options: optionsRes.data || [],
        color_variants: colorsRes.data || [],
        product_images: imagesRes.data || [],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ProductsLib] getProductWithOptions error:", message);
    return { success: false, error: message };
  }
}
