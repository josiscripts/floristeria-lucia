import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SELECT = `
  id,
  name,
  product_options (
    id,
    name,
    price_final
  ),
  color_variants (
    id,
    name
  ),
  product_images (
    id,
    image_url,
    is_primary
  )
`;

console.log('With ANON client:');
const { data: anonData, error: anonError } = await anonClient
  .from('products')
  .select(SELECT)
  .eq('active', true)
  .is('deleted_at', null)
  .limit(1);

if (anonError) {
  console.log(`❌ Error: ${anonError.message}`);
  if (anonError.details) console.log(`   Details: ${anonError.details}`);
} else {
  if (anonData?.length > 0) {
    const p = anonData[0];
    console.log(`✅ Query succeeded`);
    console.log(`   Product: ${p.name}`);
    console.log(`   Options: ${p.product_options?.length || 0}`);
    console.log(`   Images: ${p.product_images?.length || 0}`);
    console.log(`   Colors: ${p.color_variants?.length || 0}`);
  }
}

console.log('\nWith SERVICE ROLE client:');
const { data: serviceData, error: serviceError } = await serviceClient
  .from('products')
  .select(SELECT)
  .eq('active', true)
  .is('deleted_at', null)
  .limit(1);

if (serviceError) {
  console.log(`❌ Error: ${serviceError.message}`);
} else {
  if (serviceData?.length > 0) {
    const p = serviceData[0];
    console.log(`✅ Query succeeded`);
    console.log(`   Product: ${p.name}`);
    console.log(`   Options: ${p.product_options?.length || 0}`);
    console.log(`   Images: ${p.product_images?.length || 0}`);
    console.log(`   Colors: ${p.color_variants?.length || 0}`);
  }
}
