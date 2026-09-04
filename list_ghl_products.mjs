const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;

console.log("Listing GHL products...\n");

const endpoint = `https://services.leadconnectorhq.com/v3/products?locationId=${ghlLocationId}&limit=50`;

try {
  const response = await fetch(endpoint, {
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
    const data = JSON.parse(text);
    console.log(`Total products: ${data.total || data.products?.length || 0}`);

    if (data.products && data.products.length > 0) {
      console.log(`\nProducts:`);
      data.products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (ID: ${p.id})`);
      });

      // Look for our test product
      const testProduct = data.products.find(
        (p) => p.name.includes("REPARACIÓN") || p.name.includes("TEST"),
      );
      if (testProduct) {
        console.log(`\n✓ Found test product: ${testProduct.id}`);
      } else {
        console.log(`\n✗ Test product not found in GHL`);
      }
    } else {
      console.log("No products returned");
    }
  } else {
    console.log("Response body:", text.substring(0, 300));
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
