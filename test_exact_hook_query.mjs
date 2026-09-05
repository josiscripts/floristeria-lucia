import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('=== EXACT HOOK QUERY REPRODUCTION ===\n');

const SELECT_STRING = `
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
        `;

console.log('Executing EXACT hook query...\n');

let query = anonClient
  .from("products")
  .select(SELECT_STRING)
  .eq("active", true)
  .is("deleted_at", null)
  .order("name", { ascending: true })
  .limit(500);

const { data, error } = await query;

if (error) {
  console.log(`❌ QUERY FAILED`);
  console.log(`Error: ${error.message}`);
  console.log(`Code: ${error.code}`);
  
  if (error.details) {
    console.log(`\nDetails:`);
    try {
      const details = JSON.parse(JSON.stringify(error.details));
      if (Array.isArray(details)) {
        details.forEach((d, i) => {
          console.log(`  ${i+1}. ${d.embedding || d.message}`);
          if (d.cardinality) console.log(`     Cardinality: ${d.cardinality}`);
          if (d.relationship) console.log(`     Relationship: ${d.relationship}`);
        });
      } else {
        console.log(JSON.stringify(details, null, 2));
      }
    } catch(ex) {
      console.log(error.details);
    }
  }
} else {
  console.log(`✅ QUERY SUCCEEDED`);
  console.log(`Products: ${data?.length || 0}`);
}
