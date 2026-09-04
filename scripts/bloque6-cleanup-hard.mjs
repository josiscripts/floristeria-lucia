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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function hardDeleteTestProducts() {
  console.log("\n=== HARD DELETE TEST PRODUCTS ===\n");

  // Find TEST products
  const { data: testProducts } = await supabase
    .from("products")
    .select("id, name")
    .or("name.ilike.%TEST%,name.ilike.%TEMP%");

  console.log(`Found ${testProducts?.length} TEST products:`);
  testProducts?.forEach((p) => {
    console.log(`  - ${p.name}`);
  });

  if (!testProducts || testProducts.length === 0) {
    console.log("No TEST products to delete");
    return;
  }

  const testIds = testProducts.map((p) => p.id);

  // Hard delete: options
  const { error: e1 } = await supabase.from("product_options").delete().in("product_id", testIds);
  console.log(`\nDeleting product_options: ${e1 ? "ERROR" : "✓"}`);

  // Hard delete: images
  const { error: e2 } = await supabase.from("product_images").delete().in("product_id", testIds);
  console.log(`Deleting product_images: ${e2 ? "ERROR" : "✓"}`);

  // Hard delete: colors
  const { error: e3 } = await supabase.from("color_variants").delete().in("product_id", testIds);
  console.log(`Deleting color_variants: ${e3 ? "ERROR" : "✓"}`);

  // Hard delete: products
  const { error: e4 } = await supabase.from("products").delete().in("id", testIds);
  console.log(`Deleting products: ${e4 ? "ERROR" : "✓"}`);

  // Verify
  const { data: remaining } = await supabase
    .from("products")
    .select("id")
    .or("name.ilike.%TEST%,name.ilike.%TEMP%");

  console.log(`\nRemaining TEST products: ${remaining?.length || 0}`);

  const { data: allProducts } = await supabase.from("products").select("id");

  console.log(`Total products now: ${allProducts?.length || 0}`);
}

async function main() {
  try {
    await hardDeleteTestProducts();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
