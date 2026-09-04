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

async function createRosasColors() {
  console.log("\n=== ACCIÓN 5: CREAR COLORES PARA ROSAS ETERNAS ===\n");

  // Get Rosas Eternas products
  const { data: rosasProducts } = await supabase
    .from("products")
    .select("id, ghl_product_id")
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  console.log(`Productos Rosas Eternas: ${rosasProducts?.length || 0}`);

  const colors = ["Rojo", "Blanco", "Rosa"];
  let colorsCreated = 0;
  let colorImagesCreated = 0;

  for (const product of rosasProducts || []) {
    console.log(`\nProcessing: ${product.id}`);

    for (let i = 0; i < colors.length; i++) {
      const colorName = colors[i];

      // Create color variant
      const { data: colorData, error: colorError } = await supabase
        .from("color_variants")
        .insert({
          product_id: product.id,
          name: colorName,
          sort_order: i + 1,
          active: true,
        })
        .select("id")
        .single();

      if (colorError) {
        console.warn(`  Error creating color ${colorName}:`, colorError.message);
        continue;
      }

      if (colorData) {
        colorsCreated++;
        console.log(`  ✓ Color creado: ${colorName}`);

        // Create image for this color variant
        const colorImageUrl = `https://floristeria-lucia.vercel.app/images/placeholder-rosas-eternas-${colorName.toLowerCase()}.png`;
        const colorStoragePath = `products/${product.ghl_product_id}/${colorName.toLowerCase()}.png`;

        const { error: imgError } = await supabase.from("product_images").insert({
          product_id: product.id,
          ghl_product_id: product.ghl_product_id,
          image_url: colorImageUrl,
          storage_path: colorStoragePath,
          color_variant_id: colorData.id,
          is_primary: false,
          sort_order: i + 2,
        });

        if (!imgError) {
          colorImagesCreated++;
          console.log(`    ✓ Imagen creada para color`);
        } else {
          console.warn(`    Warning image: ${imgError.message}`);
        }
      }
    }
  }

  console.log(`\n--- RESULTADO ---`);
  console.log(`Colores creados: ${colorsCreated}`);
  console.log(`Imágenes por color: ${colorImagesCreated}`);

  // Verify
  const { data: colorVariants } = await supabase
    .from("color_variants")
    .select("COUNT(*) as count", { count: "exact" })
    .is("deleted_at", null);

  console.log(`\nTotal de variantes de color: ${colorVariants?.length || 0}`);
}

async function main() {
  try {
    await createRosasColors();
    console.log("\n✓ ACCIÓN 5 COMPLETADA\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
