import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  process.stdout.write(`\n▶ ${name}... `);
  try {
    await fn();
    console.log('✅ PASS');
    testsPassed++;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    testsFailed++;
  }
}

async function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg} (expected: ${expected}, got: ${actual})`);
  }
}

async function assertExists(value, msg) {
  if (!value) {
    throw new Error(`${msg} (got: ${value})`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('FASE 5.2 — END-TO-END PRODUCT SYSTEM TEST SUITE');
console.log('='.repeat(70));

// ============================================================================
// 1. READ TESTS - Verify public catalog sees Supabase products
// ============================================================================
console.log('\n\n█ SECTION 1: READ TESTS (Catalog visibility)');

await test('1.1 Anon client can query active products', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select('id, name, active, deleted_at')
    .eq('active', true)
    .is('deleted_at', null)
    .limit(5);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No active products found');
});

await test('1.2 Anon client sees nested product_images', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select(`
      id, name,
      product_images (id, image_url, is_primary)
    `)
    .eq('active', true)
    .is('deleted_at', null)
    .limit(3);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No products');
});

await test('1.3 Anon client sees product_options nested', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select(`
      id, name,
      product_options (id, name, price_final)
    `)
    .eq('active', true)
    .is('deleted_at', null)
    .limit(3);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No products');
});

await test('1.4 Anon client sees color_variants nested', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select(`
      id, name, has_color_variants,
      color_variants (id, name)
    `)
    .eq('active', true)
    .is('deleted_at', null)
    .limit(3);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No products');
});

// ============================================================================
// 2. RLS ENFORCEMENT TESTS
// ============================================================================
console.log('\n\n█ SECTION 2: RLS ENFORCEMENT TESTS');

await test('2.1 Anon cannot see deleted products', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select('id')
    .not('deleted_at', 'is', null)
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) throw new Error('RLS failed: anon can see deleted products');
});

await test('2.2 Anon cannot see inactive products', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select('id')
    .eq('active', false)
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) throw new Error('RLS failed: anon can see inactive products');
});

await test('2.3 Service role CAN see all products (including deleted)', async () => {
  const { data, error } = await serviceClient
    .from('products')
    .select('id, active, deleted_at')
    .limit(1);

  if (error) throw error;
  // Service role should have full access regardless of RLS
});

// ============================================================================
// 3. CREATE TEST (via service role, since anon likely can't create)
// ============================================================================
console.log('\n\n█ SECTION 3: CREATE TEST');

let createdProductId;

await test('3.1 Service role can CREATE product', async () => {
  const { data, error } = await serviceClient
    .from('products')
    .insert({
      name: 'TEST_PRODUCT_' + Date.now(),
      category: 'ramos',
      active: true,
      has_color_variants: false,
      cover_image_url: '/test.jpg'
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!data || !data.id) throw new Error('No ID returned');

  createdProductId = data.id;
});

await test('3.2 Created product visible to anon (if active)', async () => {
  if (!createdProductId) throw new Error('No product to verify');

  const { data, error } = await anonClient
    .from('products')
    .select('id, name')
    .eq('id', createdProductId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Product not visible to anon');
});

await test('3.3 Can CREATE product_options', async () => {
  if (!createdProductId) throw new Error('No product');

  const { data, error } = await serviceClient
    .from('product_options')
    .insert({
      product_id: createdProductId,
      name: 'Test Option',
      price_amount: 100,
      discount_percent: 0,
      stock_quantity: 10,
      sku: 'TEST-SKU-' + Date.now()
    })
    .select('id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Option not created');
});

await test('3.4 Anon can read created product with nested options', async () => {
  if (!createdProductId) throw new Error('No product');

  const { data, error } = await anonClient
    .from('products')
    .select(`
      id, name,
      product_options (id, name, price_final)
    `)
    .eq('id', createdProductId)
    .single();

  if (error) throw error;
  if (!data?.product_options || data.product_options.length === 0) {
    throw new Error('Options not visible to anon');
  }
});

// ============================================================================
// 4. UPDATE TEST
// ============================================================================
console.log('\n\n█ SECTION 4: UPDATE TEST');

await test('4.1 Service role can UPDATE product', async () => {
  if (!createdProductId) throw new Error('No product');

  const newName = 'UPDATED_' + Date.now();
  const { data, error } = await serviceClient
    .from('products')
    .update({ name: newName })
    .eq('id', createdProductId)
    .select('name')
    .single();

  if (error) throw error;
  if (data?.name !== newName) throw new Error('Update failed');
});

await test('4.2 Anon sees updated product data', async () => {
  if (!createdProductId) throw new Error('No product');

  const { data, error } = await anonClient
    .from('products')
    .select('name')
    .eq('id', createdProductId)
    .single();

  if (error) throw error;
  if (!data?.name.includes('UPDATED')) throw new Error('Update not visible');
});

// ============================================================================
// 5. SOFT DELETE TEST
// ============================================================================
console.log('\n\n█ SECTION 5: SOFT DELETE TEST');

await test('5.1 Service role can soft-delete product', async () => {
  if (!createdProductId) throw new Error('No product');

  const { error } = await serviceClient
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', createdProductId);

  if (error) throw error;
});

await test('5.2 Deleted product invisible to anon', async () => {
  if (!createdProductId) throw new Error('No product');

  const { data, error } = await anonClient
    .from('products')
    .select('id')
    .eq('id', createdProductId);

  if (error) throw error;
  if (data && data.length > 0) throw new Error('Deleted product still visible to anon');
});

await test('5.3 Service role still sees deleted product', async () => {
  if (!createdProductId) throw new Error('No product');

  const { data, error } = await serviceClient
    .from('products')
    .select('deleted_at')
    .eq('id', createdProductId)
    .single();

  if (error) throw error;
  if (!data?.deleted_at) throw new Error('Service role cannot see deleted_at');
});

// ============================================================================
// 6. PAGINATION TEST
// ============================================================================
console.log('\n\n█ SECTION 6: PAGINATION TEST');

await test('6.1 Can fetch first 10 active products', async () => {
  const { data, error } = await anonClient
    .from('products')
    .select('id')
    .eq('active', true)
    .is('deleted_at', null)
    .limit(10);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No products');
});

// ============================================================================
// 7. FULL CATALOG QUERY (like real Catalog page)
// ============================================================================
console.log('\n\n█ SECTION 7: FULL CATALOG QUERY');

await test('7.1 Complete catalog query works', async () => {
  const { data, error } = await anonClient
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

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No products in catalog query');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! FASE 5.2 IS VERIFIED.');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed.`);
  process.exit(1);
}
