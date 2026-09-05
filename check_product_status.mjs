import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

console.log('[CHECK] Querying products...');
const { data, error, count } = await supabase
  .from('products')
  .select('id, name, active, deleted_at, category, created_at', { count: 'exact' });

if (error) {
  console.error('[ERROR]', error);
  process.exit(1);
}

console.log(`\n[RESULT] Total products: ${count}`);
console.log(`\n[ACTIVE] Products with active=true AND deleted_at IS NULL:`);
const active = data.filter(p => p.active === true && p.deleted_at === null);
console.log(`  Count: ${active.length}`);
active.slice(0, 5).forEach(p => {
  console.log(`  - ${p.name} (${p.category}) [${p.id}]`);
});

console.log(`\n[INACTIVE] Products with active=false AND deleted_at IS NULL:`);
const inactive = data.filter(p => p.active === false && p.deleted_at === null);
console.log(`  Count: ${inactive.length}`);
inactive.slice(0, 5).forEach(p => {
  console.log(`  - ${p.name} (${p.category}) [${p.id}]`);
});

console.log(`\n[DELETED] Products with deleted_at IS NOT NULL:`);
const deleted = data.filter(p => p.deleted_at !== null);
console.log(`  Count: ${deleted.length}`);
deleted.slice(0, 5).forEach(p => {
  console.log(`  - ${p.name} (${p.category}) [deleted: ${p.deleted_at}]`);
});

console.log('\n[SUMMARY]');
console.log(`  Public-visible (active=true, deleted_at=NULL): ${active.length}`);
console.log(`  Inactive (active=false, deleted_at=NULL): ${inactive.length}`);
console.log(`  Soft-deleted (deleted_at IS NOT NULL): ${deleted.length}`);
