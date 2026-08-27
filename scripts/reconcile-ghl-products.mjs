#!/usr/bin/env node

/**
 * RECONCILIATION SCRIPT - READ-ONLY
 *
 * Objetivo:
 * 1. Obtener todos los productos de GHL
 * 2. Comparar con catalog.ts
 * 3. Analizar imágenes, categorías, precios
 * 4. Generar informe de reconciliación
 *
 * NO modifica nada en GHL ni Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').replace(/^["']|["']$/g, '');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Merge with process.env
Object.assign(process.env, envVars);

const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_PRIVATE_INTEGRATION_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;

if (!GHL_LOCATION_ID || !GHL_PRIVATE_INTEGRATION_TOKEN) {
  console.error('❌ GHL credentials missing from .env');
  process.exit(1);
}

console.log('🔍 RECONCILIACIÓN GHL ↔ catalog.ts');
console.log(`📍 Location ID: ${GHL_LOCATION_ID}`);
console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
console.log('');

// Helper function to call GHL API
async function ghlFetch(endpoint) {
  const baseUrl = 'https://api.gohighlevel.com/v1';
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GHL_PRIVATE_INTEGRATION_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.log(`  [${response.status}] ${url}`);
    throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Load catalog.ts
console.log('📖 Cargando catalog.ts...');
const catalogModule = await import('../src/data/catalog.ts', { assert: { type: 'module' } }).catch(() => null);

let catalogProducts = [];
try {
  // Direct import won't work, so read and parse the file
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.ts');
  const catalogContent = fs.readFileSync(catalogPath, 'utf-8');

  // Extract products array from the file
  const match = catalogContent.match(/export const products: Product\[\] = \[([\s\S]*?)\n\];/);

  if (match) {
    // This is tricky - we'd need to parse TypeScript
    // For now, we'll use a simpler approach
    console.log('⚠️  Leyendo catalog.ts directamente...');

    // Count products by parsing id fields
    const idMatches = catalogContent.match(/id: "([^"]+)"/g);
    console.log(`✅ Productos en catalog.ts: ${idMatches ? idMatches.length : 0}`);

    // Extract product data by lines
    const lines = catalogContent.split('\n');
    let currentProduct = {};

    for (const line of lines) {
      if (line.includes('id: "')) {
        if (currentProduct.id) {
          catalogProducts.push(currentProduct);
        }
        const match = line.match(/id: "([^"]+)"/);
        if (match) {
          currentProduct = { id: match[1] };
        }
      } else if (line.includes('name: "')) {
        const match = line.match(/name: "([^"]+)"/);
        if (match) currentProduct.name = match[1];
      } else if (line.includes('category: "')) {
        const match = line.match(/category: "([^"]+)"/);
        if (match) currentProduct.category = match[1];
      } else if (line.includes('priceMin:')) {
        const match = line.match(/priceMin:\s*(\d+(?:\.\d+)?)/);
        if (match) currentProduct.priceMin = parseFloat(match[1]);
      } else if (line.includes('priceMax:')) {
        const match = line.match(/priceMax:\s*(\d+(?:\.\d+)?)/);
        if (match) currentProduct.priceMax = parseFloat(match[1]);
      } else if (line.includes('image:')) {
        currentProduct.hasImage = true;
      } else if (line.includes('colors:')) {
        currentProduct.colors = true;
      } else if (line.includes('roseStep:')) {
        const match = line.match(/roseStep:\s*(\d+)/);
        if (match) currentProduct.roseStep = parseInt(match[1]);
      } else if (line.includes('badge:')) {
        const match = line.match(/badge:\s*"([^"]+)"/);
        if (match) currentProduct.badge = match[1];
      }
    }

    if (currentProduct.id) {
      catalogProducts.push(currentProduct);
    }
  }
} catch (err) {
  console.error('Error loading catalog:', err.message);
}

console.log(`✅ Productos cargados de catalog.ts: ${catalogProducts.length}`);
console.log('');

// Fetch GHL products
console.log('🌐 Consultando GoHighLevel API...');
let ghlProducts = [];

try {
  const response = await ghlFetch(`/locations/${GHL_LOCATION_ID}/products/?limit=100`);

  if (response.products && Array.isArray(response.products)) {
    ghlProducts = response.products;
    console.log(`✅ Productos obtenidos de GHL: ${ghlProducts.length}`);
  } else {
    console.log('⚠️  Respuesta inesperada de GHL');
    console.log(JSON.stringify(response, null, 2));
  }
} catch (error) {
  console.error('❌ Error consultando GHL:', error.message);
  process.exit(1);
}

console.log('');
console.log('━'.repeat(80));
console.log('📊 ANÁLISIS COMPARATIVO');
console.log('━'.repeat(80));
console.log('');

// Analysis
const ghlIds = new Set(ghlProducts.map(p => p.id));
const catalogIds = new Set(catalogProducts.map(p => p.id));

let matches = [];
let possibleMatches = [];
let onlyInCatalog = [];
let onlyInGHL = [];

// Compare
for (const catalogProduct of catalogProducts) {
  // Try exact match
  if (ghlIds.has(catalogProduct.id)) {
    const ghlProduct = ghlProducts.find(p => p.id === catalogProduct.id);
    matches.push({
      catalog: catalogProduct,
      ghl: ghlProduct
    });
  } else {
    // Try name match
    const nameMatch = ghlProducts.find(p =>
      p.name && p.name.toLowerCase() === catalogProduct.name.toLowerCase()
    );

    if (nameMatch) {
      possibleMatches.push({
        catalog: catalogProduct,
        ghl: nameMatch,
        reason: 'Name match'
      });
    } else {
      onlyInCatalog.push(catalogProduct);
    }
  }
}

for (const ghlProduct of ghlProducts) {
  if (!catalogIds.has(ghlProduct.id) &&
      !possibleMatches.some(m => m.ghl.id === ghlProduct.id)) {
    onlyInGHL.push(ghlProduct);
  }
}

console.log(`📊 MATCHES CLAROS: ${matches.length}`);
console.log(`📊 POSIBLES MATCHES: ${possibleMatches.length}`);
console.log(`📊 SOLO EN catalog.ts: ${onlyInCatalog.length}`);
console.log(`📊 SOLO EN GHL: ${onlyInGHL.length}`);
console.log('');

// Image analysis
console.log('📸 ANÁLISIS DE IMÁGENES');
const ghlWithImage = ghlProducts.filter(p => p.image || p.images).length;
const catalogWithImage = catalogProducts.filter(p => p.hasImage).length;

console.log(`GHL con imagen: ${ghlWithImage}/${ghlProducts.length}`);
console.log(`catalog.ts con imagen: ${catalogWithImage}/${catalogProducts.length}`);
console.log('');

// Category analysis
console.log('📂 ANÁLISIS DE CATEGORÍAS');
const ghlCategories = new Set(ghlProducts.map(p => p.category).filter(c => c));
const catalogCategories = new Set(catalogProducts.map(p => p.category));

console.log(`Categorías en GHL: ${Array.from(ghlCategories).join(', ') || 'ninguna'}`);
console.log(`Categorías en catalog.ts: ${Array.from(catalogCategories).join(', ')}`);
console.log('');

// Price analysis
console.log('💰 ANÁLISIS DE PRECIOS');
const priceMatches = matches.filter(m => {
  const ghlPrice = m.ghl.price || m.ghl.cost;
  return ghlPrice === m.catalog.priceMin;
}).length;

console.log(`Precios que coinciden con priceMin: ${priceMatches}/${matches.length}`);
console.log('');

// Generate summary data
console.log('━'.repeat(80));
console.log('📋 SAMPLE DATA');
console.log('━'.repeat(80));
console.log('');

if (matches.length > 0) {
  console.log('MATCH EXAMPLE:');
  const sample = matches[0];
  console.log(`  catalog.ts: ${sample.catalog.id} - ${sample.catalog.name} ($${sample.catalog.priceMin})`);
  console.log(`  GHL: ${sample.ghl.id} - ${sample.ghl.name} ($${sample.ghl.price})`);
  console.log('');
}

if (onlyInCatalog.length > 0) {
  console.log('SOLO EN catalog.ts (primeros 3):');
  onlyInCatalog.slice(0, 3).forEach(p => {
    console.log(`  ${p.id} - ${p.name}`);
  });
  if (onlyInCatalog.length > 3) {
    console.log(`  ... y ${onlyInCatalog.length - 3} más`);
  }
  console.log('');
}

if (onlyInGHL.length > 0) {
  console.log('SOLO EN GHL (primeros 3):');
  onlyInGHL.slice(0, 3).forEach(p => {
    console.log(`  ${p.id} - ${p.name}`);
  });
  if (onlyInGHL.length > 3) {
    console.log(`  ... y ${onlyInGHL.length - 3} más`);
  }
  console.log('');
}

// Scenario determination
console.log('━'.repeat(80));
console.log('🎯 ESCENARIO DETERMINADO');
console.log('━'.repeat(80));
console.log('');

let scenario = '';
if (matches.length + possibleMatches.length >= 35) {
  scenario = 'ESCENARIO A: Mayoría de productos ya existen en GHL';
} else if (matches.length + possibleMatches.length === 0) {
  scenario = 'ESCENARIO B: Productos NO existen en GHL';
} else {
  scenario = 'ESCENARIO C: Combinación - algunos productos existen, otros no';
}

console.log(scenario);
console.log('');
console.log(`Coverage: ${Math.round((matches.length + possibleMatches.length) / catalogProducts.length * 100)}%`);
console.log('');

// Save report data
const reportData = {
  timestamp: new Date().toISOString(),
  totals: {
    catalogTotal: catalogProducts.length,
    ghlTotal: ghlProducts.length,
    matches: matches.length,
    possibleMatches: possibleMatches.length,
    onlyCatalog: onlyInCatalog.length,
    onlyGHL: onlyInGHL.length
  },
  images: {
    ghlWithImage: ghlWithImage,
    catalogWithImage: catalogWithImage
  },
  categories: {
    ghl: Array.from(ghlCategories),
    catalog: Array.from(catalogCategories)
  },
  scenario: scenario,
  ghlProducts: ghlProducts.slice(0, 10), // Sample for report
  matches: matches.slice(0, 5) // Sample
};

// Write to file
const reportPath = path.join(__dirname, '..', 'docs', 'ghl-reconciliation-data.json');
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

console.log('✅ Datos salvados en: docs/ghl-reconciliation-data.json');
console.log('');
console.log('🛑 ANÁLISIS COMPLETADO - SIN MODIFICACIONES EN GHL NI SUPABASE');
