const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID;

async function check() {
  const res = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${locationId}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Version": "v3",
      },
    }
  );

  const data = await res.json();
  if (data.items && data.items[0]) {
    console.log("Existing product 'pepito':");
    console.log(JSON.stringify(data.items[0], null, 2));
  }
}

check().catch(console.error);
