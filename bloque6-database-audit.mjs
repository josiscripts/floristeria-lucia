#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

// Hardcode credentials
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("=".repeat(70));
console.log("BLOQUE 6 - DATABASE AUDIT");
console.log("=".repeat(70));
console.log("");

console.log("1. PRODUCTS TABLE");
console.log("-".repeat(70));

try {
  const { data, count } = await supabase
    .from("products")
    .select("id, name, category, ghl_product_id", { count: "exact" });

  console.log(`Total products: ${count}`);
  console.log(`Sample products:`);
  (data || []).slice(0, 5).forEach(p => {
    console.log(`  - ${p.name} (${p.category}): ghl_product_id=${p.ghl_product_id ? '✓' : '✗'}`);
  });
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log("");
console.log("2. PRODUCT_OPTIONS TABLE");
console.log("-".repeat(70));

try {
  const { data, count } = await supabase
    .from("product_options")
    .select("id, name, sku, price_amount, ghl_price_id");

  console.log(`Total options: ${count}`);
  console.log(`Options state:`);
  (data || []).forEach(opt => {
    const ghlStatus = opt.ghl_price_id ? '✓' : '✗';
    console.log(`  - ${opt.name}: €${opt.price_amount} [SKU: ${opt.sku}] ghl_price_id=${ghlStatus}`);
  });
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log("");
console.log("3. PRODUCT_IMAGES TABLE");
console.log("-".repeat(70));

try {
  const { data, count, error } = await supabase
    .from("product_images")
    .select("*")
    .limit(1);

  if (error) {
    console.log(`Error querying: ${error.message}`);
    console.log(`Attempting to check table structure...`);

    // Try to get the raw response
    const response = await supabase
      .from("product_images")
      .select("*")
      .limit(1);

    console.log(`Response:`, response);
  } else {
    console.log(`Total images: ${count}`);
    if (data && data.length > 0) {
      console.log(`Sample image:`, JSON.stringify(data[0], null, 2));
    }
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log("");
console.log("4. COLOR_VARIANTS TABLE");
console.log("-".repeat(70));

try {
  const { data, count } = await supabase
    .from("color_variants")
    .select("id, product_id, name");

  console.log(`Total color variants: ${count}`);
  const byProduct = {};
  (data || []).forEach(cv => {
    if (!byProduct[cv.product_id]) byProduct[cv.product_id] = [];
    byProduct[cv.product_id].push(cv.name);
  });

  Object.entries(byProduct).forEach(([productId, colors]) => {
    console.log(`  Product ${productId}: ${colors.join(', ')}`);
  });
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log("");
console.log("5. TABLES CHECK");
console.log("-".repeat(70));

try {
  // List all tables
  const { data, error } = await supabase.rpc('list_tables');

  if (error) {
    console.log(`Cannot list tables via RPC: ${error.message}`);
    console.log(`Trying to query information_schema...`);
  } else {
    console.log(`Tables available:`, data);
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log("");
console.log("6. SCHEMA ANALYSIS");
console.log("-".repeat(70));

// Try to infer schema by attempting to select all columns
const tables = ["products", "product_options", "product_images", "color_variants"];

for (const tableName of tables) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    if (error) {
      console.log(`${tableName}: ❌ Error - ${error.message}`);
    } else if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`${tableName}: ✓ Columns - ${columns.join(', ')}`);
    } else {
      console.log(`${tableName}: ✓ (empty or no read permission)`);
    }
  } catch (error) {
    console.log(`${tableName}: Error - ${error.message}`);
  }
}

console.log("");
console.log("=".repeat(70));
