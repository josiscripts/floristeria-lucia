#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ajlzrqfhjfdgwlzvmfxo.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbHpycWZoamZkZ3dsendtZnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NTg1OTUsImV4cCI6MjAzNTQzNDU5NX0.P5Yb5JiJJ8ZKfXNWXp4J_3i0eqI1qrYpPeS8hmQECDE";

async function check() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("Verificando datos en Supabase\n");

  const { data, error } = await supabase.from("product_metadata").select("*").limit(5);

  if (error) {
    console.log("✗ Error:", error.message);
    return;
  }

  console.log(`Total registros en Supabase: (mostrando primeros 5)\n`);

  if (Array.isArray(data)) {
    console.log(`Registros encontrados: ${data.length}\n`);

    data.forEach((r, i) => {
      console.log(`${i + 1}. ${r.ghl_product_id}`);
      console.log(`   category: ${r.category}`);
      console.log(`   price_min: ${r.price_min}`);
      console.log(`   sku: ${r.sku}`);
      console.log(`   status: ${r.status}\n`);
    });
  } else {
    console.log("✗ No data returned");
  }

  // Count total
  const { count, error: countError } = await supabase
    .from("product_metadata")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Error counting:", countError.message);
  } else {
    console.log(`\n✓ Total registros en tabla: ${count}`);
  }
}

check();
