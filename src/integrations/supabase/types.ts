export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          full_name: string;
          id: string;
          is_default: boolean;
          label: string;
          phone: string;
          postal_code: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address: string;
          city: string;
          country?: string;
          created_at?: string;
          full_name: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          phone: string;
          postal_code: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          phone?: string;
          postal_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          record_id: string | null;
          resource: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          record_id?: string | null;
          resource: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          record_id?: string | null;
          resource?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          display_order: number | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      category_to_ghl_collection: {
        Row: {
          category: string;
          created_at: string;
          ghl_collection_id: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          ghl_collection_id?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          ghl_collection_id?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      color_variants: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          id: string;
          name: string;
          product_id: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          id?: string;
          name: string;
          product_id: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          product_id?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "color_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          color: string | null;
          created_at: string | null;
          ghl_product_id: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          size: string;
          special_instructions: string | null;
          subtotal: number;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          ghl_product_id: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          size: string;
          special_instructions?: string | null;
          subtotal: number;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          ghl_product_id?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          size?: string;
          special_instructions?: string | null;
          subtotal?: number;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          city: string;
          country: string;
          created_at: string | null;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          dedicatory: string | null;
          deleted_at: string | null;
          delivery_date: string | null;
          ghl_contact_id: string | null;
          ghl_opportunity_id: string | null;
          id: string;
          notes: string | null;
          order_number: string;
          postal_code: string;
          status: string;
          subtotal: number;
          total: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          address: string;
          city: string;
          country?: string;
          created_at?: string | null;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          dedicatory?: string | null;
          deleted_at?: string | null;
          delivery_date?: string | null;
          ghl_contact_id?: string | null;
          ghl_opportunity_id?: string | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          postal_code: string;
          status?: string;
          subtotal: number;
          total: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          created_at?: string | null;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          dedicatory?: string | null;
          deleted_at?: string | null;
          delivery_date?: string | null;
          ghl_contact_id?: string | null;
          ghl_opportunity_id?: string | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          postal_code?: string;
          status?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          color_variant_id: string | null;
          created_at: string;
          ghl_product_id: string;
          id: string;
          image_url: string | null;
          is_primary: boolean;
          product_id: string;
          sort_order: number;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          alt_text?: string | null;
          color_variant_id?: string | null;
          created_at?: string;
          ghl_product_id: string;
          id?: string;
          image_url?: string | null;
          is_primary?: boolean;
          product_id: string;
          sort_order?: number;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          alt_text?: string | null;
          color_variant_id?: string | null;
          created_at?: string;
          ghl_product_id?: string;
          id?: string;
          image_url?: string | null;
          is_primary?: boolean;
          product_id?: string;
          sort_order?: number;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_color_variant_id_fkey";
            columns: ["color_variant_id"];
            isOneToOne: false;
            referencedRelation: "color_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_metadata: {
        Row: {
          auto_created: boolean | null;
          available_colors: string[] | null;
          badge_label: string | null;
          category: string | null;
          created_at: string | null;
          deleted_at: string | null;
          ghl_price_id: string | null;
          ghl_product_id: string;
          id: string;
          legacy_catalog_id: string | null;
          location_id: string;
          price_max: number | null;
          price_min: number | null;
          requires_quote: boolean | null;
          rose_step: number | null;
          sku: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          auto_created?: boolean | null;
          available_colors?: string[] | null;
          badge_label?: string | null;
          category?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          ghl_price_id?: string | null;
          ghl_product_id: string;
          id?: string;
          legacy_catalog_id?: string | null;
          location_id?: string;
          price_max?: number | null;
          price_min?: number | null;
          requires_quote?: boolean | null;
          rose_step?: number | null;
          sku?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          auto_created?: boolean | null;
          available_colors?: string[] | null;
          badge_label?: string | null;
          category?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          ghl_price_id?: string | null;
          ghl_product_id?: string;
          id?: string;
          legacy_catalog_id?: string | null;
          location_id?: string;
          price_max?: number | null;
          price_min?: number | null;
          requires_quote?: boolean | null;
          rose_step?: number | null;
          sku?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_options: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          deleted_at: string | null;
          discount_percent: number | null;
          ghl_price_id: string | null;
          id: string;
          name: string;
          price_amount: number;
          price_final: number | null;
          product_id: string;
          sku: string | null;
          sort_order: number | null;
          stock_quantity: number | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          discount_percent?: number | null;
          ghl_price_id?: string | null;
          id?: string;
          name: string;
          price_amount: number;
          price_final?: number | null;
          product_id: string;
          sku?: string | null;
          sort_order?: number | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          discount_percent?: number | null;
          ghl_price_id?: string | null;
          id?: string;
          name?: string;
          price_amount?: number;
          price_final?: number | null;
          product_id?: string;
          sku?: string | null;
          sort_order?: number | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean | null;
          category: string | null;
          category_id: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          ghl_product_id: string | null;
          has_color_variants: boolean | null;
          id: string;
          metadata: Json | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          category?: string | null;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          ghl_product_id?: string | null;
          has_color_variants?: boolean | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          category?: string | null;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          ghl_product_id?: string | null;
          has_color_variants?: boolean | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          cookies_analytics: boolean;
          cookies_marketing: boolean;
          cookies_personalization: boolean;
          created_at: string;
          email_newsletter_news: boolean;
          email_newsletter_promotions: boolean;
          email_order_updates: boolean;
          id: string;
          preferred_delivery_time: string | null;
          recurring_order_preference: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cookies_analytics?: boolean;
          cookies_marketing?: boolean;
          cookies_personalization?: boolean;
          created_at?: string;
          email_newsletter_news?: boolean;
          email_newsletter_promotions?: boolean;
          email_order_updates?: boolean;
          id?: string;
          preferred_delivery_time?: string | null;
          recurring_order_preference?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cookies_analytics?: boolean;
          cookies_marketing?: boolean;
          cookies_personalization?: boolean;
          created_at?: string;
          email_newsletter_news?: boolean;
          email_newsletter_promotions?: boolean;
          email_order_updates?: boolean;
          id?: string;
          preferred_delivery_time?: string | null;
          recurring_order_preference?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          delivery_id: string;
          error_message: string | null;
          event_type: string;
          id: string;
          location_id: string;
          opportunity_id: string;
          order_id: string | null;
          payload: Json;
          processed: boolean | null;
          processed_at: string | null;
          received_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          delivery_id: string;
          error_message?: string | null;
          event_type: string;
          id?: string;
          location_id: string;
          opportunity_id: string;
          order_id?: string | null;
          payload: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          delivery_id?: string;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          location_id?: string;
          opportunity_id?: string;
          order_id?: string | null;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_product_with_options: {
        Args: { p_product_id: string };
        Returns: {
          discount_percent: number;
          option_id: string;
          option_name: string;
          price_amount: number;
          price_final: number;
          product_category: string;
          product_id: string;
          product_name: string;
          sku: string;
          stock_quantity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
