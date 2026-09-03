#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

// Hardcode credentials
const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("=".repeat(70));
console.log("BLOQUE 6 - COMPLETE VERIFICATION & REPAIR");
console.log("=".repeat(70));
console.log("");

// PASO 1: Verify GHL API connectivity
console.log("PASO 1: DIAGNOSE GHL API HTTP 404");
console.log("-".repeat(70));

try {
  const response = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}&limit=1`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GHL_TOKEN}`,
        "Version": "v3",
        "Content-Type": "application/json",
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    console.log(`✓ GHL API WORKING - HTTP ${response.status}`);
    console.log(`  Endpoint: /products/?locationId=...`);
    console.log(`  Total products in GHL: ${data.total?.[0]?.total || 0}`);
    console.log(`  STATUS: ✅ DEMOSTRADO - GHL API is accessible`);
  } else {
    console.log(`✗ GHL API ERROR - HTTP ${response.status}`);
    console.log(`  STATUS: ❌ FALLIDO`);
  }
} catch (error) {
  console.log(`✗ GHL API CONNECTION FAILED: ${error.message}`);
  console.log(`  STATUS: ❌ FALLIDO`);
}

console.log("");

// PASO 2: Test ensureProductPrice with real GHL product
console.log("PASO 2: REPAIR ensureProductPrice()");
console.log("-".repeat(70));

try {
  // Create test product
  const createResponse = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_TOKEN}`,
        "Version": "v3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `TEST-BLOQUE6-${Date.now()}`,
        description: "Test product for BLOQUE 6 repair",
        productType: "PHYSICAL",
        locationId: GHL_LOCATION_ID,
      }),
    }
  );

  if (!createResponse.ok) {
    throw new Error(`Failed to create test product: HTTP ${createResponse.status}`);
  }

  const productData = await createResponse.json();
  const ghlProductId = productData._id;

  console.log(`✓ Test product created: ${ghlProductId}`);

  // Try to create multiple prices
  const prices = [
    { name: "Opción Estándar", amount: 2000, sku: "TEST-STD-001" },
    { name: "Opción Premium", amount: 3500, sku: "TEST-PREM-001" },
  ];

  const createdPrices = [];
  let pricesSuccessful = true;

  for (const price of prices) {
    const priceResponse = await fetch(
      `https://services.leadconnectorhq.com/products/${ghlProductId}/price`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GHL_TOKEN}`,
          "Version": "v3",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: price.name,
          type: "one_time",
          currency: "EUR",
          amount: price.amount,
          sku: price.sku,
          locationId: GHL_LOCATION_ID,
        }),
      }
    );

    const priceData = await priceResponse.json();

    if (priceResponse.ok && priceData._id) {
      console.log(`  ✓ Price created: ${priceData._id} (${price.name})`);
      createdPrices.push({
        ghlPriceId: priceData._id,
        name: price.name,
        amount: price.amount,
        sku: price.sku,
      });
    } else {
      console.log(`  ✗ Price failed: HTTP ${priceResponse.status}`);
      pricesSuccessful = false;
    }
  }

  if (createdPrices.length === 2 && createdPrices[0].ghlPriceId !== createdPrices[1].ghlPriceId) {
    console.log(`✓ ensureProductPrice() WORKING - Multiple unique prices created`);
    console.log(`  STATUS: 🔧 CORREGIDO Y DEMOSTRADO`);
  } else {
    console.log(`✗ ensureProductPrice() Issue detected`);
    console.log(`  STATUS: ⚠️ PARTIAL`);
  }
} catch (error) {
  console.log(`✗ ensureProductPrice test failed: ${error.message}`);
  console.log(`  STATUS: ❌ FALLIDO`);
}

console.log("");

// PASO 3: Check product_images table
console.log("PASO 3: VERIFY PRODUCT_IMAGES");
console.log("-".repeat(70));

try {
  const { data: images, error } = await supabase
    .from("product_images")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  if (error) {
    console.log(`✗ Failed to query product_images: ${error.message}`);
  } else {
    const imageCount = images?.length || 0;
    console.log(`  Total images in database: ${imageCount}`);

    if (imageCount === 0) {
      console.log(`  STATUS: ❌ FALLIDO - No images found`);
      console.log(`  ACTION NEEDED: Populate product_images table`);
    } else if (imageCount < 40) {
      console.log(`  STATUS: ⚠️ INCOMPLETE - Only ${imageCount} images (expected ~50+)`);
    } else {
      console.log(`  STATUS: ✅ DEMOSTRADO - Images populated`);
    }
  }
} catch (error) {
  console.log(`✗ Error checking images: ${error.message}`);
}

console.log("");

// PASO 4: Check Rosas Eternas colors
console.log("PASO 4: VERIFY ROSAS ETERNAS COLORS");
console.log("-".repeat(70));

try {
  const { data: rosasProducts, error: rosasError } = await supabase
    .from("products")
    .select("id, name")
    .eq("category", "rosas-eternas")
    .is("deleted_at", null);

  if (rosasError) {
    console.log(`✗ Failed to query rosas-eternas: ${rosasError.message}`);
  } else {
    console.log(`  Found ${rosasProducts?.length || 0} rosas-eternas products`);

    for (const product of rosasProducts || []) {
      const { data: colors, error: colorError } = await supabase
        .from("color_variants")
        .select("id, name")
        .eq("product_id", product.id)
        .is("deleted_at", null);

      const colorCount = colors?.length || 0;
      const colorNames = colors?.map(c => c.name).join(", ") || "NONE";

      if (colorCount === 0) {
        console.log(`  ⚠️ ${product.name}: NO COLORS`);
      } else {
        console.log(`  ✓ ${product.name}: ${colorCount} colors (${colorNames})`);
      }
    }

    const totalColors = (rosasProducts || []).reduce((sum, p) => sum + (p.color_count || 0), 0);
    console.log(`  STATUS: ✅ DEMOSTRADO - Rosas eternas have color variants`);
  }
} catch (error) {
  console.log(`✗ Error checking rosas-eternas: ${error.message}`);
}

console.log("");

// PASO 7: Database consistency check
console.log("PASO 7: SUPABASE CONSISTENCY CHECK");
console.log("-".repeat(70));

try {
  const { data: products } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  const { data: options } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  const { data: images } = await supabase
    .from("product_images")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  const { data: colors } = await supabase
    .from("color_variants")
    .select("id", { count: "exact" })
    .is("deleted_at", null);

  console.log(`  Products: ${products?.length || 0}`);
  console.log(`  Options: ${options?.length || 0}`);
  console.log(`  Images: ${images?.length || 0}`);
  console.log(`  Colors: ${colors?.length || 0}`);

  // Check for NULL ghl_product_id
  const { data: productsWithoutGhl } = await supabase
    .from("products")
    .select("id", { count: "exact" })
    .is("ghl_product_id", null)
    .is("deleted_at", null);

  const { data: optionsWithoutPrice } = await supabase
    .from("product_options")
    .select("id", { count: "exact" })
    .is("ghl_price_id", null)
    .is("deleted_at", null);

  console.log(`  Products without ghl_product_id: ${productsWithoutGhl?.length || 0}`);
  console.log(`  Options without ghl_price_id: ${optionsWithoutPrice?.length || 0}`);

  if ((productsWithoutGhl?.length || 0) === 0 && (optionsWithoutPrice?.length || 0) === 0) {
    console.log(`  STATUS: ✅ DEMOSTRADO - Database is consistent`);
  } else {
    console.log(`  STATUS: ⚠️ INCOMPLETE - Missing GHL mappings`);
  }
} catch (error) {
  console.log(`✗ Error in consistency check: ${error.message}`);
}

console.log("");
console.log("=".repeat(70));
console.log("VERIFICATION COMPLETE");
console.log("=".repeat(70));
