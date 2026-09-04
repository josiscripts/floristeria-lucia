const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

async function check() {
  const res = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${locationId}&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Version: "v3",
      },
    },
  );

  const data = await res.json();
  const items = data.items || [];

  console.log("=== GHL PRODUCTS DETAILED ===\n");
  items.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   ID: ${p.id || p._id}`);
    console.log(`   Category: "${p.category || "EMPTY"}"`);
    console.log(`   Price: ${p.price}`);
    console.log(`   SKU: ${p.sku || "NONE"}`);
    console.log(`   Description: ${(p.description || "").substring(0, 60)}...`);
    console.log();
  });
}

check().catch(console.error);
