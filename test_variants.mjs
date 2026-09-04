const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Testing variant creation...\n");

const endpoint = `/products/${ghlProductId}/?locationId=${ghlLocationId}`;
const payload = {
  variants: [
    {
      name: "Basic",
      sku: "FL-RAM-BASIC",
      price: 2500,
    },
    {
      name: "Premium",
      sku: "FL-RAM-PREMIUM",
      price: 4500,
    },
  ],
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

      if (data.variants) {
        console.log(`\n✓ Variants created: ${data.variants.length}`);
        data.variants.forEach((v) => {
          console.log(`  - ${v.name}: ${v.price} (ID: ${v._id || v.id})`);
        });
      }
    } catch {
      console.log("Response body:", text.substring(0, 300));
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
