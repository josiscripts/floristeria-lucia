import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function GET() {
  try {
    // Test 1: Count records
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("product_metadata")
      .select("*", { count: "exact", head: true });

    // Test 2: Get first 3 records with all columns
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .limit(3);

    // Test 3: Specific GHL ID lookup
    const testGhlId = "6a9568c0973de9c5b8125afe"; // Corona F26
    const { data: specificData, error: specificError } = await supabaseAdmin
      .from("product_metadata")
      .select("*")
      .eq("ghl_product_id", testGhlId);

    return json({
      totalCount,
      countError: countError?.message,
      sampleRecords: sampleData ? sampleData.slice(0, 3).map(r => ({
        ghl_product_id: r.ghl_product_id,
        category: r.category,
        price_min: r.price_min,
        sku: r.sku,
        status: r.status,
      })) : null,
      sampleError: sampleError?.message,
      specificLookup: {
        testId: testGhlId,
        found: specificData && specificData.length > 0,
        record: specificData && specificData[0] ? {
          category: specificData[0].category,
          price_min: specificData[0].price_min,
          sku: specificData[0].sku,
        } : null,
        error: specificError?.message,
      },
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "Unknown",
    }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/admin/debug-metadata")({
  server: {
    handlers: {
      GET: () => GET(),
    },
  },
});
