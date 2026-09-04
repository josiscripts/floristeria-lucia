import type { SupabaseProduct, SupabaseProductOption } from "@/hooks/useSupabaseProducts";
import type { Product } from "@/data/catalog";

/**
 * Convert a Supabase product with multiple options to the legacy Product format
 * Uses the first option as the primary price for compatibility with ProductCard
 */
export function supabaseProductToLegacy(supabaseProduct: SupabaseProduct): Product {
  const primaryOption = supabaseProduct.product_options[0];
  const secondaryOption = supabaseProduct.product_options[1];
  const tertiaryOption = supabaseProduct.product_options[2];

  // Get primary image (marked as primary or first image)
  const primaryImage = supabaseProduct.product_images.find((img) => img.is_primary) ||
    supabaseProduct.product_images.find((img) => !img.color_variant_id) ||
    supabaseProduct.product_images[0] || {
      image_url: supabaseProduct.cover_image_url || "/placeholder.png",
    };

  // Extract colors from color_variants
  const colors = supabaseProduct.has_color_variants
    ? supabaseProduct.color_variants.map((v) => v.name)
    : undefined;

  const result = {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    category: supabaseProduct.category || "ramos",
    priceMin: primaryOption?.price_final || primaryOption?.price_amount || 0,
    priceMax: tertiaryOption?.price_final || tertiaryOption?.price_amount,
    image: primaryImage.image_url || supabaseProduct.cover_image_url || "/placeholder.png",
    description: supabaseProduct.description || "",
    colors: colors && colors.length > 0 ? colors : undefined,
    // Store additional Supabase data in a way that doesn't break the type
    ...(supabaseProduct as any),
  };

  console.log("[supabaseProductToLegacy]", result.name, "category:", result.category, "image:", result.image);

  return result;
}

/**
 * Get all price tiers from Supabase product options
 */
export function getSupabasePriceTiers(options: SupabaseProductOption[]) {
  return options.map((option) => ({
    label: option.name,
    price: option.price_final,
    id: option.id,
    ghl_price_id: option.ghl_price_id,
    stock_quantity: option.stock_quantity,
    discount_percent: option.discount_percent,
  }));
}

/**
 * Get image for a specific color variant
 */
export function getImageForColor(supabaseProduct: SupabaseProduct, colorVariantId: string | null) {
  if (colorVariantId) {
    const colorImage = supabaseProduct.product_images.find(
      (img) => img.color_variant_id === colorVariantId && !img.is_primary,
    ) ||
      supabaseProduct.product_images.find((img) => img.color_variant_id === colorVariantId) || {
        image_url: supabaseProduct.cover_image_url || "/placeholder.png",
      };
    return colorImage.image_url || supabaseProduct.cover_image_url || "/placeholder.png";
  }

  const primaryImage = supabaseProduct.product_images.find((img) => img.is_primary) ||
    supabaseProduct.product_images.find((img) => !img.color_variant_id) ||
    supabaseProduct.product_images[0] || {
      image_url: supabaseProduct.cover_image_url || "/placeholder.png",
    };

  return primaryImage.image_url || supabaseProduct.cover_image_url || "/placeholder.png";
}

/**
 * Format price with Euro symbol
 */
export function formatSupabasePrice(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}
