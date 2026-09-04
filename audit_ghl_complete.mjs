import fs from "fs";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "v3";
const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID;

if (!token || !locationId) {
  console.error("Missing GHL_PRIVATE_INTEGRATION_TOKEN or GHL_LOCATION_ID");
  process.exit(1);
}

async function ghlFetch(endpoint, options = {}) {
  const url = `${GHL_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };

  console.log(`\n[GHL] GET ${endpoint}`);
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      console.error(`[GHL] Error ${res.status}:`, data);
      return { error: true, status: res.status, data };
    }

    console.log(`[GHL] Success`);
    return { error: false, data };
  } catch (err) {
    console.error(`[GHL] Fetch error:`, err.message);
    return { error: true, message: err.message };
  }
}

async function audit() {
  console.log("=== GHL COMPLETE AUDIT ===\n");
  console.log(`Location ID: ${locationId}`);
  console.log(`API Base: ${GHL_API_BASE}`);
  console.log(`API Version: ${GHL_API_VERSION}`);

  const report = {
    timestamp: new Date().toISOString(),
    locationId,
    products: {},
    collections: {},
    audit: [],
  };

  // 1. Test connection
  console.log("\n--- 1. Testing Connection ---");
  const connTest = await ghlFetch(`/locations/${locationId}`);
  if (!connTest.error) {
    report.audit.push("✓ Location accessible");
  } else {
    report.audit.push("✗ Location NOT accessible");
  }

  // 2. Fetch products
  console.log("\n--- 2. Fetching Products ---");
  const productsRes = await ghlFetch(`/products/?locationId=${locationId}&limit=500`);

  if (!productsRes.error && productsRes.data) {
    const items = productsRes.data.items || productsRes.data.products || [];
    report.products.count = items.length;
    report.products.total = productsRes.data.total;
    report.products.items = items.slice(0, 10).map((p) => ({
      id: p.id || p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      collectionIds: p.collectionIds,
      images: p.images ? p.images.length : 0,
      status: p.status,
    }));

    report.audit.push(`✓ ${items.length} products found`);

    // Analyze categories
    const categories = new Set();
    items.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    report.products.categories = Array.from(categories);
    report.audit.push(`Categories in GHL: ${Array.from(categories).join(", ") || "NONE"}`);

    // Analyze collections
    const collections = new Set();
    items.forEach((p) => {
      if (p.collectionIds && Array.isArray(p.collectionIds)) {
        p.collectionIds.forEach((c) => collections.add(c));
      }
    });
    report.products.collectionsUsed = Array.from(collections);
    if (collections.size > 0) {
      report.audit.push(`✓ Products use collectionIds: ${Array.from(collections).join(", ")}`);
    } else {
      report.audit.push("⚠ Products do NOT use collectionIds");
    }
  } else {
    report.audit.push("✗ Failed to fetch products");
  }

  // 3. Try to fetch Product Collections
  console.log("\n--- 3. Fetching Product Collections ---");
  const collectionsRes = await ghlFetch(`/products/collections/?locationId=${locationId}`);

  if (!collectionsRes.error && collectionsRes.data) {
    const collections = collectionsRes.data.collections || collectionsRes.data.items || [];
    report.collections.count = collections.length;
    report.collections.items = collections.map((c) => ({
      id: c.id || c._id,
      name: c.name,
      slug: c.slug,
      productCount: c.productCount,
    }));
    report.audit.push(`✓ ${collections.length} collections found`);
  } else {
    report.audit.push("⚠ Product Collections endpoint might not exist or is empty");

    // Try alternative endpoint
    console.log("[GHL] Trying alternative collections endpoint...");
    const altRes = await ghlFetch(`/collections/?locationId=${locationId}`);
    if (!altRes.error && altRes.data) {
      report.collections.count = (altRes.data.items || []).length;
      report.audit.push(`✓ Alternative collections endpoint works`);
    }
  }

  // 4. Check product structure detail
  if (productsRes.data && productsRes.data.items && productsRes.data.items[0]) {
    console.log("\n--- 4. Product Structure Detail ---");
    const firstProduct = productsRes.data.items[0];
    report.products.firstProductKeys = Object.keys(firstProduct).sort();
    report.audit.push(`First product has ${Object.keys(firstProduct).length} keys`);
  }

  // 5. Summary
  console.log("\n--- AUDIT SUMMARY ---");
  report.audit.forEach((line) => console.log(line));

  // Save report
  fs.writeFileSync("audit_ghl_report.json", JSON.stringify(report, null, 2));
  console.log("\n✓ Report saved to audit_ghl_report.json");
}

audit().catch(console.error);
