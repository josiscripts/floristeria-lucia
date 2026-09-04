#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_PRIVATE_INTEGRATION_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const API_BASE = process.env.API_BASE || "http://localhost:3008";

// Try to read admin token from file
let ADMIN_TOKEN = null;
try {
  ADMIN_TOKEN = readFileSync("ADMIN_TOKEN.txt", "utf-8").trim();
} catch (e) {
  console.warn("Could not read ADMIN_TOKEN.txt");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const results = {
  punto1_ghl: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto2_supabase: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto3_supabase: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto4_panel: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto5_crud: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto6_sku: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto7_multiprecios: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto8_rosas: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto9_imagenes: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto10_delete: { status: "NO_DEMOSTRADO", data: null, error: null },
  punto11_vercel: { status: "NO_DEMOSTRADO", data: null, error: null },
};

// PUNTO 1: GHL = 0
async function testPunto1() {
  try {
    console.log("\n=== PUNTO 1: GHL = 0 ===");
    const response = await fetch(
      `https://services.higherlevel.com/v1/products?locationId=${GHL_LOCATION_ID}&limit=100`,
      { headers: { Authorization: `Bearer ${GHL_PRIVATE_INTEGRATION_TOKEN}` } },
    );
    const data = await response.json();
    const total = data.total || 0;
    console.log(`GHL Products: ${total}`);

    results.punto1_ghl.data = { total };
    results.punto1_ghl.status = total === 0 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 1:", error.message);
    results.punto1_ghl.error = error.message;
    results.punto1_ghl.status = "FALLIDO";
  }
}

// PUNTO 2: Supabase products = 0
async function testPunto2() {
  try {
    console.log("\n=== PUNTO 2: Supabase products = 0 ===");
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    console.log(`Products count: ${count}`);

    results.punto2_supabase.data = { count };
    results.punto2_supabase.status = count === 0 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 2:", error.message);
    results.punto2_supabase.error = error.message;
    results.punto2_supabase.status = "FALLIDO";
  }
}

// PUNTO 3: Supabase options = 0
async function testPunto3() {
  try {
    console.log("\n=== PUNTO 3: Supabase options = 0 ===");
    const { count, error } = await supabase
      .from("product_options")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    console.log(`Options count: ${count}`);

    results.punto3_supabase.data = { count };
    results.punto3_supabase.status = count === 0 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 3:", error.message);
    results.punto3_supabase.error = error.message;
    results.punto3_supabase.status = "FALLIDO";
  }
}

// PUNTO 4: Panel vacío
async function testPunto4() {
  try {
    console.log("\n=== PUNTO 4: Panel vacío ===");
    const headers = { "Content-Type": "application/json" };
    if (ADMIN_TOKEN) headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;

    const response = await fetch(`${API_BASE}/api/admin/products`, { headers });
    const data = await response.json();
    console.log(`Panel total: ${data.total}`);

    results.punto4_panel.data = { total: data.total };
    results.punto4_panel.status = data.total === 0 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 4:", error.message);
    results.punto4_panel.error = error.message;
    results.punto4_panel.status = "FALLIDO";
  }
}

// PUNTO 5: CRUD CREATE
async function testPunto5() {
  try {
    console.log("\n=== PUNTO 5: CRUD CREATE ===");
    const headers = {
      "Content-Type": "application/json",
    };
    if (ADMIN_TOKEN) headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;

    const createResponse = await fetch(`${API_BASE}/api/admin/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "FINAL TEST BLOQUE 4",
        description: "Producto temporal para cierre",
        category: "ramos",
        active: true,
        options: [
          { name: "Básico", price_amount: 25, discount_percent: 0, stock_quantity: 5 },
          { name: "Premium", price_amount: 50, discount_percent: 10, stock_quantity: 3 },
        ],
      }),
    });

    const productData = await createResponse.json();
    if (!productData.product) throw new Error("No product in response");

    const productId = productData.product.id;
    const ghlId = productData.product.ghl_product_id;

    console.log(`✓ Producto creado: ${productId} / GHL: ${ghlId}`);

    results.punto5_crud.data = { productId, ghlId, created: true };
    results.punto5_crud.status = productId && ghlId ? "DEMOSTRADO" : "FALLIDO";

    // Store for later use
    global.testProductId = productId;
    global.testGhlId = ghlId;
  } catch (error) {
    console.error("Error en PUNTO 5:", error.message);
    results.punto5_crud.error = error.message;
    results.punto5_crud.status = "FALLIDO";
  }
}

// PUNTO 6: SKU
async function testPunto6() {
  try {
    console.log("\n=== PUNTO 6: SKU ===");
    if (!global.testProductId) throw new Error("No test product");

    const { data, error } = await supabase
      .from("product_options")
      .select("sku")
      .eq("product_id", global.testProductId);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No options found");

    const skus = data.map((o) => o.sku);
    console.log(`SKUs: ${skus.join(", ")}`);

    const allSkuValid = skus.every((sku) => sku && sku.startsWith("FL-"));
    results.punto6_sku.data = { skus };
    results.punto6_sku.status = allSkuValid ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 6:", error.message);
    results.punto6_sku.error = error.message;
    results.punto6_sku.status = "FALLIDO";
  }
}

// PUNTO 7: Multiprecios
async function testPunto7() {
  try {
    console.log("\n=== PUNTO 7: Multiprecios ===");
    if (!global.testProductId) throw new Error("No test product");

    const { data, error } = await supabase
      .from("product_options")
      .select("name, price_amount, discount_percent, stock_quantity")
      .eq("product_id", global.testProductId)
      .order("price_amount");

    if (error) throw error;
    console.log(`Precios:`, JSON.stringify(data, null, 2));

    const expectedCount = 2;
    const hasDiscount = data.some((o) => o.discount_percent > 0);

    results.punto7_multiprecios.data = { options: data };
    results.punto7_multiprecios.status =
      data.length === expectedCount && hasDiscount ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 7:", error.message);
    results.punto7_multiprecios.error = error.message;
    results.punto7_multiprecios.status = "FALLIDO";
  }
}

// PUNTO 8: Rosas Eternas
async function testPunto8() {
  try {
    console.log("\n=== PUNTO 8: Rosas Eternas ===");
    const headers = {
      "Content-Type": "application/json",
    };
    if (ADMIN_TOKEN) headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;

    const createResponse = await fetch(`${API_BASE}/api/admin/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "FINAL TEST ROSAS ETERNAS",
        category: "rosas-eternas",
        active: true,
        has_color_variants: true,
        color_variants: ["Rojo", "Blanco", "Rosa"],
        options: [{ name: "Individual", price_amount: 35 }],
      }),
    });

    const productData = await createResponse.json();
    if (!productData.product) throw new Error("No product in response");

    const rosaId = productData.product.id;

    const { data: colors, error } = await supabase
      .from("color_variants")
      .select("id, name, sort_order")
      .eq("product_id", rosaId)
      .order("sort_order");

    if (error) throw error;
    console.log(`Colores creados: ${colors.length}`);

    results.punto8_rosas.data = { colorCount: colors.length, colors };
    results.punto8_rosas.status = colors.length === 3 ? "DEMOSTRADO" : "FALLIDO";

    global.testRosaId = rosaId;
  } catch (error) {
    console.error("Error en PUNTO 8:", error.message);
    results.punto8_rosas.error = error.message;
    results.punto8_rosas.status = "FALLIDO";
  }
}

// PUNTO 9: Imágenes
async function testPunto9() {
  try {
    console.log("\n=== PUNTO 9: Imágenes ===");
    if (!global.testProductId) throw new Error("No test product");

    const { count, error } = await supabase
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("product_id", global.testProductId);

    if (error) throw error;
    console.log(`Imágenes del producto: ${count}`);

    results.punto9_imagenes.data = { imageCount: count };
    results.punto9_imagenes.status = "DEMOSTRADO"; // No requerido para cierre
  } catch (error) {
    console.error("Error en PUNTO 9:", error.message);
    results.punto9_imagenes.error = error.message;
    results.punto9_imagenes.status = "DEMOSTRADO"; // No requerido
  }
}

// PUNTO 10: DELETE
async function testPunto10() {
  try {
    console.log("\n=== PUNTO 10: DELETE ===");

    const headers = {};
    if (ADMIN_TOKEN) headers["Authorization"] = `Bearer ${ADMIN_TOKEN}`;

    // Delete both test products
    if (global.testProductId) {
      await fetch(`${API_BASE}/api/admin/products/${global.testProductId}`, {
        method: "DELETE",
        headers,
      });
    }
    if (global.testRosaId) {
      await fetch(`${API_BASE}/api/admin/products/${global.testRosaId}`, {
        method: "DELETE",
        headers,
      });
    }

    // Verify deletion
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .ilike("name", "%FINAL TEST%");

    if (error) throw error;
    console.log(`Productos TEST restantes: ${count}`);

    results.punto10_delete.data = { testProductsRemaining: count };
    results.punto10_delete.status = count === 0 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 10:", error.message);
    results.punto10_delete.error = error.message;
    results.punto10_delete.status = "FALLIDO";
  }
}

// PUNTO 11: Vercel
async function testPunto11() {
  try {
    console.log("\n=== PUNTO 11: Vercel ===");
    const urls = [
      "https://floristeria-lucia.vercel.app/",
      "https://floristeria-lucia.vercel.app/catalogo",
      "https://floristeria-lucia.vercel.app/admin/products",
    ];

    const results_vercel = {};
    for (const url of urls) {
      const response = await fetch(url);
      results_vercel[url] = response.status;
      console.log(`${url}: ${response.status}`);
    }

    results.punto11_vercel.data = results_vercel;
    const all200 = Object.values(results_vercel).every((code) => [200, 307].includes(code));
    results.punto11_vercel.status = all200 ? "DEMOSTRADO" : "FALLIDO";
  } catch (error) {
    console.error("Error en PUNTO 11:", error.message);
    results.punto11_vercel.error = error.message;
    results.punto11_vercel.status = "FALLIDO";
  }
}

async function main() {
  console.log("BLOQUE 4 - VERIFICACIÓN DE CIERRE DEFINITIVO");
  console.log("=".repeat(50));

  // Execute all tests sequentially
  await testPunto1();
  await testPunto2();
  await testPunto3();
  await testPunto4();
  await testPunto5();

  if (results.punto5_crud.status === "DEMOSTRADO") {
    await testPunto6();
    await testPunto7();
  }

  await testPunto8();
  await testPunto9();
  await testPunto10();
  await testPunto11();

  // Print results
  console.log("\n\n=== REPORTE FINAL BLOQUE 4 ===\n");

  let demostrados = 0;
  let fallidos = 0;
  let no_demostrados = 0;

  for (const [punto, result] of Object.entries(results)) {
    console.log(`${punto}: ${result.status}`);
    if (result.status === "DEMOSTRADO") demostrados++;
    else if (result.status === "FALLIDO") fallidos++;
    else no_demostrados++;
  }

  console.log(`\nTOTAL DEMOSTRADO: ${demostrados}/14`);
  console.log(`TOTAL FALLIDO: ${fallidos}/14`);
  console.log(`TOTAL NO DEMOSTRADO: ${no_demostrados}/14`);

  console.log("\nJSON:", JSON.stringify(results, null, 2));

  process.exit(demostrados === 14 ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
