const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing /prices endpoint with correct format...\n");

// Correct endpoint: /prices (not /v3/products/{id}/prices)
const endpoint = `https://services.leadconnectorhq.com/prices?locationId=${ghlLocationId}&productId=${ghlProductId}`;
const payload = {
  name: "Test Price",
  amount: 2500, // in cents
  currency: "EUR",
  sku: "TEST-SKU-001",
};

console.log(`POST ${endpoint.replace(ghlToken, "***")}\n`);
console.log(`Payload:`, JSON.stringify(payload, null, 2), "\n");

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
      Version: "v3",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log(`Status: ${response.status} ${response.statusText}`);

  if (text) {
    try {
      const data = JSON.parse(text);
      console.log("Response:", JSON.stringify(data, null, 2));

      if (data._id) {
        console.log(`✓ Price ID (response._id): ${data._id}`);
      } else if (data.id) {
        console.log(`✓ Price ID (response.id): ${data.id}`);
      }
    } catch {
      console.log("Response body:", text.substring(0, 300));
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
