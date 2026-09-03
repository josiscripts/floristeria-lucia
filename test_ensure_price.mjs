import { createClient } from "@supabase/supabase-js";

// Test ensureProductPrice directly
const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78"; // From previous step

console.log("Testing ensureProductPrice...");
console.log(`GHL Product ID: ${ghlProductId}`);
console.log(`GHL Location ID: ${ghlLocationId}`);
console.log(`Token exists: ${!!ghlToken}`);

// Make direct API call to GHL v3
const endpoint = `https://services.higherlevel.com/v3/products/${ghlProductId}/price?locationId=${ghlLocationId}`;
const payload = {
  name: "TEST PRICE",
  amount: 25,
  currency: "EUR",
  sku: "TEST-SKU-001",
  status: "active",
};

console.log(`\nPOST ${endpoint}`);
console.log(`Payload:`, payload);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log(`\nStatus: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.ok && data._id) {
    console.log(`\n✓ Price ID received: ${data._id}`);
  } else if (response.ok && data.id) {
    console.log(`\n✓ Price ID received (response.id): ${data.id}`);
  } else {
    console.log(`\n✗ No price ID in response`);
  }
} catch (error) {
  console.error(`\n✗ Error:`, error.message);
}
