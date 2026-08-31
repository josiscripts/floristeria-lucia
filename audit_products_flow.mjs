const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

async function auditFlow() {
  console.log("=== AUDITING PRODUCT FLOWS ===\n");

  // 1. GET /api/products (admin endpoint)
  console.log("1. Admin Flow: GET /api/products");
  try {
    const adminRes = await fetch("http://localhost:3000/api/products", {
      headers: { "Cookie": "authenticated=true" },
    });
    
    if (adminRes.ok) {
      const data = await adminRes.json();
      console.log(`   ✓ Status 200`);
      console.log(`   - Products returned: ${data.products?.length || 0}`);
      console.log(`   - Total: ${data.pagination?.total || 0}`);
      if (data.products && data.products.length > 0) {
        console.log(`   - Sample: ${data.products[0]?.name}`);
      }
    } else {
      console.log(`   ✗ Status ${adminRes.status}`);
    }
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
  }

  // 2. GET /api/ghl/products (public endpoint)
  console.log("\n2. Public Flow: GET /api/ghl/products");
  try {
    const pubRes = await fetch("http://localhost:3000/api/ghl/products?limit=500");
    
    if (pubRes.ok) {
      const data = await pubRes.json();
      console.log(`   ✓ Status 200`);
      console.log(`   - Products returned: ${data.products?.length || 0}`);
      console.log(`   - Total: ${data.total || 0}`);
      if (data.products && data.products.length > 0) {
        console.log(`   - Sample: ${data.products[0]?.name}`);
      }
    } else {
      console.log(`   ✗ Status ${pubRes.status}`);
    }
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
  }

  // 3. Direct GHL check
  console.log("\n3. Direct GHL API: /products?locationId=...");
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/products/?locationId=${locationId}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Version": "v3",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const items = data.items || data.products || [];
      console.log(`   ✓ Status 200`);
      console.log(`   - Items: ${items.length}`);
      console.log(`   - Total: ${Array.isArray(data.total) ? data.total[0]?.total : data.total}`);
      
      // Analyze categories
      const categories = {};
      items.forEach(p => {
        const cat = p.category || "NO CATEGORY";
        categories[cat] = (categories[cat] || 0) + 1;
      });
      console.log(`   - Categories:`, JSON.stringify(categories));
    } else {
      console.log(`   ✗ Status ${res.status}`);
    }
  } catch (err) {
    console.log(`   ✗ Error: ${err.message}`);
  }

  console.log("\n=== END AUDIT ===");
}

// Wait for server to be ready
setTimeout(auditFlow, 2000);
