import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const productId = "14c99b1a-5666-4234-937f-58238af90418";

const { data, error } = await supabase
  .from("product_options")
  .select("id, name, price_amount, discount_percent, stock_quantity, sku, ghl_price_id")
  .eq("product_id", productId)
  .order("price_amount");

if (error) {
  console.error("Error:", error);
} else {
  console.log("Product Options:");
  if (data.length === 0) {
    console.log("  NO OPTIONS FOUND");
  } else {
    data.forEach((opt) => {
      console.log(`  ${opt.name}:`);
      console.log(`    - Price: ${opt.price_amount}`);
      console.log(`    - Discount: ${opt.discount_percent}%`);
      console.log(`    - Stock: ${opt.stock_quantity}`);
      console.log(`    - SKU: ${opt.sku}`);
      console.log(`    - GHL Price ID: ${opt.ghl_price_id || "NULL"}`);
    });
  }
}
