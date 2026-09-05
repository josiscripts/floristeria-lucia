import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Getting all foreign keys on product_images table...\n');

// Query information_schema to get ALL foreign keys
const { data: fks, error } = await serviceClient
  .rpc('get_table_foreign_keys', {
    table_name: 'product_images',
    schema_name: 'public'
  })
  .catch(() => {
    console.log('RPC not available, using direct query...');
    return {};
  });

if (fks && fks.length > 0) {
  console.log('Foreign keys found via RPC:');
  fks.forEach(fk => {
    console.log(`  ${fk.constraint_name}: ${fk.column_name} → ${fk.referenced_table}.${fk.referenced_column}`);
  });
} else {
  // Fallback: Try information_schema query
  const { data: tableInfo } = await serviceClient
    .from('information_schema.table_constraints')
    .select('*')
    .eq('table_name', 'product_images')
    .eq('constraint_type', 'FOREIGN KEY')
    .catch(() => ({data: []}));
    
  if (tableInfo?.length > 0) {
    console.log('Foreign keys found via information_schema:');
    tableInfo.forEach(fk => {
      console.log(`  ${fk.constraint_name}: ${fk.table_name}`);
    });
  }
}

// Direct approach: Query by checking what PostgREST sees
console.log('\nChecking PostgREST relationship detection...\n');

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Try to select with products relationship
const { data: data1, error: err1 } = await anonClient
  .from('product_images')
  .select('id, products(id)')
  .limit(1);

if (err1) {
  console.log(`❌ product_images → products: ${err1.message}`);
  console.log(`   Code: ${err1.code}`);
} else {
  console.log(`✅ product_images → products: OK`);
}

// Try products → product_images
const { data: data2, error: err2 } = await anonClient
  .from('products')
  .select('id, product_images(id)')
  .limit(1);

if (err2) {
  console.log(`❌ products → product_images: ${err2.message}`);
  console.log(`   Code: ${err2.code}`);
} else {
  console.log(`✅ products → product_images: OK`);
}
