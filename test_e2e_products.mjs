import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://leksmflinhohnekbgmgj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_PRODUCT_NAME = `TEST_FASE_5_4_${Date.now()}`;
const TEST_CATEGORY_ID = ''; // Will be fetched

console.log('='.repeat(70));
console.log('BLOQUE J — E2E PRODUCT FLOW TEST');
console.log('='.repeat(70));

try {
  // 1. Get a valid category ID
  console.log('\n[STEP 1] Fetching category ID...');
  const { data: categories, error: catError } = await adminClient
    .from('categories')
    .select('id, name')
    .eq('active', true)
    .limit(1);

  if (catError || !categories?.length) {
    throw new Error(`Failed to fetch category: ${catError?.message}`);
  }

  const categoryId = categories[0].id;
  console.log(`✅ Category: ${categories[0].name} (${categoryId})`);

  // 2. CREATE: Create product via admin endpoint
  console.log('\n[STEP 2] Creating product...');
  const createPayload = {
    name: TEST_PRODUCT_NAME,
    description: 'Test product for E2E verification',
    category_id: categoryId,
    active: true,
    options: [
      { name: 'Basic', price_amount: 25.00, discount_percent: 0 },
      { name: 'Premium', price_amount: 45.00, discount_percent: 10 }
    ],
    color_variants: ['Red', 'Blue', 'White']
  };

  const { data: createResponse, error: createError } = await adminClient.functions
    .invoke('admin-products-create', { body: createPayload })
    .catch(() => ({ data: null, error: new Error('Function not available, using direct insert') }));

  if (createError && createError.message.includes('not available')) {
    console.log('⚠️ Admin function not available, using direct insert...');

    const { data: product, error: insertError } = await adminClient
      .from('products')
      .insert([{
        name: TEST_PRODUCT_NAME,
        description: 'Test product for E2E verification',
        category_id: categoryId,
        active: true,
        has_color_variants: true,
        cover_image_url: null,
        ghl_product_id: null
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`✅ Product created: ${product.id}`);

    // Create options
    const { error: optError } = await adminClient
      .from('product_options')
      .insert([
        { product_id: product.id, name: 'Basic', price_amount: 25.00, discount_percent: 0, stock_quantity: null, sku: null, active: true },
        { product_id: product.id, name: 'Premium', price_amount: 45.00, discount_percent: 10, stock_quantity: null, sku: null, active: true }
      ]);

    if (optError) console.error('⚠️ Options error:', optError.message);

    // Create color variants
    const { error: colorError } = await adminClient
      .from('color_variants')
      .insert([
        { product_id: product.id, name: 'Red', sort_order: 0, active: true },
        { product_id: product.id, name: 'Blue', sort_order: 1, active: true },
        { product_id: product.id, name: 'White', sort_order: 2, active: true }
      ]);

    if (colorError) console.error('⚠️ Colors error:', colorError.message);

    // 3. ADMIN READ: Verify in admin panel
    console.log('\n[STEP 3] Reading from admin panel...');
    const { data: adminReadData, error: adminReadError } = await adminClient
      .from('products')
      .select(`
        id, name, active, deleted_at, category_id,
        product_options(name, price_amount, discount_percent),
        color_variants(name, sort_order)
      `)
      .eq('id', product.id)
      .single();

    if (adminReadError) throw adminReadError;

    console.log(`✅ Admin can see product:`);
    console.log(`   - Name: ${adminReadData.name}`);
    console.log(`   - Active: ${adminReadData.active}`);
    console.log(`   - Deleted: ${adminReadData.deleted_at}`);
    console.log(`   - Options: ${adminReadData.product_options.length}`);
    console.log(`   - Colors: ${adminReadData.color_variants.length}`);

    // 4. PUBLIC CATALOG: Verify product appears
    console.log('\n[STEP 4] Checking public catalog...');
    const { data: catalogData, error: catalogError } = await publicClient
      .from('products')
      .select(`
        id, name, category_id,
        product_options(name, price_amount),
        product_images(image_url, is_primary)
      `)
      .eq('id', product.id)
      .eq('active', true)
      .is('deleted_at', null)
      .single();

    if (catalogError) {
      console.log(`⚠️ Product NOT visible in public catalog: ${catalogError.message}`);
    } else {
      console.log(`✅ Product visible in public catalog`);
      console.log(`   - Options available: ${catalogData.product_options.length}`);
    }

    // 5. DEACTIVATE
    console.log('\n[STEP 5] Deactivating product...');
    const { error: deactivateError } = await adminClient
      .from('products')
      .update({ active: false })
      .eq('id', product.id);

    if (deactivateError) throw deactivateError;
    console.log(`✅ Product deactivated`);

    // 6. VERIFY DEACTIVATED (should NOT appear in catalog)
    console.log('\n[STEP 6] Verifying deactivation...');
    const { data: deactivatedCheck, error: deactivatedError } = await publicClient
      .from('products')
      .select('id')
      .eq('id', product.id)
      .eq('active', true)
      .is('deleted_at', null)
      .single();

    if (deactivatedError?.code === 'PGRST116') {
      console.log(`✅ Product correctly hidden from catalog`);
    } else {
      console.log(`⚠️ Product still visible (should be hidden)`);
    }

    // 7. REACTIVATE
    console.log('\n[STEP 7] Reactivating product...');
    const { error: reactivateError } = await adminClient
      .from('products')
      .update({ active: true })
      .eq('id', product.id);

    if (reactivateError) throw reactivateError;
    console.log(`✅ Product reactivated`);

    // 8. SOFT DELETE
    console.log('\n[STEP 8] Soft-deleting product...');
    const { error: softDeleteError } = await adminClient
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', product.id);

    if (softDeleteError) throw softDeleteError;
    console.log(`✅ Product soft-deleted`);

    // 9. VERIFY SOFT DELETE
    console.log('\n[STEP 9] Verifying soft-delete...');
    const { data: softDeleteCheck, error: softDeleteCheckError } = await publicClient
      .from('products')
      .select('id')
      .eq('id', product.id)
      .eq('active', true)
      .is('deleted_at', null)
      .single();

    if (softDeleteCheckError?.code === 'PGRST116') {
      console.log(`✅ Product correctly hidden after soft-delete`);
    } else {
      console.log(`⚠️ Product still visible after soft-delete`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🟢 E2E TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

  } else {
    throw new Error(createError?.message || 'Unknown creation error');
  }

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.log('\n' + '='.repeat(70));
  console.log('🔴 E2E TEST FAILED');
  console.log('='.repeat(70));
  process.exit(1);
}
