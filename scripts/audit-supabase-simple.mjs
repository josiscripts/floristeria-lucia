#!/usr/bin/env node

/**
 * Auditoría READ-ONLY simple del nuevo Supabase (leksmflinhohnekbgmgj)
 * Usa directamente la REST API sin dependencias externas
 */

const PROJECT_ID = "leksmflinhohnekbgmgj";
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk";

console.log("🔍 Auditando nuevo Supabase...");
console.log(`📍 Proyecto: ${PROJECT_ID}`);
console.log(`🕐 Hora: ${new Date().toISOString()}`);
console.log("");

const results = {
  timestamp: new Date().toISOString(),
  projectId: PROJECT_ID,
  tables: {},
  storageBuckets: [],
  notes: [],
  warnings: [],
};

// Tablas conocidas a verificar
const tablesToCheck = ["profiles", "product_metadata"];

async function checkTable(tableName) {
  console.log(`\n📋 Verificando tabla: ${tableName}`);

  try {
    // Usar REST API de Supabase para contar registros
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      method: "GET",
      headers: {
        apikey: PUBLISHABLE_KEY,
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      console.log(`  ❌ TABLA NO EXISTE`);
      results.tables[tableName] = {
        exists: false,
        records: 0,
        status: "NO_EXISTE",
      };
      return;
    }

    if (!response.ok) {
      console.log(`  ⚠️  Error: ${response.status} ${response.statusText}`);
      results.warnings.push(`Error checking ${tableName}: ${response.statusText}`);
      return;
    }

    // Obtener conteo (mediante header)
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count()`, {
      method: "HEAD",
      headers: {
        apikey: PUBLISHABLE_KEY,
        Accept: "application/json",
      },
    });

    const contentRange = countResponse.headers.get("content-range");
    let recordCount = 0;

    if (contentRange) {
      const match = contentRange.match(/\/(\d+)/);
      recordCount = match ? parseInt(match[1]) : 0;
    }

    console.log(`  ✅ EXISTE`);
    console.log(`     Registros: ${recordCount}`);

    results.tables[tableName] = {
      exists: true,
      records: recordCount,
      status: tableName === "profiles" ? "CONSERVAR" : "REVISAR",
      classification:
        tableName === "profiles"
          ? "Tabla crítica para autenticación y datos de usuario de Floristería Lucía"
          : "Tabla para metadatos GHL - revisar si fue migrada de proyecto anterior",
    };
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.warnings.push(`Failed to check ${tableName}: ${err.message}`);
  }
}

async function checkStorageBuckets() {
  console.log("\n\n📦 Verificando Storage Buckets...");

  try {
    // Storage buckets conocidos
    const bucketsToCheck = ["hero-animation"];

    for (const bucket of bucketsToCheck) {
      console.log(`  📂 Verificando bucket: ${bucket}`);

      try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/buckets`, {
          method: "GET",
          headers: {
            apikey: PUBLISHABLE_KEY,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.log(`     ⚠️  No se pudo listar buckets`);
          break;
        }

        const buckets = await response.json();
        const found = buckets.find((b) => b.name === bucket);

        if (found) {
          console.log(`     ✅ EXISTE`);
          console.log(`        Público: ${found.public}`);
          results.storageBuckets.push({
            name: bucket,
            exists: true,
            public: found.public,
            status: "CONSERVAR",
            purpose: "Almacena 205 frames de animación para hero component",
          });
        } else {
          console.log(`     ❌ NO EXISTE`);
          results.storageBuckets.push({
            name: bucket,
            exists: false,
            status: "CREAR",
            purpose: "Necesario para animación hero - debe crearse",
          });
        }
      } catch (err) {
        console.log(`     ⚠️  Error: ${err.message}`);
        results.warnings.push(`Failed to check bucket ${bucket}: ${err.message}`);
      }
    }
  } catch (err) {
    console.log(`  ❌ Error general: ${err.message}`);
    results.warnings.push(`Storage audit failed: ${err.message}`);
  }
}

async function generateSummary() {
  console.log("\n\n" + "=".repeat(70));
  console.log("📊 RESUMEN DE AUDITORÍA");
  console.log("=".repeat(70));

  console.log("\n📋 TABLAS:");
  let hasProfiles = false;
  let hasProductMetadata = false;

  for (const [tableName, info] of Object.entries(results.tables)) {
    const icon = info.exists ? "✅" : "❌";
    console.log(`  ${icon} ${tableName.toUpperCase()}`);
    console.log(`     Existe: ${info.exists}`);
    console.log(`     Registros: ${info.records}`);
    console.log(`     Clasificación: ${info.status}`);
    console.log(`     Motivo: ${info.classification || "N/A"}`);

    if (tableName === "profiles" && info.exists) hasProfiles = true;
    if (tableName === "product_metadata" && info.exists) hasProductMetadata = true;
  }

  console.log("\n📦 STORAGE:");
  for (const bucket of results.storageBuckets) {
    const icon = bucket.exists ? "✅" : "❌";
    console.log(`  ${icon} ${bucket.name.toUpperCase()}`);
    console.log(`     Existe: ${bucket.exists}`);
    if (bucket.exists) console.log(`     Público: ${bucket.public}`);
    console.log(`     Clasificación: ${bucket.status}`);
    console.log(`     Propósito: ${bucket.purpose}`);
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  ADVERTENCIAS:");
    for (const warning of results.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("🔍 ANÁLISIS:");
  console.log("=".repeat(70));

  if (hasProfiles && !hasProductMetadata) {
    console.log("\n✅ ESTADO: Supabase tiene estructura PARCIAL de Floristería Lucía");
    console.log("   - profiles está creada");
    console.log("   - product_metadata NO existe (aún no se ha aplicado migración)");
    console.log("\n💡 ACCIÓN RECOMENDADA:");
    console.log("   1. Limpiar cualquier tabla del proyecto anterior");
    console.log("   2. Aplicar migración product_metadata cuando esté aprobado");
  } else if (hasProfiles && hasProductMetadata) {
    console.log("\n✅ ESTADO: Supabase tiene estructura COMPLETA de Floristería Lucía");
  } else if (!hasProfiles) {
    console.log("\n⚠️  ESTADO: profiles NO EXISTE");
    console.log("   - Debe ser creada antes de usar este Supabase en producción");
  }

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Auditoría completada: ${new Date().toISOString()}`);
  console.log("=".repeat(70));
}

async function run() {
  try {
    // Verificar tablas
    for (const table of tablesToCheck) {
      await checkTable(table);
    }

    // Verificar storage
    await checkStorageBuckets();

    // Generar resumen
    await generateSummary();

    // Guardar resultados
    const fs = await import("fs");
    const path = await import("path");

    const reportFile = path.join(process.cwd(), "docs", "SUPABASE_AUDIT_RESULTS.json");
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Resultados guardados: ${reportFile}`);
  } catch (err) {
    console.error("❌ Error fatal:", err);
    process.exit(1);
  }
}

run();
