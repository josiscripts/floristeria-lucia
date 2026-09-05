import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(url, key);

console.log('Query with SERVICE ROLE (no RLS):');

const { data: products, error } = await serviceClient
  .from('products')
  .select(`
    id, name,
    product_options (id, name, price_final),
    product_images (id, image_url),
    color_variants (id, name)
  `)
  .eq('active', true)
  .is('deleted_at', null)
  .limit(5);

if (error) {
  console.log(`Error: ${error.message}`);
} else {
  console.log(`Found ${products?.length || 0} products with nested data`);
  if (products && products.length > 0) {
    const p = products[0];
    console.log(`Sample: ${p.name}`);
    console.log(`  Options: ${p.product_options?.length || 0}`);
    console.log(`  Images: ${p.product_images?.length || 0}`);
    console.log(`  Colors: ${p.color_variants?.length || 0}`);
  }
}
