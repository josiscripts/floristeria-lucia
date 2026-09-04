-- Grant base permissions to anon role for product_images
-- This is required for RLS policies to work
GRANT SELECT ON "public"."product_images" TO "anon";
GRANT SELECT ON "public"."product_images" TO "authenticated";
