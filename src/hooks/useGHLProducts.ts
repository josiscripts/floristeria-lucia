import { useQuery } from "@tanstack/react-query";
import type { GHLProductsResponse, GHLError } from "@/lib/ghl/types";

interface UseGHLProductsOptions {
  enabled?: boolean;
  locationId?: string;
  limit?: number;
  skip?: number;
}

/**
 * Hook to fetch products from GoHighLevel via server-side API
 * Token is never exposed to the browser
 */
export function useGHLProducts(options: UseGHLProductsOptions = {}) {
  const { enabled = true, locationId, limit = 100, skip = 0 } = options;

  return useQuery({
    queryKey: ["ghl-products", locationId, limit, skip],
    queryFn: async (): Promise<GHLProductsResponse | GHLError> => {
      const params = new URLSearchParams({
        limit: String(limit),
        skip: String(skip),
      });

      if (locationId) {
        params.append("locationId", locationId);
      }

      const response = await fetch(`/api/ghl/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch GHL products: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });
}

/**
 * Hook to test GHL connection
 */
export function useGHLConnectionTest(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["ghl-connection-test"],
    queryFn: async () => {
      const response = await fetch("/api/ghl/products?action=test");

      if (!response.ok) {
        throw new Error("GHL connection test failed");
      }

      return response.json() as Promise<{
        connected: boolean;
        message: string;
        error?: string;
      }>;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
