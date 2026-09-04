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
  console.log("=== FASE C: VERIFICATION OF DELETION ===\n");

  // Check 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`Attempt ${attempt}/3:`);

    const { data } = await request(
      "GET",
      `/products/?locationId=${GHL_LOCATION_ID}&limit=100&page=1`,
    );
    const products = data?.items || data?.products || [];
    const total = data?.total || products.length;

    console.log(`  Total products: ${total}`);
    console.log(`  Page 1 products: ${products.length}`);

    if (total === 0 || (Array.isArray(total) && total[0]?.total === 0)) {
      console.log(`  ✅ Catalog is CLEAN\n`);
      break;
    } else {
      console.log(`  ⏳ Still ${total} products. Waiting 5s before retry...\n`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("=== VERIFICATION COMPLETE ===");
}

main().catch(console.error);
