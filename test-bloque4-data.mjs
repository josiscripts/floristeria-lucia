#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";
const GHL_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "vOq7yOWR63XGU4qQ7XWd";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('\\n========== BLOQUE 4 - REAL DATA VERIFICATION ==========\\n');

// Phase 5: Supabase verification
async function verifySupabase() {
  console.log('\\n--- SUPABASE DATA CHECK ---\\n');

  try {
    // Count products
    const { count: productCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (prodError) {
      console.log(`✗ Products query error: ${prodError.message}`);
      console.log(`  Table may not exist yet. Status: NOT DEMOSTRADO`);
    } else {
      console.log(`✓ Products: ${productCount || 0} [DEMOSTRADO]`);
    }

    // Count product_options
    const { count: optCount, error: optError } = await supabase
      .from('product_options')
      .select('*', { count: 'exact', head: true });

    if (optError) {
      console.log(`✗ Product options query error: ${optError.message}`);
      console.log(`  Table may not exist yet. Status: NOT DEMOSTRADO`);
    } else {
      console.log(`✓ Product options: ${optCount || 0} [DEMOSTRADO]`);
    }

    // Count color_variants
    const { count: colorCount, error: colorError } = await supabase
      .from('color_variants')
      .select('*', { count: 'exact', head: true });

    if (colorError) {
      console.log(`✗ Color variants query error: ${colorError.message}`);
      console.log(`  Table may not exist yet. Status: NOT DEMOSTRADO`);
    } else {
      console.log(`✓ Color variants: ${colorCount || 0} [DEMOSTRADO]`);
    }

    // Count product_images
    const { count: imgCount, error: imgError } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true });

    if (imgError) {
      console.log(`✗ Product images query error: ${imgError.message}`);
      console.log(`  Table may not exist yet. Status: NOT DEMOSTRADO`);
    } else {
      console.log(`✓ Product images: ${imgCount || 0} [DEMOSTRADO]`);
    }

    // Check orphans
    console.log('\\n--- ORPHAN RECORDS CHECK ---\\n');

    const { data: orphanOptions, error: orphanOptError } = await supabase
      .rpc('check_orphan_product_options');

    if (orphanOptError && orphanOptError.code !== 'PGRST201') {
      console.log(`✗ Orphan check error: ${orphanOptError.message}`);
    } else {
      const orphanCount = Array.isArray(orphanOptions) ? orphanOptions.length : 0;
      console.log(`✓ Orphan product_options: ${orphanCount} [${orphanCount === 0 ? 'DEMOSTRADO' : 'FAILED'}]`);
    }

    // List first 5 products
    console.log('\\n--- FIRST PRODUCTS SAMPLE ---\\n');
    const { data: firstProducts, error: listError } = await supabase
      .from('products')
      .select('id, name, ghl_product_id, category, active, created_at')
      .limit(5);

    if (listError) {
      console.log(`✗ Cannot list products: ${listError.message}`);
    } else if (firstProducts && firstProducts.length > 0) {
      firstProducts.forEach((p, i) => {
        console.log(`${i+1}. ${p.name} (id: ${p.id.substring(0, 8)}..., ghl: ${p.ghl_product_id})`);
      });
      console.log('[DEMOSTRADO]');
    } else {
      console.log('No products found. [NO DEMOSTRADO]');
    }

  } catch (error) {
    console.log(`✗ Supabase connection error: ${error.message}`);
  }
}

// Phase 5: GHL verification
async function verifyGHL() {
  console.log('\\n--- GHL DATA CHECK ---\\n');

  return new Promise((resolve) => {
    const reqUrl = `https://services.higherlevel.com/v1/products?locationId=${GHL_LOCATION_ID}&limit=100`;

    const options = {
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(reqUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.products) {
            console.log(`✓ GHL Products: ${response.products.length} [DEMOSTRADO]`);

            // Sample first product details
            if (response.products.length > 0) {
              const p = response.products[0];
              console.log(`  Sample: ${p.name || 'N/A'} (id: ${p.id})`);
              console.log(`  Prices: ${p.prices ? p.prices.length : 0}`);
            }
          } else {
            console.log(`✗ Unexpected GHL response format. [NOT DEMOSTRADO]`);
          }
        } catch (e) {
          console.log(`✗ Failed to parse GHL response: ${e.message} [FAILED]`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`✗ GHL API error: ${err.message} [FAILED]`);
      resolve();
    });
  });
}

// Run all checks
(async () => {
  await verifySupabase();
  await verifyGHL();
  console.log('\\n========== END VERIFICATION ==========\\n');
})();
