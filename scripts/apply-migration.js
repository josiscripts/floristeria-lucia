#!/usr/bin/env node
/**
 * Apply migration to Supabase: Add category and sku columns
 * Run: node scripts/apply-migration.js
 */

const fs = require('fs');
const path = require('path');

// Read migration SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/add_category_sku_to_product_metadata.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('Migration SQL to be applied:');
console.log('═'.repeat(60));
console.log(migrationSQL);
console.log('═'.repeat(60));
console.log('\nTo apply this migration:');
console.log('\n1. Go to Supabase Dashboard');
console.log('2. Open SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Execute');
console.log('\nOR');
console.log('\n1. Run: npx supabase migrations up');
console.log('2. Then: npx supabase gen types typescript > src/integrations/supabase/types.ts');
console.log('\nAfter migration, the types will be auto-generated.');
