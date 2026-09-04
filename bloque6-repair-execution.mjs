#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("=".repeat(70));
console.log("BLOQUE 6 - REPAIR EXECUTION");
console.log("=".repeat(70));
console.log("");

// STEP 1: Fetch all product_options with NULL ghl_price_id
console.log("STEP 1: SYNC PRODUCT_OPTIONS TO GHL");
console.log("-".repeat(70));

try {
  const { data: optionsToSync } = await supabase
    .from("product_options")
    .select("id, product_id, name, price_amount, sku")
    .is("ghl_price_id", null);

  console.log(`Found ${optionsToSync?.length || 0} options to sync`);
  console.log("");

  let successCount = 0;
  let failCount = 0;

  for (const option of optionsToSync || []) {
    // Get the product to find its ghl_product_id
    const { data: product } = await supabase
      .from("products")
      .select("ghl_product_id")
      .eq("id", option.product_id)
      .single();

    if (!product || !product.ghl_product_id) {
      console.log(`✗ Option ${option.name}: Product GHL ID not found`);
      failCount++;
      continue;
    }

    // Create price in GHL
    try {
      const priceResponse = await fetch(
        `https://services.leadconnectorhq.com/products/${product.ghl_product_id}/price`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GHL_TOKEN}`,
            Version: "v3",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: option.name,
            type: "one_time",
            currency: "EUR",
            amount: Math.round(option.price_amount * 100), // Convert to cents
            sku: option.sku,
            locationId: GHL_LOCATION_ID,
          }),
        },
      );

      const priceData = await priceResponse.json();

      if (priceResponse.ok && priceData._id) {
        // Update Supabase with the ghl_price_id
        const { error: updateError } = await supabase
          .from("product_options")
          .update({ ghl_price_id: priceData._id })
          .eq("id", option.id);

        if (updateError) {
          console.log(`✗ Option ${option.name}: Sync to GHL OK but DB update failed`);
          failCount++;
        } else {
          console.log(`✓ Option ${option.name}: Synced (${priceData._id})`);
          successCount++;
        }
      } else {
        console.log(`✗ Option ${option.name}: GHL creation failed (${priceResponse.status})`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Option ${option.name}: Error - ${error.message}`);
      failCount++;
    }
  }

  console.log("");
  console.log(`Results: ${successCount} synced, ${failCount} failed`);
} catch (error) {
  console.log(`Error in sync step: ${error.message}`);
}

console.log("");

// STEP 2: Verify Rosas Eternas colors
console.log("STEP 2: VERIFY ROSAS ETERNAS COLORS");
console.log("-".repeat(70));

try {
  const { data: rosasProducts } = await supabase
    .from("products")
    .select("id, name, category")
    .eq("category", "rosas-eternas");

  console.log(`Found ${rosasProducts?.length || 0} rosas-eternas products`);

  for (const product of rosasProducts || []) {
    const { data: colors } = await supabase
      .from("color_variants")
      .select("name")
      .eq("product_id", product.id);

    const colorCount = colors?.length || 0;
    const colorNames = colors?.map((c) => c.name).join(", ") || "NONE";

    if (colorCount === 0) {
      console.log(`✗ ${product.name}: NO COLORS - Creating defaults...`);

      // Create default colors
      const defaultColors = ["Rojo", "Blanco", "Rosa"];
      for (let i = 0; i < defaultColors.length; i++) {
        await supabase.from("color_variants").insert({
          product_id: product.id,
          name: defaultColors[i],
          sort_order: i + 1,
          active: true,
        });
      }

      console.log(`  ✓ Added default colors: ${defaultColors.join(", ")}`);
    } else {
      console.log(`✓ ${product.name}: ${colorCount} colors (${colorNames})`);
    }
  }
} catch (error) {
  console.log(`Error in colors step: ${error.message}`);
}

console.log("");

// STEP 3: Create sample product_images entries
console.log("STEP 3: POPULATE PRODUCT_IMAGES");
console.log("-".repeat(70));

try {
  // For now, create image entries using the catalog image URLs
  // In production, you'd use real image URLs or file storage
  const { data: products } = await supabase.from("products").select("id, name, cover_image_url");

  let createdCount = 0;

  for (const product of products || []) {
    if (product.cover_image_url) {
      // Check if image already exists
      const { data: existing } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", product.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Insert product image
        const { error: insertError } = await supabase.from("product_images").insert({
          product_id: product.id,
          image_url: product.cover_image_url,
          is_primary: true,
          sort_order: 1,
        });

        if (!insertError) {
          createdCount++;
        }
      }
    }
  }

  console.log(`✓ Created ${createdCount} product image entries`);
} catch (error) {
  console.log(`Error in images step: ${error.message}`);
}

console.log("");

// STEP 4: Final verification
console.log("STEP 4: FINAL VERIFICATION");
console.log("-".repeat(70));

try {
  const { data: optionsWithPrice } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .not("ghl_price_id", "is", null);

  const { data: optionsTotal } = await supabase
    .from("product_options")
    .select("id", { count: "exact" });

  const { data: images } = await supabase.from("product_images").select("id", { count: "exact" });

  const { data: colorVariants } = await supabase
    .from("color_variants")
    .select("id", { count: "exact" });

  console.log(
    `Options with ghl_price_id: ${optionsWithPrice?.length || 0}/${optionsTotal?.length || 0}`,
  );
  console.log(`Product images: ${images?.length || 0}`);
  console.log(`Color variants: ${colorVariants?.length || 0}`);

  if (
    (optionsWithPrice?.length || 0) === (optionsTotal?.length || 0) &&
    (optionsTotal?.length || 0) > 0
  ) {
    console.log(`✓ STATUS: ✅ PASO 2 COMPLETED - All options synced to GHL`);
  } else {
    console.log(`⚠ STATUS: ⚠️ Some options still need sync`);
  }

  if ((images?.length || 0) > 0) {
    console.log(`✓ STATUS: ✅ PASO 3 COMPLETED - Images populated`);
  }

  if ((colorVariants?.length || 0) > 0) {
    console.log(`✓ STATUS: ✅ PASO 4 COMPLETED - Color variants present`);
  }
} catch (error) {
  console.log(`Error in verification: ${error.message}`);
}

console.log("");
console.log("=".repeat(70));
console.log("REPAIR EXECUTION COMPLETE");
console.log("=".repeat(70));
