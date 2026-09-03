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

async function populateProducts() {
  console.log("\n=== ACCIÓN 2: POBLAR TABLA PRODUCTS ===\n");

  // Step 1: Get all product_metadata
  const { data: metadata, error: metaError } = await supabase
    .from("product_metadata")
    .select("*")
    .order("created_at");

  if (metaError) {
    console.error("Error fetching metadata:", metaError);
    process.exit(1);
  }

  console.log(`Metadata records: ${metadata.length}`);

  // Step 2: For each metadata, create product in products table
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const meta of metadata) {
    try {
      // Check if product already exists with this ghl_product_id
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("ghl_product_id", meta.ghl_product_id)
        .is("deleted_at", null)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Create product
      const productData = {
        ghl_product_id: meta.ghl_product_id,
        name: meta.legacy_catalog_id || "Unknown Product",
        description: `Product ${meta.category}`,
        category: meta.category,
        active: meta.status === "active",
        has_color_variants: meta.category === "rosas-eternas",
      };

      const { data: newProduct, error: createError } = await supabase
        .from("products")
        .insert([productData])
        .select("id")
        .single();

      if (createError) {
        console.error(
          `Error creating product ${meta.legacy_catalog_id}:`,
          createError
        );
        continue;
      }

      // Create default option if price exists
      if (meta.price && newProduct) {
        const optionData = {
          product_id: newProduct.id,
          name: "Estándar",
          price_amount: meta.price,
          discount_percent: 0,
          stock_quantity: 100,
          sku: meta.sku,
          ghl_price_id: meta.ghl_price_id,
        };

        const { error: optionError } = await supabase
          .from("product_options")
          .insert([optionData]);

        if (optionError) {
          console.warn(
            `Warning creating option for ${meta.legacy_catalog_id}:`,
            optionError
          );
        }
      }

      created++;
      if (created % 10 === 0) {
        console.log(`  Progress: ${created} productos creados...`);
      }
    } catch (error) {
      console.error(`Error processing ${meta.legacy_catalog_id}:`, error);
    }
  }

  console.log(`\n--- RESULTADO ---`);
  console.log(`Productos creados: ${created}`);
  console.log(`Productos ya existentes: ${skipped}`);

  // Verify
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  console.log(`\nTotal de productos en table: ${totalProducts}`);
}

async function main() {
  try {
    await populateProducts();
    console.log("\n✓ ACCIÓN 2 COMPLETADA\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
