// Quick audit of Supabase tables using REST API
import https from "https";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk3NzI2NSwiaWF0IjoxNzg3NDM3OTQ4LCJleHAiOjIxMDMwMTM5NDh9.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM",
);

async function main() {
  console.log("=== SUPABASE TABLE AUDIT ===\n");

  const tables = ["products", "product_options", "color_variants", "product_images"];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (e) {
      console.log(`⚠️  ${table}: Exception - ${e.message}`);
    }
  }

  console.log("\n=== END AUDIT ===");
}

main().catch(console.error);
