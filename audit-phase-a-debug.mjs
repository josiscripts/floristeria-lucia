import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://leksmflinhohnekbgmgj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk3NzI2NSwiaWF0IjoxNzg3NDM3OTQ4LCJleHAiOjIxMDMwMTM5NDh9.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM"
);

async function test() {
  console.log("Testing products table...");
  
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    console.log("Error:", error);
    console.log("Data:", data);
  } catch (e) {
    console.log("Exception:", e.message);
  }

  // Try to list tables
  console.log("\nTrying to get all tables...");
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("*")
      .eq("table_schema", "public");
    
    console.log("Schema error:", error);
    console.log("Tables:", data?.map(t => t.table_name));
  } catch(e) {
    console.log("Exception:", e.message);
  }
}

test().catch(console.error);
