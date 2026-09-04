const fs = require("fs");
const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

const allProducts = [
  // RAMOS (6)
  { id: "ramo-silvestre", name: "Ramo Silvestre", category: "ramos", priceMin: 30 },
  { id: "ramo-felicidad", name: "Ramo Felicidad", category: "ramos", priceMin: 35 },
  { id: "ramo-alegria", name: "Ramo Alegría", category: "ramos", priceMin: 35 },
  { id: "ramo-girasoles", name: "Ramo de Girasoles", category: "ramos", priceMin: 30 },
  { id: "ramo-belleza", name: "Ramo Belleza", category: "ramos", priceMin: 30 },
  { id: "ramo-rosas", name: "Ramo de Rosas", category: "ramos", priceMin: 24 },

  // PLANTAS (13)
  { id: "anthurium", name: "Anthurium", category: "plantas", priceMin: 25 },
  { id: "taza-plantas", name: "Taza de Plantas", category: "plantas", priceMin: 36 },
  { id: "cesta-mimbre", name: "Cesta de Mimbre", category: "plantas", priceMin: 60 },
  { id: "cesta-blanca-mimbre", name: "Cesta Blanca de Mimbre", category: "plantas", priceMin: 45 },
  { id: "banera-ceramica", name: "Bañera Cerámica", category: "plantas", priceMin: 35 },
  { id: "orquidea-azul", name: "Orquídea Azul", category: "plantas", priceMin: 30 },
  { id: "orquidea", name: "Orquídea", category: "plantas", priceMin: 30 },
  { id: "denrobium", name: "Denrobium", category: "plantas", priceMin: 28 },
  {
    id: "centro-orquideas-variadas",
    name: "Centro de Orquídeas Variadas",
    category: "plantas",
    priceMin: 80,
  },
  {
    id: "centro-orquidea-blanca",
    name: "Centro Orquídea Blanca",
    category: "plantas",
    priceMin: 80,
  },
  { id: "cesta-rosa", name: "Cesta Rosa", category: "plantas", priceMin: 25 },
  { id: "bonsai-ficus-ginseng", name: "Bonsái Ficus Ginseng", category: "plantas", priceMin: 25 },
  { id: "calathea", name: "Calathea", category: "plantas", priceMin: 35 },

  // ROSAS ETERNAS (4)
  {
    id: "caja-rosas-eternas",
    name: "Caja de Rosas Eternas",
    category: "rosas-eternas",
    priceMin: 40,
  },
  { id: "caja-romantica", name: "Caja Romántica", category: "rosas-eternas", priceMin: 45 },
  { id: "cupido", name: "Cupido", category: "rosas-eternas", priceMin: 55 },
  { id: "pecera-rosa-eterna", name: "Pecera Rosa Eterna", category: "rosas-eternas", priceMin: 22 },

  // COMPLEMENTOS (13)
  {
    id: "jarron-cristal-1",
    name: "Jarrón de Cristal Nº 1",
    category: "complementos",
    priceMin: 1.5,
  },
  { id: "jarron-cristal-2", name: "Jarrón de Cristal Nº 2", category: "complementos", priceMin: 5 },
  {
    id: "chocolate-belga-pequena",
    name: "Chocolate Belga Pequeña",
    category: "complementos",
    priceMin: 12.5,
  },
  {
    id: "chocolate-belga-grande",
    name: "Chocolate Belga Grande",
    category: "complementos",
    priceMin: 15,
  },
  { id: "oso-peluche", name: "Oso de Peluche", category: "complementos", priceMin: 12.5 },
  {
    id: "oso-peluche-corazon",
    name: "Oso de Peluche Corazón",
    category: "complementos",
    priceMin: 12,
  },
  {
    id: "macetero-violeta-orquidea",
    name: "Macetero Violeta Orquídea",
    category: "complementos",
    priceMin: 4.5,
  },
  {
    id: "macetero-blanco-orquidea",
    name: "Macetero Blanco Orquídea",
    category: "complementos",
    priceMin: 4.5,
  },
  { id: "piruletas", name: "Piruletas", category: "complementos", priceMin: 3 },
  { id: "vino-seleccion", name: "Botella de vino", category: "complementos", priceMin: 12 },
  { id: "tabla-quesos", name: "Selección de quesos", category: "complementos", priceMin: 15 },
  { id: "cesta-frutas", name: "Frutas de temporada", category: "complementos", priceMin: 18 },
  { id: "globos-ocasion", name: "Globos", category: "complementos", priceMin: 4 },

  // CONDOLENCIAS (14)
  { id: "centro-corazon", name: "Centro corazón", category: "condolencias", priceMin: 90 },
  { id: "centro-lagrima", name: "Centro lágrima", category: "condolencias", priceMin: 95 },
  { id: "almohadon-f21", name: "Almohadón F21", category: "condolencias", priceMin: 75 },
  { id: "centro-redondo-f19", name: "Centro redondo F19", category: "condolencias", priceMin: 55 },
  {
    id: "centro-almohadon-f22",
    name: "Centro almohadón F22",
    category: "condolencias",
    priceMin: 75,
  },
  { id: "cruz-floral", name: "Cruz floral", category: "condolencias", priceMin: 120 },
  { id: "centro-redondo-f3", name: "Centro redondo F3", category: "condolencias", priceMin: 65 },
  { id: "centro-redondo-f20", name: "Centro redondo F20", category: "condolencias", priceMin: 105 },
  { id: "corona-f23", name: "Corona F23", category: "condolencias", priceMin: 190 },
  { id: "corona-f25", name: "Corona F25", category: "condolencias", priceMin: 170 },
  {
    id: "centro-almohadon-xxl",
    name: "Centro almohadón XXL",
    category: "condolencias",
    priceMin: 230,
  },
  { id: "centro-50-rosas", name: "Centro 50 rosas", category: "condolencias", priceMin: 180 },
  { id: "centro-f24", name: "Centro F24", category: "condolencias", priceMin: 110 },
  { id: "corona-f26", name: "Corona F26", category: "condolencias", priceMin: 260 },
];

async function migrate() {
  console.log(`Migrando ${allProducts.length} productos...\n`);
  const results = [];

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const sku = `FL-${p.category.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, "0")}`;

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
            name: p.name,
            description: "Floristería Lucía",
            productType: "PHYSICAL",
            status: "active",
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        results.push({
          ghl_id: data._id,
          catalog_id: p.id,
          name: p.name,
          category: p.category,
          price: p.priceMin,
          sku: sku,
        });
        console.log(`${i + 1}. ✓ ${p.name}`);
      } else {
        console.log(`${i + 1}. ✗ ${p.name}`);
      }
    } catch (e) {
      console.log(`${i + 1}. ✗ ${p.name} (error)`);
    }

    if ((i + 1) % 15 === 0) await new Promise((r) => setTimeout(r, 2000));
    else await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n✓ Migracion completada: ${results.length}/${allProducts.length}`);

  const byCategory = {};
  results.forEach((r) => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  console.log("\nPor categoría:");
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  fs.writeFileSync("migration_all_products.json", JSON.stringify(results, null, 2));
}

migrate().catch(console.error);
