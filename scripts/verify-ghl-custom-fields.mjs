#!/usr/bin/env node

/**
 * Script de exploración: Verificar capacidad de custom fields para productos en GHL
 * Objetivo: Descubrir estructura real, endpoints y limitaciones
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  envPath = path.join(__dirname, "..", ".env");
}

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "");
      env[key.trim()] = value;
    }
  });
  return env;
}

async function makeRequest(endpoint, method = "GET", body = null) {
  const env = loadEnv(envPath);
  const token = env.GHL_PRIVATE_INTEGRATION_TOKEN;
  const locationId = env.GHL_LOCATION_ID;

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  const options = {
    method,
    headers,
    signal: AbortSignal.timeout(15000),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, options);

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    return {
      status: response.statusCode || response.status,
      ok: response.ok,
      data,
      error: !response.ok ? text : null,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      error: error.message,
    };
  }
}

async function explore() {
  console.log("\n🔍 Exploración: Custom Fields para Productos en GHL\n");
  console.log("━".repeat(70));

  const env = loadEnv(envPath);
  const locationId = env.GHL_LOCATION_ID;

  console.log("\n📋 Pruebas a ejecutar:\n");

  // Test 1: Obtener estructura completa de producto existente
  console.log("Test 1: Obtener estructura completa de producto");
  console.log("─".repeat(70));
  const productsRes = await makeRequest(`/products/?locationId=${locationId}&limit=1`);

  if (productsRes.ok && productsRes.data?.products?.length > 0) {
    const product = productsRes.data.products[0];
    console.log("✅ Respuesta exitosa");
    console.log("\nCampos presentes en producto:");
    console.log(JSON.stringify(Object.keys(product).sort(), null, 2));

    console.log("\nEstructura completa:");
    console.log(JSON.stringify(product, null, 2));

    // Buscar si hay campos personalizados
    if (product.customFields) {
      console.log("\n✅ customFields encontrado:", product.customFields);
    } else if (product.customField) {
      console.log("\n✅ customField encontrado:", product.customField);
    } else {
      console.log("\n⚠️  No se encuentran custom fields en la estructura");
    }
  } else {
    console.log("❌ Error:", productsRes.error);
  }

  // Test 2: Buscar endpoints relacionados con custom fields
  console.log("\n\nTest 2: Intentar acceder a endpoints de custom fields");
  console.log("─".repeat(70));

  const customFieldEndpoints = [
    `/locations/${locationId}/custom-fields`,
    `/locations/${locationId}/customFields`,
    `/products/custom-fields?locationId=${locationId}`,
    `/custom-fields?locationId=${locationId}`,
    `/customFields?locationId=${locationId}`,
  ];

  for (const endpoint of customFieldEndpoints) {
    const res = await makeRequest(endpoint);
    console.log(`\n${endpoint}`);
    console.log(`  Status: ${res.status}`);
    if (res.ok) {
      console.log(`  ✅ Endpoint existe`);
      console.log(`  Respuesta:`, JSON.stringify(res.data, null, 2).substring(0, 200));
    } else {
      console.log(`  ❌ Endpoint no encontrado o error`);
    }
  }

  // Test 3: Intentar crear custom field
  console.log("\n\nTest 3: Intentar crear custom field (descubrir estructura)");
  console.log("─".repeat(70));

  const createFieldBody = {
    name: "test_legacy_catalog_id",
    type: "text",
    label: "Legacy Catalog ID",
  };

  console.log("Endpoint intentado: POST /custom-fields");
  console.log("Body:", JSON.stringify(createFieldBody, null, 2));

  const createRes = await makeRequest("/custom-fields", "POST", createFieldBody);
  console.log(`Status: ${createRes.status}`);
  if (createRes.ok) {
    console.log("✅ Custom field creado");
    console.log("Respuesta:", JSON.stringify(createRes.data, null, 2));
  } else {
    console.log("ℹ️  Respuesta:", createRes.error);
  }

  // Test 4: Intentar obtener metadata de custom fields
  console.log("\n\nTest 4: Obtener información de definición de custom fields");
  console.log("─".repeat(70));

  const metadataEndpoints = [
    `/locations/${locationId}/metadata`,
    `/locations/${locationId}/schema`,
    `/products/schema?locationId=${locationId}`,
  ];

  for (const endpoint of metadataEndpoints) {
    const res = await makeRequest(endpoint);
    console.log(`\n${endpoint}`);
    console.log(`  Status: ${res.status}`);
    if (res.ok && res.data) {
      console.log(`  ✅ Respuesta:`);
      console.log(JSON.stringify(res.data, null, 2).substring(0, 500));
    }
  }

  // Test 5: Documentación inferida de la respuesta actual
  console.log("\n\n" + "━".repeat(70));
  console.log("📊 Análisis de Respuesta Actual de Producto\n");

  const actualRes = await makeRequest(`/products/?locationId=${locationId}&limit=1`);
  if (actualRes.ok && actualRes.data?.products?.length > 0) {
    const product = actualRes.data.products[0];

    console.log("Estructura de producto en respuesta actual:");
    const fields = Object.keys(product);

    console.log("\n✅ Campos nativos encontrados:");
    const nativeFields = [
      "_id",
      "locationId",
      "name",
      "description",
      "image",
      "category",
      "status",
      "price",
      "cost",
      "sku",
      "productType",
      "availableInStore",
      "variants",
      "isTaxesEnabled",
      "taxes",
      "trackProductInventory",
    ];

    nativeFields.forEach((f) => {
      if (fields.includes(f)) {
        console.log(`  ✅ ${f}`);
      }
    });

    console.log("\n❓ Campos desconocidos o potencialmente personalizados:");
    const unknownFields = fields.filter((f) => !nativeFields.includes(f));
    unknownFields.forEach((f) => {
      console.log(
        `  ? ${f}: ${typeof product[f]} = ${JSON.stringify(product[f]).substring(0, 50)}`,
      );
    });
  }

  console.log("\n" + "━".repeat(70));
  console.log("✅ Exploración completada\n");
}

explore().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
