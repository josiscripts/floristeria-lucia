# AUDITORÍA TÉCNICA: INTEGRACIÓN GOHIGHLEVEL

**Fecha:** 2026-08-28
**Propósito:** Evaluar integración GHL existente antes de implementar sincronización de órdenes
**Alcance:** Productos, Contactos, Opportunities, Pipelines, Custom Fields, Webhooks

---

## 1. INTEGRACIÓN GHL ACTUAL

### 1.1 Ubicación del Código

```
src/lib/ghl/
├── client.server.ts       (Cliente API principal)
└── types.ts               (Tipos TypeScript)

src/routes/
├── api.ghl.products.ts         (GET /api/ghl/products)
├── api.ghl.products.[id].ts    (GET /api/ghl/products/:id)
└── api.webhooks.ghl-product.ts (POST /api/webhooks/ghl-product)

src/lib/
├── normalize-ghl-product.ts    (Normaliza GHL → Frontend)
└── product-metadata.server.ts  (Sync metadata GHL ↔ Supabase)

src/hooks/
└── useGHLProducts.ts      (Hook cliente para productos)
```

### 1.2 Variables de Entorno Configuradas

```
GHL_PRIVATE_INTEGRATION_TOKEN = "pit-0cf65f40-51a4-4e28-9793-9eb8421e2291"
GHL_LOCATION_ID            = "vOq7yOWR63XGU4qQ7XWd"
GHL_API_BASE               = "https://services.leadconnectorhq.com"
GHL_API_VERSION            = "v3"
GHL_TIMEOUT                = 10000ms
```

### 1.3 Funciones GHL Implementadas (client.server.ts)

#### READ Operations (4 funciones)

```
✅ getGHLProducts(locationId?, options?)
   - Endpoint: GET /products/?locationId=X&limit=Y&skip=Z
   - Retorna: {products[], total, pageSize, currentPage}
   - Usado por: /api/ghl/products, catalogo.tsx

✅ getGHLProduct(productId, locationId?)
   - Endpoint: GET /products/?id=X&locationId=Y
   - Retorna: GHLProduct | GHLError
   - Usado por: /api/ghl/products/[id]

✅ testGHLConnection()
   - Endpoint: GET /products/?limit=1
   - Retorna: {connected: bool, message, error?}
   - Usado por: /api/ghl/products?action=test

✅ getGHLToken()
   - Lee env: GHL_PRIVATE_INTEGRATION_TOKEN
   - Validación: Throws si no configurado
   - Seguridad: ✅ Server-side only
```

#### WRITE Operations (3 funciones)

```
✅ createGHLProduct(productData, locationId?)
   - Método: POST /products
   - Body: {name, description?, price?, category?, image?, sku?, status?, ...custom}
   - Retorna: GHLProduct | GHLError
   - Usado por: /api/products (POST)

✅ updateGHLProduct(productId, productData, locationId?)
   - Método: PUT /products/:id
   - Body: {name?, description?, price?, ...}
   - Retorna: GHLProduct | GHLError
   - Nota: No implementado en endpoints aún

✅ deleteGHLProduct(productId, locationId?)
   - Método: PUT /products/:id
   - Implementación: Soft delete (status: "inactive")
   - Retorna: GHLProduct | GHLError
   - Nota: No implementado en endpoints aún
```

#### Utilidad (1 función)

```
🔧 ghlFetch<T>(endpoint, options?)
   - Wrapper para todas las llamadas API
   - Headers: Authorization, Content-Type, Version
   - Timeout: 10 segundos
   - Error handling: Convierte HTTP errors → GHLError
```

### 1.4 Tipos Definidos (types.ts)

**Implementados:**

```typescript
✅ GHLProduct
   - id, name, description, price, cost, image, images[], sku, category, status, inventory
   - [key: string]: unknown  (Custom fields)

✅ GHLProductsResponse
   - products[], total, pageSize, currentPage

✅ GHLError
   - message, code?, statusCode?
```

**NO Implementados:**

```typescript
❌ GHLContact          (Necesario para sincronización de órdenes)
❌ GHLOpportunity      (Necesario para pipeline de pedidos)
❌ GHLCustomField      (Necesario para datos personalizados)
❌ GHLPipeline         (Necesario para estados de pedidos)
❌ GHLWebhookEvent     (Necesario para webhooks bidireccionales)
```

### 1.5 Endpoints API Existentes

#### Lectura (Productos)

```
GET /api/ghl/products?action=test
   - Verifica conectividad con GHL
   - Response: {connected, message, error?}

GET /api/ghl/products?limit=10&skip=0
   - Lista productos normalizados (GHL + Supabase metadata)
   - Response: {products[], total, pageSize, currentPage}

GET /api/ghl/products/[id]
   - Obtiene un producto con metadata
   - Response: {id, name, priceMin, priceMax, ...normalized}
```

#### Escritura (Productos)

```
POST /api/products
   - Crear producto en GHL + Supabase metadata
   - Body: {name, description?, price?, category?, ...}
   - Response: {success, product, metadata}
```

#### Webhooks

```
POST /api/webhooks/ghl-product
   - Recibe: {event: "product.created|updated|deleted", data: GHLProduct, timestamp?}
   - Acciones:
     * product.created/updated → syncProductMetadata()
     * product.deleted → deleteProductMetadata()
   - Validación: TODO (signature verification not implemented)
   - Idempotencia: ✅ Usa ghl_product_id como unique constraint
```

### 1.6 Sincronización de Metadata (product_metadata table)

**Schema Supabase:**

```sql
product_metadata
├── id (UUID, primary)
├── ghl_product_id (VARCHAR, unique FK → GHL)
├── legacy_catalog_id (VARCHAR, nullable)
├── price_max (NUMERIC, nullable)
├── available_colors (JSON array, nullable)
├── badge_label (VARCHAR, nullable)
├── rose_step (INTEGER, nullable)
├── requires_quote (BOOLEAN, default false)
├── status (VARCHAR, default 'active')
├── auto_created (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP, nullable, soft delete)
```

**Flujo Actual:**

```
GHL Product
    ↓
/api/ghl/products (GET)
    ↓
Supabase product_metadata (SYNC via syncProductMetadata)
    ↓
normalize-ghl-product.ts (Combina GHL + Supabase)
    ↓
Frontend Product
```

**Funciones Disponibles:**

```
✅ syncProductMetadata(input)       - Create or update
✅ deleteProductMetadata(ghlId)     - Soft delete
✅ getProductMetadata(ghlId)        - Single record
✅ getProductMetadataByIds(ids[])   - Batch lookup (optimizado)
```

---

## 2. INTEGRACIÓN DE ÓRDENES: ESTADO ACTUAL

### 2.1 Base de Datos (Supabase)

**Tabla: orders (19 campos)**

```
✅ id (UUID)                    - Primary key
✅ order_number (VARCHAR)       - Unique, formato: ORD-YYYYMMDD-XXXXX
✅ customer_name                - Requerido
✅ customer_email               - Requerido
✅ customer_phone               - Requerido
✅ ghl_contact_id (nullable)    - FK a GHL, **PARA SINCRONIZAR**
✅ address, city, postal_code, country
✅ subtotal, total (NUMERIC)
✅ delivery_date (DATE, nullable)
✅ dedicatory, notes (TEXT, nullable)
✅ status (VARCHAR)             - pending, confirmed, preparing, ready, delivered, cancelled
✅ created_at, updated_at, deleted_at
```

**Tabla: order_items (12 campos)**

```
✅ id, order_id (FK)            - Primary key + Foreign key
✅ ghl_product_id              - Referencia a producto en GHL
✅ product_name, size, quantity
✅ unit_price, subtotal (NUMERIC)
✅ color, special_instructions (nullable)
✅ created_at, updated_at
```

### 2.2 Backend de Órdenes

**Funciones Implementadas:**

```
✅ createOrder(request: CreateOrderRequest)
   Ubicación: src/lib/orders.server.ts
   - Valida customer data (email regex, required fields)
   - Valida cart lines (qty > 0, price > 0)
   - Genera order_number: ORD-YYYYMMDD-XXXXX
   - INSERT orders → Supabase
   - Batch INSERT order_items → Supabase
   - Retorna: {success, orderId, orderNumber, total}
   - Nota: ghl_contact_id se deja NULL (sin sincronización aún)
```

**Endpoints:**

```
✅ POST /api/orders
   - Valida estructura de request
   - Llama createOrder()
   - Response 201: {success, orderId, orderNumber, total}
   - Response 400/500: {success: false, error}

✅ GET /api/confirmation?orderId=X
   - Fetch order + order_items desde Supabase
   - Response: {order: OrderRow, items: OrderItemRow[]}
```

### 2.3 Frontend de Órdenes

```
✅ /checkout
   - Formulario customer data + resumen carrito
   - POST /api/orders
   - Redirect a /confirmation/$orderId

✅ /confirmation/$orderId
   - Loader fetcha /api/confirmation?orderId=X
   - Renderiza order data completa
   - Botón "Volver al catálogo"
```

---

## 3. RESPUESTAS A PREGUNTAS CLAVE

### A. ¿Podemos crear/actualizar contactos de GHL desde nuestro backend?

**Respuesta: ❌ NO IMPLEMENTADO**

```
Estado:
  - Función: ❌ NO existe (createGHLContact, updateGHLContact)
  - Tipos: ❌ NO existe GHLContact type
  - Endpoint: ❌ NO existe /api/ghl/contacts
  - Test: ❌ NO hay test de GHL Contacts API

Requerimientos para implementar:
  1. Función createGHLContact() en client.server.ts
  2. Función updateGHLContact() en client.server.ts
  3. Tipos: GHLContact, GHLContactInput, GHLContactResponse
  4. Endpoint: POST /api/ghl/contacts (internal only)
  5. Llamar desde createOrder() cuando se crea orden

API GHL v3 Reference:
  - POST /contacts                    (Create)
  - PUT /contacts/:id                 (Update)
  - GET /contacts/:id                 (Get by ID)
  - GET /contacts?email=X             (Search by email)
```

### B. ¿Podemos crear una Opportunity en GHL asociada al contacto cuando se crea una orden?

**Respuesta: ❌ NO IMPLEMENTADO**

```
Estado:
  - Función: ❌ NO existe (createGHLOpportunity)
  - Tipos: ❌ NO existe GHLOpportunity type
  - Endpoint: ❌ NO existe /api/ghl/opportunities
  - Pipeline: ❌ NO hay pipeline configurado para órdenes

Requerimientos:
  1. Función createGHLOpportunity() en client.server.ts
  2. Tipos: GHLOpportunity, GHLOpportunityInput
  3. Definir pipelineId para órdenes (en .env)
  4. Mapear estados orden → Pipeline stages
  5. Llamar desde createOrder() DESPUÉS de crear contacto

API GHL v3 Reference:
  - POST /opportunities              (Create)
  - PUT /opportunities/:id           (Update)
  - GET /opportunities/:id           (Get by ID)

Requerimiento previo:
  - ghl_contact_id debe estar poblado (ver punto A)
```

### C. ¿Podemos utilizar un Pipeline de GHL para representar el estado del pedido?

**Respuesta: ⚠️ POSIBLE PERO REQUIERE CONFIGURACIÓN**

```
Problema:
  - Los pipelines en GHL deben ser definidos MANUALMENTE en interfaz GHL
  - El application debe conocer pipelineId
  - Las stages están definidas en GHL, no en código

Solución Recomendada:

1. Crear Pipeline en GHL manualmente:
   Nombre: "Pedidos Floristería Lucia"
   Stages:
   ├── RECIBIDO           (id: stage_1)
   ├── PREPARANDO         (id: stage_2)
   ├── LISTO              (id: stage_3)
   ├── EN REPARTO         (id: stage_4)
   ├── ENTREGADO          (id: stage_5)
   └── CANCELADO          (id: stage_6)

2. Guardar pipelineId en .env:
   GHL_ORDER_PIPELINE_ID = "xxx"

3. Mapeo automático:
   Supabase order.status → GHL opportunity.pipelineStageId
   pending      → RECIBIDO
   preparing    → PREPARANDO
   ready        → LISTO
   in_delivery  → EN REPARTO
   delivered    → ENTREGADO
   cancelled    → CANCELADO

4. Sincronización:
   - Crear opportunity en Pipeline cuando createOrder()
   - Actualizar stage cuando order.status cambia
   - Leer actualizaciones de GHL vía webhook
```

### D. ¿Podemos guardar en GHL datos personalizados del pedido?

**Respuesta: ✅ SÍ, VIA CUSTOM FIELDS**

```
GHL soporta Custom Fields en Opportunities y Contacts

Datos a guardar en GHL Custom Fields:
  - numero_pedido        → order_number (ORD-YYYYMMDD-XXXXX)
  - total                → order.total (DECIMAL)
  - fecha_entrega        → order.delivery_date (DATE)
  - direccion            → order.address (STRING)
  - dedicatoria          → order.dedicatory (TEXT)
  - productos            → JSON array of order_items
  - order_id_supabase    → order.id (UUID) para bidi sync

Requerimientos:
  1. Definir Custom Fields en GHL (manualmente o via API)
  2. Obtener customFieldId para cada campo
  3. Guardar mapping en .env o Supabase config table
  4. Enviar valores cuando createGHLOpportunity()

API GHL:
  - Custom Fields son enviados en POST /opportunities como
    {customFields: [{fieldId: "x", value: "y"}]}

Ventaja:
  ✅ GHL se convierte en fuente de verdad para dashboard
  ✅ Datos visibles en CRM sin configuración manual
  ✅ Automatizaciones GHL pueden reaccionar a datos
```

### E. ¿Podemos consultar posteriormente esos pedidos desde GHL?

**Respuesta: ✅ SÍ**

```
Opciones:

1. Dashboard GHL:
   ✅ Ver Opportunities (órdenes como opportunities)
   ✅ Filtrar por Pipeline Stage (estado del pedido)
   ✅ Ver custom fields (total, dirección, etc.)
   ✅ Búsqueda por contacto (customer_name)

2. API GHL:
   GET /opportunities?pipelineId=X         (Listar órdenes)
   GET /opportunities/:id                  (Detalle orden)
   GET /opportunities?contactId=Y          (Órdenes de cliente)
   GET /contacts/:id/opportunities         (Órdenes de contacto)

3. Búsqueda avanzada:
   - Por email cliente
   - Por teléfono cliente
   - Por fecha de entrega
   - Por estado (stage del pipeline)

Ventaja:
  ✅ Gestión completa de órdenes desde GHL UI
  ✅ Reportes de ventas/conversión
  ✅ Integraciones con otras herramientas GHL
  ✅ Automatizaciones basadas en datos de orden
```

### F. ¿Qué parte debe permanecer obligatoriamente en Supabase?

**Respuesta: TODO, pero sincronizado con GHL**

```
Datos que DEBEN estar en Supabase:

✅ orders
   - Source of Truth para: order_number, creación, itemization
   - Razón: Garantiza integridad referencial con order_items
   - Sync bidireccional: ↔ GHL opportunity status/stages

✅ order_items
   - NUNCA puede moverse a GHL (es relacional con order)
   - Razón: GHL no soporta líneas anidadas en opportunities
   - Sync unidireccional: → GHL custom field JSON array

✅ ghl_contact_id
   - Campo en orders para vincular → GHL contact
   - NUNCA replicar contacto info a GHL (usar contactId FK)
   - Sincronización: ← GHL cuando cambia contacto

✅ Metadata local:
   - product_metadata: Datos extendidos no en GHL
   - Configuración: Custom field mappings

Datos que PUEDEN replicarse a GHL:

↔ opportunity (sincronización activa)
   ├─ status order → stage opportunity
   ├─ custom fields (total, dirección, etc.)
   └─ contact_id para relación

Estrategia de Sincronización:

Supabase = Database Principal (CRUD source of truth)
GHL = Dashboard + Automatizaciones

Flujo unidireccional (generalmente):
  WEB → Checkout
    ↓
  Supabase: INSERT orders + order_items
    ↓
  GHL: CREATE contact + opportunity (custom fields)
    ↓
  GHL Dashboard: Visible para gestión
    ↓
  GHL API: Webhooks si status cambia
    ↓
  Supabase: UPDATE order.status

```

---

## 4. ARQUITECTURA RECOMENDADA

### 4.1 Flujo Completo: WEB → SUPABASE → GHL

```
┌─────────────────────────────────────────────────────────┐
│ CLIENTE WEB (Frontend)                                  │
│ - /checkout: Formulario + carrito                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ POST /api/orders
                     │ {customer_*, cartLines}
                     ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND: src/routes/api.orders.ts                       │
│ - Valida request                                        │
│ - Llama createOrder()                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ SUPABASE: createOrder() [src/lib/orders.server.ts]      │
│ ✅ INSERT orders (order_number, customer_*, totals)     │
│ ✅ INSERT order_items (ghl_product_id, qty, price)      │
│ ℹ️ ghl_contact_id = NULL (será sincronizado después)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ [NUEVO] Llamar:
                     │ 1. createGHLContact(order data)
                     │ 2. updateOrder(ghl_contact_id)
                     ↓
┌─────────────────────────────────────────────────────────┐
│ GHL: Contact Management                                 │
│ - Crear/actualizar contacto con email + phone           │
│ - Retorna: ghl_contact_id                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ [NUEVO] Llamar:
                     │ createGHLOpportunity()
                     │ {contact_id, pipeline, stages, custom_fields}
                     ↓
┌─────────────────────────────────────────────────────────┐
│ GHL: Opportunity + Pipeline                             │
│ - Crear opportunity con datos de orden                  │
│ - Custom fields: total, dirección, dedicatoria, items   │
│ - Status/Stage = RECIBIDO (pending)                     │
│ - Retorna: ghl_opportunity_id                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ [NUEVO] Actualizar Supabase:
                     │ UPDATE orders SET
                     │   ghl_contact_id = X,
                     │   ghl_opportunity_id = Y
                     │ WHERE id = order_id
                     ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENTE WEB: /confirmation/$orderId                     │
│ - Loader: GET /api/confirmation                         │
│ - Renderiza orden completamente                         │
│ - Datos desde Supabase (source of truth)                │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Sincronización de Estado (Orden Updates)

```
Caso 1: Cambio de estado en Supabase
────────────────────────────────────

Supabase UPDATE: order.status = "preparing"
         ↓
Dashboard/Admin (interfaz no implementada aún)
         ↓
🔄 Sincronización necesaria:
   UPDATE GHL opportunity
   SET pipelineStageId = "stage_2"  (PREPARANDO)
   WHERE customFields[order_id_supabase] = X
         ↓
GHL Dashboard actualizado automáticamente
         ↓
✅ Webhook: GHL puede notificar cambio (env automático)


Caso 2: Cambio de estado en GHL Dashboard
──────────────────────────────────────────

GHL Dashboard: usuario mueve opportunity a stage "LISTO"
         ↓
🔔 Webhook: POST /api/webhooks/ghl-opportunity
   {event: "opportunity.updated", data: {id, pipelineStageId}}
         ↓
Backend: Mapea GHL stage → Supabase status
   "stage_3" (LISTO) → "ready"
         ↓
UPDATE orders SET status = "ready" WHERE id = X
         ↓
Supabase → Frontend → /confirmation actualizado
```

### 4.3 Schema de Custom Fields en GHL

**Definición (debe hacerse manualmente en GHL UI o via API setup):**

```json
{
  "customFields": [
    {
      "fieldId": "cf_order_number",
      "label": "Número Pedido",
      "type": "text",
      "value": "ORD-20260828-ABC12"
    },
    {
      "fieldId": "cf_order_id",
      "label": "ID Supabase",
      "type": "text",
      "value": "517f2b5b-4a10-4cd4-a15c-7e28c6af46fd"
    },
    {
      "fieldId": "cf_order_total",
      "label": "Total Pedido",
      "type": "numeric",
      "value": 80.5
    },
    {
      "fieldId": "cf_delivery_date",
      "label": "Fecha Entrega",
      "type": "date",
      "value": "2026-08-30"
    },
    {
      "fieldId": "cf_delivery_address",
      "label": "Dirección Entrega",
      "type": "text",
      "value": "Dirección Test 123, Madrid 28001"
    },
    {
      "fieldId": "cf_dedicatory",
      "label": "Dedicatoria",
      "type": "longtext",
      "value": "Para ti, con cariño"
    },
    {
      "fieldId": "cf_items",
      "label": "Productos",
      "type": "json",
      "value": [
        { "product": "Ramo Rosas", "qty": 1, "price": 45.0 },
        { "product": "Cesta Plantas", "qty": 2, "price": 35.5 }
      ]
    }
  ]
}
```

---

## 5. FASES DE IMPLEMENTACIÓN RECOMENDADAS

### Phase 1: Infraestructura GHL (Preparación)

**Tiempo estimado: 1-2 horas (manual + config)**

```
1.1 Crear Pipeline en GHL UI:
    - Nombre: "Pedidos Floristería Lucia"
    - Stages: RECIBIDO, PREPARANDO, LISTO, EN REPARTO, ENTREGADO, CANCELADO
    - Obtener: pipelineId

1.2 Definir Custom Fields:
    - Via GHL UI o API setup
    - Campos: order_number, order_id, total, address, dedicatory, items
    - Obtener: fieldIds para mapping

1.3 Actualizar .env:
    GHL_ORDER_PIPELINE_ID="xxx"
    GHL_STAGE_RECEIVED="stage_1"
    GHL_STAGE_PREPARING="stage_2"
    GHL_STAGE_READY="stage_3"
    GHL_STAGE_DELIVERY="stage_4"
    GHL_STAGE_DELIVERED="stage_5"
    GHL_STAGE_CANCELLED="stage_6"
    GHL_CF_ORDER_NUMBER="cf_order_number"
    GHL_CF_ORDER_ID="cf_order_id"
    ... (rest of custom fields)
```

### Phase 2: Backend - Contactos (Implementación)

**Tiempo estimado: 3-4 horas**

```
2.1 Tipos TypeScript:
    - src/lib/ghl/types.ts: Agregar GHLContact, GHLContactInput

2.2 Funciones Cliente:
    - src/lib/ghl/client.server.ts:
      * createGHLContact(data)
      * updateGHLContact(contactId, data)
      * getGHLContactByEmail(email)

2.3 Integración con Orders:
    - src/lib/orders.server.ts:
      * Después de INSERT orders, crear GHL Contact
      * Guardar ghl_contact_id en orders table

2.4 Error Handling:
    - Si contacto ya existe: usar GET + UPDATE
    - Si falla creación: log error, continuar (no bloquear orden)

2.5 Tests:
    - Unit test: createGHLContact con datos válidos
    - Unit test: updateGHLContact si contacto existe
```

### Phase 3: Backend - Opportunities (Implementación)

**Tiempo estimado: 4-5 horas**

```
3.1 Tipos TypeScript:
    - src/lib/ghl/types.ts: GHLOpportunity, GHLOpportunityInput

3.2 Funciones Cliente:
    - src/lib/ghl/client.server.ts:
      * createGHLOpportunity(data)
      * updateGHLOpportunity(opportunityId, data)
      * updateGHLOpportunityStage(opportunityId, stageId)

3.3 Mapeo de Estados:
    - src/lib/ghl/order-stage-mapping.ts (nuevo):
      * supabaseStatusToGHLStage(status)
      * ghlStageToSupabaseStatus(stageId)

3.4 Integración con Orders:
    - src/lib/orders.server.ts:
      * Después de crear contacto, crear Opportunity
      * Incluir custom fields con datos de orden
      * Guardar ghl_opportunity_id en orders

3.5 Supabase Schema Update:
    - Agregar columna: ghl_opportunity_id (VARCHAR, nullable)

3.6 Tests:
    - Crear opportunity con custom fields
    - Mapeo de estados bidireccional
```

### Phase 4: Webhooks - Order Updates (Implementación)

**Tiempo estimado: 3-4 horas**

```
4.1 Webhook Endpoint:
    - src/routes/api.webhooks.ghl-opportunity.ts (nuevo):
      * POST /api/webhooks/ghl-opportunity
      * Recibe: {event, data: {id, pipelineStageId, ...}}
      * Acciones: Mapear stage → status, UPDATE orders

4.2 Registro Webhook en GHL:
    - URL: https://floristeria-lucia.com/api/webhooks/ghl-opportunity
    - Eventos: opportunity.updated (stage changes)

4.3 Signature Verification:
    - GHL envía X-GHL-Signature header
    - Validar contra GHL_WEBHOOK_SECRET
    - Seguridad: ✅ Verificar antes de procesar

4.4 Idempotencia:
    - Guardar webhook event_id para evitar duplicados
    - Nueva tabla: webhook_events {id, ghl_event_id, processed_at}

4.5 Tests:
    - Simular webhook stage change
    - Verificar ORDER actualizado correctamente
```

### Phase 5: Dashboard GHL + Frontend Updates (Configuración)

**Tiempo estimado: 2-3 horas**

```
5.1 GHL Dashboard:
    - Personalizar vista de opportunities
    - Mostrar campos custom en tarjetas
    - Crear reportes de órdenes

5.2 Frontend - Confirmation Page:
    - [OPCIONAL] Mostrar ghl_opportunity_id
    - [OPCIONAL] Link directo a GHL opportunity
    - Estado sincronizado desde Supabase

5.3 [FUTURO] Admin Dashboard:
    - Listar órdenes
    - Cambiar status (que sincronice a GHL)
    - Ver detalles completos

5.4 [FUTURO] Email Notifications:
    - SendGrid: Confirmación pedido
    - Notificación cambio estado
```

### Phase 6: Verification & Sync Testing (Validación)

**Tiempo estimado: 2-3 horas**

```
6.1 End-to-End Test:
    - Crear orden via WEB
    - Verificar contacto creado en GHL
    - Verificar opportunity en GHL
    - Verificar custom fields poblados

6.2 Webhook Test:
    - Cambiar stage en GHL UI
    - Verificar order.status actualizado en Supabase
    - Verificar frontend refleja cambio

6.3 Sync Bidireccional:
    - Cambiar status en Supabase
    - Verificar stage en GHL (requiere admin interface, Phase 5)
    - Cambiar en GHL, verificar en Supabase

6.4 Error Scenarios:
    - Email duplicado (contacto existente)
    - Opportunity duplicado
    - Webhook duplicado (idempotencia)
    - Fallo red GHL (timeout/retry)
```

---

## 6. RESUMEN: RESPUESTAS A PREGUNTAS

### A. Crear/actualizar contactos GHL ✅ SÍ (Implementar Phase 2)

- Usar: GET /contacts?email= + POST/PUT /contacts
- Desde: createOrder() → syncGHLContact()
- Almacenar: ghl_contact_id en orders.ghl_contact_id

### B. Crear Opportunity asociado a contacto ✅ SÍ (Implementar Phase 3)

- Usar: POST /opportunities con contactId + pipelineId
- Custom fields: order_number, total, address, items
- Almacenar: ghl_opportunity_id en orders

### C. Pipeline para estado pedido ✅ SÍ (Setup Phase 1 + Impl Phase 3/4)

- Crear manualmente: Pipeline con 6 stages
- Mapeo: pending→RECIBIDO, preparing→PREPARANDO, etc.
- Sync bidireccional: updateStage() + Webhook

### D. Custom Fields para datos pedido ✅ SÍ (Phase 1 + Phase 3)

- Definir en GHL: order_number, total, address, dedicatory, items
- Poblar en: createGHLOpportunity() con valores
- Actualizar en: updateGHLOpportunity()

### E. Consultar pedidos desde GHL ✅ SÍ (Dashboard GHL + API)

- GHL UI: Ver opportunities con filtros
- API: GET /opportunities?pipelineId=X
- Búsqueda: Por email, teléfono, fecha entrega

### F. Datos en Supabase ✅ SIEMPRE (Sync bidireccional)

- Source of Truth: orders + order_items
- Sincronizado: ghl_contact_id, ghl_opportunity_id
- Webhooks: Actualizar status cuando GHL cambia

---

## 7. RECOMENDACIONES FINALES

### ✅ Recomendado Hacer

```
1. Implementar por fases (no todo de golpe)
2. Empezar por Phase 2 (Contactos) - es la base
3. Hacer tests en sandbox GHL primero
4. Validar webhook signature (seguridad)
5. Implementar idempotencia (evitar duplicados)
6. Loguear todos los eventos de sincronización
7. Crear monitoring para sincronización GHL
```

### ⚠️ Cuidados Importantes

```
1. NO perder datos de Supabase (es source of truth)
2. Manejar errores sin bloquear orden creation
3. Implementar retry logic para fallos de GHL API
4. Validar integridad referencial (ghl_contact_id → GHL)
5. Evitar loops infinitos webhook
6. Testear límites de rate GHL API
7. No exponer GHL tokens al client
```

### 🚀 Stack Recomendado

```
- Framework: TanStack Start ✅ (ya en uso)
- DB: Supabase + PostgreSQL ✅ (ya en uso)
- GHL API: v3 ✅ (verificado)
- Auth: Service role token server-side ✅ (verificado)
- Logging: Console + Sentry (opcional)
- Testing: Jest + Mock GHL API
```

---

**Auditoría completada:** 2026-08-28
**Estado:** LISTO PARA IMPLEMENTACIÓN (Phase 1-2)
**Siguiente paso:** Crear Plan de Implementación detallado
