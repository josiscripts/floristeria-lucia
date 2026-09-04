#!/usr/bin/env node

/**
 * Script de prueba para verificar conexión a GoHighLevel Products API v3
 * Uso: node scripts/test-ghl-connection.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try .env.local first, then .env
let envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  envPath = path.join(__dirname, "..", ".env");
}

// Leer .env
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Environment file not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim();
      // Remove quotes if present
      env[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  });

  return env;
}

async function testGHLConnection() {
  console.log("\n🧪 GoHighLevel Products API v3 Connection Test\n");
  console.log("━".repeat(60));

  try {
    // 1. Load environment
    console.log("📄 Loading environment variables...");
    const env = loadEnv(envPath);
    const token = env.GHL_PRIVATE_INTEGRATION_TOKEN;
    const locationId = env.GHL_LOCATION_ID;

    if (!token) {
      console.error("❌ Error: GHL_PRIVATE_INTEGRATION_TOKEN not found");
      process.exit(1);
    }

    if (!locationId) {
      console.error("❌ Error: GHL_LOCATION_ID not found");
      process.exit(1);
    }

    console.log("✅ Environment loaded");
    console.log(
      `   Token: ${token.substring(0, 10)}...${token.substring(token.length - 10)} (${token.length} chars)`,
    );
    console.log(
      `   Location ID: ${locationId.substring(0, 8)}...${locationId.substring(locationId.length - 4)} (${locationId.length} chars)\n`,
    );

    // 2. Test Products API v3
    console.log("🔗 Testing GoHighLevel Products API v3...");
    console.log(`   Endpoint: https://services.leadconnectorhq.com/products/`);
    console.log(`   Method: GET`);
    console.log(`   Version: 2021-07-28\n`);

    const response = await fetch(
      `https://services.leadconnectorhq.com/products/?locationId=${locationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    console.log(`✅ API responded with HTTP ${response.status}\n`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`❌ Error: ${response.statusText}`);
      console.error(`\n📋 Response body:`);
      console.error(`   ${responseText.substring(0, 500)}`);

      console.error("\n🔍 Analysis:");
      if (response.status === 401) {
        console.error("   401 Unauthorized = Token invalid or expired");
        console.error("   Action: Verify token in GHL Dashboard");
      } else if (response.status === 403) {
        console.error("   403 Forbidden = Token lacks permissions");
        console.error("   Action: Check integration scopes");
      } else if (response.status === 404) {
        console.error("   404 Not Found = LocationId invalid or endpoint wrong");
        console.error("   Action: Verify locationId and endpoint");
      } else if (response.status === 400) {
        console.error("   400 Bad Request = Invalid parameters");
        console.error("   Action: Check query parameters and headers");
      }

      process.exit(1);
    }

    const data = await response.json();

    // 3. Display results
    console.log("━".repeat(60));
    console.log("✅ CONNECTION SUCCESSFUL\n");

    console.log("📊 Products Response Summary:");
    console.log(`   Total products: ${data.products?.length || data.total || 0}`);

    if (data.meta) {
      console.log(`   Meta info:`, data.meta);
    }

    if (data.products && data.products.length > 0) {
      console.log(`\n📝 Sample Products (first 3):\n`);

      data.products.slice(0, 3).forEach((product, idx) => {
        console.log(`   ${idx + 1}. ${product.name || product.id}`);
        console.log(`      ID: ${product.id}`);
        if (product.price !== undefined) console.log(`      Price: ${product.price}`);
        if (product.cost !== undefined) console.log(`      Cost: ${product.cost}`);
        if (product.description)
          console.log(`      Description: ${product.description.substring(0, 60)}...`);
        if (product.sku) console.log(`      SKU: ${product.sku}`);
        console.log("");
      });

      // Show complete structure of first product
      console.log("━".repeat(60));
      console.log("\n📋 Complete Structure of First Product:\n");
      console.log(JSON.stringify(data.products[0], null, 2));
    } else {
      console.log("\n⚠️  No products returned from API");
    }

    console.log("\n" + "━".repeat(60));
    console.log("\n✅ All tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:\n");

    if (error.name === "AbortError") {
      console.error(`   Error: API request timed out (15 seconds)`);
      console.error("   Cause: API might be slow or unreachable");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error(`   Error: Cannot resolve api.gohighlevel.com`);
      console.error("   Cause: Network/DNS issue");
    } else {
      console.error(`   Error: ${error.message}`);
    }

    console.error("\n" + "━".repeat(60) + "\n");
    process.exit(1);
  }
}

// Run test
testGHLConnection();
