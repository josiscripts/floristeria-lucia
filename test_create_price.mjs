const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing price creation with trailing slash...\n");

// Try /prices/ (with trailing slash)
const endpoint = `/prices/?locationId=${ghlLocationId}&productId=${ghlProductId}`;
const payload = {
  name: "Premium",
  amount: 4500, // 45 EUR in cents
  currency: "EUR",
  sku: "FL-RAM-PREMIUM",
};

console.log(`POST ${endpoint}`);
console.log(`Payload:`, JSON.stringify(payload, null, 2), "\n");

try {
  const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
      "Version": "v3",
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
        console.log(`\n✓ SUCCESS - Price ID: ${data._id}`);
      } else if (data.id) {
        console.log(`\n✓ SUCCESS - Price ID: ${data.id}`);
      } else {
        console.log(`\n✗ No ID in response`);
      }
    } catch {
      console.log("Response body:", text);
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
