#!/usr/bin/env node

/**
 * Diagnóstico de pedidos
 * Investiga qué pedidos de prueba existen en la base de datos
 *
 * Uso: node scripts/diagnose-orders.js
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  console.error("❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos");
  console.error("   Asegúrate de que el archivo .env.local está configurado correctamente");
  process.exit(1);
}

// Usar service role key si está disponible, de lo contrario anon key
const key = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, key);

async function diagnoseOrders() {
  console.log("🔍 Investigando pedidos en la base de datos...\n");

  try {
    // 1. Contar pedidos totales
    const { count: totalCount, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (countError) throw countError;
    console.log(`📊 Total de pedidos (incluyendo eliminados): ${totalCount}`);

    // 2. Contar pedidos activos
    const { count: activeCount, error: activeError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);

    if (activeError) throw activeError;
    console.log(`✓ Pedidos activos (deleted_at IS NULL): ${activeCount}\n`);

    // 3. Listar todos los pedidos activos
    console.log("📋 Listado de pedidos activos:");
    console.log("─".repeat(120));

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, status, created_at, user_id, deleted_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order.id}`);
        console.log(`   Número: ${order.order_number}`);
        console.log(`   Cliente: ${order.customer_name} <${order.customer_email}>`);
        console.log(`   Estado: ${order.status}`);
        console.log(`   Creado: ${new Date(order.created_at).toLocaleString("es-ES")}`);
        console.log(`   Usuario ID: ${order.user_id || "(sin asociar)"}`);
        console.log(`   Eliminado: ${order.deleted_at ? "Sí" : "No"}`);
      });
    } else {
      console.log("✓ No hay pedidos activos en la base de datos");
    }

    // 4. Contar pedidos por estado
    console.log("\n📈 Distribución de pedidos por estado:");
    console.log("─".repeat(60));

    const { data: statusDistribution, error: statusError } = await supabase
      .from("orders")
      .select("status, id")
      .is("deleted_at", null);

    if (statusError) throw statusError;

    const statusCount = {};
    (statusDistribution || []).forEach((row) => {
      statusCount[row.status] = (statusCount[row.status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 5. Verificar items de cada orden
    console.log("\n📦 Items por orden:");
    console.log("─".repeat(60));

    const { data: orderWithItems, error: itemsError } = await supabase
      .from("orders")
      .select("id, order_number, order_items(id)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (itemsError) throw itemsError;

    if (orderWithItems && orderWithItems.length > 0) {
      orderWithItems.forEach((order) => {
        const itemCount = (order.order_items || []).length;
        console.log(`   ${order.order_number}: ${itemCount} items`);
      });
    }

    // 6. Investigar GoHighLevel
    console.log("\n🔗 Información de sincronización GoHighLevel:");
    console.log("─".repeat(60));

    const { data: ghlOrders, error: ghlError } = await supabase
      .from("orders")
      .select("id, order_number, ghl_contact_id")
      .is("deleted_at", null)
      .not("ghl_contact_id", "is", null);

    if (ghlError) throw ghlError;

    if (ghlOrders && ghlOrders.length > 0) {
      console.log(`✓ Pedidos sincronizados con GoHighLevel: ${ghlOrders.length}`);
      ghlOrders.forEach((order) => {
        console.log(`   ${order.order_number} → GHL Contact: ${order.ghl_contact_id}`);
      });
    } else {
      console.log("✓ No hay pedidos sincronizados con GoHighLevel");
    }

    console.log("\n" + "═".repeat(120));
    console.log("✅ Diagnóstico completado\n");

    return {
      total: totalCount,
      active: activeCount,
      orders: orders || [],
      statusCount,
      ghlCount: ghlOrders?.length || 0,
    };
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error.message);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
diagnoseOrders().catch(console.error);
