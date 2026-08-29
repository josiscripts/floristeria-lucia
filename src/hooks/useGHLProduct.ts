import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/data/catalog";

interface UseGHLProductOptions {
  locationId?: string;
}

export function useGHLProduct(productId: string | undefined, options?: UseGHLProductOptions) {
  return useQuery<Product | null>({
    queryKey: ["ghlProduct", productId, options?.locationId],
    queryFn: async () => {
      if (!productId) return null;

      try {
        const params = new URLSearchParams();
        if (options?.locationId) {
          params.append("locationId", options.locationId);
        }

        const queryString = params.toString();
        const url = queryString
          ? `/api/ghl/products/${productId}?${queryString}`
          : `/api/ghl/products/${productId}`;

        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`[useGHLProduct] Failed to fetch product ${productId}`);
          return null;
        }

        return response.json();
      } catch (error) {
        console.error(`[useGHLProduct] Error fetching product ${productId}:`, error);
        return null;
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
