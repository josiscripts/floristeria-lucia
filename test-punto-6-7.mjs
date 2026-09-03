#!/usr/bin/env node

/**
 * VALIDACIÓN PUNTOS 6 Y 7 - SKU + MULTIPRECIOS
 * Script de prueba directa contra Supabase + GHL
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

console.log('='.repeat(60));
console.log('VALIDACIÓN PUNTOS 6-7: SKU AUTOMÁTICO + MULTIPRECIOS');
console.log('='.repeat(60));
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!GHL_TOKEN || !GHL_LOCATION_ID) {
  console.error('ERROR: Falta GHL_TOKEN o GHL_LOCATION_ID');
  process.exit(1);
}

// Helper functions
async function supabaseQuery(query, values = []) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, values }),
    }
  );
  const data = await response.json();
  return data;
}

async function supabaseSelect(table, filters = {}) {
  let query = `${SUPABASE_URL}/rest/v1/${table}?select=*`;

  for (const [key, value] of Object.entries(filters)) {
    query += `&${key}=eq.${value}`;
  }

  const response = await fetch(query, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  return response.json();
}

async function ghlGetPrices(productId) {
  const response = await fetch(
    `https://services.higherlevel.com/v1/products/${productId}/prices?locationId=${GHL_LOCATION_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  return data;
}

// Test functions
async function testSKUGeneration() {
  console.log('PASO 1: PROBAR GENERACIÓN DE SKU');
  console.log('-'.repeat(60));

  // Create test product with options using direct DB
  const testProduct = {
    name: `TEST PUNTO 6 - SKU SECUENCIAL - ${Date.now()}`,
    ghl_product_id: `test-sku-${Date.now()}`,
    category: 'ramos',
    active: true,
  };

  console.log('Creando producto test en Supabase...');
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduct),
      }
    );

    const product = await res.json();
    if (!product[0]) {
      console.error('ERROR: No se pudo crear producto');
      return false;
    }

    const productId = product[0].id;
    console.log(`✓ Producto creado: ${productId}`);

    // Now test SKU generation via API endpoint
    // For now, just check existing SKUs in DB
    const skusRes = await fetch(
      `${SUPABASE_URL}/rest/v1/product_options?select=sku&sku=like.FL-RAM-%&order=sku`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const existingSKUs = await skusRes.json();
    console.log(`\nSKUs existentes para categoría ramos: ${existingSKUs.length}`);

    if (Array.isArray(existingSKUs) && existingSKUs.length > 0) {
      console.log('Últimos 3 SKUs:');
      existingSKUs.slice(-3).forEach(row => {
        console.log(`  - ${row.sku}`);
      });
    }

    return { productId, success: true };
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return { success: false };
  }
}

async function validateCurrentProducts() {
  console.log('\nPASO 2: VALIDAR PRODUCTOS EXISTENTES');
  console.log('-'.repeat(60));

  try {
    // Get all test products
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,category,ghl_product_id&name=like.TEST%&order=created_at.desc&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const testProducts = await res.json();

    if (!Array.isArray(testProducts) || testProducts.length === 0) {
      console.log('No hay productos test existentes');
      return [];
    }

    console.log(`Encontrados ${testProducts.length} productos test\n`);

    // For each product, get its options
    const results = [];
    for (const product of testProducts.slice(0, 5)) {
      console.log(`Producto: ${product.name} (${product.id})`);
      console.log(`  Categoría: ${product.category}`);
      console.log(`  GHL ID: ${product.ghl_product_id}`);

      // Get options
      const optRes = await fetch(
        `${SUPABASE_URL}/rest/v1/product_options?select=id,name,price_amount,discount_percent,stock_quantity,sku,ghl_price_id&product_id=eq.${product.id}&order=price_amount`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      const options = await optRes.json();

      if (Array.isArray(options) && options.length > 0) {
        console.log(`  Opciones (${options.length}):`);

        const skus = [];
        const ghlPrices = [];

        for (const opt of options) {
          console.log(`    - ${opt.name}: ${opt.price_amount}EUR (-${opt.discount_percent}%) | Stock: ${opt.stock_quantity}`);
          console.log(`      SKU: ${opt.sku}`);
          console.log(`      GHL Price ID: ${opt.ghl_price_id}`);

          if (opt.sku) skus.push(opt.sku);
          if (opt.ghl_price_id) ghlPrices.push(opt.ghl_price_id);
        }

        // Verify SKU uniqueness
        const uniqueSKUs = new Set(skus);
        if (uniqueSKUs.size < skus.length) {
          console.log(`  ⚠ ALERTA: SKUs duplicados detectados`);
        } else {
          console.log(`  ✓ SKUs únicos: ${uniqueSKUs.size}`);
        }

        // Verify GHL price IDs uniqueness
        const uniquePrices = new Set(ghlPrices);
        if (uniquePrices.size < ghlPrices.length) {
          console.log(`  ⚠ ALERTA: GHL Price IDs duplicados detectados`);
        } else {
          console.log(`  ✓ GHL Price IDs únicos: ${uniquePrices.size}`);
        }

        results.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          options,
          skuUnique: uniqueSKUs.size === skus.length,
          pricesUnique: uniquePrices.size === ghlPrices.length,
        });
      } else {
        console.log('  Sin opciones');
      }

      console.log('');
    }

    return results;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return [];
  }
}

async function checkGHLSync(ghlProductId) {
  console.log(`\nPASO 3: VERIFICAR SINCRONIZACIÓN CON GHL - ${ghlProductId}`);
  console.log('-'.repeat(60));

  if (!ghlProductId) {
    console.log('Saltando: Sin GHL Product ID');
    return null;
  }

  try {
    const prices = await ghlGetPrices(ghlProductId);

    if (!prices.prices || prices.prices.length === 0) {
      console.log('No hay precios en GHL');
      return null;
    }

    console.log(`Encontrados ${prices.prices.length} precios en GHL:\n`);

    for (const price of prices.prices) {
      console.log(`- ID: ${price.id}`);
      console.log(`  Amount: ${price.amount}`);
      console.log(`  Compare At Price: ${price.compareAtPrice}`);
      console.log(`  Available Quantity: ${price.availableQuantity}`);
      console.log(`  SKU: ${price.sku}`);
      console.log('');
    }

    return prices.prices;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return null;
  }
}

async function getDatabaseStats() {
  console.log('\nPASO 4: ESTADÍSTICAS GLOBALES DE PRODUCTOS TEST');
  console.log('-'.repeat(60));

  try {
    // Count test products
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id&name=like.TEST%`,
      {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    // Get stats via RPC or direct query
    const optionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/product_options?select=id,sku,ghl_price_id&product_id=in.(SELECT id FROM products WHERE name LIKE 'TEST%')`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const options = await optionsRes.json();

    if (Array.isArray(options)) {
      const skus = options.map(o => o.sku).filter(Boolean);
      const prices = options.map(o => o.ghl_price_id).filter(Boolean);

      console.log(`Total opciones de productos TEST: ${options.length}`);
      console.log(`Total SKUs: ${skus.length}`);
      console.log(`SKUs únicos: ${new Set(skus).size}`);
      console.log(`Total GHL Price IDs: ${prices.length}`);
      console.log(`GHL Price IDs únicos: ${new Set(prices).size}`);

      if (skus.length > 0 && new Set(skus).size < skus.length) {
        console.log('\n⚠ ALERTA: Hay SKUs duplicados en la base de datos');
      }

      if (prices.length > 0 && new Set(prices).size < prices.length) {
        console.log('⚠ ALERTA: Hay GHL Price IDs duplicados en la base de datos');
      }
    }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    // Run validations
    await testSKUGeneration();
    const products = await validateCurrentProducts();
    await getDatabaseStats();

    if (products.length > 0) {
      // Check GHL sync for first product
      const firstProduct = products[0];
      if (firstProduct.options.length > 0) {
        await checkGHLSync(firstProduct.options[0].ghl_price_id);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('VALIDACIÓN COMPLETADA');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error fatal:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error en main:', error);
  process.exit(1);
});
