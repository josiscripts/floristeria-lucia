#!/usr/bin/env node

/**
 * FASE 1: Ejecutar migraciones en nuevo Supabase
 *
 * Solo ejecuta:
 * 1. Migration 20260822021251_*.sql (profiles + funciones + triggers + RLS)
 * 2. Migration 20260822021259_*.sql (permisos revoke)
 * 3. Crear bucket hero-animation
 * 4. Crear policy de lectura
 *
 * NO ejecuta:
 * - product_metadata
 * - migración de usuarios
 * - cambios en Lovable
 * - cambios en .env
 * - rollback automático
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const PROJECT_ID = "leksmflinhohnekbgmgj";
const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";

// Nota: Para ejecutar SQL necesitamos credenciales de admin
// Las opciones son:
// 1. Supabase CLI (si está instalado)
// 2. Service Role Key en .env
// 3. API REST de Supabase con credenciales especiales

console.log("🚀 FASE 1: Ejecutar migraciones en nuevo Supabase");
console.log(`📍 Proyecto: ${PROJECT_ID}`);
console.log(`🕐 Inicio: ${new Date().toISOString()}`);
console.log("");

// Leer variables de entorno
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");

console.log("📝 Verificando credenciales...");

// Buscar Service Role Key en .env o variables de entorno
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY no está en variables de entorno");
  console.log("");
  console.log("Para ejecutar migraciones SQL, necesitamos el Service Role Key.");
  console.log("");
  console.log("Opciones:");
  console.log("1. Ir a: https://supabase.com/dashboard");
  console.log("2. Seleccionar proyecto: leksmflinhohnekbgmgj");
  console.log("3. Settings → Database → Connection Pooling");
  console.log("4. Copiar el password (que es el Service Role Key)");
  console.log("5. O: Settings → API → Service Role Key");
  console.log("6. Establecer variable: SUPABASE_SERVICE_ROLE_KEY=<key>");
  console.log("");
  console.log("O usar Supabase CLI:");
  console.log("   supabase db push");
  console.log("");
  process.exit(1);
}

console.log("✅ Service Role Key encontrado");
console.log("");

// Leer archivos de migración
const migrationDir = path.join(__dirname, "..", "supabase", "migrations");

const migration1File = path.join(
  migrationDir,
  "20260822021251_6d2b278a-9cbd-46b8-b007-d38a54d0df2f.sql",
);
const migration2File = path.join(
  migrationDir,
  "20260822021259_91a717e7-d94a-4ace-b0be-9f207bec227a.sql",
);

if (!fs.existsSync(migration1File) || !fs.existsSync(migration2File)) {
  console.log("❌ No se encontraron archivos de migración");
  process.exit(1);
}

const migration1SQL = fs.readFileSync(migration1File, "utf-8");
const migration2SQL = fs.readFileSync(migration2File, "utf-8");

console.log("📋 Archivos de migración encontrados:");
console.log(`  1️⃣  20260822021251_*.sql`);
console.log(`  2️⃣  20260822021259_*.sql`);
console.log("");

// Función para ejecutar SQL vía API
async function executeSQL(sql, description) {
  console.log(`⏳ Ejecutando: ${description}`);

  try {
    // Usar API de Supabase para ejecutar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      console.log(`  ❌ Error: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.log(`  Detalles: ${error}`);
      return false;
    }

    console.log(`  ✅ Ejecutado correctamente`);
    return true;
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return false;
  }
}

// Función para crear bucket
async function createBucket() {
  console.log("⏳ Creando bucket: hero-animation");

  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/buckets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        name: "hero-animation",
        public: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Si el bucket ya existe, no es un error
      if (error.message && error.message.includes("already exists")) {
        console.log(`  ℹ️  Bucket ya existe`);
        return true;
      }
      console.log(`  ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Bucket creado correctamente`);
    return true;
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return false;
  }
}

// Función para crear policy en storage
async function createStoragePolicy() {
  console.log("⏳ Creando policy de lectura para hero-animation");

  try {
    // La policy para storage debe crearse vía SQL
    const policySQL = `
      create policy "Anyone can read hero animation frames"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'hero-animation');
    `;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey:
          process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: policySQL }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`  ⚠️  La policy podría no haberse creado. Detalles: ${error}`);
      // No es un error fatal, puede que ya exista
    } else {
      console.log(`  ✅ Policy creada correctamente`);
    }
    return true;
  } catch (err) {
    console.log(`  ⚠️  Error creando policy: ${err.message}`);
    return true; // No es fatal
  }
}

// Ejecutar
async function run() {
  try {
    console.log("━".repeat(70));
    console.log("EJECUTANDO FASE 1");
    console.log("━".repeat(70));
    console.log("");

    // 1. Aplicar migration 1
    const result1 = await executeSQL(migration1SQL, "Migration 1: profiles + funciones + triggers");
    if (!result1) {
      console.log("");
      console.log("⚠️  Migración 1 falló. Deteniendo sin rollback automático.");
      process.exit(1);
    }
    console.log("");

    // 2. Aplicar migration 2
    const result2 = await executeSQL(migration2SQL, "Migration 2: permisos revoke");
    if (!result2) {
      console.log("");
      console.log("⚠️  Migración 2 falló. Deteniendo sin rollback automático.");
      process.exit(1);
    }
    console.log("");

    // 3. Crear bucket
    const result3 = await createBucket();
    if (!result3) {
      console.log("");
      console.log("⚠️  No se pudo crear bucket. Continuando...");
    }
    console.log("");

    // 4. Crear policy
    const result4 = await createStoragePolicy();
    console.log("");

    console.log("━".repeat(70));
    console.log("✅ FASE 1 EJECUTADA");
    console.log("━".repeat(70));
    console.log("");
    console.log("Próximo paso: Verificación READ-ONLY");
    console.log("");
  } catch (err) {
    console.error("❌ Error fatal:", err.message);
    process.exit(1);
  }
}

run();
