import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://leksmflinhohnekbgmgj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk3NzI2NSwiaWF0IjoxNzg3NDM3OTQ4LCJleHAiOjIxMDMwMTM5NDh9.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM",
);

async function auditPhaseA() {
  console.log("=== FASE A - AUDITORÍA SUPABASE ===\n");

  const tables = [
    { name: "products", query: "id" },
    { name: "product_options", query: "id" },
    { name: "color_variants", query: "id" },
    { name: "product_images", query: "id" },
  ];

  const result = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select(table.query, { count: "exact", head: true });

      if (error) throw error;
      result[table.name] = count || 0;
      console.log(`✅ ${table.name}: ${count || 0} registros`);
    } catch (error) {
      console.log(`❌ ${table.name}: Error - ${error.message}`);
      result[table.name] = "error";
    }
  }

  // Check for orphans
  console.log("\n=== Verificando Huérfanos ===");

  try {
    const { count: orphanOptions } = await supabase
      .from("product_options")
      .select("id", { count: "exact", head: true })
      .not("product_id", "in", `(SELECT id FROM products)`);
    console.log(`Opciones huérfanas: ${orphanOptions || 0}`);
  } catch (e) {
    console.log(`Error verificando opciones huérfanas: ${e.message}`);
  }

  console.log("\n=== RESUMEN ===");
  console.log(JSON.stringify(result, null, 2));

  return result;
}

auditPhaseA().catch(console.error);
