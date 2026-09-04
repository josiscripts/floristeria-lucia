#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Query table schema using information_schema
  const { data, error } = await supabase
    .rpc("get_table_schema", {
      table_name: "product_metadata",
    })
    .catch(() => ({ data: null, error: { message: "RPC not available" } }));

  if (error || !data) {
    console.log("Cannot query via RPC. Checking via column query:\n");

    // Try to get actual column info from a sample record
    const { data: sample } = await supabase.from("product_metadata").select("*").limit(1);

    if (sample && sample[0]) {
      console.log("Column names from sample record:");
      Object.keys(sample[0]).forEach((col) => {
        const val = sample[0][col];
        const type = typeof val;
        console.log(`  ${col}: ${type} = ${JSON.stringify(val)}`);
      });
    }

    console.log("\nChecking status constraint by testing insert:");

    // Test different status values
    const testValues = ["active", "inactive", "needs_review", "archived", "pending"];
    for (const status of testValues) {
      const { error: testErr } = await supabase.from("product_metadata").insert({
        ghl_product_id: `test-${status}-${Date.now()}`,
        location_id: "vOq7yOWR63XGU4qQ7XWd",
        status: status,
        auto_created: false,
      });

      if (testErr) {
        console.log(`  ✗ ${status}: ${testErr.message}`);
      } else {
        console.log(`  ✓ ${status}: VALID`);
        // Cleanup
        await supabase
          .from("product_metadata")
          .delete()
          .eq("ghl_product_id", `test-${status}-${Date.now()}`);
      }
    }
  }
}

main().catch(console.error);
