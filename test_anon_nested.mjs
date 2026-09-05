import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('Testing ANON access to product_options:');
const { data: opts, error: optsErr } = await anonClient
  .from('product_options')
  .select('id')
  .limit(1);
console.log(optsErr ? `❌ Error: ${optsErr.message}` : `✅ Can read (found ${opts?.length})`);

console.log('\nTesting ANON access to color_variants:');
const { data: colors, error: colorsErr } = await anonClient
  .from('color_variants')
  .select('id')
  .limit(1);
console.log(colorsErr ? `❌ Error: ${colorsErr.message}` : `✅ Can read (found ${colors?.length})`);

console.log('\nTesting ANON access to product_images:');
const { data: images, error: imagesErr } = await anonClient
  .from('product_images')
  .select('id')
  .limit(1);
console.log(imagesErr ? `❌ Error: ${imagesErr.message}` : `✅ Can read (found ${images?.length})`);
