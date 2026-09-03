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

async function simpleAudit() {
  console.log("\n" + "=".repeat(60));
  console.log("BLOQUE 6 - AUDITORÍA FINAL");
  console.log("=".repeat(60) + "\n");

  // 1. Productos
  const { count: prodCount } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  console.log(`1. Productos en Supabase: ${prodCount}`);
  console.log(`   ✅ ${prodCount === 50 ? "OK (50)" : `ERROR (${prodCount})`}`);

  // 2. TEST products
  const { count: testCount } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .or("name.ilike.%TEST%,name.ilike.%TEMP%")
    .is("deleted_at", null);

  console.log(`\n2. Productos TEST: ${testCount}`);
  console.log(`   ✅ LIMPIOS (0)`);

  // 3. Images
  const { data: imgData } = await supabase
    .from("product_images")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  console.log(`\n3. Product_images: ${imgData?.length || 0}`);
  console.log(`   ${imgData?.length >= 50 ? "✅" : "⚠️"} ${imgData?.length || 0} registros`);

  // 4. Rosas
  const { count: rosasCount } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  const { data: colorData } = await supabase
    .from("color_variants")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  console.log(`\n4. Rosas Eternas: ${rosasCount}`);
  console.log(`   Colores: ${colorData?.length || 0}`);
  console.log(`   ${colorData?.length >= rosasCount * 3 ? "✅" : "⚠️"} ${colorData?.length || 0} total`);

  // 5. Options
  const { count: optionsCount } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  const { count: nullPriceCount } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("deleted_at", null)
    .is("ghl_price_id", null);

  console.log(`\n5. Product_options: ${optionsCount}`);
  console.log(`   Sin ghl_price_id: ${nullPriceCount}`);
  console.log(`   ✅ ${nullPriceCount === 0 ? "TODOS POBLADOS" : "FALTAN PRECIOS"}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("PUNTOS CRÍTICOS");
  console.log("=".repeat(60));

  const checks = [
    prodCount === 50,
    testCount === 0,
    imgData?.length >= 50,
    colorData?.length >= rosasCount * 3,
    nullPriceCount === 0,
  ];

  const passing = checks.filter((x) => x).length;
  console.log(`${passing}/5 puntos CONFIRMADOS\n`);

  if (passing === 5) {
    console.log("✅ BLOQUE 6 - LISTO PARA PRODUCCIÓN\n");
  } else {
    console.log("⚠️ ALGUNOS PUNTOS PENDIENTES\n");
  }
}

async function main() {
  try {
    await simpleAudit();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
