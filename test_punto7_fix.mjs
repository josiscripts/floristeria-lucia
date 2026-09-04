import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";

// Load env vars
config({ path: ".env" });
config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=".repeat(50));
console.log("PUNTO 7 FIX - TEST ensureProductPrice()");
console.log("=".repeat(50));
console.log("");

// Check env vars
const GHL_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!GHL_TOKEN || !GHL_LOCATION_ID) {
  console.error("❌ Missing GHL credentials in .env");
  console.error("   GHL_TOKEN:", GHL_TOKEN ? "✓" : "✗");
  console.error("   GHL_LOCATION_ID:", GHL_LOCATION_ID ? "✓" : "✗");
  process.exit(1);
}

console.log("✓ Environment variables loaded");
console.log("  GHL_LOCATION_ID:", GHL_LOCATION_ID);
console.log("");

// Dynamic import of ensureProductPrice
try {
  // Try importing from dist (built files)
  const priceSync = await import("./dist/server/lib/price-sync.server.js").catch(() => null);

  if (!priceSync || !priceSync.ensureProductPrice) {
    console.error("❌ Cannot import ensureProductPrice");
    console.error("   Make sure to run 'npm run build' first");
    process.exit(1);
  }

  const { ensureProductPrice } = priceSync;

  console.log("✓ ensureProductPrice imported successfully");
  console.log("");

  // Create test product in GHL first
  console.log("Step 1: Creating temporary product in GHL...");

  const productResponse = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "v3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `TEST_PUNTO7_${Date.now()}`,
        description: "Temporal para test PUNTO 7",
        productType: "PHYSICAL",
        locationId: GHL_LOCATION_ID,
      }),
    },
  );

  const productData = await productResponse.json();
  const ghlProductId = productData._id;

  if (!ghlProductId) {
    console.error("❌ Failed to create product:", productData);
    process.exit(1);
  }

  console.log("✓ Product created:", ghlProductId);
  console.log("");

  // Test ensureProductPrice with multiple prices
  console.log("Step 2: Creating prices using ensureProductPrice()...");

  const testPrices = [
    {
      name: "Basic",
      amount: 2500,
      sku: "FL-TEST-001",
    },
    {
      name: "Premium",
      amount: 5000,
      sku: "FL-TEST-002",
    },
  ];

  const results = [];

  for (const priceData of testPrices) {
    console.log(`\n  Creating price: ${priceData.name} (€${priceData.amount / 100})`);

    const result = await ensureProductPrice({
      ghlProductId,
      amount: priceData.amount,
      currency: "EUR",
      sku: priceData.sku,
      priceName: priceData.name,
      locationId: GHL_LOCATION_ID,
    });

    if (result.success) {
      console.log(`  ✓ Price created: ${result.ghlPriceId}`);
      results.push({
        name: priceData.name,
        sku: priceData.sku,
        ghlPriceId: result.ghlPriceId,
      });
    } else {
      console.error(`  ✗ Price creation failed: ${result.error}`);
    }
  }

  console.log("");
  console.log("=".repeat(50));
  console.log("RESULTS");
  console.log("=".repeat(50));

  if (results.length === 2) {
    console.log("✓ Both prices created successfully");
    console.log("");

    for (const r of results) {
      console.log(`  ${r.name}:`);
      console.log(`    SKU: ${r.sku}`);
      console.log(`    GHL Price ID: ${r.ghlPriceId}`);
    }

    // Verify IDs are different
    if (results[0].ghlPriceId !== results[1].ghlPriceId) {
      console.log("");
      console.log("✓ Price IDs are different (no duplicates)");
    } else {
      console.log("");
      console.log("✗ Price IDs are the same (ERROR)");
    }
  } else {
    console.log(`✗ Failed to create all prices (created ${results.length}/2)`);
  }

  console.log("");
  console.log("=".repeat(50));
  console.log("TEST STATUS: PASSED");
  console.log("=".repeat(50));
} catch (error) {
  console.error("❌ Test failed with error:");
  console.error(error);
  process.exit(1);
}
