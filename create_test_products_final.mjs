const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

const testProducts = [
  {
    name: "TEST - Ramo Silvestre",
    category: "ramos",
    description: "Producto de prueba: Ramo silvestre para verificar sincronización GHL ↔ catálogo",
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

async function create(product) {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/products/?locationId=${locationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Version: "v3",
        },
        body: JSON.stringify({
          locationId,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          productType: "PHYSICAL",
          status: "active",
          sku: `TEST-${product.category.substring(0, 3).toUpperCase()}-001`,
        }),
      },
    );

    const data = await res.json();
    if (res.ok) {
      console.log(`✓ ${product.name}`);
      return { ...product, ghl_id: data.id || data._id, success: true };
    } else {
      console.log(`✗ ${product.name}: ${data.message?.[0] || data.message}`);
      return { ...product, success: false, error: data.message };
    }
  } catch (err) {
    console.log(`✗ ${product.name}: ${err.message}`);
    return { ...product, success: false, error: err.message };
  }
}

async function main() {
  console.log("=== CREATING TEST PRODUCTS ===\n");
  const results = [];

  for (const product of testProducts) {
    const result = await create(product);
    results.push(result);
    await new Promise((r) => setTimeout(r, 500));
  }

  const success = results.filter((r) => r.success).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`✓ Created: ${success}/${results.length}`);

  if (success > 0) {
    console.log("\nCreated Products:");
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`  - ${r.name} (${r.category}) → ${r.ghl_id}`);
      });
  }
}

main().catch(console.error);
