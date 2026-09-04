import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number | null;
  active: boolean | null;
}

export function useSupabaseCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, display_order, active")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
