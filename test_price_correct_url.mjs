import { createClient } from "@supabase/supabase-js";

const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing with correct GHL base URL...\n");

// Correct endpoint: services.leadconnectorhq.com (not higherlevel)
const endpoint = `https://services.leadconnectorhq.com/v3/products/${ghlProductId}/prices?locationId=${ghlLocationId}`;
const payload = {
  name: "TEST PRICE BASIC",
  amount: 25,
  currency: "EUR",
  sku: "TEST-SKU-BASIC",
  status: "active",
};

console.log(`POST ${endpoint.replace(ghlToken, "***")}\n`);
console.log(`Payload:`, JSON.stringify(payload, null, 2), "\n");

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
      "Version": "v3",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type");
  const text = await response.text();
  
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${contentType}`);
  
  if (contentType && contentType.includes("application/json")) {
    const data = JSON.parse(text);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (data._id) {
      console.log(`\n✓ SUCCESS - Price ID: ${data._id}`);
    } else if (data.id) {
      console.log(`\n✓ SUCCESS - Price ID: ${data.id}`);
    } else {
      console.log(`\n✗ No ID in response`);
    }
  } else {
    console.log(`Response Body:\n${text.substring(0, 300)}`);
  }
} catch (error) {
  console.error(`✗ Error:`, error.message);
}
