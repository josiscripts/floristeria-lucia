#!/usr/bin/env node

// Cargar variables de .env.local
require("dotenv").config({ path: ".env.local" });

console.log("\n========== FASE 3A: DIAGNÓSTICO DE CONEXIONES ==========\n");

// 1. VERIFICAR VARIABLES
console.log("1️⃣  VERIFICACIÓN DE VARIABLES:");
const vars = [
  "GHL_PRIVATE_INTEGRATION_TOKEN",
  "GHL_LOCATION_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_ID",
];

let allPresent = true;
vars.forEach((v) => {
  const present = !!process.env[v];
  console.log(`   ${present ? "✅" : "❌"} ${v}: ${present ? "PRESENTE" : "AUSENTE"}`);
  if (!present) allPresent = false;
});

if (!allPresent) {
  console.error("\n❌ Faltan variables de entorno");
  process.exit(1);
}

console.log("\n2️⃣  PRUEBA DE GHL:\n");

// Importar cliente GHL
const https = require("https");

const GHL_API_BASE = "https://api.gohighlevel.com/v1";
const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const locationId = process.env.GHL_LOCATION_ID;

async function testGHL() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.gohighlevel.com",
      path: "/v1/contacts?limit=1",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401) {
        resolve({
          auth: res.statusCode === 200,
          status: res.statusCode,
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on("error", reject);
    req.end();
  });
}

async function getGHLProducts() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.gohighlevel.com",
      path: `/v1/locations/${locationId}/products?limit=1000`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            status: res.statusCode,
            count: json.products ? json.products.length : 0,
            products: json,
          });
        } catch (e) {
          resolve({
            success: false,
            status: res.statusCode,
            error: "Invalid JSON",
          });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    // Test GHL Auth
    const authTest = await testGHL();
    console.log(`   Autenticación: ${authTest.auth ? "✅" : "❌"}`);

    if (!authTest.auth) {
      console.log("   ❌ Token inválido o expirado");
      process.exit(1);
    }

    // Test GHL Products
    console.log(`   Location: ${locationId ? "✅" : "❌"}`);

    const productsTest = await getGHLProducts();
    console.log(`   API READ: ${productsTest.success ? "✅" : "❌"}`);

    if (productsTest.success) {
      console.log(`   Productos encontrados: ${productsTest.count}`);
    } else {
      console.log(`   Error: HTTP ${productsTest.status}`);
    }

    console.log("\n3️⃣  PRUEBA DE SUPABASE:\n");

    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`   Conexión: ✅`);

    // Test SELECT
    const { data, error } = await supabase.from("product_metadata").select("id").limit(1);

    if (error) {
      console.log(`   product_metadata: ❌`);
      console.log(`   Error: ${error.message}`);
      process.exit(1);
    } else {
      console.log(`   product_metadata: ✅`);
    }

    // Count records
    const { count, error: countError } = await supabase
      .from("product_metadata")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.log(`   SELECT: ❌`);
      console.log(`   Error: ${countError.message}`);
    } else {
      console.log(`   SELECT: ✅`);
      console.log(`   Registros actuales: ${count || 0}`);
    }

    console.log("\n========== DIAGNOSTICO COMPLETADO ==========\n");
    console.log("🟢 LISTO PARA FASE 3B\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
})();
