const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;

console.log("Testing different /products endpoints...\n");

const endpoints = [
  `/products?locationId=${ghlLocationId}&limit=1`,
  `/products/?locationId=${ghlLocationId}&limit=1`,
  `/product?locationId=${ghlLocationId}&limit=1`,
];

for (const endpoint of endpoints) {
  console.log(`GET ${endpoint}`);

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
    console.log(`  Status: ${response.status}`);

    if (response.status === 200 && text) {
      try {
        const data = JSON.parse(text);
        console.log(`  ✓ Response: ${JSON.stringify(data).substring(0, 100)}`);
      } catch {
        console.log(`  Body: ${text.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log("");
}
