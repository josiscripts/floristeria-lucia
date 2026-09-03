import { createClient } from "@supabase/supabase-js";

const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing with /prices endpoint (plural)...\n");

// Try with /prices (plural)
const endpoint = `https://services.higherlevel.com/v3/products/${ghlProductId}/prices?locationId=${ghlLocationId}`;
const payload = {
  name: "TEST PRICE",
  amount: 25,
  currency: "EUR",
  sku: "TEST-SKU-001",
  status: "active",
};

console.log(`POST ${endpoint}\n`);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type");
  const text = await response.text();
  
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`Response Body (first 500 chars):\n${text.substring(0, 500)}`);

  if (contentType && contentType.includes("application/json")) {
    const data = JSON.parse(text);
    console.log(`\nParsed JSON:`, JSON.stringify(data, null, 2));
    
    if (data._id) {
      console.log(`✓ Price ID (response._id): ${data._id}`);
    } else if (data.id) {
      console.log(`✓ Price ID (response.id): ${data.id}`);
    } else {
      console.log(`✗ No price ID found`);
    }
  }
} catch (error) {
  console.error(`Error:`, error.message);
}
