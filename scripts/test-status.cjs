#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testStatus(status) {
  const testId = `test-${status}-${Date.now()}`;
  const { error } = await supabase.from("product_metadata").insert({
    ghl_product_id: testId,
    location_id: "vOq7yOWR63XGU4qQ7XWd",
    status: status,
    auto_created: false,
  });

  if (error) {
    console.log(`✗ ${status}: ${error.message}`);
    return false;
  } else {
    console.log(`✓ ${status}: VALID`);
    // Cleanup
    await supabase.from("product_metadata").delete().eq("ghl_product_id", testId);
    return true;
  }
}

async function main() {
  const testValues = ["active", "inactive", "needs_review", "archived", "pending", ""];
  console.log("Testing status values:\n");
  for (const status of testValues) {
    await testStatus(status || "(empty)");
  }
}

main().catch(console.error);
