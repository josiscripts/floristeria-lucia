#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

// Parse .env.local
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ACCIÓN 1: Auditar productos legacy/test
async function auditTestProducts() {
  console.log("\n=== ACCIÓN 1: AUDITAR PRODUCTOS LEGACY/TEST ===\n");

  // Query 1: Buscar productos con ghl_product_id tipo test
  const { data: testProducts, error: error1 } = await supabase
    .from("products")
    .select("id, name, category, ghl_product_id, created_at")
    .or(
      `ghl_product_id.like.test-product-%,name.ilike.%TEST%,name.ilike.%TEMP%`
    )
    .order("created_at", { ascending: false });

  if (error1) {
    console.error("Error fetching test products:", error1);
    return;
  }

  console.log("Productos potencialmente TEST/TEMP encontrados:");
  console.log(JSON.stringify(testProducts, null, 2));

  if (testProducts && testProducts.length > 0) {
    console.log(
      `\nTotal a revisar: ${testProducts.length} productos\n`
    );

    // Para cada uno, vamos a determinar si es realmente test
    for (const prod of testProducts) {
      console.log(`- ID: ${prod.id}`);
      console.log(`  Nombre: ${prod.name}`);
      console.log(`  Categoría: ${prod.category}`);
      console.log(`  GHL ID: ${prod.ghl_product_id}`);
      console.log(`  Creado: ${prod.created_at}`);
      console.log("");
    }
  } else {
    console.log("No hay productos TEST/TEMP en Supabase");
  }

  return testProducts || [];
}

// ACCIÓN 2: Verificar orfandad de datos
async function checkOrphanData() {
  console.log(
    "\n=== VERIFICAR ORFANDAD DE DATOS (opciones, imágenes, colores) ===\n"
  );

  // Opciones huérfanas
  const { data: orphanOptions, error: e1 } = await supabase
    .from("product_options")
    .select("id, product_id")
    .not("product_id", "in", `(SELECT id FROM products WHERE deleted_at IS NULL)`);

  // Imágenes huérfanas
  const { data: orphanImages, error: e2 } = await supabase
    .from("product_images")
    .select("id, product_id")
    .not("product_id", "in", `(SELECT id FROM products WHERE deleted_at IS NULL)`);

  // Colores huérfanos
  const { data: orphanColors, error: e3 } = await supabase
    .from("color_variants")
    .select("id, product_id")
    .not("product_id", "in", `(SELECT id FROM products WHERE deleted_at IS NULL)`);

  console.log(
    `Opciones huérfanas: ${orphanOptions?.length || 0}`
  );
  console.log(
    `Imágenes huérfanas: ${orphanImages?.length || 0}`
  );
  console.log(
    `Colores huérfanos: ${orphanColors?.length || 0}`
  );

  return { orphanOptions, orphanImages, orphanColors };
}

// ACCIÓN 3: Contar productos reales
async function countRealProducts() {
  console.log("\n=== CONTAR PRODUCTOS REALES ===\n");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, category, ghl_product_id")
    .eq("deleted_at", null)
    .order("category");

  if (error) {
    console.error("Error:", error);
    return [];
  }

  console.log(
    `Total de productos reales en Supabase: ${products.length}`
  );
  console.log("\nProductos por categoría:");

  const byCategory = {};
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p.name);
  });

  Object.entries(byCategory).forEach(([cat, names]) => {
    console.log(`\n${cat} (${names.length}):`);
    names.forEach((name) => console.log(`  - ${name}`));
  });

  return products;
}

// ACCIÓN 4: Verificar ghl_price_id NULL
async function checkMissingGHLPriceIds() {
  console.log("\n=== VERIFICAR ghl_price_id NULL ===\n");

  const { data: nullPrices, error } = await supabase
    .from("product_options")
    .select("id, product_id, name, price_amount, sku, ghl_price_id")
    .is("deleted_at", null)
    .is("ghl_price_id", null);

  if (error) {
    console.error("Error:", error);
    return [];
  }

  console.log(`Opciones SIN ghl_price_id: ${nullPrices.length}`);
  if (nullPrices.length > 0) {
    console.log("\nDetalles:");
    console.log(JSON.stringify(nullPrices, null, 2));
  }

  return nullPrices;
}

// ACCIÓN 5: Verificar product_images
async function checkProductImages() {
  console.log("\n=== VERIFICAR PRODUCT_IMAGES ===\n");

  const { data: images, error } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, is_primary")
    .is("deleted_at", null)
    .order("product_id");

  if (error) {
    console.error("Error:", error);
    return [];
  }

  console.log(`Total de imágenes: ${images.length}`);

  // Contar imágenes por producto
  const byProduct = {};
  images.forEach((img) => {
    if (!byProduct[img.product_id]) byProduct[img.product_id] = 0;
    byProduct[img.product_id]++;
  });

  const productsWithImages = Object.keys(byProduct).length;
  console.log(`Productos con imágenes: ${productsWithImages}`);

  // Verificar URLs válidas
  const invalidUrls = images.filter(
    (img) => !img.image_url || img.image_url.trim() === ""
  );
  console.log(`Imágenes con URLs vacías: ${invalidUrls.length}`);

  if (invalidUrls.length > 0) {
    console.log("\nDetalles de URLs vacías:");
    console.log(JSON.stringify(invalidUrls.slice(0, 5), null, 2));
  }

  return images;
}

// ACCIÓN 6: Verificar Rosas Eternas
async function checkRosasEternas() {
  console.log("\n=== VERIFICAR ROSAS ETERNAS ===\n");

  // Buscar todos los productos de rosas eternas
  const { data: rosasProducts, error: e1 } = await supabase
    .from("products")
    .select("id, name, ghl_product_id")
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  if (e1) {
    console.error("Error:", e1);
    return;
  }

  console.log(`Productos Rosas Eternas: ${rosasProducts.length}`);

  for (const prod of rosasProducts) {
    const { data: colors, error: e2 } = await supabase
      .from("color_variants")
      .select("id, name")
      .eq("product_id", prod.id)
      .is("deleted_at", null);

    console.log(`\n${prod.name}:`);
    console.log(`  Colores disponibles: ${colors?.length || 0}`);
    if (colors && colors.length > 0) {
      colors.forEach((c) => console.log(`    - ${c.name}`));
    }
  }
}

// ACCIÓN 7: Verificar duplicados (idempotencia)
async function checkDuplicates() {
  console.log("\n=== VERIFICAR DUPLICADOS ===\n");

  // Productos duplicados
  const { data: prodDups } = await supabase
    .from("products")
    .select("name, COUNT(*) as count")
    .is("deleted_at", null)
    .order("count", { ascending: false });

  // SKU duplicados
  const { data: skuDups } = await supabase
    .from("product_options")
    .select("sku, COUNT(*) as count")
    .is("deleted_at", null)
    .order("count", { ascending: false });

  // ghl_product_id duplicados
  const { data: ghlProdDups } = await supabase
    .from("products")
    .select("ghl_product_id, COUNT(*) as count")
    .is("deleted_at", null)
    .not("ghl_product_id", "is", null)
    .order("count", { ascending: false });

  // ghl_price_id duplicados
  const { data: ghlPriceDups } = await supabase
    .from("product_options")
    .select("ghl_price_id, COUNT(*) as count")
    .is("deleted_at", null)
    .not("ghl_price_id", "is", null)
    .order("count", { ascending: false });

  console.log("Productos con nombre duplicado:");
  prodDups?.filter((d) => d.count > 1).forEach((d) => {
    console.log(`  ${d.name}: ${d.count} veces`);
  });

  console.log("\nSKUs duplicados:");
  skuDups?.filter((d) => d.count > 1).forEach((d) => {
    console.log(`  ${d.sku}: ${d.count} veces`);
  });

  console.log("\nghl_product_id duplicados:");
  ghlProdDups?.filter((d) => d.count > 1).forEach((d) => {
    console.log(`  ${d.ghl_product_id}: ${d.count} veces`);
  });

  console.log("\nghl_price_id duplicados:");
  ghlPriceDups?.filter((d) => d.count > 1).forEach((d) => {
    console.log(`  ${d.ghl_price_id}: ${d.count} veces`);
  });
}

// Main
async function main() {
  try {
    console.log("=".repeat(50));
    console.log("BLOQUE 6 - AUDITORÍA INICIAL");
    console.log("=".repeat(50));

    const testProducts = await auditTestProducts();
    const realProducts = await countRealProducts();
    const orphanData = await checkOrphanData();
    const nullPrices = await checkMissingGHLPriceIds();
    const images = await checkProductImages();
    await checkRosasEternas();
    await checkDuplicates();

    console.log("\n" + "=".repeat(50));
    console.log("RESUMEN DE AUDITORÍA");
    console.log("=".repeat(50));
    console.log(`Productos reales: ${realProducts.length}`);
    console.log(`Productos TEST: ${testProducts.length}`);
    console.log(`Opciones sin ghl_price_id: ${nullPrices.length}`);
    console.log(`Imágenes totales: ${images.length}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
