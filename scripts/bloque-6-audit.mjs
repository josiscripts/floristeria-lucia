#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk";
const GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291";
const GHL_LOCATION_ID = "vOq7yOWR63XGU4qQ7XWd";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PUNTO 1: SNAPSHOT DE ESTADO ACTUAL
console.log("==================================================");
console.log("BLOQUE 6 - AUDITORÍA FINAL Y VERIFICACIÓN");
console.log("==================================================\n");

console.log("PASO 1: SNAPSHOT DE ESTADO ACTUAL");
console.log("==================================================\n");

// Supabase snapshot
console.log("1. SUPABASE - Snapshot:");

const { data: products, error: prodErr } = await supabase
  .from("products")
  .select("*")
  .is("deleted_at", null);

const { data: options, error: optErr } = await supabase
  .from("product_options")
  .select("*")
  .is("deleted_at", null);

const { data: colors, error: colErr } = await supabase
  .from("color_variants")
  .select("*")
  .is("deleted_at", null);

const { data: images, error: imgErr } = await supabase
  .from("product_images")
  .select("*")
  .is("deleted_at", null);

console.log(`✓ products: ${products?.length || 0}`);
console.log(`✓ product_options: ${options?.length || 0}`);
console.log(`✓ color_variants: ${colors?.length || 0}`);
console.log(`✓ product_images: ${images?.length || 0}`);

if (prodErr) console.error("Error products:", prodErr.message);
if (optErr) console.error("Error options:", optErr.message);
if (colErr) console.error("Error colors:", colErr.message);
if (imgErr) console.error("Error images:", imgErr.message);

console.log("\n2. GHL - Snapshot:");

try {
  const ghlRes = await fetch("https://services.leadconnectorhq.com/v3/products", {
    headers: {
      Authorization: `Bearer ${GHL_TOKEN}`,
      Version: "v3",
    },
  });

  if (!ghlRes.ok) {
    console.error(`HTTP ${ghlRes.status} from GHL`);
  } else {
    const ghlData = await ghlRes.json();
    const ghlProducts = ghlData.products || [];
    console.log(`✓ GHL products: ${ghlProducts.length}`);
    console.log(
      `  (Total with prices: ${ghlProducts.reduce((acc, p) => acc + (p.prices?.length || 0), 0)})`,
    );
  }
} catch (err) {
  console.error("GHL fetch error:", err.message);
}

// PUNTO 2: CATÁLOGO BASE
console.log("\n==================================================");
console.log("PUNTO 1: CATÁLOGO BASE");
console.log("==================================================\n");

// Contar productos por categoría en Supabase
const categoryCount = {};
const productNames = new Set();
if (products) {
  products.forEach((p) => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    productNames.add(p.name);
  });
}

console.log("SUPABASE:");
console.log(`- Total: ${products?.length || 0} productos`);
console.log(`- Categorías: ${Object.keys(categoryCount).join(", ") || "ninguna"}`);
console.log(`- Por categoría:`);
Object.entries(categoryCount).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log("\nPRIMEROS 5 PRODUCTOS EN SUPABASE:");
products?.slice(0, 5).forEach((p) => {
  console.log(`- ${p.name} (${p.category}) [${p.id}]`);
});

// PUNTO 3: PRODUCTOS SUPABASE CON DETALLES
console.log("\n==================================================");
console.log("PUNTO 2: PRODUCTOS SUPABASE - DETALLE");
console.log("==================================================\n");

console.log("Productos con relaciones:");
if (products) {
  for (const p of products.slice(0, 10)) {
    const prodOptions = options?.filter((o) => o.product_id === p.id) || [];
    const prodColors = colors?.filter((c) => c.product_id === p.id) || [];
    const prodImages = images?.filter((i) => i.product_id === p.id) || [];

    console.log(`\n${p.name}:`);
    console.log(`  id: ${p.id}`);
    console.log(`  category: ${p.category}`);
    console.log(`  active: ${p.active}`);
    console.log(`  ghl_product_id: ${p.ghl_product_id || "NULL"}`);
    console.log(`  has_color_variants: ${p.has_color_variants}`);
    console.log(`  - opciones: ${prodOptions.length}`);
    console.log(`  - imágenes: ${prodImages.length}`);
    console.log(`  - colores: ${prodColors.length}`);

    if (p.has_color_variants && prodColors.length === 0) {
      console.log(`  ⚠️ PROBLEMA: has_color_variants=true pero 0 colores`);
    }
  }
}

// PUNTO 4: OPCIONES / PRECIOS
console.log("\n==================================================");
console.log("PUNTO 3: OPCIONES / PRECIOS");
console.log("==================================================\n");

console.log("ANÁLISIS DE OPTIONS/PRECIOS:");

let ghlPriceIdsNull = 0;
let skuDuplicates = 0;
const skuMap = {};

options?.forEach((opt) => {
  if (!opt.ghl_price_id) {
    ghlPriceIdsNull++;
  }

  if (skuMap[opt.sku]) {
    skuMap[opt.sku].push(opt.id);
    skuDuplicates++;
  } else {
    skuMap[opt.sku] = [opt.id];
  }
});

console.log(`- Total opciones: ${options?.length || 0}`);
console.log(`- ghl_price_id NULL: ${ghlPriceIdsNull}`);
console.log(`- SKUs únicos: ${Object.keys(skuMap).length}`);

if (ghlPriceIdsNull > 0) {
  console.log(`\n⚠️ CRÍTICO: ${ghlPriceIdsNull} opciones SIN ghl_price_id`);
}

if (skuDuplicates > 0) {
  console.log(`\n⚠️ CRÍTICO: Detectados SKUs duplicados:`);
  Object.entries(skuMap).forEach(([sku, ids]) => {
    if (ids.length > 1) {
      console.log(`  ${sku}: ${ids.length} veces`);
    }
  });
} else {
  console.log(`✓ Todos los SKUs son únicos`);
}

console.log("\nPRIMERAS 5 OPCIONES:");
options?.slice(0, 5).forEach((opt) => {
  const prodName = products?.find((p) => p.id === opt.product_id)?.name || "?";
  const priceFinal = opt.price_amount * (1 - (opt.discount_percent || 0) / 100);
  console.log(`- ${prodName}: ${opt.name}`);
  console.log(`  SKU: ${opt.sku}`);
  console.log(
    `  Precio: €${opt.price_amount} (${opt.discount_percent || 0}% desc) = €${priceFinal.toFixed(2)}`,
  );
  console.log(`  Stock: ${opt.stock_quantity}`);
  console.log(`  ghl_price_id: ${opt.ghl_price_id || "NULL"}`);
});

// PUNTO 5: VERIFICACIÓN GHL
console.log("\n==================================================");
console.log("PUNTO 4: CONSULTAR GHL REALMENTE");
console.log("==================================================\n");

console.log("Verificando correspondencia Supabase ↔ GHL:");

try {
  const ghlRes = await fetch("https://services.leadconnectorhq.com/v3/products", {
    headers: {
      Authorization: `Bearer ${GHL_TOKEN}`,
      Version: "v3",
    },
  });

  if (!ghlRes.ok) {
    console.error(`❌ GHL HTTP ${ghlRes.status}`);
  } else {
    const ghlData = await ghlRes.json();
    const ghlProducts = ghlData.products || [];

    console.log(`GHL tiene ${ghlProducts.length} productos`);

    // Verificar primeros 5 productos de Supabase en GHL
    let matched = 0;
    let missing = 0;

    for (const sProduct of (products || []).slice(0, 5)) {
      if (!sProduct.ghl_product_id) {
        console.log(`\n⚠️ ${sProduct.name}: NO tiene ghl_product_id`);
        missing++;
        continue;
      }

      const ghlProd = ghlProducts.find((p) => p.id === sProduct.ghl_product_id);

      if (ghlProd) {
        matched++;
        console.log(`\n✓ ${sProduct.name}`);
        console.log(`  Supabase ID: ${sProduct.id}`);
        console.log(`  GHL ID: ${sProduct.ghl_product_id}`);
        console.log(`  GHL precios: ${ghlProd.prices?.length || 0}`);
      } else {
        console.log(`\n❌ ${sProduct.name}: NO ENCONTRADO en GHL`);
        missing++;
      }
    }

    console.log(`\nRESULTADO: ${matched} coincidencias, ${missing} faltantes`);
  }
} catch (err) {
  console.error("Error verificando GHL:", err.message);
}

// PUNTO 6: RESUMEN DE CLASIFICACIÓN
console.log("\n==================================================");
console.log("RESUMEN INICIAL");
console.log("==================================================\n");

const issues = [];

if (!products || products.length === 0) {
  issues.push("❌ 0 productos en Supabase");
}

if (ghlPriceIdsNull > 0) {
  issues.push(`❌ ${ghlPriceIdsNull} opciones sin ghl_price_id`);
}

if (skuDuplicates > 0) {
  issues.push(`❌ SKUs duplicados detectados`);
}

if (issues.length === 0) {
  console.log("✅ Estado inicial sin problemas críticos detectados");
  console.log(`✅ ${products?.length || 0} productos en Supabase`);
  console.log(`✅ ${options?.length || 0} opciones/precios`);
  console.log(`✅ ${colors?.length || 0} variantes de color`);
  console.log(`✅ ${images?.length || 0} imágenes`);
} else {
  console.log("❌ PROBLEMAS DETECTADOS:");
  issues.forEach((issue) => console.log(issue));
}

console.log("\n==================================================");
console.log("FIN SNAPSHOT INICIAL");
console.log("==================================================\n");
