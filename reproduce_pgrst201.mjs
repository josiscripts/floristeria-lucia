import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('Testing if PGRST201 occurs...\n');

const { data, error } = await anonClient
  .from('products')
  .select(`
    id,
    name,
    product_options(id, name, price_final),
    color_variants(id, name),
    product_images(id, image_url, is_primary)
  `)
  .eq('active', true)
  .is('deleted_at', null)
  .limit(1);

if (error) {
  console.log('❌ ERROR OCCURRED:');
  console.log(`Code: ${error.code}`);
  console.log(`Message: ${error.message}`);
  
  if (error.code === 'PGRST201') {
    console.log('\n🔴 PGRST201 CONFIRMED!');
    console.log('\nError details:');
    if (error.details) {
      const details = error.details;
      if (Array.isArray(details)) {
        details.forEach((d, i) => {
          console.log(`\n  Relationship ${i+1}:`);
          console.log(`    Embedding: ${d.embedding}`);
          console.log(`    Cardinality: ${d.cardinality}`);
          console.log(`    Relationship: ${d.relationship}`);
        });
      }
    }
  }
} else {
  console.log('✅ No error - query succeeded');
  console.log(`Products: ${data?.length}`);
}
