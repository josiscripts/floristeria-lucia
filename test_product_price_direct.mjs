const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing direct price field update...\n");

const endpoint = `/products/`;
const payload = {
  locationId: ghlLocationId,
  id: ghlProductId,
  name: "REPARACIÓN PUNTO 7 - TEST MULTIPRECIOS",
  price: 2500, // 25 EUR in cents
  sku: "FL-RAM-BASIC",
};

console.log(`PUT ${endpoint}`);
console.log(`Payload:`, JSON.stringify(payload, null, 2), "\n");

try {
  const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
      Version: "v3",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);

  if (text) {
    try {
      const data = JSON.parse(text);
      console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));

      if (data._id || data.id) {
        console.log(`\n✓ Product updated: ${data._id || data.id}`);
      }
    } catch {
      console.log("Response body:", text);
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
