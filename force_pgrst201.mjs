import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('Attempting to force an error that shows all relationships...\n');

// This will fail and show us what PostgREST sees
const { data, error } = await anonClient
  .from('products')
  .select('id, product_images(*)')
  .limit(1);

if (error && error.code === 'PGRST201') {
  console.log('🔴 PGRST201 ERROR TRIGGERED!');
  console.log(`\nError message:\n  ${error.message}\n`);
  
  if (error.details && Array.isArray(error.details)) {
    console.log('Detected relationships:');
    error.details.forEach((detail, i) => {
      console.log(`\n  Relationship ${i+1}:`);
      console.log(`    Message: ${detail.message || detail.embedding}`);
      console.log(`    Cardinality: ${detail.cardinality}`);
      console.log(`    Details: ${detail.relationship}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS:');
  console.log('='.repeat(70));
  console.log(`If more than one relationship is shown, that is the problem.`);
  console.log(`Each should map uniquely to ONE foreign key.`);
  
} else if (error) {
  console.log(`Different error: ${error.message}`);
} else {
  console.log('✅ No error - this is unexpected if PGRST201 was reported');
}
