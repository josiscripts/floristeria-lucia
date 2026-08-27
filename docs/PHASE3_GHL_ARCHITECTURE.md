# FASE 3: GHL INTEGRATION ARCHITECTURE

**Proyecto:** Floristería Lucía  
**Fecha:** 2026-08-27  
**Status:** DESIGN ONLY - NO IMPLEMENTATION YET  

---

## 📋 TABLE OF CONTENTS

1. Estado actual
2. Código GHL existente
3. Mapeo de datos
4. Arquitectura propuesta
5. Flujo de sincronización
6. Diseño del webhook
7. Estrategia de polling
8. Migración inicial
9. Seguridad
10. Manejo de errores
11. Idempotencia
12. Categorías e imágenes
13. Plan de pruebas
14. Archivos a crear/modificar
15. Orden de implementación
16. Checklist

---

## 1. ESTADO ACTUAL

### Catálogo Local (catalog.ts)

**Total de productos:** 41

| Categoría | Count |
|-----------|-------|
| complementos | 13 |
| plantas | 13 |
| ramos | 6 |
| rosas-eternas | 4 |
| condolencias | 5 |

### Campos utilizados en catalog.ts

```typescript
type Product = {
  id: string;                    // "ramo-silvestre"
  name: string;                  // "Ramo Silvestre"
  category: CategoryId;          // "ramos"
  priceMin: number;              // 30
  priceMax?: number;             // 45
  image: string;                 // asset path
  description: string;           // HTML description
  badge?: string;                // "Más vendido", "Premium"
  quoteOnly?: boolean;           // FALSE (0 productos)
  roseStep?: number;             // 6 (4 productos)
  colors?: string[];             // array (5 productos)
};
```

### Estadísticas

| Campo | Productos | Status |
|-------|-----------|--------|
| id | 41/41 | ✅ Universal |
| name | 41/41 | ✅ Universal |
| category | 41/41 | ✅ Universal |
| priceMin | 41/41 | ✅ Universal |
| priceMax | 17/41 | ⚠️ Parcial |
| image | 41/41 | ✅ Universal |
| description | 41/41 | ✅ Universal |
| badge | 3/41 | 🔴 Raro ("Más vendido", "Premium", "7-10 años") |
| quoteOnly | 0/41 | ⏸️ No usado |
| roseStep | 4/41 | 🔴 Muy raro |
| colors | 5/41 | 🔴 Raro |

---

## 2. CÓDIGO GHL EXISTENTE

### 2.1 GHL Client Library

**Location:** `src/lib/ghl/client.server.ts`

#### Función: getGHLProducts()

```typescript
export async function getGHLProducts(
  locationId?: string,
  options?: { limit?: number; skip?: number; filter?: Record<string, unknown> }
): Promise<GHLProductsResponse | GHLError>
```

| Aspect | Value |
|--------|-------|
| **Endpoint** | `/locations/{locationId}/products` |
| **Method** | GET |
| **Auth** | Bearer token from GHL_PRIVATE_INTEGRATION_TOKEN |
| **Parameters** | limit, skip, filter (status) |
| **Response** | GHLProductsResponse (products[], total, pageSize, currentPage) |
| **Error Handling** | Returns GHLError object |
| **Timeout** | 10 seconds |

#### Función: getGHLProduct()

```typescript
export async function getGHLProduct(
  productId: string,
  locationId?: string
): Promise<GHLProduct | GHLError>
```

| Aspect | Value |
|--------|-------|
| **Endpoint** | `/locations/{locationId}/products/{productId}` |
| **Method** | GET |
| **Auth** | Bearer token |
| **Response** | GHLProduct |
| **Error Handling** | Returns GHLError object |

#### Función: testGHLConnection()

```typescript
export async function testGHLConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}>
```

| Aspect | Value |
|--------|-------|
| **Endpoint** | `/contacts?limit=1` |
| **Method** | GET |
| **Purpose** | Health check, validate token |
| **Response** | {connected: boolean, message: string} |

### 2.2 Type Definitions

**Location:** `src/lib/ghl/types.ts`

```typescript
export type GHLProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  image?: string;
  images?: string[];
  sku?: string;
  category?: string;
  status?: "active" | "inactive";
  inventory?: number;
  [key: string]: unknown; // Custom fields allowed
};

export type GHLProductsResponse = {
  products: GHLProduct[];
  total: number;
  pageSize: number;
  currentPage: number;
};
```

### 2.3 API Endpoint

**Location:** `src/routes/api.ghl.products.ts`

```typescript
GET /api/ghl/products
  Query params:
    - action: "test" | undefined
    - locationId: string (optional)
    - limit: number (default: 100)
    - skip: number (default: 0)

  Returns:
    - action=test → {connected: boolean, message: string}
    - else → GHLProductsResponse or GHLError

  Error handling:
    - 503 if connection test fails
    - 500 on server error
    - 200 on success
```

### 2.4 React Query Hooks

**Location:** `src/hooks/useGHLProducts.ts`

```typescript
// Hook 1: Fetch products
useGHLProducts(options)
  - Calls: /api/ghl/products
  - Cache: staleTime=5min, gcTime=10min
  - Retry: 1

// Hook 2: Test connection
useGHLConnectionTest(options)
  - Calls: /api/ghl/products?action=test
  - Cache: staleTime=1min, gcTime=5min
  - Retry: 1
```

---

## 3. MAPEO DE DATOS

### 3.1 Tabla de Campos

| Field | GHL | catalog.ts | product_metadata | Frontend | Transform |
|-------|-----|-----------|------------------|----------|-----------|
| **id** | ✅ id | ✅ id | ❌ ghl_product_id | ✅ display | GHL ID as identifier |
| **name** | ✅ name | ✅ name | ❌ - | ✅ display | Direct |
| **description** | ✅ description | ✅ description | ❌ - | ✅ display | Direct |
| **price** | ✅ price | ✅ priceMin | ❌ price_min | ✅ display | Use priceMin from GHL |
| **priceMax** | ❌ - | ✅ priceMax | ✅ price_max | ✅ display | Store in product_metadata |
| **image** | ✅ image | ✅ image | ❌ - | ✅ display | Direct |
| **images** | ✅ images | ❌ - | ❌ - | ✅ display | TBD |
| **category** | ❌ NO CUSTOM FIELDS | ✅ category | ❌ - | ✅ filter | Need solution |
| **badge** | ❌ - | ✅ badge (3) | ✅ badge_label | ✅ display | Store in product_metadata |
| **colors** | ❌ - | ✅ colors (5) | ✅ available_colors | ✅ display | Store in product_metadata |
| **roseStep** | ❌ - | ✅ roseStep (4) | ✅ rose_step | ✅ quantity | Store in product_metadata |
| **quoteOnly** | ❌ - | ❌ (0) | ✅ requires_quote | ✅ UI | Store in product_metadata |
| **sku** | ✅ sku | ❌ - | ❌ - | ❌ - | TBD |
| **status** | ✅ status | ❌ - | ✅ status | ✅ visibility | Use GHL status |
| **inventory** | ✅ inventory | ❌ - | ❌ - | ❌ - | TBD |
| **legacy_catalog_id** | ❌ - | ✅ id | ✅ legacy_catalog_id | ❌ - | Map catalog.ts id |

### 3.2 Problemas Identificados

#### 🔴 CRITICAL: Category

**Problem:** GHL Products API does NOT support custom fields.

**Current state:**
- catalog.ts has category field (ramos, plantas, etc.)
- GHL Products have category field but it's a STRING, not a normalized list
- How to maintain category filtering/organization?

**Options (decide before implementation):**
1. Store category in GHL's category field as string
2. Create separate categories table in Supabase
3. Use a mapping file (legacy_catalog_id → category)

**Recommendation:** Use option 3 (mapping) temporarily, plan proper categorization.

#### 🟡 WARNING: Images

**Problem:** catalog.ts uses local image assets. GHL uses URLs.

**Questions:**
- Are images already uploaded to GHL?
- How to handle image migrations?
- Who manages image uploads going forward?

**Recommendation:** Verify GHL image status before migration.

#### 🟡 WARNING: Price Reconciliation

**Problem:** catalog.ts has priceMin and priceMax. GHL has single price.

**What to do:**
- priceMin → store in GHL price
- priceMax → store in product_metadata
- Frontend displays both

#### 🔴 CRITICAL: Missing Fields

**quoteOnly, roseStep, colors, badge** are in product_metadata but NOT referenced in GHL.

**Decision:** These are display/business logic only, OK to store in Supabase.

---

## 4. ARQUITECTURA PROPUESTA

### 4.1 Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      GOHIGHLEVEL                               │
│                 (Source of Truth)                              │
│                                                                │
│  Product: {id, name, description, price, image, status}      │
└────────────┬─────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
WEBHOOK          POLLING
(Primary)        (Fallback)
    │                 │
    └────────┬────────┘
             │
    ┌────────▼──────────────┐
    │  src/lib/ghl/sync.ts  │
    │  (Sync Service)       │
    └────────┬──────────────┘
             │
    ┌────────▼────────────────────────┐
    │  Sync Operations:                │
    │  ├─ insertProduct()              │
    │  ├─ updateProduct()              │
    │  ├─ deleteProduct() [soft]       │
    │  └─ reconcileProducts()          │
    └────────┬────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │     public.product_metadata           │
    │     (15 columns)                      │
    │                                       │
    │  ├─ ghl_product_id [PK from GHL]      │
    │  ├─ legacy_catalog_id [from catalog]  │
    │  ├─ price_min, price_max              │
    │  ├─ available_colors []               │
    │  ├─ badge_label                       │
    │  ├─ rose_step                         │
    │  ├─ requires_quote                    │
    │  ├─ status [soft delete]              │
    │  └─ timestamps                        │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────┐
    │  RLS Policies:        │
    │  SELECT: anon/auth    │
    │  (only status=active) │
    │  WRITE: service_role  │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────┐
    │         Frontend                  │
    │  ProductCard Component            │
    │                                   │
    │  Data sources:                    │
    │  ├─ GHL (name, price, desc)      │
    │  └─ product_metadata (colors...) │
    └───────────────────────────────────┘
```

### 4.2 Three Sync Scenarios

#### Scenario A: Initial Sync (catalog.ts → GHL → Supabase)

```
Phase 1: Verify GHL state
  - Check if 41 products already exist in GHL
  - If YES: Go to Phase 2
  - If NO: Decide migration strategy

Phase 2: Sync GHL → product_metadata
  - GET /locations/{locationId}/products?limit=100&skip=0
  - For each GHL product:
    INSERT INTO product_metadata:
      ghl_product_id = product.id
      legacy_catalog_id = find matching in catalog.ts
      status = active
      auto_created = true
      [other fields = null for now]

Phase 3: Enrich with catalog.ts metadata
  - For each matched product (ghl_product_id):
    UPDATE product_metadata:
      price_max = catalog.priceMax
      available_colors = catalog.colors
      badge_label = catalog.badge
      rose_step = catalog.roseStep
      legacy_catalog_id = catalog.id

Phase 4: Handle unmatched products
  - Products in GHL but not in catalog.ts → Decide manually
  - Products in catalog.ts but not in GHL → Decide strategy
```

#### Scenario B: Product Created in GHL

```
Event: New product created in GHL
  ↓
Webhook triggered (GHL → /api/webhooks/ghl)
  ├─ Verify signature
  ├─ Parse payload: {action: "product.created", product: {...}}
  ├─ Validate schema
  └─ Idempotence check
       ├─ SELECT COUNT(*) WHERE ghl_product_id = X
       ├─ If exists → Return 200 (already processed)
       └─ If not exists → Continue
             ↓
             INSERT into product_metadata
             ├─ ghl_product_id = product.id
             ├─ status = 'active'
             ├─ auto_created = true
             ├─ legacy_catalog_id = NULL (no legacy data)
             └─ all other fields = NULL
                  ↓
                  Frontend refetch
                  ├─ useGHLProducts() invalidate
                  └─ Display new product
```

#### Scenario C: Product Updated in GHL

```
Event: Product updated in GHL (e.g., price, name)
  ↓
Webhook triggered (product.updated)
  ├─ Verify signature
  ├─ Get ghl_product_id from payload
  └─ Idempotence check: Last-Modified-At
       ├─ SELECT updated_at FROM product_metadata
       ├─ If webhook.timestamp <= product_metadata.updated_at
       │   └─ Return 200 (duplicate, ignore)
       └─ If webhook.timestamp > product_metadata.updated_at
             ↓
             UPDATE product_metadata
             ├─ status = product.status (from GHL)
             └─ Trigger auto-updates updated_at
                  ↓
                  Frontend refetch
```

#### Scenario D: Product Deleted in GHL

```
Event: Product status = 'inactive' in GHL
  ↓
Webhook triggered (product.updated)
  ├─ Check status change to 'inactive'
  └─ Soft delete in product_metadata
       ↓
       UPDATE product_metadata
       ├─ status = 'deleted'
       ├─ deleted_at = NOW()
       └─ Trigger updates updated_at
            ↓
            RLS filters it out
            (SELECT ... WHERE status = 'active')
            ↓
            Frontend doesn't see it
```

---

## 5. FLUJO DE SINCRONIZACIÓN

### 5.1 Webhook Flow (Primary)

```
GHL Dashboard
  └─ User creates/edits product
       └─ GHL API triggers webhook
            └─ POST /api/webhooks/ghl
                 ├─ Extract signature from headers
                 ├─ Verify HMAC(payload, GHL_WEBHOOK_SECRET)
                 ├─ Parse JSON body
                 ├─ Validate schema against event type
                 ├─ Check idempotence (ghl_product_id)
                 └─ Route by event type:
                      ├─ product.created → insertProduct()
                      ├─ product.updated → updateProduct()
                      └─ [product.deleted] → deleteProduct() [soft]
                           └─ Process in transaction
                                ├─ Load current state
                                ├─ Check conflicts
                                ├─ Apply update
                                ├─ Update timestamps
                                └─ Return 200
                                     ↓
                                     Client logs event
```

### 5.2 Polling Flow (Fallback)

```
Cron job (every 15 minutes)
  └─ Execute syncGHLToSupabase()
       ├─ Load cursor (lastSyncedAt)
       ├─ GET /products?updatedSince={lastSyncedAt}
       ├─ For each returned product:
       │   ├─ Check if exists in product_metadata
       │   ├─ If new: INSERT
       │   ├─ If changed: UPDATE
       │   └─ Track in sync log
       └─ Update cursor
            ├─ Save lastSyncedAt = NOW()
            └─ Log results (inserted, updated, errors)
```

---

## 6. DISEÑO DEL WEBHOOK

### 6.1 Endpoint Specification

```
POST /api/webhooks/ghl

Headers:
  Content-Type: application/json
  X-GHL-Signature: sha256=<HMAC signature>
  X-GHL-Timestamp: <unix timestamp>

Body:
{
  "action": "product.created|product.updated|product.deleted",
  "event": {
    "product": {
      "id": "ghl_product_id",
      "name": "Product Name",
      "description": "...",
      "price": 50,
      "image": "https://...",
      "status": "active|inactive",
      "updatedAt": "2026-08-27T12:00:00Z"
    }
  },
  "timestamp": 1725203034
}

Response:
  200 OK: {"status": "processed", "id": "ghl_product_id"}
  409 CONFLICT: {"status": "duplicate", "id": "ghl_product_id"}
  400 BAD REQUEST: {"error": "Invalid signature"}
  500 ERROR: {"error": "Internal server error"}
```

### 6.2 Validation

```
Function: validateWebhookSignature()
  Input: payload (raw body), signature (from header), secret (from env)
  Process:
    1. Compute: calculated_sig = HMAC256(payload, GHL_WEBHOOK_SECRET)
    2. Compare: timing-safe comparison with header signature
    3. Check timestamp: within 5 minutes of now
  Return: true|false

Function: validatePayloadSchema()
  Input: parsed JSON body
  Process:
    1. Check required fields: action, event, event.product, product.id
    2. Validate action enum
    3. Validate product object structure
    4. Validate data types
  Return: {valid: true|false, errors: [...]}
```

### 6.3 Idempotence Strategy

```
Webhook may be delivered multiple times.
Ensure single processing per event.

Strategy: Event deduplication
  1. Before processing: Check if ghl_product_id exists
  2. For INSERT: 
     - SELECT count(*) WHERE ghl_product_id = X AND auto_created = true
     - If > 0: Return 200 (already processed)
  3. For UPDATE:
     - SELECT updated_at FROM product_metadata WHERE ghl_product_id = X
     - Compare with event.timestamp
     - If event.timestamp <= db.updated_at: Return 200 (stale event)
  4. For DELETE:
     - SELECT status FROM product_metadata
     - If status = 'deleted': Return 200 (already deleted)

Database:
  - Add unique constraint on (ghl_product_id, location_id) ✅ EXISTS
  - Add index on ghl_product_id ✅ EXISTS
  - Add unique index on (ghl_product_id, updated_at) for dedup
```

---

## 7. ESTRATEGIA DE POLLING

### 7.1 Polling Schedule

```
Trigger: Cron job
  Frequency: Every 15 minutes
  Timezone: Server local or UTC

Purpose:
  - Catch webhooks that failed/were lost
  - Detect products modified outside webhook flow
  - Periodic reconciliation
```

### 7.2 Polling Algorithm

```
Function: pollGHLProducts()
  
  1. Load state
     ├─ SELECT MAX(updated_at) FROM product_metadata as lastSync
     └─ If null: Use 24 hours ago (don't refetch all on first run)

  2. Fetch changes
     ├─ GET /locations/{locationId}/products?limit=100&skip=0
     ├─ Filter by: product.updatedAt > lastSync
     └─ Paginate through all results

  3. Reconcile each product
     FOR EACH ghlProduct:
       ├─ SELECT * FROM product_metadata WHERE ghl_product_id = X
       ├─ IF not exists:
       │   └─ INSERT new record
       ├─ ELSE IF product.updatedAt > db.updated_at:
       │   └─ UPDATE record (but preserve manual edits)
       └─ IF product.status = 'inactive' AND db.status != 'deleted':
           └─ Mark as deleted (soft delete)

  4. Log results
     ├─ Count: inserted, updated, deleted
     ├─ Errors: any failures
     └─ Save: lastSync = NOW()

  5. Alert on issues
     ├─ If > 10 updates in one run: log warning
     └─ If any errors: log and alert
```

---

## 8. MIGRACIÓN INICIAL

### 8.1 Pre-Migration Questions

**Before starting migration, answer:**

1. **Are products already in GHL?**
   - If YES: Which 41 products from catalog.ts?
   - If NO: Do we create them first?

2. **Image status:**
   - Are images uploaded to GHL?
   - Or still local assets only?

3. **Category representation:**
   - How should categories be stored in GHL?
   - Custom field? Subcategory? Mapping file?

4. **Timeline:**
   - Migrate before or after launch?
   - Do it gradually or all at once?

### 8.2 Migration Procedure (High Level)

```
IF products not in GHL:
  └─ Create products in GHL first (manual or script)
       ├─ For each catalog.ts product:
       │   ├─ Extract name, description, price, image
       │   ├─ POST /locations/{locationId}/products
       │   ├─ Get ghl_product_id from response
       │   └─ Save mapping in temp file
       └─ Review: correct products created?

THEN:
  └─ Sync GHL → product_metadata
       ├─ Fetch all products from GHL
       ├─ For each GHL product:
       │   ├─ Find matching catalog.ts product (by name or mapping)
       │   ├─ INSERT INTO product_metadata:
       │   │   ├─ ghl_product_id = GHL id
       │   │   ├─ legacy_catalog_id = catalog.ts id
       │   │   ├─ price_max = catalog.priceMax
       │   │   ├─ available_colors = catalog.colors
       │   │   ├─ badge_label = catalog.badge
       │   │   ├─ rose_step = catalog.roseStep
       │   │   └─ auto_created = false
       │   └─ Validate insert succeeded
       └─ Verify: 41 products in product_metadata?

FINALLY:
  └─ Frontend update
       ├─ Switch from catalog.ts to product_metadata + GHL
       └─ Test all display works
```

### 8.3 Migration Rollback

If migration fails:
```
1. Stop webhook processing
2. Truncate product_metadata (DELETE all)
3. Revert frontend to catalog.ts only
4. Investigate issues
5. Retry
```

---

## 9. SEGURIDAD

### 9.1 Token Management

**GHL_PRIVATE_INTEGRATION_TOKEN:**
- ✅ Stored in .env (server-side only)
- ✅ Never in VITE_ prefixed variables
- ✅ Only used in src/lib/ghl/client.server.ts
- ✅ Never sent to frontend
- ✅ Used only for server-side API calls

**Risk Check:**
```
❌ NOT in .env.example? YES (only placeholder)
❌ NOT in any frontend imports? YES
❌ NOT in any API responses? YES
❌ NOT logged anywhere? YES
✅ Protected from exposure? YES
```

### 9.2 RLS Protection

**product_metadata RLS:**
```
READ (SELECT):
  ├─ anon: WHERE status = 'active' (via policy)
  └─ authenticated: WHERE status = 'active' (via policy)

WRITE (INSERT/UPDATE/DELETE):
  └─ service_role ONLY (via policy)
     ├─ Webhook processing uses service_role
     └─ Frontend CANNOT write

Risk:
  ❌ Frontend cannot insert fake products
  ❌ Frontend cannot modify prices
  ❌ Frontend cannot delete products
  ✅ RLS enforces server-side writes only
```

### 9.3 Webhook Security

**Signature Verification:**
```
1. HMAC256 signature required
   ├─ GHL sends: X-GHL-Signature header
   ├─ We verify: HMAC(body, GHL_WEBHOOK_SECRET)
   └─ Reject: unsigned requests

2. Timestamp validation
   ├─ Accept: within 5 minutes of now
   └─ Reject: old/future timestamps (replay attack protection)

3. Idempotence
   ├─ Duplicate webhooks processed once
   └─ No double-inserts/updates
```

---

## 10. MANEJO DE ERRORES

### 10.1 Sync Errors

```
SCENARIO: Webhook fails to insert product_metadata

Behavior:
  1. Try INSERT
  2. On unique constraint violation:
     ├─ Log: "Product exists, checking for update"
     └─ Try UPDATE instead
  3. On other DB error:
     ├─ Log error with details
     ├─ Return 500
     └─ GHL may retry (ideal)
  4. On validation error:
     ├─ Log: "Invalid product data"
     ├─ Return 400
     └─ Manual review needed

Recovery:
  ├─ Check product_metadata status
  ├─ Check webhook logs
  └─ Manual INSERT/UPDATE if needed
```

### 10.2 API Timeouts

```
GHL API calls have 10-second timeout.

If timeout:
  1. Return error to caller
  2. For webhook: Return 503 (retry)
  3. For polling: Log and retry next cycle
  4. For frontend: Show "Unable to load products"
```

### 10.3 Database Errors

```
If product_metadata INSERT fails:

1. Constraint violation (unique):
   └─ Try UPDATE (product already exists)

2. Foreign key error:
   └─ Should not happen (no FKs in product_metadata)

3. Other DB error:
   ├─ Log with full context
   ├─ Return 500
   └─ Alert ops team
```

---

## 11. IDEMPOTENCIA

### 11.1 Webhook Idempotence

**Problem:** Webhook may be delivered multiple times.

**Solution:** Event deduplication

```
For product.created:
  1. Before INSERT
  2. Check: SELECT COUNT(*) WHERE ghl_product_id = X
  3. If > 0: Return 200 (already processed)
  4. Else: INSERT and return 200

For product.updated:
  1. Before UPDATE
  2. Check: SELECT updated_at WHERE ghl_product_id = X
  3. If event.timestamp <= db.updated_at: Return 200 (stale)
  4. Else: UPDATE and return 200

For product.deleted:
  1. Before soft-delete
  2. Check: SELECT status WHERE ghl_product_id = X
  3. If status = 'deleted': Return 200 (already deleted)
  4. Else: UPDATE to deleted and return 200
```

### 11.2 Polling Idempotence

**Problem:** Polling may run while webhook is processing.

**Solution:** Timestamp-based conflict detection

```
Polling sees product updated_at = 2026-08-27 14:00:00
Webhook just processed updated_at = 2026-08-27 14:00:01

If polling timestamp < webhook timestamp:
  ├─ Polling skips (let webhook win)
  └─ Or both update (same data, OK if idempotent)

If webhook timestamp < polling timestamp:
  ├─ Polling updates (webhook was stale)
  └─ OK (updates are idempotent)
```

---

## 12. CATEGORÍAS E IMÁGENES

### 12.1 Categorías

**Problem:** catalog.ts has categories. GHL Products API doesn't support custom fields.

**Current Solutions:**

#### Option 1: Store in GHL category field
```
GHL: {category: "ramos"}
Supabase: product_metadata (not needed)
Frontend: Parse from GHL

Pros: Simple, single source
Cons: GHL field might be for different purpose
Risk: May lose other GHL categorizations
```

#### Option 2: Separate Supabase table
```
Table: product_categories
  ├─ ghl_product_id (FK)
  └─ category_id (FK to categories table)

Pros: Flexible, supports multiple categories
Cons: Extra queries, more complexity
Risk: Sync complexity

Recommended for now? NO - too complex before MVP
```

#### Option 3: Mapping file (RECOMMENDED)
```
File: src/data/ghl_category_mapping.json

{
  "ramo-silvestre": "ramos",
  "ramo-felicidad": "ramos",
  ...
}

Frontend logic:
  ├─ Load GHL product
  ├─ Get ghl_product_id
  ├─ Look up in mapping file
  └─ Use for filtering/display

Pros: No schema changes, simple
Cons: Manual maintenance needed
Risk: Mapping gets out of sync

Status: Use this for MVP, decide later
```

### 12.2 Imágenes

**Problem:** catalog.ts uses local assets. GHL uses URLs.

**Current state:**

```
catalog.ts:
  └─ image: imgRamos (imported from @/assets/)

Question: Are these images in GHL?
  └─ If YES: Use GHL URLs
  └─ If NO: Keep local assets until migrated

Frontend strategy:
  └─ Try GHL image first
  └─ Fallback to local if not available
  └─ Or: Migrate images to GHL first, then use only URLs
```

**Recommendation for MVP:**
```
1. Keep local images for now
2. When GHL products available: Use GHL image if present
3. Plan image migration for Phase 2
```

---

## 13. PLAN DE PRUEBAS

### 13.1 Unit Tests

```
Files to create:
  ├─ src/lib/ghl/sync.test.ts
  │   ├─ Test insertProduct()
  │   ├─ Test updateProduct()
  │   ├─ Test deleteProduct() [soft]
  │   └─ Test reconcileProducts()
  │
  ├─ src/lib/ghl/webhook.test.ts
  │   ├─ Test signature verification
  │   ├─ Test idempotence check
  │   ├─ Test schema validation
  │   └─ Test error handling
  │
  └─ src/routes/api.webhooks.ghl.test.ts
      ├─ Test 200 on valid webhook
      ├─ Test 400 on invalid signature
      ├─ Test 409 on duplicate
      └─ Test 500 on DB error
```

### 13.2 Integration Tests

```
Tests:
  1. Create product in GHL → appears in product_metadata
  2. Edit product in GHL → updates in product_metadata
  3. Delete product in GHL → marked deleted
  4. Webhook + Polling: both sync correctly
  5. Idempotence: webhook twice = same result
  6. RLS: Frontend can't write to product_metadata
  7. RLS: Frontend reads only active products
```

### 13.3 End-to-End Tests

```
Tests:
  1. Full workflow: Create → Edit → Delete product
  2. Frontend: Display products with metadata
  3. Frontend: Filter by category
  4. Frontend: Show colors, badges, rose steps
  5. Concurrent: Webhook + Polling at same time
  6. Error recovery: DB error → retry works
  7. Performance: Sync 100+ products efficiently
```

### 13.4 Security Tests

```
Tests:
  1. Webhook: Invalid signature rejected
  2. Webhook: Unsigned requests rejected
  3. Token: Never logged
  4. Token: Never sent to frontend
  5. RLS: Frontend can't INSERT products
  6. RLS: Frontend can't UPDATE prices
  7. Replay attack: Old timestamps rejected
```

---

## 14. ARCHIVOS A CREAR

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/api.webhooks.ghl.ts` | Webhook endpoint | ~150 |
| `src/lib/ghl/sync.server.ts` | Sync logic | ~200 |
| `src/lib/ghl/webhook.server.ts` | Webhook utils | ~100 |
| `src/lib/ghl/polling.server.ts` | Polling logic | ~100 |
| `src/data/ghl_category_mapping.json` | Category mapping | 50 |
| `scripts/migrate-catalog-to-ghl.mjs` | One-time migration | ~150 |
| `scripts/sync-ghl-to-supabase.mjs` | One-time sync | ~150 |
| `src/routes/admin/products.tsx` | Admin UI | ~300 |
| `src/components/ProductMetadataForm.tsx` | Edit form | ~200 |
| `docs/GHL_WEBHOOK_SETUP.md` | Webhook instructions | 100 |
| `docs/GHL_MIGRATION_GUIDE.md` | Migration steps | 100 |

---

## 15. ARCHIVOS A MODIFICAR

| File | Changes | Impact |
|------|---------|--------|
| `src/lib/ghl/client.server.ts` | Add write operations: createGHLProduct(), updateGHLProduct() | createGHLProduct, updateGHLProduct functions |
| `src/routes/api.ghl.products.ts` | Add POST handler for sync trigger | Support POST requests |
| `src/hooks/useGHLProducts.ts` | Add mutation hooks: useSyncGHL(), useCreateProduct() | New hooks for mutations |
| `src/components/ProductCard.tsx` | Query product_metadata for metadata | Show colors, badge, rose_step |
| `src/routes/[category].tsx` | Combine GHL + product_metadata | Use both data sources |
| `.env` | Add GHL_WEBHOOK_SECRET | New environment variable |
| `.env.example` | Document webhook secret | Reference for setup |
| `supabase/migrations/...ts` | Add migration for unique index on ghl_product_id+updated_at | New index for dedup |

---

## 16. ORDEN EXACTO DE IMPLEMENTACIÓN

### Phase A: Core Infrastructure (Week 1)

```
1. ✅ Create src/lib/ghl/sync.server.ts
   └─ Implement: insertProduct, updateProduct, deleteProduct
   
2. ✅ Create src/lib/ghl/webhook.server.ts
   └─ Implement: validateSignature, validateSchema
   
3. ✅ Create src/routes/api.webhooks.ghl.ts
   └─ Implement: POST endpoint, route by event type
   
4. ✅ Test: Unit tests for sync and webhook
   
5. ✅ Add env var: GHL_WEBHOOK_SECRET
```

### Phase B: Polling (Week 1)

```
6. ✅ Create src/lib/ghl/polling.server.ts
   └─ Implement: pollGHLProducts cron job
   
7. ✅ Set up: Cron trigger (every 15 minutes)
   
8. ✅ Test: Polling + webhook together
```

### Phase C: Initial Migration (Week 1-2)

```
9. ✅ Create migration script: scripts/migrate-catalog-to-ghl.mjs
   └─ If products not in GHL: Create them first
   
10. ✅ Create sync script: scripts/sync-ghl-to-supabase.mjs
    └─ Sync GHL → product_metadata
    
11. ✅ Create mapping: src/data/ghl_category_mapping.json
    └─ Map GHL products to catalog categories
    
12. ✅ Run migration (ONCE, carefully)
    └─ Verify: 41 products in product_metadata
```

### Phase D: Frontend Integration (Week 2)

```
13. ✅ Modify src/components/ProductCard.tsx
    └─ Show metadata from product_metadata
    
14. ✅ Modify src/routes/[category].tsx
    └─ Use GHL products + product_metadata
    
15. ✅ Update useGHLProducts hook
    └─ Add cache invalidation on webhook
    
16. ✅ Create admin panel: src/routes/admin/products.tsx
    └─ CRUD for product_metadata
    
17. ✅ Test: End-to-end workflows
```

### Phase E: Hardening (Week 2-3)

```
18. ✅ Add integration tests
    └─ All sync scenarios
    
19. ✅ Add security tests
    └─ Token protection, RLS enforcement
    
20. ✅ Documentation
    └─ Webhook setup guide
    └─ Migration guide
    └─ Runbook
    
21. ✅ Staging: Deploy to staging
    └─ Full testing before production
    
22. ✅ Production: Gradual rollout
    └─ Monitor closely
```

---

## 17. PHASE 3 — IMPLEMENTATION CHECKLIST

### Core GHL Client

- ✅ getGHLProducts() exists
- ✅ getGHLProduct() exists
- ✅ testGHLConnection() exists
- ✅ Types defined
- ✅ API endpoint works
- ✅ React Query hooks exist

### Webhook Infrastructure

- 🔴 /api/webhooks/ghl.ts endpoint (CREATE)
- 🔴 validateWebhookSignature() (CREATE)
- 🔴 validatePayloadSchema() (CREATE)
- 🔴 Route by event type (CREATE)
- 🔴 Unit tests (CREATE)

### Sync Logic

- 🔴 insertProduct() function (CREATE)
- 🔴 updateProduct() function (CREATE)
- 🔴 deleteProduct() function (soft delete) (CREATE)
- 🔴 reconcileProducts() function (CREATE)
- 🔴 Unit tests (CREATE)

### Polling

- 🔴 pollGHLProducts() function (CREATE)
- 🔴 Cron job setup (CREATE)
- 🔴 Polling schedule configuration (CREATE)

### Frontend Integration

- 🟡 src/components/ProductCard.tsx (MODIFY)
- 🟡 src/routes/[category].tsx (MODIFY)
- 🟡 src/hooks/useGHLProducts.ts (MODIFY - add mutations)
- 🔴 src/routes/admin/products.tsx (CREATE)
- 🔴 src/components/ProductMetadataForm.tsx (CREATE)

### Migration

- 🔴 scripts/migrate-catalog-to-ghl.mjs (CREATE)
- 🔴 scripts/sync-ghl-to-supabase.mjs (CREATE)
- 🔴 src/data/ghl_category_mapping.json (CREATE)
- ⏳ Execute migration (REQUIRES DECISION)

### Database

- 🟡 supabase/migrations/...ts - add dedup index (MODIFY)

### Configuration

- 🟡 .env (MODIFY - add GHL_WEBHOOK_SECRET)
- 🟡 .env.example (MODIFY)

### Documentation

- 🔴 docs/GHL_WEBHOOK_SETUP.md (CREATE)
- 🔴 docs/GHL_MIGRATION_GUIDE.md (CREATE)
- 🔴 docs/GHL_IMPLEMENTATION_RUNBOOK.md (CREATE)

### Testing

- 🔴 Unit tests for sync, webhook (CREATE)
- 🔴 Integration tests (CREATE)
- 🔴 E2E tests (CREATE)
- 🔴 Security tests (CREATE)

---

## 📊 SUMMARY METRICS

| Aspect | Status | Effort | Risk |
|--------|--------|--------|------|
| Client library | ✅ Done | 0 | Low |
| Webhook | 🔴 Create | High | Medium |
| Sync logic | 🔴 Create | High | Medium |
| Polling | 🔴 Create | Medium | Low |
| Frontend | 🟡 Modify | Medium | Low |
| Migration | 🔴 Create | High | High |
| Testing | 🔴 Create | High | Medium |
| Documentation | 🔴 Create | Low | Low |

---

## 🎯 NEXT STEPS

1. **Review this document** with team
2. **Answer critical questions:**
   - Are products already in GHL?
   - How should categories be represented?
   - Where are images stored?
3. **Make architectural decisions**
4. **Approve implementation order**
5. **Begin PHASE 3 implementation** (Week 1)

---

**Status:** ✅ DESIGN COMPLETE - AWAITING APPROVAL FOR IMPLEMENTATION

**Date:** 2026-08-27

