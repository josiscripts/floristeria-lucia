import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testProductName = 'TEST_FASE_5_3_' + Date.now();

console.log('1. Creating test product...');
const { data: product, error: productError } = await serviceClient
  .from('products')
  .insert({
    name: testProductName,
    category: 'ramos',
    active: true,
    has_color_variants: false,
    cover_image_url: '/assets/placeholder.png',
  })
  .select('id')
  .single();

if (productError) {
  console.log(`❌ Failed: ${productError.message}`);
  process.exit(1);
}

const productId = product.id;
console.log(`✅ Product created: ${productId}`);

console.log('\n2. Adding price option...');
const { data: option, error: optionError } = await serviceClient
  .from('product_options')
  .insert({
    product_id: productId,
    name: 'Tamaño único',
    price_amount: 2999,
    discount_percent: 0,
    stock_quantity: 100,
    sku: 'TEST-SKU-' + Date.now(),
  })
  .select('id')
  .single();

if (optionError) {
  console.log(`❌ Failed: ${optionError.message}`);
  process.exit(1);
}

console.log(`✅ Option created: ${option.id}`);

console.log('\n3. Adding image...');
const { data: image, error: imageError } = await serviceClient
  .from('product_images')
  .insert({
    product_id: productId,
    image_url: '/assets/girasoles.jpg',
    is_primary: true,
    sort_order: 0,
  })
  .select('id')
  .single();

if (imageError) {
  console.log(`❌ Failed: ${imageError.message}`);
  process.exit(1);
}

console.log(`✅ Image created: ${image.id}`);

console.log('\n4. Verifying from anon client (as catalog would)...');
const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const { data: verified } = await anonClient
  .from('products')
  .select(`
    id, name, category,
    product_options(id, name, price_final),
    product_images(id, image_url, is_primary)
  `)
  .eq('id', productId)
  .single();

if (verified) {
  console.log(`✅ Verified from anon:`);
  console.log(`   Name: ${verified.name}`);
  console.log(`   Category: ${verified.category}`);
  console.log(`   Options: ${verified.product_options?.length}`);
  console.log(`   Images: ${verified.product_images?.length}`);
  if (verified.product_images?.length > 0) {
    console.log(`   Image URL: ${verified.product_images[0].image_url}`);
  }
  
  console.log(`\n📌 TEST PRODUCT CREATED: ${testProductName}`);
  console.log(`   ID: ${productId}`);
  console.log(`   URL: http://localhost:3003/catalogo`);
  console.log(`   (Should see this product in the catalog)`);
} else {
  console.log('❌ Failed to verify');
}
