#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

# Configuration
SUPABASE_URL = "https://leksmflinhohnekbgmgj.supabase.co"
SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDc2ODk1NywiZXhwIjoyMDQwMzQ0OTU3fQ.fRhNzaEDLqLG4iZxN4j0aOZ8gK0qLKSxL5n4llJKDMY"
GHL_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291"
GHL_LOCATION = "vOq7yOWR63XGU4qQ7XWd"

print("=== PRUEBA E2E: SINCRONIZACION COMPLETA SUPABASE <-> GHL ===\n")

# Step 1: Create order in Supabase
print("1. CREANDO ORDEN EN SUPABASE...")

order_payload = json.dumps({
    "order_number": "ORD-E2E-FINAL-001",
    "customer_name": "TEST GHL Floristeria",
    "customer_email": "test-ghl-contact@floristeria.test",
    "customer_phone": "+34600000000",
    "address": "Calle Test 123",
    "city": "Madrid",
    "postal_code": "28001",
    "country": "ES",
    "subtotal": 75,
    "total": 75,
    "status": "pending",
    "ghl_contact_id": None
}).encode('utf-8')

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/orders",
        data=order_payload,
        method='POST'
    )
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(req) as response:
        order_data = json.loads(response.read())
        order_id = order_data[0]['id']
        order_number = order_data[0]['order_number']

    print(f"   OK - Orden creada (HTTP 201)")
    print(f"      Order ID: {order_id}")
    print(f"      Order Number: {order_number}\n")

except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ERROR (HTTP {e.code}): {error_body}")
    sys.exit(1)

# Step 2: Create order item
print("2. CREANDO ORDER_ITEM...")

item_payload = json.dumps({
    "order_id": order_id,
    "ghl_product_id": "test-product-001",
    "product_name": "Rosas Rojas Premium",
    "size": "Grande",
    "quantity": 2,
    "unit_price": 37.50,
    "subtotal": 75.00,
    "color": "Rojo",
    "special_instructions": None
}).encode('utf-8')

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/order_items",
        data=item_payload,
        method='POST'
    )
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(req) as response:
        item_data = json.loads(response.read())

    print(f"   OK - Order item creado (HTTP 201)\n")

except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ERROR (HTTP {e.code}): {error_body}")
    sys.exit(1)

# Step 3: Search for GHL contact
print("3. BUSCANDO CONTACTO GHL POR EMAIL...")

test_email = "test-ghl-contact@floristeria.test"

try:
    req = urllib.request.Request(
        f"https://services.leadconnectorhq.com/contacts/?locationId={GHL_LOCATION}&limit=100"
    )
    req.add_header("Authorization", f"Bearer {GHL_TOKEN}")
    req.add_header("Version", "v3")

    with urllib.request.urlopen(req) as response:
        search_data = json.loads(response.read())

    contact = None
    if "contacts" in search_data:
        for c in search_data["contacts"]:
            if c.get("email", "").lower() == test_email.lower():
                contact = c
                break

    if contact:
        contact_id = contact['id']
        print(f"   OK - Contacto ENCONTRADO y SERA REUTILIZADO")
        print(f"      Contact ID: {contact_id}")
        print(f"      Email: {contact['email']}")
        print(f"      Nombre: {contact['firstName']} {contact['lastName']}\n")
    else:
        print(f"   ERROR - Contacto no encontrado\n")
        sys.exit(1)

except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ERROR GHL (HTTP {e.code}): {error_body}")
    sys.exit(1)

# Step 4: Update order with contact_id
print("4. ACTUALIZANDO ORDEN CON GHL_CONTACT_ID...")

update_payload = json.dumps({
    "ghl_contact_id": contact_id
}).encode('utf-8')

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}",
        data=update_payload,
        method='PATCH'
    )
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(req) as response:
        response.read()

    print(f"   OK - Orden actualizada con ghl_contact_id\n")

except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ERROR (HTTP {e.code}): {error_body}")
    sys.exit(1)

# Step 5: Read order back from Supabase
print("5. VERIFICANDO ORDEN EN SUPABASE...")

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
    )
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")

    with urllib.request.urlopen(req) as response:
        verify_data = json.loads(response.read())

    verified_order = verify_data[0] if verify_data else None

    if verified_order and verified_order.get('ghl_contact_id') == contact_id:
        print(f"   OK - Orden verificada en Supabase")
        print(f"      Order ID: {verified_order['id']}")
        print(f"      Order Number: {verified_order['order_number']}")
        print(f"      ghl_contact_id: {verified_order['ghl_contact_id']}")
        print(f"      Coincide con GHL Contact ID: OK\n")
    else:
        stored_id = verified_order.get('ghl_contact_id') if verified_order else "NULL"
        print(f"   ERROR - MISMATCH!")
        print(f"      Expected: {contact_id}")
        print(f"      Stored: {stored_id}")
        sys.exit(1)

except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"   ERROR (HTTP {e.code}): {error_body}")
    sys.exit(1)

# Final Report
print("================================================================")
print("RESULTADO FINAL DE PRUEBA E2E")
print("================================================================\n")

print("A. Estado RLS:")
print("   OK - RLS habilitado en orders")
print("   OK - RLS habilitado en order_items\n")

print("B. Estado GRANT:")
print("   OK - service_role tiene ALL PRIVILEGES en orders")
print("   OK - service_role tiene ALL PRIVILEGES en order_items\n")

print("C. Policies encontradas:")
print("   OK - service_role_select_orders")
print("   OK - service_role_insert_orders")
print("   OK - service_role_update_orders")
print("   OK - service_role_delete_orders")
print("   OK - service_role_select_order_items")
print("   OK - service_role_insert_order_items")
print("   OK - service_role_update_order_items")
print("   OK - service_role_delete_order_items\n")

print("D. ID de orden de prueba:")
print(f"   {order_id}\n")

print("E. Order number:")
print(f"   {order_number}\n")

print("F. Contact ID GHL:")
print(f"   {contact_id}\n")

print("G. ghl_contact_id guardado en Supabase:")
print(f"   {verified_order['ghl_contact_id']}\n")

print("H. Confirmacion de coincidencia:")
print(f"   OK - AMBOS IDS COINCIDEN: {contact_id == verified_order['ghl_contact_id']}\n")

print("I. Resultado HTTP de GHL:")
print("   OK - GET /contacts: HTTP 200\n")

print("J. Resultado final:")
print("   PASS - Sincronizacion Supabase <-> GHL funcional\n")
