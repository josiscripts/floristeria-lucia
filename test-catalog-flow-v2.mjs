/**
 * FASE 5.3 TEST v2: Exact query replication from hook
 */

import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('\n' + '='.repeat(70));
console.log('FASE 5.3 - EXACT HOOK QUERY REPLICATION');
console.log('='.repeat(70));

// Use EXACT query from useSupabaseProducts hook
let query = anonClient
  .from('products')
  .select(`
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
  `)
  .eq('active', true)
  .is('deleted_at', null)
  .order('name', { ascending: true })
  .limit(500);

console.log('\n📍 Executing exact hook query...');
const { data, error } = await query;

if (error) {
  console.log(`❌ Query failed: ${error.message}`);
  process.exit(1);
}

console.log(`✅ Query succeeded: ${data?.length || 0} products`);

if (data && data.length > 0) {
  console.log('\n📍 Sample data structure:');
  const p = data[0];
  console.log(`  Product: ${p.name}`);
  console.log(`  - ID: ${p.id}`);
  console.log(`  - Category: ${p.category}`);
  console.log(`  - Active: ${p.active}`);
  console.log(`  - Options: ${p.product_options?.length || 0}`);
  if (p.product_options?.length > 0) {
    console.log(`    └─ First option: ${p.product_options[0].name} @ €${p.product_options[0].price_final}`);
  }
  console.log(`  - Images: ${p.product_images?.length || 0}`);
  if (p.product_images?.length > 0) {
    console.log(`    └─ First image: ${p.product_images[0].image_url}`);
  }
  console.log(`  - Colors: ${p.color_variants?.length || 0}`);
  if (p.color_variants?.length > 0) {
    console.log(`    └─ Available: ${p.color_variants.map(c => c.name).join(', ')}`);
  }
}

console.log('\n📍 Stats:');
let totalOptions = 0, totalImages = 0, totalColors = 0;
data.forEach(p => {
  totalOptions += p.product_options?.length || 0;
  totalImages += p.product_images?.length || 0;
  totalColors += p.color_variants?.length || 0;
});

console.log(`  Total products: ${data?.length || 0}`);
console.log(`  Total options across all products: ${totalOptions}`);
console.log(`  Total images across all products: ${totalImages}`);
console.log(`  Total color variants across all products: ${totalColors}`);

if (totalOptions === 0 && totalImages === 0 && totalColors === 0) {
  console.log('\n❌ WARNING: No nested data found!');
  console.log('   This will cause ProductCard to show priceMin=0 and /placeholder.png');
} else {
  console.log('\n✅ Nested data loaded correctly');
}

console.log('\n' + '='.repeat(70) + '\n');
process.exit(totalOptions > 0 && totalImages > 0 ? 0 : 1);
