import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('=== TESTING ACTUAL RELATIONSHIPS ===\n');

console.log('1. Testing: product_images → products');
const { data: d1, error: e1 } = await anonClient
  .from('product_images')
  .select('id, products(id)')
  .limit(1);

if (e1) {
  console.log(`   ❌ Error: ${e1.message}`);
  console.log(`   Code: ${e1.code}`);
  if (e1.details) console.log(`   Details: ${JSON.stringify(e1.details)}`);
} else {
  console.log(`   ✅ Success`);
}

console.log('\n2. Testing: products → product_images');
const { data: d2, error: e2 } = await anonClient
  .from('products')
  .select('id, product_images(id)')
  .limit(1);

if (e2) {
  console.log(`   ❌ Error: ${e2.message}`);
  console.log(`   Code: ${e2.code}`);
  if (e2.details) {
    console.log(`\n   Details:`);
    try {
      const details = JSON.parse(JSON.stringify(e2.details));
      details.forEach((d, i) => {
        console.log(`   ${i+1}. ${d.embedding} (${d.cardinality})`);
        console.log(`      Relationship: ${d.relationship}`);
      });
    } catch(ex) {
      console.log(`   ${e2.details}`);
    }
  }
} else {
  console.log(`   ✅ Success`);
}

console.log('\n3. Testing: Full catalog query');
const { data: d3, error: e3 } = await anonClient
  .from('products')
  .select(`
    id, name,
    product_options(id, name),
    product_images(id, image_url),
    color_variants(id, name)
  `)
  .limit(1);

if (e3) {
  console.log(`   ❌ Error: ${e3.message}`);
  console.log(`   Code: ${e3.code}`);
} else {
  console.log(`   ✅ Success`);
}
