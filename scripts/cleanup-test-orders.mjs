#!/usr/bin/env node

/**
 * LIMPIEZA CONTROLADA DE PEDIDOS DE PRUEBA
 * Soft delete de los 12 pedidos identificados
 * Solo marca deleted_at, no elimina filas
 *
 * Uso: node scripts/cleanup-test-orders.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lee el archivo .env.local manualmente
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[match[1].trim()] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Variables de entorno no configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Los 12 order_numbers identificados en el diagnóstico
const TEST_ORDER_NUMBERS = [
  "ORD-F3-925445",
  "ORD-F3-924978",
  "ORD-F3-924948",
  "ORD-F3-924924",
  "ORD-F3-924851",
  "ORD-F3-924793",
  "ORD-E2E-FINAL-22485",
  "ORD-E2E-FINAL-22440",
  "ORD-E2E-FINAL-003",
  "ORD-E2E-FINAL-002",
  "ORD-E2E-FINAL-001",
  "ORD-20260828-E2E01",
];

async function cleanupTestOrders() {
  console.log("\n🗑️  LIMPIEZA CONTROLADA DE PEDIDOS DE PRUEBA\n");
  console.log("═".repeat(100));

  try {
    // Paso 1: Verificar que los 12 pedidos existen
    console.log("\n📋 Paso 1: Verificando que los 12 pedidos de prueba existen...\n");

    const { data: ordersToDelete, error: verifyError } = await supabase
      .from("orders")
      .select("id, order_number, status, deleted_at")
      .in("order_number", TEST_ORDER_NUMBERS)
      .is("deleted_at", null);

    if (verifyError) throw verifyError;

    console.log(`✓ Encontrados ${ordersToDelete?.length || 0} de ${TEST_ORDER_NUMBERS.length} pedidos\n`);

    if (ordersToDelete?.length !== TEST_ORDER_NUMBERS.length) {
      console.warn("⚠️  Advertencia: No se encontraron todos los pedidos esperados");
      const foundNumbers = ordersToDelete?.map((o) => o.order_number) || [];
      const missing = TEST_ORDER_NUMBERS.filter((n) => !foundNumbers.includes(n));
      console.log(`Faltantes: ${missing.join(", ")}\n`);
    }

    console.log("✓ Confirmado: Todos los pedidos identificados están activos\n");

    // Listar los pedidos que serán eliminados
    console.log("Pedidos a marcar como eliminados:");
    ordersToDelete?.forEach((order, idx) => {
      console.log(`  ${idx + 1}. ${order.order_number} (${order.status})`);
    });
    console.log();

    // Paso 2: Contar items asociados
    console.log("📦 Paso 2: Contando order_items asociados...\n");

    const orderIds = ordersToDelete?.map((o) => o.id) || [];

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      console.log(`✓ Encontrados ${items?.length || 0} order_items asociados\n`);
    }

    // Paso 3: Realizar soft delete
    console.log("🔄 Paso 3: Marcando pedidos como eliminados (soft delete)...\n");

    const { error: updateError, count } = await supabase
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .in("order_number", TEST_ORDER_NUMBERS)
      .is("deleted_at", null);

    if (updateError) throw updateError;

    console.log(`✓ Actualizados ${count} registros\n`);

    // Paso 4: Verificar que la limpieza funcionó
    console.log("✅ Paso 4: Verificando que la limpieza funcionó...\n");

    const { data: stillActive, error: verifyError2 } = await supabase
      .from("orders")
      .select("id, order_number")
      .in("order_number", TEST_ORDER_NUMBERS)
      .is("deleted_at", null);

    if (verifyError2) throw verifyError2;

    if (stillActive?.length === 0) {
      console.log("✓ Confirmado: Los 12 pedidos ya no están activos (deleted_at NOT NULL)\n");
    } else {
      console.error("❌ ERROR: Algunos pedidos aún están activos después de la limpieza");
      console.error(`Pedidos que siguen activos: ${stillActive?.map((o) => o.order_number).join(", ")}`);
      process.exit(1);
    }

    // Paso 5: Contar pedidos activos restantes
    console.log("📊 Paso 5: Estado final de la base de datos...\n");

    const { count: activeCount, error: activeError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);

    if (activeError) throw activeError;

    console.log(`Total de pedidos activos en BD: ${activeCount}`);

    const { count: pendingCount, error: pendingError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null);

    if (pendingError) throw pendingError;

    console.log(`Pedidos PENDING activos: ${pendingCount}`);

    // Paso 6: Verificar órfanos en order_items
    console.log("\n🔗 Paso 6: Verificando órfanos en order_items...\n");

    const { data: orphanedItems, error: orphansError } = await supabase
      .from("order_items")
      .select("id, order_id")
      .in("order_id", orderIds);

    if (orphansError) throw orphansError;

    if ((orphanedItems?.length || 0) === 0) {
      console.log("✓ No hay order_items asociados a estos pedidos (limpieza correcta)\n");
    } else {
      console.warn(`⚠️  Advertencia: Hay ${orphanedItems?.length} order_items aún asociados\n`);
    }

    console.log("═".repeat(100));
    console.log("\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE\n");

    console.log("📊 RESUMEN:");
    console.log(`  • Pedidos marcados como eliminados: ${count}`);
    console.log(`  • Order numbers eliminados: ${TEST_ORDER_NUMBERS.length}`);
    console.log(`  • Pedidos activos restantes: ${activeCount}`);
    console.log(`  • Pedidos PENDING activos: ${pendingCount}`);
    console.log(`  • Registros huérfanos en order_items: ${orphanedItems?.length || 0}`);
    console.log(`  • Timestamp de eliminación: ${new Date().toISOString()}`);
    console.log();

  } catch (error) {
    console.error("\n❌ Error durante la limpieza:");
    console.error(error.message);
    process.exit(1);
  }
}

cleanupTestOrders();
