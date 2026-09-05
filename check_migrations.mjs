import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: migrations, error } = await serviceClient
  .from('schema_migrations')
  .select('name')
  .order('name', { ascending: false })
  .limit(20);

if (error) {
  console.log('Could not query schema_migrations directly');
} else if (migrations) {
  console.log('Applied migrations (latest 20):');
  migrations.forEach(m => {
    if (m.name.includes('170') || m.name.includes('180') || m.name.includes('product_images')) {
      console.log(`  ✅ ${m.name}`);
    }
  });
}
