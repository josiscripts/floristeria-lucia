import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseProduct } from "./useSupabaseProducts";

interface UseSupabaseProductOptions {
  enabled?: boolean;
}

export function useSupabaseProduct(productId: string | undefined, options: UseSupabaseProductOptions = {}) {
  const { enabled = !!productId } = options;

  return useQuery({
    queryKey: ["supabase-product", productId],
    queryFn: async (): Promise<SupabaseProduct | null> => {
      if (!productId) return null;

      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            id,
            ghl_product_id,
            name,
            description,
            category,
            active,
            cover_image_url,
            has_color_variants,
            product_options (
              id,
              name,
              price_amount,
              discount_percent,
              price_final,
              stock_quantity,
              sku,
              ghl_price_id
            ),
            color_variants (
              id,
              name,
              sort_order
            ),
            product_images (
              id,
              image_url,
              color_variant_id,
              is_primary,
              sort_order
            )
          `,
          )
          .eq("id", productId)
          .eq("active", true)
          .is("deleted_at", null)
          .single();

        if (error || !data) {
          console.warn(`[useSupabaseProduct] Failed to fetch product ${productId}:`, error);
          return null;
        }

        // Sort color variants and images
        const product = data as SupabaseProduct;
        return {
          ...product,
          color_variants: product.color_variants.sort((a, b) => a.sort_order - b.sort_order),
          product_images: product.product_images.sort((a, b) => a.sort_order - b.sort_order),
        };
      } catch (error) {
        console.error(`[useSupabaseProduct] Error fetching product ${productId}:`, error);
        return null;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
