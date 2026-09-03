import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check ALL options regardless of product
const { data, error } = await supabase
  .from("product_options")
  .select("id, product_id, name, price_amount, ghl_price_id, sku")
  .order("created_at", { ascending: false })
  .limit(20);

if (error) {
  console.error("Error:", error);
} else {
  console.log("Latest 20 product options:");
  data.forEach((opt) => {
    console.log(`  ${opt.name} (Product: ${opt.product_id.substring(0, 8)}..., Price: ${opt.price_amount}, GHL ID: ${opt.ghl_price_id || "NULL"}, SKU: ${opt.sku})`);
  });
}
