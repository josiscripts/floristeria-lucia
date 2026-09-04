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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function verify() {
  console.log("\n=== BLOQUE 6 - VERIFICACIÓN FINAL ===\n");

  // Products
  const { data: products } = await supabase.from("products").select("id");
  console.log(`✅ Productos: ${products?.length || 0}`);

  // Test products
  const { data: test } = await supabase
    .from("products")
    .select("id")
    .or("name.ilike.%TEST%,name.ilike.%TEMP%");
  console.log(`✅ TEST products: ${test?.length || 0}`);

  // Images (no deleted_at filter)
  const { data: images } = await supabase.from("product_images").select("id");
  console.log(`✅ Imágenes: ${images?.length || 0}`);

  // Colors (no deleted_at filter)
  const { data: colors } = await supabase.from("color_variants").select("id");
  console.log(`✅ Colores: ${colors?.length || 0}`);

  // Options
  const { data: options } = await supabase.from("product_options").select("id");
  console.log(`✅ Opciones: ${options?.length || 0}`);

  // Rosas Eternas
  const { data: rosas } = await supabase
    .from("products")
    .select("id")
    .eq("category", "rosas-eternas");
  console.log(`✅ Rosas Eternas: ${rosas?.length || 0}`);

  console.log("\n=== RESUMEN ===");
  console.log(`Total productos: ${products?.length}`);
  console.log(`Total TEST: ${test?.length}`);
  console.log(`Total imágenes: ${images?.length}`);
  console.log(`Total colores: ${colors?.length}`);
  console.log(`Total opciones: ${options?.length}`);

  const allOk =
    products?.length === 50 && test?.length === 0 && images?.length >= 50 && colors?.length >= 12;

  console.log(`\n${allOk ? "✅ LISTO" : "⚠️ INCOMPLETO"}\n`);
}

verify();
