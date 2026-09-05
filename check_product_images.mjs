import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: images, error } = await serviceClient
  .from('product_images')
  .select('id, image_url, storage_path, product_id')
  .limit(50);

if (error) {
  console.log(`Error: ${error.message}`);
} else {
  console.log(`Found ${images?.length || 0} product_images records:`);
  
  let orphaned = 0;
  let valid = 0;
  
  images.forEach(img => {
    if (img.product_id) {
      valid++;
    } else {
      orphaned++;
      console.log(`  Orphaned: ${img.id} (no product_id)`);
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`  Assigned to products: ${valid}`);
  console.log(`  Orphaned (no product): ${orphaned}`);
}
