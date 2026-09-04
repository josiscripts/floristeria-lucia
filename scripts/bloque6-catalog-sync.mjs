#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ACCIÓN 2: Leer catalog.ts
async function readCatalog() {
  console.log("\n=== ACCIÓN 2: LEER CATÁLOGO.TS ===\n");

  const catalogPath = path.join(__dirname, "../src/data/catalog.ts");
  const content = fs.readFileSync(catalogPath, "utf-8");

  // Extract product names from the products array
  const productRegex = /name:\s*"([^"]+)"/g;
  const matches = [];
  let match;
  while ((match = productRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }

  const uniqueNames = [...new Set(matches)];
  console.log(`Productos en catalog.ts: ${uniqueNames.length}`);
  console.log("\nLista:");
  uniqueNames.forEach((name, i) => {
    console.log(`${i + 1}. ${name}`);
  });

  return uniqueNames;
}

// ACCIÓN 3: Contar productos reales en Supabase
async function getRealProducts() {
  console.log("\n=== ACCIÓN 2b: PRODUCTOS REALES EN SUPABASE ===\n");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, ghl_product_id, ghl_location_id")
    .is("deleted_at", null)
    .order("category");

  if (!products) {
    console.log("No hay productos reales");
    return [];
  }

  console.log(`Total de productos activos: ${products.length}`);
  console.log("\nProductos por categoría:");

  const byCategory = {};
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  Object.entries(byCategory).forEach(([cat, prods]) => {
    console.log(`\n${cat} (${prods.length}):`);
    prods.forEach((p) => {
      console.log(`  - ${p.name} [ghl_id: ${p.ghl_product_id || "NULL"}]`);
    });
  });

  return products;
}

// ACCIÓN 4: Verificar y poblar ghl_price_id
async function populateGHLPriceIds(realProducts) {
  console.log("\n=== ACCIÓN 3: VERIFICAR ghl_price_id ===\n");

  const { data: nullPrices } = await supabase
    .from("product_options")
    .select("id, product_id, name, price_amount, sku, ghl_price_id")
    .is("deleted_at", null)
    .is("ghl_price_id", null);

  console.log(`Opciones sin ghl_price_id: ${nullPrices?.length || 0}`);

  if (nullPrices && nullPrices.length > 0) {
    console.log("\nDetalles de opciones sin ghl_price_id:");
    nullPrices.forEach((opt) => {
      const prod = realProducts.find((p) => p.id === opt.product_id);
      console.log(`  - ${prod?.name || "UNKNOWN"} → ${opt.name}`);
      console.log(`    ID: ${opt.id}, Precio: ${opt.price_amount}`);
    });

    console.log("\nNOTA: Para población de ghl_price_id necesitamos acceso a GHL API");
    console.log("      Se requiere ensureProductPrice() en el endpoint backend");
  }

  return nullPrices;
}

// ACCIÓN 5: Verificar product_images
async function checkAndCreateProductImages(realProducts) {
  console.log("\n=== ACCIÓN 4: VERIFICAR PRODUCT_IMAGES ===\n");

  // Get existing images
  const { data: existingImages } = await supabase.from("product_images").select("id, product_id");

  console.log(`Imágenes existentes: ${existingImages?.length || 0}`);
  console.log(`Productos que necesitan imágenes: ${realProducts.length}`);

  // Check which products are missing images
  const imagesByProduct = {};
  existingImages?.forEach((img) => {
    if (!imagesByProduct[img.product_id]) {
      imagesByProduct[img.product_id] = 0;
    }
    imagesByProduct[img.product_id]++;
  });

  const missingImages = realProducts.filter((p) => !imagesByProduct[p.id]);

  console.log(`Productos sin imágenes: ${missingImages.length}`);
  if (missingImages.length > 0) {
    console.log("\nProductos sin imágenes:");
    missingImages.forEach((p) => {
      console.log(`  - ${p.name}`);
    });

    console.log(
      "\nNOTA: Se requiere:\n" +
        "  1. Crear URLs de imágenes (Supabase Storage o public/images)\n" +
        "  2. Insertar en product_images tabla\n" +
        "  3. Asociar a color_variants si es Rosas Eternas",
    );
  }

  return { existingImages, missingImages, imagesByProduct };
}

// ACCIÓN 6: Verificar Rosas Eternas
async function checkRosasEternas(realProducts) {
  console.log("\n=== ACCIÓN 5: ROSAS ETERNAS - COLORES ===\n");

  const rosasProducts = realProducts.filter((p) => p.category === "rosas-eternas");

  console.log(`Productos Rosas Eternas: ${rosasProducts.length}`);

  for (const prod of rosasProducts) {
    const { data: colors } = await supabase
      .from("color_variants")
      .select("id, name")
      .eq("product_id", prod.id)
      .is("deleted_at", null);

    const { data: images } = await supabase
      .from("product_images")
      .select("id, color_variant_id")
      .eq("product_id", prod.id);

    console.log(`\n${prod.name}:`);
    console.log(`  Colores: ${colors?.length || 0}`);
    if (colors && colors.length > 0) {
      colors.forEach((c) => console.log(`    - ${c.name}`));
    }
    console.log(`  Imágenes: ${images?.length || 0}`);

    if (colors && colors.length > 0) {
      const coloredImages = images?.filter((i) => i.color_variant_id);
      console.log(`  Imágenes con color asignado: ${coloredImages?.length || 0}`);
    }
  }
}

async function main() {
  try {
    const catalogNames = await readCatalog();
    const realProducts = await getRealProducts();
    const nullPrices = await populateGHLPriceIds(realProducts);
    const imageData = await checkAndCreateProductImages(realProducts);
    await checkRosasEternas(realProducts);

    console.log("\n" + "=".repeat(50));
    console.log("RESUMEN ACCIONES 2-5");
    console.log("=".repeat(50));
    console.log(`Productos en catalog.ts: ${catalogNames.length}`);
    console.log(`Productos activos en Supabase: ${realProducts.length}`);
    console.log(`Opciones sin ghl_price_id: ${nullPrices?.length || 0}`);
    console.log(`Imágenes: ${imageData.existingImages?.length || 0}`);
    console.log(`Productos sin imágenes: ${imageData.missingImages?.length || 0}`);
    console.log("=".repeat(50));
    console.log("\nACCIONES 2-5: AUDITORÍA COMPLETADA");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
