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
      // TEST: Simple query without nested relations first
      console.log("[useSupabaseProducts] Attempting simple query first...");
      const simpleResult = await supabase
        .from("products")
        .select("id, name, category, active")
        .eq("active", true)
        .is("deleted_at", null);

      console.log("[useSupabaseProducts] Simple query result:", simpleResult);

      // NOW try the full query with nested relations
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

      const { data, error, status } = await query;

      console.log("[useSupabaseProducts] Query status:", status);
      console.log("[useSupabaseProducts] Query error:", error);

      if (error) {
        console.error("[useSupabaseProducts] ERROR fetching products:", error);
        console.error("[useSupabaseProducts] Error message:", error.message);
        console.error("[useSupabaseProducts] Error details:", JSON.stringify(error, null, 2));
        return [];
      }

      console.log("[useSupabaseProducts] Query returned:", data?.length || 0, "products");
      if (data && data.length > 0) {
        console.log("[useSupabaseProducts] First product:", JSON.stringify(data[0], null, 2));
      } else {
        console.warn("[useSupabaseProducts] NO PRODUCTS RETURNED - using fallback to catalog.ts");
      }

      // Ensure product_options are sorted by creation order
      return (data as SupabaseProduct[]).map((product) => ({
        ...product,
        color_variants: product.color_variants.sort((a, b) => a.sort_order - b.sort_order),
        product_images: product.product_images.sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
