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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function cleanupTestProducts() {
  console.log("\n=== ACCIÓN 1: ELIMINAR PRODUCTOS TEST ===\n");

  // Step 1: Get test products
  const { data: testProducts } = await supabase
    .from("products")
    .select("id")
    .or(
      `ghl_product_id.like.test-product-%,name.ilike.%TEST%,name.ilike.%TEMP%`
    );

  if (!testProducts || testProducts.length === 0) {
    console.log("No hay productos TEST para eliminar");
    return;
  }

  const testIds = testProducts.map((p) => p.id);
  console.log(`Productos TEST a eliminar: ${testIds.length}`);
  console.log(`IDs: ${testIds.join(", ")}\n`);

  // Step 2: Delete product_options
  console.log("Eliminando product_options asociadas...");
  const { error: e1 } = await supabase
    .from("product_options")
    .delete()
    .in("product_id", testIds);
  if (e1) console.error("Error eliminando options:", e1);
  else console.log("✓ product_options eliminadas");

  // Step 3: Delete product_images
  console.log("Eliminando product_images asociadas...");
  const { error: e2 } = await supabase
    .from("product_images")
    .delete()
    .in("product_id", testIds);
  if (e2) console.error("Error eliminando images:", e2);
  else console.log("✓ product_images eliminadas");

  // Step 4: Delete color_variants
  console.log("Eliminando color_variants asociadas...");
  const { error: e3 } = await supabase
    .from("color_variants")
    .delete()
    .in("product_id", testIds);
  if (e3) console.error("Error eliminando colors:", e3);
  else console.log("✓ color_variants eliminadas");

  // Step 5: Delete products (soft delete)
  console.log("Soft-deleting productos...");
  const now = new Date().toISOString();
  const { error: e4 } = await supabase
    .from("products")
    .update({ deleted_at: now })
    .in("id", testIds);
  if (e4) console.error("Error soft-deleting products:", e4);
  else console.log("✓ Productos soft-deleted");

  // Verify
  console.log("\n--- VERIFICACIÓN POST-LIMPIEZA ---\n");
  const { data: remaining } = await supabase
    .from("products")
    .select("COUNT(*) as count", { count: "exact" })
    .or(
      `ghl_product_id.like.test-product-%,name.ilike.%TEST%,name.ilike.%TEMP%`
    );

  const { count: prodCount } = await supabase
    .from("products")
    .select("COUNT(*) as count", { count: "exact" })
    .is("deleted_at", null);

  console.log(`Productos TEST aún visibles: ${remaining?.[0]?.count || 0}`);
  console.log(`Total de productos activos: ${prodCount}`);
}

async function main() {
  try {
    await cleanupTestProducts();
    console.log("\n✓ ACCIÓN 1 COMPLETADA\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
