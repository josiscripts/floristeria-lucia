#!/usr/bin/env node

import http from "http";

const BASE_URL = "http://localhost:5173";

const routes = [
  "/",
  "/catalogo",
  "/catalogo?categoria=ramos",
  "/catalogo?categoria=plantas",
  "/catalogo?categoria=rosas-eternas",
  "/catalogo?categoria=complementos",
  "/catalogo?categoria=condolencias",
  "/sobre-nosotros",
  "/envios",
  "/contacto",
];

console.log("==================================================");
console.log("BLOQUE 6 - VERIFICACIÓN FRONTEND");
console.log("==================================================\n");

console.log(`Conectando a: ${BASE_URL}\n`);

async function checkRoute(route) {
  return new Promise((resolve) => {
    const url = new URL(route, BASE_URL);

    const req = http.get(url.toString(), { timeout: 3000 }, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
        // Only get first KB to check if HTML is valid
        if (data.length > 1000) {
          res.pause();
        }
      });

      res.on("end", () => {
        const isHTML = data.includes("<!DOCTYPE") || data.includes("<html");
        const hasTitle = data.includes("<title>");
        const hasErrors =
          data.includes("error") ||
          data.includes("Error") ||
          data.includes("404") ||
          data.includes("undefined") ||
          data.includes("null");

        resolve({
          route,
          status: res.statusCode,
          isHTML,
          hasTitle,
          hasErrors: hasErrors && !isHTML,
          dataLength: data.length,
          success: res.statusCode === 200 && isHTML && !hasErrors,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        route,
        status: 0,
        error: err.message,
        success: false,
      });
    });

    req.on("timeout", () => {
      req.abort();
      resolve({
        route,
        status: 0,
        error: "TIMEOUT",
        success: false,
      });
    });
  });
}

async function main() {
  console.log("Verificando rutas...\n");

  let successCount = 0;
  const results = [];

  for (const route of routes) {
    const result = await checkRoute(route);
    results.push(result);

    const status = result.success ? "✓" : "✗";
    const statusCode = result.status || "N/A";

    console.log(`${status} ${route.padEnd(40)} HTTP ${statusCode}`);

    if (result.error) {
      console.log(`  └─ Error: ${result.error}`);
    }

    if (result.hasErrors) {
      console.log(`  └─ ⚠️  Posible error en página`);
    }

    if (result.success) {
      successCount++;
    }
  }

  console.log("\n==================================================");
  console.log("RESUMEN FRONTEND");
  console.log("==================================================\n");

  console.log(`Rutas respondieron: ${successCount} / ${routes.length}`);
  console.log(`Disponibilidad: ${((successCount / routes.length) * 100).toFixed(0)}%`);

  if (successCount === routes.length) {
    console.log("\n✅ RESULTADO: TODAS LAS RUTAS FUNCIONAN");
  } else if (successCount >= routes.length * 0.8) {
    console.log("\n⚠️  RESULTADO: MAYORÍA DE RUTAS FUNCIONAN");
  } else {
    console.log("\n❌ RESULTADO: PROBLEMAS DE CONECTIVIDAD");
  }

  // Detailed results
  console.log("\n---Detalles---");
  results.forEach((r) => {
    if (!r.success) {
      console.log(`\n${r.route}:`);
      if (r.error) {
        console.log(`  Error: ${r.error}`);
      } else {
        console.log(`  HTTP ${r.status}`);
        console.log(`  HTML válido: ${r.isHTML}`);
        console.log(`  Contiene título: ${r.hasTitle}`);
      }
    }
  });

  // Product routes (need actual IDs from metadata)
  console.log("\n==================================================");
  console.log("PRODUCTOS - Necesitan IDs reales de Supabase");
  console.log("==================================================\n");

  console.log("IDs conocidos de productos:");
  console.log("  - ramo-silvestre");
  console.log("  - caja-rosas-eternas");
  console.log("  - anthurium");
  console.log("\n[Para verificar, usar: /producto/{catalog-id}]");

  process.exit(successCount === routes.length ? 0 : 1);
}

main().catch(console.error);
