#!/usr/bin/env node

/**
 * DIAGNÓSTICO DIRECTO DE PEDIDOS
 * Consulta la base de datos Supabase sin pasar por autenticación de admin
 * Solo para diagnóstico - NO modifica datos
 *
 * Uso: node scripts/query-orders-direct.mjs
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
    // Remover comillas si las tiene
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[match[1].trim()] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Las variables de entorno no están configuradas");
  console.error("   VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseOrders() {
  console.log("\n🔍 DIAGNÓSTICO DIRECTO DE PEDIDOS\n");
  console.log("═".repeat(100));

  try {
    // 1. Obtener TODOS los pedidos (incluyendo eliminados)
    console.log("\n📊 Consultando tabla 'orders'...\n");

    const { data: allOrders, error: allError, count: allCount } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (allError) throw allError;

    console.log(`Total de registros en 'orders': ${allCount}`);
    console.log(`Registros obtenidos: ${allOrders?.length || 0}\n`);

    // 2. Obtener pedidos ACTIVOS (deleted_at IS NULL) - esto es lo que ve el admin
    console.log("📋 Pedidos ACTIVOS (deleted_at IS NULL) - Lo que ve /admin/orders:\n");

    const { data: activeOrders, error: activeError, count: activeCount } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (activeError) throw activeError;

    console.log(`Total de pedidos activos: ${activeCount}\n`);

    if (activeOrders && activeOrders.length > 0) {
      // Crear tabla de resumen
      console.log("┌─────┬──────────────────┬──────────────────────────┬──────────┬─────────┬──────────────────────────┬──────────────┬──────────────┐");
      console.log("│ # │ Order Number │ Customer Email │ Status │ User ID │ Created │ GHL Contact │ GHL Opportunity │");
      console.log("├─────┼──────────────────┼──────────────────────────┼──────────┼─────────┼──────────────────────────┼──────────────┼──────────────┤");

      activeOrders.forEach((order, idx) => {
        const userIdDisplay = order.user_id ? `${order.user_id.substring(0, 8)}...` : "(NULL)";
        const ghlContact = order.ghl_contact_id ? `${order.ghl_contact_id.substring(0, 8)}...` : "(none)";
        const ghlOpp = order.ghl_opportunity_id ? `${order.ghl_opportunity_id.substring(0, 8)}...` : "(none)";
        const createdDate = new Date(order.created_at).toLocaleDateString("es-ES");

        console.log(
          `│ ${String(idx + 1).padEnd(3)} │ ${String(order.order_number).padEnd(16)} │ ${String(order.customer_email).padEnd(24)} │ ${String(order.status).padEnd(8)} │ ${String(userIdDisplay).padEnd(7)} │ ${String(createdDate).padEnd(24)} │ ${String(ghlContact).padEnd(12)} │ ${String(ghlOpp).padEnd(12)} │`,
        );
      });

      console.log("└─────┴──────────────────┴──────────────────────────┴──────────┴─────────┴──────────────────────────┴──────────────┴──────────────┘");

      // Análisis detallado
      console.log("\n📈 ANÁLISIS DETALLADO:\n");

      // Por estado
      const byStatus = {};
      activeOrders.forEach((order) => {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      });

      console.log("Por estado:");
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });

      // Con user_id vs sin user_id
      const withUserId = activeOrders.filter((o) => o.user_id).length;
      const withoutUserId = activeOrders.filter((o) => !o.user_id).length;

      console.log(`\nAsociación a usuarios:`);
      console.log(`  Con user_id (usuarios reales): ${withUserId}`);
      console.log(`  Sin user_id (prueba/checkout): ${withoutUserId}`);

      // Sincronizados con GHL
      const withGHL = activeOrders.filter((o) => o.ghl_contact_id).length;
      console.log(`\nSincronización GoHighLevel:`);
      console.log(`  Sincronizados con GHL: ${withGHL}`);
      console.log(`  No sincronizados: ${activeOrders.length - withGHL}`);

      // 3. Items por orden
      console.log(`\n📦 Items por orden:\n`);

      const orderIds = activeOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, product_name, quantity")
          .in("order_id", orderIds);

        if (!itemsError && items) {
          const itemsByOrder = {};
          items.forEach((item) => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });

          Object.entries(itemsByOrder).forEach(([orderId, orderItems]) => {
            const order = activeOrders.find((o) => o.id === orderId);
            console.log(`  ${order.order_number}: ${orderItems.length} items`);
            orderItems.forEach((item) => {
              console.log(`    - ${item.product_name} (qty: ${item.quantity})`);
            });
          });
        }
      }

      // Pedidos de prueba (candidatos a eliminar)
      console.log(`\n🗑️  CANDIDATOS PARA ELIMINAR (pedidos sin user_id):\n`);
      const testOrders = activeOrders.filter((o) => !o.user_id);
      if (testOrders.length > 0) {
        console.log(`Total: ${testOrders.length}\n`);
        testOrders.forEach((order) => {
          console.log(`  • ${order.order_number}`);
          console.log(`    Email: ${order.customer_email}`);
          console.log(`    Estado: ${order.status}`);
          console.log(`    Creado: ${new Date(order.created_at).toLocaleString("es-ES")}`);
          console.log(`    GHL: ${order.ghl_contact_id ? "Sí" : "No"}`);
          console.log();
        });
      } else {
        console.log("✓ No hay pedidos sin user_id (todos están asociados a usuarios)");
      }
    } else {
      console.log("✅ No hay pedidos activos en la base de datos");
    }

    // Pedidos eliminados
    const deletedOrders = allOrders?.filter((o) => o.deleted_at) || [];
    console.log(`\n🔒 Pedidos eliminados (deleted_at NOT NULL): ${deletedOrders.length}`);

    console.log("\n" + "═".repeat(100));
    console.log("\n✅ Diagnóstico completado\n");

  } catch (error) {
    console.error("\n❌ Error durante el diagnóstico:");
    console.error(error.message);
    process.exit(1);
  }
}

diagnoseOrders();
