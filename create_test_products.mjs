import fs from "fs";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "v3";
const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID;

async function ghlFetch(endpoint, method = "GET", body = null) {
  const url = `${GHL_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      return { error: true, status: res.status, data };
    }

    return { error: false, data };
  } catch (err) {
    return { error: true, message: err.message };
  }
}

async function createTestProducts() {
  console.log("=== CREATING TEST PRODUCTS IN GHL ===\n");
  console.log(`Location ID: ${locationId}`);

  const testProducts = [
    {
      name: "TEST - Ramo Silvestre",
      category: "ramos",
      description:
        "Producto de prueba: Ramo silvestre para verificar sincronización GHL ↔ catálogo",
      price: 35,
    },
    {
      name: "TEST - Planta Decorativa",
      category: "plantas",
      description:
        "Producto de prueba: Planta decorativa para verificar sincronización GHL ↔ catálogo",
      price: 40,
    },
    {
      name: "TEST - Rosa Eterna",
      category: "rosas-eternas",
      description: "Producto de prueba: Rosa eterna para verificar sincronización GHL ↔ catálogo",
      price: 50,
    },
    {
      name: "TEST - Complemento Floral",
      category: "complementos",
      description:
        "Producto de prueba: Complemento floral para verificar sincronización GHL ↔ catálogo",
      price: 15,
    },
    {
      name: "TEST - Condolencias",
      category: "condolencias",
      description:
        "Producto de prueba: Centro de condolencias para verificar sincronización GHL ↔ catálogo",
      price: 85,
    },
  ];

  const results = [];

  for (const product of testProducts) {
    console.log(`\nCreating: ${product.name}`);

    // Try both endpoint formats
    const endpoints = [`/locations/${locationId}/products`, `/products/?locationId=${locationId}`];

    let created = false;
    let createdProduct = null;

    for (const endpoint of endpoints) {
      if (created) break;

      const payload = {
        locationId: locationId,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        productType: "product", // Required by GHL v3
        status: "active",
        sku: `TEST-${product.category.toUpperCase().substring(0, 3)}-001`,
      };

      console.log(`  Trying endpoint: ${endpoint}`);
      const res = await ghlFetch(endpoint, "POST", payload);

      if (!res.error) {
        console.log(`  ✓ Success with ${endpoint}`);
        createdProduct = res.data;
        created = true;
      } else {
        console.log(`  ✗ ${res.data?.message?.[0] || res.message || "Unknown error"}`);
      }
    }

    if (created) {
      console.log(`✓ Created: ${createdProduct.id || createdProduct._id}`);
      results.push({
        name: product.name,
        category: product.category,
        ghl_id: createdProduct.id || createdProduct._id,
        price: createdProduct.price,
        success: true,
      });
    } else {
      results.push({
        name: product.name,
        category: product.category,
        success: false,
        error: "All endpoints failed",
      });
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  // Summary
  console.log("\n=== SUMMARY ===\n");
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✓ Created: ${successful.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`✗ Failed: ${failed.length}`);
  }

  fs.writeFileSync("create_test_products_results.json", JSON.stringify(results, null, 2));
  console.log("\n✓ Results saved to create_test_products_results.json");

  return results;
}

createTestProducts().catch(console.error);
