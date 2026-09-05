import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('Searching for products with "TEST_FASE_5_3" in name...\n');

const { data: results } = await anonClient
  .from('products')
  .select(`
    id, name, category, active, deleted_at,
    product_options(id, name, price_final),
    product_images(id, image_url)
  `)
  .eq('active', true)
  .is('deleted_at', null);

const testProducts = results.filter(p => p.name.includes('TEST_FASE_5_3'));

if (testProducts.length > 0) {
  console.log(`✅ Found ${testProducts.length} test product(s)`);
  testProducts.forEach(p => {
    console.log(`\n  Product: ${p.name}`);
    console.log(`  - ID: ${p.id}`);
    console.log(`  - Category: ${p.category}`);
    console.log(`  - Options: ${p.product_options?.length}`);
    console.log(`  - Images: ${p.product_images?.length}`);
    
    if (p.product_options?.length > 0) {
      const price = p.product_options[0].price_final;
      console.log(`  - Price: €${(price/100).toFixed(2)}`);
    }
    
    if (p.product_images?.length > 0) {
      console.log(`  - Image: ${p.product_images[0].image_url}`);
    }
  });
  
  console.log('\n🟢 TEST PRODUCTS SHOULD APPEAR IN CATALOG');
} else {
  console.log('❌ No test products found');
}
