# GHL INTEGRATION READINESS ANALYSIS

**Proyecto:** Floristería Lucía  
**Fecha:** 2026-08-27  
**Status:** READ-ONLY ANALYSIS - NO IMPLEMENTATION YET  

---

## 📊 EXECUTIVE SUMMARY

La infraestructura básica para integración con GoHighLevel está **PARCIALMENTE LISTA**. 

- ✅ Supabase product_metadata completada
- ✅ Código cliente GHL básico existe
- ✅ Infraestructura de configuración está
- ⚠️ Sincronización GHL ↔ Supabase NO IMPLEMENTADA
- ⚠️ Mapeo catalog.ts → GHL → product_metadata EN DISEÑO
- ⚠️ Webhook GHL NO CONFIGURADO
- ⚠️ Polling GHL NO IMPLEMENTADO
- ⚠️ Frontend NO MODIFICADO aún para usar product_metadata

---

## A. QUÉ ESTÁ COMPLETADO

### 1. Supabase Infrastructure
- ✅ `public.product_metadata` table (15 columns)
- ✅ RLS policies (4 policies, anon/authenticated/service_role)
- ✅ Triggers (auto-update timestamps)
- ✅ Indexes optimizados para queries
- ✅ Soft delete pattern (status='active'/'deleted')

### 2. GHL Client Library
- ✅ `src/lib/ghl/client.server.ts` - Server-side GHL API client
  - Función `getGHLProducts()` - Fetch all products
  - Función `getGHLProduct()` - Fetch single product
  - Función `testGHLConnection()` - Health check
  - Token management via process.env.GHL_PRIVATE_INTEGRATION_TOKEN
  - Never exposes token to frontend

### 3. GHL React Hooks
- ✅ `src/hooks/useGHLProducts.ts` - React Query hook
  - `useGHLProducts()` - Fetch products via server API
  - `useGHLConnectionTest()` - Test connectivity
  - Proper cache management (5min staleTime, 10min gcTime)

### 4. GHL API Route
- ✅ `src/routes/api.ghl.products.ts` - Express endpoint
  - Safe server-side API for frontend to call
  - Token never exposed to client
  - Query parameter validation

### 5. Type Definitions
- ✅ `src/lib/ghl/types.ts` - TypeScript types for GHL API responses

### 6. Configuration
- ✅ `.env` - Configured with:
  - GHL_PRIVATE_INTEGRATION_TOKEN (secret, server-only)
  - GHL_LOCATION_ID (vOq7yOWR63XGU4qQ7XWd)
  - SUPABASE_* variables pointing to leksmflinhohnekbgmgj
- ✅ `.env.example` - Updated with placeholders

### 7. Testing Infrastructure
- ✅ `scripts/test-ghl-connection.mjs` - Connection test script
- ✅ `scripts/verify-ghl-custom-fields.mjs` - Discovered custom fields limitation
- ✅ Debug page: `src/routes/debug.ghl-test.tsx` (development only)

### 8. Documentation
- ✅ `docs/GHL_ARCHITECTURE_ANALYSIS.md` - Architecture decisions
- ✅ `docs/GHL_ARCHITECTURE_SUMMARY.md` - Visual diagrams
- ✅ `docs/GHL_PRODUCT_MAPPING.md` - Field mapping analysis
- ✅ `docs/GHL_CATALOG_DESIGN.md` - 58 products analyzed
- ✅ `docs/GHL_CUSTOM_FIELDS_LIMITATION.md` - Why Supabase needed
- ✅ `docs/GHL_INTEGRATION_PROPOSAL.md` - 6-phase implementation plan

---

## B. CÓDIGO DE GHL EXISTENTE

### client.server.ts (src/lib/ghl/)
```typescript
// Token management
getGHLToken() - reads GHL_PRIVATE_INTEGRATION_TOKEN from process.env

// API communication
ghlFetch<T>() - helper for authenticated GHL API calls

// Product operations (READ-ONLY so far)
getGHLProducts(locationId?, options?) - fetch all products
getGHLProduct(productId, locationId?) - fetch single product

// Health check
testGHLConnection() - validate token and connectivity
```

**Status:** ✅ READY FOR USE (no modifications needed)

### useGHLProducts.ts (src/hooks/)
```typescript
// React Query hooks for frontend
useGHLProducts(options) - hook to fetch products from /api/ghl/products
useGHLConnectionTest(options) - hook to test GHL connection

// Caching strategy
staleTime: 5 minutes
gcTime: 10 minutes
retry: 1
```

**Status:** ✅ READY FOR USE (no modifications needed)

### api.ghl.products.ts (src/routes/)
```typescript
// Express route: GET /api/ghl/products?
// Parameters: action, locationId, limit, skip

// Handles:
action=test → testGHLConnection()
action=fetch → getGHLProducts()
Default → list products
```

**Status:** ✅ READY FOR USE (no modifications needed)

### types.ts (src/lib/ghl/)
```typescript
// GHLProduct, GHLProductsResponse, GHLError types
```

**Status:** ✅ COMPLETE (no modifications needed)

---

## C. QUÉ FALTA IMPLEMENTAR

### 1. Sincronización GHL ↔ Supabase

**Status:** ❌ NOT IMPLEMENTED

**What's needed:**
```
GHL Products API
        ↓
    Webhook (PRIMARY)
    + Polling (FALLBACK)
        ↓
src/routes/api.webhooks.ghl.ts (CREATE)
        ↓
src/lib/ghl/sync.server.ts (CREATE)
        ↓
    INSERT/UPDATE product_metadata
        ↓
RLS policies allow service_role
        ↓
Frontend reads from product_metadata
```

### 2. Webhook Configuration

**Status:** ❌ DESIGN ONLY (docs/GHL_ARCHITECTURE_VALIDATION.md)

**Requirements:**
- GHL dashboard: Configure webhook URL
- TBD: webhook endpoint (probably /api/webhooks/ghl)
- TBD: webhook secret for signature verification
- TBD: event types to listen (product.created, product.updated, product.deleted)

### 3. Polling Implementation

**Status:** ❌ NOT IMPLEMENTED

**Requirements:**
- Cron job to periodically fetch products
- Compare with product_metadata
- INSERT new, UPDATE changed, mark as deleted
- Fallback when webhook fails

### 4. Catalog.ts to GHL Mapping

**Status:** ⚠️ PARTIALLY ANALYZED (docs/GHL_CATALOG_DESIGN.md)

**Current catalog.ts structure:**
```
{
  id: "ramo-silvestre",                    // legacy_catalog_id in product_metadata
  name: "Ramo Silvestre",                  // name in GHL
  category: "ramos",                       // NO DIRECT GHL MAPPING
  priceMin: 30,                            // price_min in product_metadata
  priceMax: 45,                            // price_max in product_metadata
  image: "...",                            // image in GHL
  description: "...",                      // description in GHL
  badge?: "Más vendido",                   // badge_label in product_metadata
  quoteOnly?: false,                       // requires_quote in product_metadata
  roseStep?: 6,                            // rose_step in product_metadata
  colors?: ["Rojo", "Rosa", ...],          // available_colors in product_metadata
}
```

**Issues to resolve:**
- ❌ Category mapping: How to represent in GHL? (custom field? subcategory?)
- ❓ Image handling: Are images in GHL already or need to be imported?
- ❓ Historical products: Are these 58 products already in GHL or need creation?
- ⚠️ One-way or two-way sync? (GHL source of truth vs. catalog.ts)

### 5. Frontend Integration

**Status:** ❌ NOT MODIFIED

**Current state:**
- `src/components/ProductCard.tsx` - Uses catalog.ts directly
- `src/routes/[category].tsx` - Displays products from catalog.ts
- NO product_metadata queries

**What needs changing:**
- Components should fetch from `product_metadata` for metadata
- Components should fetch from GHL API for product data
- Combine data: GHL (name, price, description, image) + product_metadata (colors, badge, rose_step, quote_only)

### 6. Product Management UI

**Status:** ❌ NOT IMPLEMENTED

**Missing:**
- Admin panel to edit product_metadata
- Form to update price_max, available_colors, badge_label, rose_step
- Delete/soft-delete interface
- Bulk import of products from GHL

### 7. Data Migration

**Status:** ❌ NOT PLANNED

**Questions:**
- Should migrate catalog.ts products to GHL first, then sync back?
- Or create products in GHL separately and sync down?
- Timeline: Before or after going live?

---

## D. ARCHIVOS QUE HABRÍA QUE MODIFICAR

### Existing files to modify:

| File | Why | Changes Needed |
|------|-----|----------------|
| `src/lib/ghl/client.server.ts` | Add write operations | createGHLProduct(), updateGHLProduct(), deleteGHLProduct() |
| `src/routes/api.ghl.products.ts` | Add sync endpoint | POST /api/ghl/products (trigger sync) |
| `src/hooks/useGHLProducts.ts` | Add mutation hooks | useSyncGHLProducts(), useCreateProduct(), etc. |
| `src/components/ProductCard.tsx` | Use product_metadata | Query product_metadata for additional fields |
| `src/routes/[category].tsx` | Fetch from both sources | GHL for main data + product_metadata for metadata |
| `.env.example` | Document new vars | Add webhook secret, polling interval, etc. |

---

## E. ARCHIVOS QUE HABRÍA QUE CREAR

| File | Purpose |
|------|---------|
| `src/routes/api.webhooks.ghl.ts` | Webhook endpoint for GHL events |
| `src/lib/ghl/sync.server.ts` | Synchronization logic (insert/update/delete) |
| `src/lib/ghl/webhook.server.ts` | Webhook verification and parsing |
| `src/routes/admin/products.tsx` | Admin UI for managing product_metadata |
| `src/components/ProductMetadataForm.tsx` | Form for editing metadata |
| `scripts/migrate-catalog-to-ghl.mjs` | One-time migration of catalog.ts to GHL |
| `scripts/sync-ghl-to-supabase.mjs` | One-time sync of GHL to product_metadata |
| `docs/GHL_SYNC_FLOW.md` | Detailed sync algorithm documentation |
| `docs/GHL_WEBHOOK_SETUP.md` | Instructions for configuring GHL webhook |

---

## F. FLUJO DE SINCRONIZACIÓN (PROPUESTO)

```
┌─────────────────────────────────────────────────────────┐
│                     GHL PRODUCTS                         │
│         (source of truth for product data)               │
└──────────────────────┬──────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
     ┌──────▼────────┐    ┌──────▼────────┐
     │    WEBHOOK    │    │   POLLING     │
     │   (PRIMARY)   │    │  (FALLBACK)   │
     └──────┬────────┘    └──────┬────────┘
            │                     │
            └──────────┬──────────┘
                       │
          ┌────────────▼────────────┐
          │  /api/webhooks/ghl.ts   │
          │  /api/ghl/sync.ts       │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  product_metadata sync   │
          │  (INSERT/UPDATE/DELETE)  │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   public.product_metadata│
          │  (technical metadata)    │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  RLS: Read active only   │
          │  (anon/authenticated)    │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │      FRONTEND           │
          │  (Display products)      │
          └────────────────────────┘
```

---

## G. RELACIÓN catalog.ts → GHL → product_metadata → frontend

### Current state (catalog.ts only):
```
catalog.ts → ProductCard → Display
(58 products hardcoded)
```

### Future state (integrated):
```
PHASE 1: Migration
┌─────────────────────────────────────────┐
│ Option A: Existing products in GHL      │
│ (Client already created in GHL)         │
└────────────────────┬────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Sync GHL → Supabase  │
          │ (products_metadata)  │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Migrate catalog.ts   │
          │ metadata to table    │
          └──────────┬───────────┘

PHASE 2: Ongoing sync
┌─────────────────────────────────────────┐
│  Client edits in GHL Dashboard          │
└────────────────┬───────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
 WEBHOOK                   POLLING
    │                         │
    └────────────┬────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │ Sync: UPDATE         │
      │ product_metadata     │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │ Frontend refetch     │
      │ Shows updated data   │
      └──────────────────────┘

PHASE 3: Frontend displays
┌──────────────────────────────────────────┐
│ ProductCard component                    │
│ ├─ GHL data (name, price, description)  │
│ └─ product_metadata (colors, badge)     │
└──────────────────────────────────────────┘
```

---

## H. RIESGOS E INCONSISTENCIAS

### 1. Data Source Conflict
**Risk:** What if GHL data conflicts with product_metadata?
- GHL: name = "Ramo de Rosas", price = $50
- product_metadata: price_max = $45
**Solution:** GHL = source of truth for product data. product_metadata = metadata only.

### 2. Category Mapping
**Risk:** catalog.ts has categories (ramos, plantas, etc.). GHL may not.
**Question:** How to maintain category filtering if sync removes category info?
**Solution:** TBD - May need to add category as custom field or separate table.

### 3. Deleted Products
**Risk:** If product deleted in GHL, should we delete from product_metadata?
**Decision:** Use soft delete (status='deleted'). Preserves audit trail.

### 4. Concurrent Edits
**Risk:** Admin edits in GHL while webhook is syncing.
**Mitigation:** Use `updated_at` timestamps for conflict detection.

### 5. Webhook Verification
**Risk:** Webhook could be spoofed if not verified.
**Solution:** Implement HMAC signature verification (TBD).

### 6. Polling Overhead
**Risk:** Polling every N minutes could exceed API rate limits.
**Decision:** Keep polling as fallback only. Primary: webhook.

### 7. Historical Data
**Risk:** 58 products in catalog.ts. Are they already in GHL?
**Solution:** Verify before implementing sync.

### 8. Image Handling
**Risk:** Where are product images stored? GHL or local?
**Question:** Who manages image uploads?
**Solution:** TBD based on GHL configuration.

---

## I. PRUEBAS NECESARIAS ANTES DE PRODUCCIÓN

### Unit Tests
- [ ] GHL client methods (getGHLProducts, getGHLProduct)
- [ ] RLS policies (anon read, service_role write)
- [ ] Sync logic (insert, update, delete)
- [ ] Trigger function (updated_at)

### Integration Tests
- [ ] Webhook endpoint receives and processes events
- [ ] Polling syncs correctly
- [ ] Conflicts resolved properly
- [ ] Soft delete works

### End-to-End Tests
- [ ] Create product in GHL → appears in product_metadata
- [ ] Edit product in GHL → updates in product_metadata
- [ ] Delete product in GHL → marked as deleted in product_metadata
- [ ] Frontend displays product data correctly
- [ ] Color options display correctly
- [ ] Badge displays correctly
- [ ] Rose steps apply correctly

### Load Tests
- [ ] Sync performance with 100+ products
- [ ] Webhook queue handling
- [ ] Polling efficiency

### Security Tests
- [ ] Token never exposed to frontend
- [ ] RLS policies enforce access control
- [ ] Webhook signatures verified
- [ ] Rate limiting works

---

## 📋 CHECKLIST DE PREPARACIÓN

### Completed (✅)
- [x] Supabase product_metadata table
- [x] GHL client library
- [x] React Query hooks
- [x] API endpoint
- [x] Type definitions
- [x] Environment variables
- [x] Testing scripts
- [x] Documentation (architecture)
- [x] Product mapping analysis
- [x] Custom fields limitation identified

### Pending (⏳)
- [ ] Webhook endpoint code
- [ ] Sync logic implementation
- [ ] Webhook signature verification
- [ ] Polling implementation
- [ ] Admin panel for metadata
- [ ] Frontend component updates
- [ ] Data migration from catalog.ts
- [ ] Category mapping solution
- [ ] Image handling strategy
- [ ] Unit/integration/E2E tests
- [ ] Load tests
- [ ] Security tests
- [ ] Webhook setup instructions
- [ ] Operational runbook
- [ ] Monitoring/alerting setup

---

## 🎯 RECOMENDACIONES

### Before Starting Implementation:

1. **Verify GHL Data**
   - Confirm 58 products already exist in GHL
   - Check what metadata GHL already stores
   - Plan migration strategy

2. **Clarify Business Logic**
   - Category mapping: how to represent in GHL?
   - Image management: who manages uploads?
   - Pricing: will price_min/price_max come from GHL or hardcoded?

3. **Design Sync Strategy**
   - Webhook primary, polling fallback (approved)
   - Conflict resolution algorithm
   - Rollback procedure

4. **Test Infrastructure**
   - Set up GHL test account
   - Mock webhook sender for testing
   - Database backup strategy

5. **Staging Environment**
   - Deploy to staging first
   - Full end-to-end testing
   - Production readiness review

---

## 📝 FINAL STATUS

**Overall Readiness:** 🟡 **60% READY**

**Infrastructure:** ✅ Ready (Supabase, client library, hooks)  
**Implementation:** ❌ Not started (sync, webhook, polling)  
**Testing:** ⏳ Planned (no tests written yet)  
**Documentation:** ✅ Design complete (implementation docs TBD)  

---

**Analysis completed:** 2026-08-27  
**Status:** READ-ONLY ANALYSIS - AWAITING IMPLEMENTATION APPROVAL  

