#!/usr/bin/env node
/**
 * FASE 3A: Debug version of population script with detailed error logging
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://leksmflinhohnekbgmgj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM';
const GHL_TOKEN = 'pit-0cf65f40-51a4-4e28-9793-9eb8421e2291';
const GHL_LOCATION_ID = 'vOq7yOWR63XGU4qQ7XWd';

console.log('CONEXIÓN SUPABASE:');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Key: ${SUPABASE_KEY.substring(0, 20)}...`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('TEST 1: Contando registros actuales...');
  const { count, error } = await supabase
    .from('product_metadata')
    .select('*', { count: 'exact', head: true });

  console.log(`  Count: ${count}`);
  console.log(`  Error: ${error?.message || 'ninguno'}`);
  console.log('');

  console.log('TEST 2: Intentando insertar UN registro de prueba...');
  const testRecord = {
    ghl_product_id: 'test-' + Date.now(),
    category: 'test',
    price_min: 99,
    sku: 'TEST-000-0001',
    status: 'test',
    auto_created: false,
  };

  const { data, error: insertError } = await supabase
    .from('product_metadata')
    .insert([testRecord])
    .select();

  if (insertError) {
    console.log(`  ❌ Insert error: ${insertError.message}`);
    console.log(`  Code: ${insertError.code}`);
    console.log(`  Details: ${JSON.stringify(insertError.details)}`);
  } else {
    console.log(`  ✅ Insert exitoso`);
    console.log(`  Record: ${JSON.stringify(data[0])}`);
  }
  console.log('');

  // Cleanup test
  if (!insertError) {
    console.log('TEST 3: Limpiando registro de prueba...');
    await supabase
      .from('product_metadata')
      .delete()
      .eq('ghl_product_id', testRecord.ghl_product_id);
    console.log('  ✅ Limpiado');
  }
}

testConnection().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
