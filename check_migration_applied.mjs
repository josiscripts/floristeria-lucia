import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking if legacy_ghl_product_id column exists (proof migration ran)...\n');

const { data: columnInfo, error } = await serviceClient
  .from('information_schema_columns')
  .select('column_name, data_type')
  .eq('table_schema', 'public')
  .eq('table_name', 'product_images');

if (error) {
  console.log('⚠️  Cannot query information_schema directly');
  console.log('Checking by direct column access...');
  
  const { data: sample, error: sampleError } = await serviceClient
    .from('product_images')
    .select('legacy_ghl_product_id')
    .limit(1);
  
  if (sampleError && sampleError.code === '42703') {
    console.log('\n❌ Column "legacy_ghl_product_id" does NOT exist');
    console.log('   Migration 20260905170100 was NOT applied');
  } else if (sampleError) {
    console.log(`\n⚠️  Error: ${sampleError.message}`);
  } else {
    console.log('\n✅ Column "legacy_ghl_product_id" EXISTS');
    console.log('   Migration 20260905170100 WAS applied');
  }
} else if (columnInfo) {
  const hasLegacyColumn = columnInfo.some(c => c.column_name === 'legacy_ghl_product_id');
  const hasGhlColumn = columnInfo.some(c => c.column_name === 'ghl_product_id');
  
  console.log('Columns in product_images:');
  columnInfo.forEach(c => {
    const marker = c.column_name === 'legacy_ghl_product_id' ? ' ← RENAMED' : 
                   c.column_name === 'ghl_product_id' ? ' ← SHOULD NOT EXIST' : '';
    console.log(`  ${c.column_name} (${c.data_type})${marker}`);
  });
  
  console.log(`\n${hasLegacyColumn ? '✅' : '❌'} legacy_ghl_product_id: ${hasLegacyColumn ? 'EXISTS' : 'MISSING'}`);
  console.log(`${!hasGhlColumn ? '✅' : '❌'} ghl_product_id: ${hasGhlColumn ? 'STILL EXISTS (problem!)' : 'REMOVED'}`);
}
