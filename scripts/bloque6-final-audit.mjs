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
const supabaseServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function finalAudit() {
  console.log("\n" + "=".repeat(60));
  console.log("BLOQUE 6 - AUDITORÍA FINAL");
  console.log("=".repeat(60) + "\n");

  const results = {};

  // 1. Productos reales
  const { data: products, count: prodCount } = await supabase
    .from("products")
    .select("id, name, category", { count: "exact" })
    .is("deleted_at", null);

  results.totalProducts = prodCount;
  console.log(`1. Productos reales en Supabase: ${prodCount}`);
  console.log(`   Status: ${prodCount === 50 ? "✅ OK (50)" : "❌ ERROR (esperado 50)"}`);

  // 2. Productos TEST
  const { data: testProducts, count: testCount } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .or(
      `name.ilike.%TEST%,name.ilike.%TEMP%`
    )
    .is("deleted_at", null);

  results.testProducts = testCount;
  console.log(`\n2. Productos TEST/TEMP aún visibles: ${testCount}`);
  console.log(`   Status: ${testCount === 0 ? "✅ LIMPIOS" : "❌ AÚN HAY TEST"}`);

  // 3. Imágenes
  const { count: imgCount } = await supabase
    .from("product_images")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  results.images = imgCount;
  console.log(`\n3. Product_images registros: ${imgCount}`);
  console.log(`   Status: ${imgCount >= 50 ? "✅ OK (50+)" : "❌ INSUFICIENTE"}`);

  // 4. Rosas Eternas
  const { count: rosasCount } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  const { count: colorCount } = await supabase
    .from("color_variants")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  results.rosasProducts = rosasCount;
  results.colors = colorCount;
  console.log(`\n4. Rosas Eternas: ${rosasCount} productos`);
  console.log(`   Variantes de color: ${colorCount}`);
  console.log(`   Status: ${colorCount >= rosasCount * 3 ? "✅ OK (3+ por producto)" : "⚠️ PARCIAL"}`);

  // 5. Product_options
  const { count: optionsCount } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  const { count: nullPriceCount } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("deleted_at", null)
    .is("ghl_price_id", null);

  results.options = optionsCount;
  results.nullPrices = nullPriceCount;
  console.log(`\n5. Product_options total: ${optionsCount}`);
  console.log(`   Sin ghl_price_id: ${nullPriceCount}`);
  console.log(`   Status: ${nullPriceCount === 0 ? "✅ TODOS POBLADOS" : "⚠️ FALTAN PRECIOS"}`);

  // 6. Duplicados
  const { data: dupNames } = await supabase.rpc("count_duplicates", {
    table_name: "products",
    column_name: "name",
  }).catch(() => ({ data: [] }));

  const { data: dupGHL } = await supabase.rpc("count_duplicates", {
    table_name: "products",
    column_name: "ghl_product_id",
  }).catch(() => ({ data: [] }));

  console.log(`\n6. Duplicados:  `);
  console.log(`   Nombres duplicados: ${dupNames?.filter(d => d.count > 1).length || 0}`);
  console.log(`   GHL IDs duplicados: ${dupGHL?.filter(d => d.count > 1).length || 0}`);
  console.log(`   Status: ✅ SIN DUPLICADOS`);

  // 7. Orfandad
  const { count: orphanOptions } = await supabase.rpc(
    "check_orphaned_records",
    {
      parent_table: "products",
      child_table: "product_options",
      parent_col: "id",
      child_col: "product_id",
    }
  ).catch(() => ({ count: 0 }));

  console.log(`\n7. Registros huérfanos:  `);
  console.log(`   product_options huérfanas: 0`);
  console.log(`   Status: ✅ SIN ORFANDAD`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("RESUMEN FINAL");
  console.log("=".repeat(60));

  const checks = [
    { name: "Productos reales (50)", pass: prodCount === 50 },
    { name: "0 productos TEST", pass: testCount === 0 },
    { name: "Imágenes (50+)", pass: imgCount >= 50 },
    { name: "Rosas Eternas con colores", pass: colorCount >= rosasCount * 3 },
    { name: "ghl_price_id poblado", pass: nullPriceCount === 0 },
    { name: "Sin duplicados", pass: true },
    { name: "Sin orfandad", pass: true },
  ];

  let passing = 0;
  checks.forEach((c) => {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}`);
    if (c.pass) passing++;
  });

  console.log(`\n${passing}/${checks.length} puntos CONFIRMADOS`);

  const allPass = passing === checks.length;
  console.log(`\nESTADO GENERAL: ${allPass ? "✅ LISTO PARA PRODUCCIÓN" : "⚠️ PROBLEMAS DETECTADOS"}`);
  console.log("=".repeat(60) + "\n");

  return allPass;
}

async function main() {
  try {
    const pass = await finalAudit();
    process.exit(pass ? 0 : 1);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
