/**
 * FASE 5.3 COMPREHENSIVE TEST
 *
 * Simulates the EXACT sequence that happens when a user loads /catalogo
 */

import { createClient } from '@supabase/supabase-js';

console.log('\n' + '='.repeat(80));
console.log('FASE 5.3 — COMPREHENSIVE END-TO-END CATALOG TEST');
console.log('='.repeat(80));

// ============================================================================
// STEP 1: Client creation (as happens in browser)
// ============================================================================
console.log('\n📍 STEP 1: Creating Supabase client (anon, as browser does)');

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

console.log('✅ Client created');

// ============================================================================
// STEP 2: Execute hook query (useSupabaseProducts)
// ============================================================================
console.log('\n📍 STEP 2: Execute useSupabaseProducts hook query');

const query = anonClient
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

const { data: supabaseData, error: queryError } = await query;

if (queryError) {
  console.log(`❌ FATAL: Hook query failed`);
  console.log(`   Error: ${queryError.message}`);
  console.log(`   Code: ${queryError.code}`);
  process.exit(1);
}

console.log(`✅ Hook query succeeded: ${supabaseData?.length || 0} products`);

// ============================================================================
// STEP 3: Simulate conversion (supabaseProductToLegacy)
// ============================================================================
console.log('\n📍 STEP 3: Convert Supabase → Legacy format');

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

const productsToUse = supabaseData.map(supabaseProductToLegacy);

console.log(`✅ Converted ${productsToUse.length} products`);

// ============================================================================
// STEP 4: Simulate filtering (as catalogo.tsx does)
// ============================================================================
console.log('\n📍 STEP 4: Apply filters');

const categoria = undefined; // No category filter
const q = undefined; // No search
const favoritos = undefined; // Not filtering by favorites

const filtered = productsToUse.filter((p) => {
  if (categoria && p.category !== categoria) return false;
  if (favoritos && !favoritos.includes(p.id)) return false;
  if (q) {
    const query_lower = q.toLowerCase();
    if (!`${p.name} ${p.description}`.toLowerCase().includes(query_lower)) return false;
  }
  return true;
});

console.log(`✅ After filtering: ${filtered.length} products`);

// ============================================================================
// STEP 5: Validate products can render
// ============================================================================
console.log('\n📍 STEP 5: Validate products for rendering');

const CRITICAL_FIELDS = ['id', 'name', 'category', 'image'];
const RECOMMENDED_FIELDS = ['priceMin', 'priceMax', 'description'];

let criticalErrors = 0;
let recommendedWarnings = 0;

filtered.forEach((p) => {
  CRITICAL_FIELDS.forEach((field) => {
    if (!p[field]) {
      if (criticalErrors < 5) console.log(`  ❌ ${p.name}: missing ${field}`);
      criticalErrors++;
    }
  });

  RECOMMENDED_FIELDS.forEach((field) => {
    if (!p[field]) {
      if (recommendedWarnings < 3) console.log(`  ⚠️  ${p.name}: missing ${field}`);
      recommendedWarnings++;
    }
  });
});

if (criticalErrors > 0) {
  console.log(`\n❌ CRITICAL: ${criticalErrors} total critical field violations`);
} else {
  console.log(`✅ All products have critical fields`);
}

if (recommendedWarnings > 0) {
  console.log(`⚠️  ${recommendedWarnings} total recommended field violations`);
}

// ============================================================================
// STEP 6: Check ProductCard rendering requirements
// ============================================================================
console.log('\n📍 STEP 6: Check ProductCard rendering requirements');

let renderableCount = 0;
let missingImageCount = 0;
let zeroPrice = 0;

filtered.forEach((p) => {
  let canRender = true;

  if (p.image === '/placeholder.png') {
    missingImageCount++;
  }

  if (!p.priceMin || p.priceMin === 0) {
    zeroPrice++;
    canRender = false;
  }

  if (canRender) renderableCount++;
});

console.log(`  Products with images: ${filtered.length - missingImageCount}/${filtered.length}`);
console.log(`  Products with prices: ${filtered.length - zeroPrice}/${filtered.length}`);
console.log(`  Fully renderable products: ${renderableCount}/${filtered.length}`);

// ============================================================================
// STEP 7: Final diagnostic
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC RESULTS');
console.log('='.repeat(80));

console.log(`
FLOW:
  Supabase query    : ✅ ${supabaseData?.length} products
  Conversion        : ✅ ${productsToUse.length} products
  After filters     : ✅ ${filtered.length} products
  Critical errors   : ${criticalErrors > 0 ? '❌ ' + criticalErrors : '✅ 0'}
  Recommended issues: ${recommendedWarnings > 0 ? '⚠️  ' + recommendedWarnings : '✅ 0'}
  Renderable        : ${renderableCount === filtered.length ? '✅ All' : `⚠️  ${renderableCount}/${filtered.length}`}

CATALOG VISIBILITY:
  Expected on screen: ${filtered.length} product cards
  Missing images    : ${missingImageCount}
  Missing prices    : ${zeroPrice}
  Status            : ${filtered.length > 0 ? '✅ Should render' : '❌ NO PRODUCTS'}
`);

if (filtered.length === 0) {
  console.log('🔴 CRITICAL: Catalog will be EMPTY!');
} else if (zeroPrice > filtered.length * 0.5) {
  console.log('🟡 WARNING: Many products lack prices');
} else if (missingImageCount > filtered.length * 0.5) {
  console.log('🟡 WARNING: Many products will show placeholders');
} else {
  console.log('🟢 SUCCESS: Catalog should render correctly');
}

console.log('='.repeat(80) + '\n');

process.exit(filtered.length > 0 && zeroPrice === 0 ? 0 : 1);
