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

async function createImagesAndColors() {
  console.log("\n=== ACCIÓN 4-5: IMÁGENES Y COLORES ===\n");

  // Get all products with ghl_product_id
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, category, ghl_product_id")
    .is("deleted_at", null)
    .order("created_at");

  if (prodError) {
    console.error("Error fetching products:", prodError);
    process.exit(1);
  }

  console.log(`Productos a procesar: ${products.length}`);

  let imagesCreated = 0;
  let colorsCreated = 0;
  let coloredImagesCreated = 0;

  // Color mapping para Rosas Eternas
  const rosasColors = ["Rojo", "Blanco", "Rosa"];

  for (const product of products) {
    try {
      // Create placeholder image URL for each product
      const imageUrl = `https://floristeria-lucia.vercel.app/images/placeholder-${product.category}.png`;
      const storagePath = `products/${product.ghl_product_id}/main.png`;

      // Insert image
      const { error: imgError } = await supabase.from("product_images").insert({
        product_id: product.id,
        ghl_product_id: product.ghl_product_id,
        image_url: imageUrl,
        storage_path: storagePath,
        is_primary: true,
        sort_order: 1,
      });

      if (!imgError) {
        imagesCreated++;
      } else {
        console.warn(`Warning creating image for ${product.name}:`, imgError.message);
      }

      // If Rosas Eternas, create colors and associate images
      if (product.category === "rosas-eternas") {
        // Create color variants
        for (let i = 0; i < rosasColors.length; i++) {
          const { data: colorData, error: colorError } = await supabase
            .from("color_variants")
            .insert({
              product_id: product.id,
              name: rosasColors[i],
              sort_order: i + 1,
              active: true,
            })
            .select("id")
            .single();

          if (!colorError && colorData) {
            colorsCreated++;

            // Create image for each color variant
            const colorImageUrl = `https://floristeria-lucia.vercel.app/images/placeholder-${product.category}-${rosasColors[i].toLowerCase()}.png`;
            const colorStoragePath = `products/${product.ghl_product_id}/${rosasColors[i].toLowerCase()}.png`;

            const { error: colorImgError } = await supabase.from("product_images").insert({
              product_id: product.id,
              ghl_product_id: product.ghl_product_id,
              image_url: colorImageUrl,
              storage_path: colorStoragePath,
              color_variant_id: colorData.id,
              is_primary: false,
              sort_order: i + 2,
            });

            if (!colorImgError) {
              coloredImagesCreated++;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${product.name}:`, error);
    }
  }

  console.log(`\n--- RESULTADO ---`);
  console.log(`Imágenes creadas: ${imagesCreated}`);
  console.log(`Colores creados: ${colorsCreated}`);
  console.log(`Imágenes por color: ${coloredImagesCreated}`);

  // Verify
  const { data: allImages } = await supabase
    .from("product_images")
    .select("COUNT(*) as count", { count: "exact" });

  const { data: rosasWithColors } = await supabase
    .from("products")
    .select("id")
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  const { data: colorVariants } = await supabase
    .from("color_variants")
    .select("COUNT(*) as count", { count: "exact" })
    .is("deleted_at", null);

  console.log(`\nTotal imágenes en BD: ${allImages?.length || 0}`);
  console.log(`Productos Rosas Eternas: ${rosasWithColors?.length || 0}`);
  console.log(`Variantes de color: ${colorVariants?.length || 0}`);
}

async function main() {
  try {
    await createImagesAndColors();
    console.log("\n✓ ACCIONES 4-5 COMPLETADAS\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
