import https from "https";

const GHL_TOKEN = process.env.GHL_TOKEN || "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "vOq7yOWR63XGU4qQ7XWd";

function request(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "services.leadconnectorhq.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "v3",
        "Content-Type": "application/json",
      },
    };

    https
      .request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, data: null });
          }
        });
      })
      .on("error", reject)
      .end();
  });
}

async function main() {
  console.log("=== Deleting ALL GHL Products ===\n");

  // Step 1: Get ALL products (paginate through all)
  console.log("Step 1: Fetching all products...");
  let allProducts = [];
  let skip = 0;
  const limit = 100;

  while (true) {
    const { data } = await request(
      "GET",
      `/products/?locationId=${GHL_LOCATION_ID}&limit=${limit}&skip=${skip}`,
    );
    const products = data?.items || data?.products || [];

    if (products.length === 0) break;
    allProducts = allProducts.concat(products);
    console.log(`  Fetched ${products.length} products (total: ${allProducts.length})`);
    skip += limit;
  }

  console.log(`✅ Total products found: ${allProducts.length}\n`);

  // Step 2: Delete each product
  console.log("Step 2: Deleting products...\n");
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    const id = product.id || product._id;
    const name = (product.name || "Unknown").substring(0, 50);

    const { status } = await request("DELETE", `/products/${id}?locationId=${GHL_LOCATION_ID}`);

    if (status === 200 || status === 204) {
      deleted++;
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`  [${i + 1}/${allProducts.length}] Deleted: ${deleted} ✓\n`);
      }
    } else {
      failed++;
      console.log(
        `  [${i + 1}/${allProducts.length}] ❌ Failed to delete ${id.substring(0, 12)} (${status})`,
      );
    }
  }

  console.log(`\n=== DELETION SUMMARY ===`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Successfully deleted: ${deleted}`);
  console.log(`Failed: ${failed}`);

  // Step 3: Verify deletion
  console.log("\nStep 3: Verifying deletion...");
  const { data } = await request("GET", `/products/?locationId=${GHL_LOCATION_ID}&limit=10`);
  const remaining = data?.items || data?.products || [];
  const totalRemaining = data?.total || remaining.length;

  console.log(`\n✅ Products remaining in GHL: ${totalRemaining}`);

  if (totalRemaining === 0) {
    console.log("✅ SUCCESS: GHL is now clean!");
  } else {
    console.log(`⚠️  WARNING: Still ${totalRemaining} products in GHL`);
  }
}

main().catch(console.error);
