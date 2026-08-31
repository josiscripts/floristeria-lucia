const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

const productTypes = ["item", "physical", "digital", "service", "ITEM", "PHYSICAL"];

async function tryCreate(productType) {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/products/?locationId=${locationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Version": "v3",
        },
        body: JSON.stringify({
          locationId,
          name: `TEST productType ${productType}`,
          description: "Test",
          price: 10,
          productType,
          category: "ramos",
        }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      console.log(`✓ ${productType}: SUCCESS`);
      return true;
    } else {
      const msg = data.message?.[0] || data.message || "Unknown";
      console.log(`✗ ${productType}: ${msg}`);
      return false;
    }
  } catch (err) {
    console.log(`✗ ${productType}: ${err.message}`);
    return false;
  }
}

async function test() {
  console.log("Testing productType enum values...\n");
  for (const pt of productTypes) {
    await new Promise(r => setTimeout(r, 300));
    await tryCreate(pt);
  }
}

test().catch(console.error);
