#!/usr/bin/env node
/**
 * FASE 3A: CLI script to populate product metadata
 * Run: node scripts/populate-metadata-cli.cjs
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM";
const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";

// Catalog products
const catalogProducts = [
  { id: "ramo-silvestre", name: "Ramo Silvestre", category: "ramos", priceMin: 30 },
  { id: "ramo-felicidad", name: "Ramo Felicidad", category: "ramos", priceMin: 35 },
  { id: "ramo-alegria", name: "Ramo Alegría", category: "ramos", priceMin: 35 },
  { id: "ramo-girasoles", name: "Ramo de Girasoles", category: "ramos", priceMin: 30 },
  { id: "ramo-belleza", name: "Ramo Belleza", category: "ramos", priceMin: 30 },
  { id: "ramo-rosas", name: "Ramo de Rosas", category: "ramos", priceMin: 24 },
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
  {
    id: "caja-rosas-eternas",
    name: "Caja de Rosas Eternas",
    category: "rosas-eternas",
    priceMin: 40,
  },
  { id: "caja-romantica", name: "Caja Romántica", category: "rosas-eternas", priceMin: 45 },
  { id: "cupido", name: "Cupido", category: "rosas-eternas", priceMin: 55 },
  { id: "pecera-rosa-eterna", name: "Pecera Rosa Eterna", category: "rosas-eternas", priceMin: 22 },
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

function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matchWithCatalog(ghlProduct) {
  const ghlName = ghlProduct.name || "";

  // Exact match
  const exact = catalogProducts.find((p) => normalizeString(p.name) === normalizeString(ghlName));
  if (exact) return { product: exact, confidence: "exact" };

  // High match
  const high = catalogProducts.find((p) => {
    const pNorm = normalizeString(p.name);
    const gNorm = normalizeString(ghlName);
    return gNorm.includes(pNorm) || pNorm.includes(gNorm);
  });
  if (high) return { product: high, confidence: "high" };

  return { confidence: "none" };
}

function generateSKU(category, index) {
  const map = {
    ramos: "RAM",
    plantas: "PLA",
    "rosas-eternas": "ROS",
    complementos: "COM",
    condolencias: "CON",
  };
  const code = map[category] || "XXX";
  const num = String(index + 1).padStart(4, "0");
  return `FL-${code}-${num}`;
}

async function main() {
  console.log("FASE 3A: Población de metadata\n");

  // Fetch GHL products
  const ghlRes = await fetch(
    `https://services.leadconnectorhq.com/products/?locationId=${GHL_LOCATION_ID}&limit=500`,
    {
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "v3",
      },
    },
  );

  const ghlData = await ghlRes.json();
  const ghlProducts = ghlData.products || [];

  console.log(`GHL products: ${ghlProducts.length}\n`);

  // Normalize _id → id (same as getGHLProducts does)
  const normalizedProducts = ghlProducts.map((p) => ({
    ...p,
    id: p.id ?? p._id,
  }));

  // Validate and process
  const matched = [];
  const orphans = [];
  const corrupt = [];
  let skuIndex = 1;

  for (const ghl of normalizedProducts) {
    if (!ghl.id || ghl.id === "undefined") {
      corrupt.push({ ghlName: ghl.name, reason: "Invalid ID" });
      continue;
    }

    const match = matchWithCatalog(ghl);

    if (match.confidence !== "none") {
      const cat = match.product;
      const sku = generateSKU(cat.category, skuIndex++);
      matched.push({
        ghlId: ghl.id,
        ghlName: ghl.name,
        category: cat.category,
        price: cat.priceMin,
        sku,
        catalogId: cat.id,
      });
      console.log(`✓ ${ghl.name}`);
    } else {
      orphans.push({ ghlId: ghl.id, ghlName: ghl.name });
      console.log(`⚠ ${ghl.name} (orphan)`);
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`RESULTADOS`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  console.log(`Total GHL: ${ghlProducts.length}`);
  console.log(`Matched: ${matched.length}`);
  console.log(`Orphans: ${orphans.length}`);
  console.log(`Corrupt: ${corrupt.length}\n`);

  // Sync to Supabase
  console.log(`Syncing to Supabase...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let syncCount = 0;
  for (const m of matched) {
    await supabase.from("product_metadata").upsert(
      {
        ghl_product_id: m.ghlId,
        category: m.category,
        price_min: m.price,
        sku: m.sku,
        legacy_catalog_id: m.catalogId,
        status: "active",
        auto_created: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ghl_product_id" },
    );
    syncCount++;
  }

  for (const o of orphans) {
    await supabase.from("product_metadata").upsert(
      {
        ghl_product_id: o.ghlId,
        category: null,
        price_min: null,
        sku: null,
        status: "needs_review",
        auto_created: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ghl_product_id" },
    );
    syncCount++;
  }

  console.log(`✓ Synced ${syncCount} records\n`);

  console.log(`═══════════════════════════════════════════════════════`);
  console.log(`COMPLETADO`);
  console.log(`═══════════════════════════════════════════════════════`);
}

main().catch(console.error);
