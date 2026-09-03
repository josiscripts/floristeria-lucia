const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const ghlLocationId = process.env.GHL_LOCATION_ID;
const ghlProductId = "6a99b5382ec6f6c3e6a90b78";

console.log("Getting full product details...\n");

const endpoint = `/products/?locationId=${ghlLocationId}&id=${ghlProductId}`;

try {
  const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${ghlToken}`,
      "Content-Type": "application/json",
      "Version": "v3",
    },
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  
  if (response.status === 200) {
    const data = JSON.parse(text);
    console.log("Full product response:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("Response body:", text.substring(0, 500));
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
}
