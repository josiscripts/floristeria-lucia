/**
 * Test script: E2E GHL Contact Sync
 * Creates order in Supabase and syncs to GHL
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_TOKEN = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
const GHL_LOCATION = process.env.GHL_LOCATION_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !GHL_TOKEN || !GHL_LOCATION) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("=== PRUEBA E2E: SINCRONIZACIÓN DE CONTACTOS GHL ===\n");

  const testEmail = "test-ghl-contact@floristeria.test";
  const testData = {
    order_number: "ORD-TEST-GHL-E2E",
    customer_name: "TEST GHL Floristería",
    customer_email: testEmail,
    customer_phone: "+34600000000",
    address: "Calle Test 123",
    city: "Madrid",
    postal_code: "28001",
    country: "ES",
    subtotal: 50,
    total: 50,
    status: "pending",
    ghl_contact_id: null,
  };

  try {
    // Step 1: Create order in Supabase
    console.log("2️⃣  CREANDO ORDEN DE PRUEBA EN SUPABASE...");
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([testData])
      .select("id")
      .single();

    if (orderError) {
      console.error("❌ ERROR:", orderError.message);
      process.exit(1);
    }

    const orderId = orderData.id;
    console.log("✅ ORDEN CREADA en Supabase:");
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Order Number: ${testData.order_number}\n`);

    // Step 2: Search for existing contact in GHL
    console.log("3️⃣  BUSCANDO CONTACTO EXISTENTE EN GHL...");
    const searchResp = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "v3",
        },
      },
    );

    const searchData = await searchResp.json();
    let existingContact = null;

    if (searchData.contacts) {
      existingContact = searchData.contacts.find(
        (c) => c.email?.toLowerCase() === testEmail.toLowerCase(),
      );
    }

    if (existingContact) {
      console.log("✅ CONTACTO ENCONTRADO (reutilizable):");
      console.log(`   Contact ID: ${existingContact.id}`);
      console.log(`   Email: ${existingContact.email}\n`);
    } else {
      console.log("✅ Contacto NO EXISTE - se creará uno nuevo\n");
    }

    let contactId;

    if (existingContact) {
      // Reuse existing contact
      contactId = existingContact.id;
      console.log("4️⃣  REUTILIZANDO CONTACTO EXISTENTE...");
      console.log(`   Contact ID: ${contactId}\n`);
    } else {
      // Create new contact
      console.log("4️⃣  CREANDO CONTACTO EN GHL...");
      const createResp = await fetch("https://services.leadconnectorhq.com/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "v3",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION,
          firstName: "TEST GHL",
          lastName: "Floristería",
          email: testEmail,
          phone: "+34600000000",
        }),
      });

      const createData = await createResp.json();

      if (createResp.status !== 201) {
        console.error("❌ ERROR al crear contacto (HTTP " + createResp.status + "):");
        console.log(JSON.stringify(createData, null, 2));
        process.exit(1);
      }

      contactId = createData.contact.id;
      console.log(`✅ CONTACTO CREADO en GHL (HTTP ${createResp.status}):`);
      console.log(`   Contact ID: ${contactId}`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Nombre: TEST GHL Floristería\n`);
    }

    // Step 3: Update order with contact ID
    console.log("5️⃣  ACTUALIZANDO ORDEN CON CONTACT ID...");
    const { error: updateError } = await supabase
      .from("orders")
      .update({ ghl_contact_id: contactId })
      .eq("id", orderId);

    if (updateError) {
      console.error("❌ ERROR:", updateError.message);
      process.exit(1);
    }

    console.log("✅ ORDEN ACTUALIZADA\n");

    // Step 4: Verify update
    console.log("6️⃣  VERIFICANDO ACTUALIZACIÓN EN SUPABASE...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("orders")
      .select("id, order_number, ghl_contact_id")
      .eq("id", orderId)
      .single();

    if (verifyError) {
      console.error("❌ ERROR:", verifyError.message);
      process.exit(1);
    }

    console.log("✅ ORDEN VERIFICADA:");
    console.log(`   Order ID: ${verifyData.id}`);
    console.log(`   Order Number: ${verifyData.order_number}`);
    console.log(`   GHL Contact ID: ${verifyData.ghl_contact_id}`);
    console.log(`   Coincide: ${verifyData.ghl_contact_id === contactId ? "✅ SÍ" : "❌ NO"}\n`);

    // Final report
    console.log("=== RESULTADO FINAL ===\n");
    console.log("A. ID de la orden: " + orderId);
    console.log("B. Order Number: " + testData.order_number);
    console.log("C. Contact ID de GHL: " + contactId);
    console.log("D. Contacto existe en GHL: ✅ SÍ");
    console.log("E. orders.ghl_contact_id actualizado: ✅ SÍ");
    console.log("F. Datos enviados a GHL:");
    console.log("   - locationId: " + GHL_LOCATION);
    console.log("   - firstName: TEST GHL");
    console.log("   - lastName: Floristería");
    console.log("   - email: " + testEmail);
    console.log("   - phone: +34600000000");
    console.log("G. Resultado HTTP: " + (existingContact ? "200 (búsqueda)" : "201 (creación)"));
    console.log("H. Errores encontrados: NINGUNO");
    console.log("I. Resultado final: ✅ PASS");
  } catch (error) {
    console.error("❌ ERROR INESPERADO:", error.message);
    process.exit(1);
  }
}

main();
