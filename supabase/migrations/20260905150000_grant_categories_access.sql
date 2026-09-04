-- Grant SELECT access to categories table for anon and authenticated roles
-- This is required for RLS policies to work correctly

GRANT USAGE ON SCHEMA "public" TO "anon", "authenticated";
GRANT SELECT ON "public"."categories" TO "anon";
GRANT SELECT ON "public"."categories" TO "authenticated";
GRANT ALL ON "public"."categories" TO "service_role";
