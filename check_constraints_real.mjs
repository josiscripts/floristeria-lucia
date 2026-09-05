import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Querying table_constraints for product_images...\n');

const { data, error } = await serviceClient
  .rpc('get_table_constraints', {
    table_schema: 'public',
    table_name: 'product_images'
  })
  .catch(async (err) => {
    console.log('RPC not available, attempting direct select...');
    
    // Try direct information_schema query
    const result = await serviceClient
      .from('information_schema_table_constraints')
      .select('constraint_name, constraint_type, table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'product_images');
    
    return result;
  });

if (data && data.length > 0) {
  console.log('Constraints found:');
  data.forEach(row => {
    console.log(`  ${row.constraint_name || 'N/A'} (${row.constraint_type || 'N/A'})`);
  });
} else {
  console.log('Cannot query constraints directly.');
  console.log('Attempting indirect verification...');
  
  // Verify by querying the actual data
  const { data: productImages } = await serviceClient
    .from('product_images')
    .select('id, product_id')
    .limit(1);
  
  if (productImages) {
    console.log(`\n✅ product_images table is accessible`);
    console.log(`   product_id column exists and is queryable`);
  }
}
