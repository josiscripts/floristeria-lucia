#!/usr/bin/env node

/**
 * VERIFICACIÓN READ-ONLY de FASE 1
 * Verifica que todas las migraciones se aplicaron correctamente
 */

const SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk";

console.log("🔍 VERIFICACIÓN READ-ONLY - FASE 1");
console.log(`📍 Proyecto: leksmflinhohnekbgmgj`);
console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
console.log("");
console.log("━".repeat(70));
console.log("");

const results = {
  timestamp: new Date().toISOString(),
  checks: {},
  allPassed: true,
};

// Helper para hacer fetch
async function fetchQuery(query, description) {
  try {
    // Intentar vía API REST (si la query es una tabla)
    // Para vistas del sistema, esto limitado
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: PUBLISHABLE_KEY,
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      // La API REST puede no soportar system queries
      // Retornar null para que se ejecute manualmente
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
}

// Verificaciones
const checks = [
  {
    name: "public.profiles EXISTE",
    query: `SELECT table_name FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila con table_name = "profiles"',
  },
  {
    name: "profiles - Columnas correctas",
    query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;`,
    verify: (result) => result && result.length === 5,
    expectedOutput: "5 columnas: id, full_name, phone, created_at, updated_at",
  },
  {
    name: "profiles - RLS HABILITADO",
    query: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';`,
    verify: (result) => result && result[0] && result[0].rowsecurity === true,
    expectedOutput: "rowsecurity = true",
  },
  {
    name: "profiles - 3 POLICIES",
    query: `SELECT policyname FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;`,
    verify: (result) => result && result.length === 3,
    expectedOutput: "3 policies: Users can insert/select/update their own profile",
  },
  {
    name: "Función update_updated_at_column() EXISTE",
    query: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila con routine_name = "update_updated_at_column"',
  },
  {
    name: "Función handle_new_user() EXISTE",
    query: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila con routine_name = "handle_new_user"',
  },
  {
    name: "TRIGGER update_profiles_updated_at EXISTE",
    query: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at' AND trigger_schema = 'public';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila con trigger_name = "update_profiles_updated_at"',
  },
  {
    name: "TRIGGER on_auth_user_created EXISTE",
    query: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created' AND trigger_schema = 'public';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila con trigger_name = "on_auth_user_created"',
  },
  {
    name: "Storage bucket hero-animation EXISTE",
    query: `SELECT name, public FROM storage.buckets WHERE name = 'hero-animation';`,
    verify: (result) => result && result.length > 0 && result[0].public === true,
    expectedOutput: 'Una fila: name="hero-animation", public=true',
  },
  {
    name: "Storage POLICY hero-animation EXISTE",
    query: `SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%hero%';`,
    verify: (result) => result && result.length > 0,
    expectedOutput: 'Una fila: policyname = "Anyone can read hero animation frames"',
  },
];

// Ejecutar verificaciones
async function runVerification() {
  console.log("Ejecutando 10 verificaciones READ-ONLY...");
  console.log("");

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    const checkNum = i + 1;

    console.log(`${checkNum}️⃣  ${check.name}`);

    // Nota: La mayoría de estas queries requieren acceso directo a PostgreSQL
    // o credenciales de admin que no tenemos en este contexto
    // Por eso mostraremos las queries para ejecutar manualmente

    console.log(`    Query: ${check.query.substring(0, 60)}...`);
    console.log(`    Esperado: ${check.expectedOutput}`);
    console.log("");

    results.checks[check.name] = {
      query: check.query,
      expectedOutput: check.expectedOutput,
      status: "PENDIENTE_VERIFICACIÓN_MANUAL",
    };
  }

  console.log("━".repeat(70));
  console.log("");
  console.log("⚠️  NOTA IMPORTANTE:");
  console.log("");
  console.log("Las queries de sistema (information_schema, pg_policies, etc.)");
  console.log("requieren acceso directo a PostgreSQL con credenciales de admin.");
  console.log("");
  console.log("Para verificar manualmente:");
  console.log("");
  console.log("1. Ve a: https://leksmflinhohnekbgmgj.supabase.co");
  console.log("2. Abre: SQL Editor");
  console.log("3. Copia cada query");
  console.log("4. Ejecuta y verifica el resultado");
  console.log("");
  console.log("━".repeat(70));
  console.log("");
  console.log("📋 QUERIES PARA EJECUTAR MANUALMENTE");
  console.log("");
  console.log("--- QUERY 1: Verificar tabla profiles existe ---");
  console.log(checks[0].query);
  console.log("");

  console.log("--- QUERY 2: Verificar columnas ---");
  console.log(checks[1].query);
  console.log("");

  console.log("--- QUERY 3: Verificar RLS habilitado ---");
  console.log(checks[2].query);
  console.log("");

  console.log("--- QUERY 4: Verificar 3 policies ---");
  console.log(checks[3].query);
  console.log("");

  console.log("--- QUERY 5: Verificar función update_updated_at_column ---");
  console.log(checks[4].query);
  console.log("");

  console.log("--- QUERY 6: Verificar función handle_new_user ---");
  console.log(checks[5].query);
  console.log("");

  console.log("--- QUERY 7: Verificar trigger update_profiles_updated_at ---");
  console.log(checks[6].query);
  console.log("");

  console.log("--- QUERY 8: Verificar trigger on_auth_user_created ---");
  console.log(checks[7].query);
  console.log("");

  console.log("--- QUERY 9: Verificar bucket hero-animation ---");
  console.log(checks[8].query);
  console.log("");

  console.log("--- QUERY 10: Verificar policy hero-animation ---");
  console.log(checks[9].query);
  console.log("");

  console.log("━".repeat(70));
}

runVerification().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
