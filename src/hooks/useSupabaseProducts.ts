import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryId } from "@/data/catalog";

export interface SupabaseProductOption {
  id: string;
  name: string;
  price_amount: number;
  discount_percent: number;
  price_final: number;
  stock_quantity: number | null;
  sku: string | null;
  ghl_price_id: string | null;
}

export interface SupabaseColorVariant {
  id: string;
  name: string;
  sort_order: number;
}

export interface SupabaseProductImage {
  id: string;
  image_url: string;
  color_variant_id: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface SupabaseProduct {
  id: string;
  ghl_product_id: string;
  name: string;
  description: string | null;
  category: CategoryId | null;
  active: boolean;
  cover_image_url: string | null;
  has_color_variants: boolean;
  product_options: SupabaseProductOption[];
  color_variants: SupabaseColorVariant[];
  product_images: SupabaseProductImage[];
}

interface UseSupabaseProductsOptions {
  category?: CategoryId;
  limit?: number;
  skip?: number;
  enabled?: boolean;
}

export function useSupabaseProducts(options: UseSupabaseProductsOptions = {}) {
  const { category, limit = 500, skip = 0, enabled = true } = options;

  return useQuery({
    queryKey: ["supabase-products", category, limit, skip],
    queryFn: async (): Promise<SupabaseProduct[]> => {
      console.log('[useSupabaseProducts] Query starting', { category, limit, skip });
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

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }

      if (skip) {
        query = query.range(skip, skip + (limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          '[useSupabaseProducts] Query failed:',
          error.code,
          error.message,
          { category, limit, skip }
        );
        return [];
      }

      const sorted = (data as SupabaseProduct[]).map((product) => ({
        ...product,
        color_variants: product.color_variants.sort((a, b) => a.sort_order - b.sort_order),
        product_images: product.product_images.sort((a, b) => a.sort_order - b.sort_order),
      }));

      console.log('[useSupabaseProducts] Query succeeded', {
        count: sorted.length,
        category,
        limit,
        skip,
        sample: sorted[0]
          ? {
              id: sorted[0].id,
              name: sorted[0].name,
              optionsCount: sorted[0].product_options?.length,
              imagesCount: sorted[0].product_images?.length,
            }
          : null,
      });

      return sorted;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
