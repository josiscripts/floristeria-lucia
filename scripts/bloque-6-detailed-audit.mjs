#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("==================================================");
console.log("BLOQUE 6 - AUDITORÍA DETALLADA");
console.log("==================================================\n");

// Check schema information
console.log("1. VERIFICACIÓN DE SCHEMA\n");

const tables = [
  { name: "product_metadata", hasDeletedAt: true },
  { name: "products", hasDeletedAt: true },
  { name: "product_options", hasDeletedAt: true },
  { name: "color_variants", hasDeletedAt: false },
  { name: "product_images", hasDeletedAt: false },
  { name: "product_metadata", hasDeletedAt: true },
];

// Query product_metadata (the actual products table)
console.log("2. PRODUCTS EN SUPABASE (product_metadata)\n");

const { data: metadata, error: metaError } = await supabase
  .from("product_metadata")
  .select("*")
  .is("deleted_at", null)
  .order("created_at", { ascending: true });

if (metaError) {
  console.error("❌ Error fetching product_metadata:", metaError.message);
} else {
  console.log(`✓ Total: ${metadata?.length || 0} productos`);

  if (metadata) {
    const byCategory = {};
    metadata.forEach((m) => {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    });

    console.log("\nPor categoría:");
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    console.log("\n---Primeros 10 productos---");
    metadata.slice(0, 10).forEach((m) => {
      console.log(`\n▸ ${m.legacy_catalog_id || "sin_id"}: ${m.category}`);
      console.log(`  GHL Product ID: ${m.ghl_product_id}`);
      console.log(`  GHL Price ID: ${m.ghl_price_id || "NULL"}`);
      console.log(`  SKU: ${m.sku || "NULL"}`);
      console.log(`  Status: ${m.status}`);
      console.log(`  Colors: ${m.available_colors?.join(", ") || "none"}`);
    });
  }
}

// Check old products table
console.log("\n\n3. TABLA 'products' LEGACY\n");

const { data: products, error: prodError } = await supabase
  .from("products")
  .select("*")
  .is("deleted_at", null)
  .limit(10);

if (prodError) {
  console.log(`⚠️  Error: ${prodError.message}`);
} else {
  console.log(`Total (non-deleted): ${products?.length || 0}`);
  if (products && products.length > 0) {
    products.forEach((p) => {
      console.log(`- ${p.name} (${p.category}) [${p.id}]`);
    });
  }
}

// Check product_options
console.log("\n\n4. PRODUCT_OPTIONS\n");

const { data: options, error: optError } = await supabase
  .from("product_options")
  .select("*")
  .is("deleted_at", null);

if (optError) {
  console.log(`⚠️  Error: ${optError.message}`);
} else {
  console.log(`Total: ${options?.length || 0}`);

  if (options) {
    const optionsByProduct = {};
    let ghlPriceNull = 0;
    let skuCount = new Set();

    options.forEach((opt) => {
      optionsByProduct[opt.product_id] = (optionsByProduct[opt.product_id] || 0) + 1;
      if (!opt.ghl_price_id) ghlPriceNull++;
      if (opt.sku) skuCount.add(opt.sku);
    });

    console.log(`\nGHL Price ID NULL: ${ghlPriceNull} / ${options.length}`);
    console.log(`Unique SKUs: ${skuCount.size}`);

    console.log("\n---Primeras 5 opciones---");
    options.slice(0, 5).forEach((opt) => {
      console.log(`\n▸ Producto: ${opt.product_id}`);
      console.log(`  Nombre: ${opt.name}`);
      console.log(`  SKU: ${opt.sku}`);
      console.log(`  Precio: €${opt.price_amount} (${opt.discount_percent || 0}% desc)`);
      console.log(`  Stock: ${opt.stock_quantity}`);
      console.log(`  GHL Price ID: ${opt.ghl_price_id || "NULL"}`);
    });
  }
}

// Check color_variants
console.log("\n\n5. COLOR_VARIANTS\n");

const { data: colors } = await supabase
  .from("color_variants")
  .select("*");

if (colors) {
  console.log(`Total: ${colors.length}`);
  if (colors.length > 0) {
    const colorsByProduct = {};
    colors.forEach((c) => {
      colorsByProduct[c.product_id] = (colorsByProduct[c.product_id] || []).concat(c.name);
    });

    console.log("\nColores por producto:");
    Object.entries(colorsByProduct).forEach(([prodId, colorNames]) => {
      console.log(`  ${prodId}: ${colorNames.join(", ")}`);
    });
  }
}

// Check product_images
console.log("\n\n6. PRODUCT_IMAGES\n");

const { data: images } = await supabase
  .from("product_images")
  .select("*");

if (images) {
  console.log(`Total: ${images.length}`);
  if (images.length > 0) {
    const imgByProduct = {};
    images.forEach((img) => {
      imgByProduct[img.product_id] = (imgByProduct[img.product_id] || 0) + 1;
    });

    console.log("\nImágenes por producto:");
    Object.entries(imgByProduct).forEach(([prodId, count]) => {
      console.log(`  ${prodId}: ${count}`);
    });
  }
}

// VERIFICACIÓN CRÍTICA
console.log("\n\n==================================================");
console.log("CLASIFICACIÓN INICIAL");
console.log("==================================================\n");

const issues = [];

if (!metadata || metadata.length < 40) {
  issues.push("❌ CRÍTICO: Menos de 40 productos sincronizados (esperados 41)");
}

if (options && options.some((o) => !o.ghl_price_id)) {
  const count = options.filter((o) => !o.ghl_price_id).length;
  issues.push(`❌ CRÍTICO: ${count} opciones sin ghl_price_id`);
}

if (!colors || colors.length === 0) {
  issues.push("❌ CRÍTICO: Sin variantes de color (esperadas para Rosas Eternas)");
}

if (!images || images.length === 0) {
  issues.push("❌ CRÍTICO: Sin imágenes de productos");
}

if (issues.length === 0) {
  console.log("✅ ESTADO INICIAL CORRECTO");
  console.log(`✅ ${metadata?.length || 0} productos sincronizados`);
  console.log(`✅ ${options?.length || 0} opciones/precios`);
  console.log(`✅ ${colors?.length || 0} variantes de color`);
  console.log(`✅ ${images?.length || 0} imágenes`);
} else {
  console.log("⚠️  PROBLEMAS DETECTADOS:");
  issues.forEach((issue) => console.log(issue));
}

console.log("\n==================================================");
console.log("ANÁLISIS: BLOQUE 6 NO PUEDE PROCEDER");
console.log("==================================================");
console.log("\nRazón: Faltan datos fundamentales que deben estar");
console.log("sincronizados antes de auditoría.\n");
console.log("ACCIONES REQUERIDAS:");
console.log("1. Sincronizar catálogo completo (41 productos)");
console.log("2. Crear variantes de color para Rosas Eternas");
console.log("3. Crear imágenes para todos los productos");
console.log("4. Verificar sincronización con GHL\n");
