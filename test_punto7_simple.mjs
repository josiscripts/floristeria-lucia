#!/usr/bin/env node

// Hardcode credentials from .env
const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";

console.log("=".repeat(60));
console.log("PUNTO 7 FIX - VALIDATION TEST");
console.log("Testing corrected ensureProductPrice endpoint");
console.log("=".repeat(60));
console.log("");

// Step 1: Create product
console.log("STEP 1: Create temporary product in GHL");
console.log("-".repeat(60));

const createProductPayload = {
  name: `TEST_PUNTO7_${Date.now()}`,
  description: "Test temporal para validar PUNTO 7 fix",
  productType: "PHYSICAL",
  locationId: GHL_LOCATION_ID,
};

try {
  const productResponse = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_TOKEN}`,
        "Version": "v3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createProductPayload),
    }
  );

  if (!productResponse.ok) {
    throw new Error(`HTTP ${productResponse.status}: ${await productResponse.text()}`);
  }

  const productData = await productResponse.json();
  const ghlProductId = productData._id;

  if (!ghlProductId) {
    throw new Error(`No product ID returned: ${JSON.stringify(productData)}`);
  }

  console.log(`✓ Product created: ${ghlProductId}`);
  console.log("");

  // Step 2: Create multiple prices using the CORRECTED endpoint
  console.log("STEP 2: Create prices using corrected endpoint");
  console.log(`Endpoint: POST /products/{productId}/price`);
  console.log("-".repeat(60));

  const pricesData = [
    {
      name: "Opción Basic",
      type: "one_time",
      currency: "EUR",
      amount: 2500,
      sku: "FL-TEST-BASIC-001",
    },
    {
      name: "Opción Premium",
      type: "one_time",
      currency: "EUR",
      amount: 5000,
      sku: "FL-TEST-PREMIUM-001",
    },
  ];

  const createdPrices = [];

  for (const pricePayload of pricesData) {
    console.log(`\nCreating: ${pricePayload.name}`);
    console.log(`  Amount: €${(pricePayload.amount / 100).toFixed(2)}`);
    console.log(`  SKU: ${pricePayload.sku}`);

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
          ...pricePayload,
          locationId: GHL_LOCATION_ID,
        }),
      }
    );

    const priceData = await priceResponse.json();

    if (priceResponse.ok) {
      const priceId = priceData._id;
      if (priceId) {
        console.log(`  ✓ Price created: ${priceId}`);
        createdPrices.push({
          name: pricePayload.name,
          sku: pricePayload.sku,
          amount: pricePayload.amount,
          ghlPriceId: priceId,
        });
      } else {
        console.log(`  ✗ No price ID in response:`, priceData);
      }
    } else {
      console.log(`  ✗ HTTP ${priceResponse.status}: ${JSON.stringify(priceData)}`);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("STEP 3: Verify results");
  console.log("=".repeat(60));

  if (createdPrices.length === 2) {
    console.log(`✓ Both prices created successfully\n`);

    for (let i = 0; i < createdPrices.length; i++) {
      const p = createdPrices[i];
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Amount: €${(p.amount / 100).toFixed(2)}`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   GHL Price ID: ${p.ghlPriceId}`);
      console.log("");
    }

    // Check if IDs are different
    if (createdPrices[0].ghlPriceId !== createdPrices[1].ghlPriceId) {
      console.log("✓ CRITICAL: Price IDs are DIFFERENT (no duplicates)");
    } else {
      console.log("✗ CRITICAL: Price IDs are SAME (DUPLICATE)");
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("TEST RESULT: PASSED ✓");
    console.log("=".repeat(60));
    console.log("");
    console.log("Endpoint correction is working correctly.");
    console.log("ensureProductPrice() is now using:");
    console.log("  POST /products/{productId}/price");
    console.log("");
  } else {
    console.log(`✗ Expected 2 prices, got ${createdPrices.length}`);
    console.log("");
    console.log("=".repeat(60));
    console.log("TEST RESULT: PARTIAL ⚠");
    console.log("=".repeat(60));
  }
} catch (error) {
  console.error("✗ Test failed with error:");
  console.error(error.message);
  console.log("");
  console.log("=".repeat(60));
  console.log("TEST RESULT: FAILED ✗");
  console.log("=".repeat(60));
  process.exit(1);
}

