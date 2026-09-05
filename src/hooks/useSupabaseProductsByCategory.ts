import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryId } from "@/data/catalog";
import type { SupabaseProduct } from "./useSupabaseProducts";

interface UseSupabaseProductsByCategoryOptions {
  enabled?: boolean;
}

export function useSupabaseProductsByCategory(
  category?: CategoryId,
  options: UseSupabaseProductsByCategoryOptions = {},
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["supabase-products-category", category],
    queryFn: async (): Promise<SupabaseProduct[]> => {
      let query = supabase
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
        .eq("active", true)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching products for category ${category}:`, error);
        return [];
      }

      return (data as SupabaseProduct[]).map((product) => ({
        ...product,
        color_variants: product.color_variants.sort((a, b) => a.sort_order - b.sort_order),
        product_images: product.product_images.sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
