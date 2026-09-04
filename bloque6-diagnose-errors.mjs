#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("DIAGNOSTICS: Investigating 422 errors");
console.log("=".repeat(70));
console.log("");

// Get all options that failed to sync
const { data: optionsToCheck } = await supabase
  .from("product_options")
  .select("id, product_id, name, price_amount, sku");

// Get products that have GHL IDs
const { data: products } = await supabase.from("products").select("id, name, ghl_product_id");

const productMap = {};
(products || []).forEach((p) => {
  productMap[p.id] = p;
});

// Find the problematic ones
const problematicOptions = ["Estándar", "Especial", "Premium", "Pequeña", "Mediana", "Grande"];

console.log("Checking problematic options:");
console.log("");

for (const option of optionsToCheck || []) {
  if (problematicOptions.some((p) => option.name.includes(p))) {
    const product = productMap[option.product_id];
    console.log(`Option: ${option.name} (SKU: ${option.sku})`);
    console.log(`  Product: ${product ? product.name : "NOT FOUND"}`);
    console.log(`  GHL Product ID: ${product?.ghl_product_id || "MISSING"}`);
    console.log(`  Price Amount: €${option.price_amount}`);

    if (product && product.ghl_product_id) {
      // Try to create price and capture the error
      (async () => {
        try {
          const response = await fetch(
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
                amount: Math.round(option.price_amount * 100),
                sku: option.sku,
                locationId: GHL_LOCATION_ID,
              }),
            },
          );

          const data = await response.json();
          console.log(`  HTTP: ${response.status}`);
          console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}`);
        } catch (error) {
          console.log(`  Error: ${error.message}`);
        }
      })();
    }

    console.log("");
  }
}

// Also check if these products even exist in GHL
console.log("");
console.log("Checking GHL products...");
console.log("");

try {
  const response = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}&limit=50`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "v3",
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();
  const ghlProductIds = new Set((data.products || []).map((p) => p._id));

  console.log(`Total GHL products: ${data.products?.length}`);
  console.log("");

  console.log("Checking which products are in GHL:");
  for (const product of products || []) {
    const inGhl = ghlProductIds.has(product.ghl_product_id);
    console.log(`  ${inGhl ? "✓" : "✗"} ${product.name} (${product.ghl_product_id})`);
  }
} catch (error) {
  console.log(`Error checking GHL: ${error.message}`);
}
