import { createClient } from "@supabase/supabase-js";

const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Checking GHL prices for product...\n");

// Try different endpoints to get prices
const endpoints = [
  `/v3/products/${ghlProductId}/prices?locationId=${ghlLocationId}`,
  `/v3/products/${ghlProductId}?locationId=${ghlLocationId}`,
  `/v3/prices?locationId=${ghlLocationId}&productId=${ghlProductId}`,
];

for (const endpoint of endpoints) {
  console.log(`\nGET ${endpoint}`);

  try {
    const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ghlToken}`,
        "Content-Type": "application/json",
        Version: "v3",
      },
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      try {
        const data = JSON.parse(text);
        console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
      } catch (e) {
        console.log("Body:", text.substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}
