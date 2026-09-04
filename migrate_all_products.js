const fs = require("fs");
const token = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const locationId = "vOq7yOWR63XGU4qQ7XWd";

const allProducts = [
  // RAMOS (6)
  {
    id: "ramo-silvestre",
    name: "Ramo Silvestre",
    category: "ramos",
    priceMin: 30,
    description: "Flor variada de temporada con aire campestre y mucho movimiento.",
  },
  {
    id: "ramo-felicidad",
    name: "Ramo Felicidad",
    category: "ramos",
    priceMin: 35,
    description: "Tonos luminosos en rosa y blanco para celebrar buenas noticias.",
  },
  {
    id: "ramo-alegria",
    name: "Ramo Alegría",
    category: "ramos",
    priceMin: 35,
    description: "Colores vivos y contrastados, un ramo que se ve desde lejos.",
  },
  {
    id: "ramo-girasoles",
    name: "Ramo de Girasoles",
    category: "ramos",
    priceMin: 30,
    description: "Girasoles frescos combinados con verdes de temporada.",
  },
  {
    id: "ramo-belleza",
    name: "Ramo Belleza",
    category: "ramos",
    priceMin: 30,
    description: "Composición romántica en gamas rosadas y blancas.",
  },
  {
    id: "ramo-rosas",
    name: "Ramo de Rosas",
    category: "ramos",
    priceMin: 24,
    description: "Ramo de rosas frescas.",
  },

  // PLANTAS (13)
  {
    id: "anthurium",
    name: "Anthurium",
    category: "plantas",
    priceMin: 25,
    description: "Planta de interior de flor duradera y hoja brillante.",
  },
  {
    id: "taza-plantas",
    name: "Taza de Plantas",
    category: "plantas",
    priceMin: 36,
    description: "Composición de plantas variadas en taza de cerámica.",
  },
  {
    id: "cesta-mimbre",
    name: "Cesta de Mimbre",
    category: "plantas",
    priceMin: 60,
    description: "Cesta de mimbre natural con plantas de interior surtidas.",
  },
  {
    id: "cesta-blanca-mimbre",
    name: "Cesta Blanca de Mimbre",
    category: "plantas",
    priceMin: 45,
    description: "Mimbre lacado en blanco con composición de plantas.",
  },
  {
    id: "banera-ceramica",
    name: "Bañera Cerámica",
    category: "plantas",
    priceMin: 35,
    description: "Jardinera de cerámica con plantas de interior.",
  },
  {
    id: "orquidea-azul",
    name: "Orquídea Azul",
    category: "plantas",
    priceMin: 30,
    description: "Phalaenopsis teñida en azul, muy decorativa.",
  },
  {
    id: "orquidea",
    name: "Orquídea",
    category: "plantas",
    priceMin: 30,
    description: "Orquídea Phalaenopsis en maceta decorativa.",
  },
  {
    id: "denrobium",
    name: "Denrobium",
    category: "plantas",
    priceMin: 28,
    description: "Orquídea Dendrobium de floración abundante.",
  },
  {
    id: "centro-orquideas-variadas",
    name: "Centro de Orquídeas Variadas",
    category: "plantas",
    priceMin: 80,
    description: "Centro de gran formato con varias orquídeas y verdes.",
  },
  {
    id: "centro-orquidea-blanca",
    name: "Centro Orquídea Blanca",
    category: "plantas",
    priceMin: 80,
    description: "Centro elegante de orquídea blanca sobre base natural.",
  },
  {
    id: "cesta-rosa",
    name: "Cesta Rosa",
    category: "plantas",
    priceMin: 25,
    description: "Cesta en tonos rosados con planta de temporada.",
  },
  {
    id: "bonsai-ficus-ginseng",
    name: "Bonsái Ficus Ginseng",
    category: "plantas",
    priceMin: 25,
    description: "Bonsái de interior resistente y de fácil cuidado.",
  },
  {
    id: "calathea",
    name: "Calathea",
    category: "plantas",
    priceMin: 35,
    description: "Planta de hoja decorativa para interiores luminosos.",
  },

  // ROSAS ETERNAS (4)
  {
    id: "caja-rosas-eternas",
    name: "Caja de Rosas Eternas",
    category: "rosas-eternas",
    priceMin: 40,
    description: "Rosa natural preservada en caja de regalo.",
  },
  {
    id: "caja-romantica",
    name: "Caja Romántica",
    category: "rosas-eternas",
    priceMin: 45,
    description: "Rosas preservadas con acabado romántico y lazo de satén.",
  },
  {
    id: "cupido",
    name: "Cupido",
    category: "rosas-eternas",
    priceMin: 55,
    description: "Corazón de rosas eternas, nuestro diseño más regalado.",
  },
  {
    id: "pecera-rosa-eterna",
    name: "Pecera Rosa Eterna",
    category: "rosas-eternas",
    priceMin: 22,
    description: "Rosa preservada bajo cúpula de cristal.",
  },

  // COMPLEMENTOS (13)
  {
    id: "jarron-cristal-1",
    name: "Jarrón de Cristal Nº 1",
    category: "complementos",
    priceMin: 1.5,
    description: "Jarrón de cristal pequeño.",
  },
  {
    id: "jarron-cristal-2",
    name: "Jarrón de Cristal Nº 2",
    category: "complementos",
    priceMin: 5,
    description: "Jarrón de cristal de mayor tamaño.",
  },
  {
    id: "chocolate-belga-pequena",
    name: "Chocolate Belga Pequeña",
    category: "complementos",
    priceMin: 12.5,
    description: "Bombones belgas surtidos en caja pequeña.",
  },
  {
    id: "chocolate-belga-grande",
    name: "Chocolate Belga Grande",
    category: "complementos",
    priceMin: 15,
    description: "Bombones belgas surtidos en caja grande.",
  },
  {
    id: "oso-peluche",
    name: "Oso de Peluche",
    category: "complementos",
    priceMin: 12.5,
    description: "Osito de peluche suave.",
  },
  {
    id: "oso-peluche-corazon",
    name: "Oso de Peluche Corazón",
    category: "complementos",
    priceMin: 12,
    description: "Osito de peluche con corazón bordado.",
  },
  {
    id: "macetero-violeta-orquidea",
    name: "Macetero Violeta Orquídea",
    category: "complementos",
    priceMin: 4.5,
    description: "Macetero decorativo en tono violeta.",
  },
  {
    id: "macetero-blanco-orquidea",
    name: "Macetero Blanco Orquídea",
    category: "complementos",
    priceMin: 4.5,
    description: "Macetero decorativo blanco.",
  },
  {
    id: "piruletas",
    name: "Piruletas",
    category: "complementos",
    priceMin: 3,
    description: "Piruletas artesanales de colores.",
  },
  {
    id: "vino-seleccion",
    name: "Botella de vino",
    category: "complementos",
    priceMin: 12,
    description: "Botella de vino seleccionada.",
  },
  {
    id: "tabla-quesos",
    name: "Selección de quesos",
    category: "complementos",
    priceMin: 15,
    description: "Quesos artesanos.",
  },
  {
    id: "cesta-frutas",
    name: "Frutas de temporada",
    category: "complementos",
    priceMin: 18,
    description: "Frutas frescas de temporada combinadas con flor.",
  },
  {
    id: "globos-ocasion",
    name: "Globos",
    category: "complementos",
    priceMin: 4,
    description: "Globos de helio y globos de número.",
  },

  // CONDOLENCIAS (14)
  {
    id: "centro-corazon",
    name: "Centro corazón",
    category: "condolencias",
    priceMin: 90,
    description: "Centro funerario con flor natural variada.",
  },
  {
    id: "centro-lagrima",
    name: "Centro lágrima",
    category: "condolencias",
    priceMin: 95,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "almohadon-f21",
    name: "Almohadón F21",
    category: "condolencias",
    priceMin: 75,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "centro-redondo-f19",
    name: "Centro redondo F19",
    category: "condolencias",
    priceMin: 55,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "centro-almohadon-f22",
    name: "Centro almohadón F22",
    category: "condolencias",
    priceMin: 75,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "cruz-floral",
    name: "Cruz floral",
    category: "condolencias",
    priceMin: 120,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "centro-redondo-f3",
    name: "Centro redondo F3",
    category: "condolencias",
    priceMin: 65,
    description: "Centro funerario de flor natural.",
  },
  {
    id: "centro-redondo-f20",
    name: "Centro redondo F20",
    category: "condolencias",
    priceMin: 105,
    description: "Centro funerario redondo.",
  },
  {
    id: "corona-f23",
    name: "Corona F23",
    category: "condolencias",
    priceMin: 190,
    description: "Corona funeraria de flor natural.",
  },
  {
    id: "corona-f25",
    name: "Corona F25",
    category: "condolencias",
    priceMin: 170,
    description: "Corona funeraria de flor natural.",
  },
  {
    id: "centro-almohadon-xxl",
    name: "Centro almohadón XXL",
    category: "condolencias",
    priceMin: 230,
    description: "Centro funerario extra grande.",
  },
  {
    id: "centro-50-rosas",
    name: "Centro 50 rosas",
    category: "condolencias",
    priceMin: 180,
    description: "Centro almohadón grande.",
  },
  {
    id: "centro-f24",
    name: "Centro F24",
    category: "condolencias",
    priceMin: 110,
    description: "Centro funerario de una cara.",
  },
  {
    id: "corona-f26",
    name: "Corona F26",
    category: "condolencias",
    priceMin: 260,
    description: "Corona funeraria blanca.",
  },
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
            description: p.description || "",
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
    else await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✓ Migracion completada: ${results.length}/${allProducts.length}`);
  fs.writeFileSync("migration_all_products.json", JSON.stringify(results, null, 2));
}

migrate().catch(console.error);
