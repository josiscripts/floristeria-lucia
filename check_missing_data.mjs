import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: products } = await serviceClient
  .from('products')
  .select(`id, name, product_options(id), product_images(id)`)
  .eq('active', true)
  .is('deleted_at', null)
  .limit(40);

let productsWithoutOptions = 0;
let productsWithoutImages = 0;

console.log('Products without options or images:');
products.forEach(p => {
  const opts = p.product_options?.length || 0;
  const imgs = p.product_images?.length || 0;
  
  if (opts === 0 || imgs === 0) {
    console.log(`  - ${p.name}: opts=${opts}, imgs=${imgs}`);
    if (opts === 0) productsWithoutOptions++;
    if (imgs === 0) productsWithoutImages++;
  }
});

console.log(`\nSummary:`);
console.log(`  Products with 0 options: ${productsWithoutOptions}`);
console.log(`  Products with 0 images: ${productsWithoutImages}`);
console.log(`  Total active products: ${products?.length || 0}`);
