/**
 * FASE 5.3 TEST: Catalog Visibility Real
 *
 * Traces the complete flow from Supabase → Frontend → Screen
 *
 * STEP 1: Supabase query
 * STEP 2: Hook receives data
 * STEP 3: catalogo.tsx processes data
 * STEP 4: ProductCard renders
 * STEP 5: Browser displays
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('\n' + '='.repeat(70));
console.log('FASE 5.3 - CATALOG VISIBILITY: COMPLETE FLOW TEST');
console.log('='.repeat(70));

// ============================================================================
// STEP 1: Query Supabase exactly as useSupabaseProducts does
// ============================================================================
console.log('\n📍 STEP 1: Query Supabase (anon client)');

const { data: supabaseData, error: supabaseError } = await anonClient
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

if (supabaseError) {
  console.log(`❌ FAIL: ${supabaseError.message}`);
  process.exit(1);
}

console.log(`✅ Supabase returned: ${supabaseData?.length || 0} products`);
if (supabaseData?.length === 0) {
  console.log('⚠️  WARNING: Supabase returned 0 products. Catalog will be empty.');
}

// ============================================================================
// STEP 2: Check data structure
// ============================================================================
console.log('\n📍 STEP 2: Data structure validation');

if (supabaseData && supabaseData.length > 0) {
  const sample = supabaseData[0];
  console.log('Sample product from Supabase:');
  console.log(`  - id: ${sample.id}`);
  console.log(`  - name: ${sample.name}`);
  console.log(`  - active: ${sample.active}`);
  console.log(`  - category: ${sample.category}`);
  console.log(`  - options: ${sample.product_options?.length || 0}`);
  console.log(`  - images: ${sample.product_images?.length || 0}`);
  console.log(`  - colors: ${sample.color_variants?.length || 0}`);
}

// ============================================================================
// STEP 3: Simulate conversion (supabaseProductToLegacy)
// ============================================================================
console.log('\n📍 STEP 3: Convert Supabase format to Legacy');

function supabaseProductToLegacy(sp) {
  const primaryOption = sp.product_options?.[0];
  const tertiaryOption = sp.product_options?.[2];

  const primaryImage = sp.product_images?.find((img) => img.is_primary) ||
    sp.product_images?.find((img) => !img.color_variant_id) ||
    sp.product_images?.[0] || {
      image_url: sp.cover_image_url || '/placeholder.png',
    };

  const colors = sp.has_color_variants
    ? sp.color_variants?.map((v) => v.name)
    : undefined;

  return {
    id: sp.id,
    name: sp.name,
    category: sp.category || 'ramos',
    priceMin: primaryOption?.price_final || primaryOption?.price_amount || 0,
    priceMax: tertiaryOption?.price_final || tertiaryOption?.price_amount,
    image: primaryImage.image_url || sp.cover_image_url || '/placeholder.png',
    description: sp.description || '',
    colors: colors && colors.length > 0 ? colors : undefined,
    ghl_product_id: sp.ghl_product_id,
  };
}

const legacyProducts = supabaseData.map(supabaseProductToLegacy);

console.log(`✅ Converted ${legacyProducts.length} products to Legacy format`);

if (legacyProducts.length > 0) {
  const sample = legacyProducts[0];
  console.log('Sample legacy product:');
  console.log(`  - id: ${sample.id}`);
  console.log(`  - name: ${sample.name}`);
  console.log(`  - category: ${sample.category}`);
  console.log(`  - priceMin: ${sample.priceMin}`);
  console.log(`  - image: ${sample.image}`);
  console.log(`  - colors: ${sample.colors ? sample.colors.join(', ') : 'none'}`);
}

// ============================================================================
// STEP 4: Simulate filtering (as catalogo.tsx does)
// ============================================================================
console.log('\n📍 STEP 4: Apply filters (as catalogo.tsx does)');

const testFilters = [
  { name: 'No filter', categoria: undefined, q: undefined },
  { name: 'Category: ramos', categoria: 'ramos', q: undefined },
  { name: 'Category: plantas', categoria: 'plantas', q: undefined },
  { name: 'Search: "rosa"', categoria: undefined, q: 'rosa' },
];

for (const filter of testFilters) {
  const filtered = legacyProducts.filter((p) => {
    if (filter.categoria && p.category !== filter.categoria) return false;
    if (filter.q) {
      const query = filter.q.toLowerCase();
      if (!`${p.name} ${p.description}`.toLowerCase().includes(query)) return false;
    }
    return true;
  });
  console.log(`  ${filter.name}: ${filtered.length} products`);
}

// ============================================================================
// STEP 5: Validate products can be rendered
// ============================================================================
console.log('\n📍 STEP 5: Validate products can be rendered in ProductCard');

const criticalFields = ['id', 'name', 'category', 'image', 'priceMin'];
let allValid = true;

for (const product of legacyProducts) {
  for (const field of criticalFields) {
    if (!product[field]) {
      console.log(`❌ CRITICAL: Product ${product.id} missing field: ${field}`);
      allValid = false;
    }
  }
}

if (allValid) {
  console.log(`✅ All ${legacyProducts.length} products have critical fields`);
} else {
  console.log('❌ Some products are missing critical fields and will fail to render');
}

// ============================================================================
// STEP 6: End-to-end summary
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('FLOW SUMMARY');
console.log('='.repeat(70));

console.log(`
SUPABASE
  ↓
  ${supabaseData?.length || 0} products fetched
  ↓
supabaseProductToLegacy()
  ↓
  ${legacyProducts.length} products converted
  ↓
catalogo.tsx filters
  ↓
  ${legacyProducts.length} products after filter (no category)
  ↓
ProductCard renders
  ↓
Browser displays
`);

if (supabaseData?.length === 0) {
  console.log('❌ PROBLEM: Supabase returned 0 products');
  console.log('   → Catalog will be empty');
} else if (legacyProducts.length === 0) {
  console.log('❌ PROBLEM: Conversion resulted in 0 products');
  console.log('   → Catalog will be empty');
} else if (!allValid) {
  console.log('❌ PROBLEM: Some products have missing fields');
  console.log('   → Some products will fail to render');
} else {
  console.log('✅ SUCCESS: Full flow working correctly');
  console.log(`   → Catalog should display ${legacyProducts.length} products`);
}

console.log('='.repeat(70) + '\n');

process.exit(allValid && legacyProducts.length > 0 ? 0 : 1);
