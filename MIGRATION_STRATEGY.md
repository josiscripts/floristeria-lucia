# Data Migration Strategy: Hardcoded Products → Supabase

## Overview

This strategy outlines a safe, verifiable migration of 54 hardcoded products from `src/data/catalog.ts` to Supabase, preserving data integrity and protecting Condolencias products which may reference existing orders.

---

## Current State

**Source:** `src/data/catalog.ts`
- 54 hardcoded products (Product[])
- 5 categories: ramos, plantas, rosas-eternas, complementos, condolencias
- Each product has: id, name, category, priceMin, priceMax, image, description, badge, colors, roseStep

**Fallback:** Catalog frontend uses these hardcoded products when Supabase is unavailable

**Database:** Newly created schema (20260903 migration)
- `products` - Main product table
- `product_options` - Price tiers and SKUs
- `color_variants` - Color selection for rosas-eternas
- `product_images` - Product media with URLs

---

## Migration Strategy

### Phase 1: Pre-Migration Verification

**Endpoint:** `GET /api/admin/migrate-catalog`

Checks:
- [ ] Supabase connectivity (endpoint ready)
- [ ] Condolencias order references (safety check)
- [ ] Current migration progress (products in DB vs catalog)

Output:
```json
{
  "catalogSize": 54,
  "supabaseProducts": 0,
  "supabaseOptions": 0,
  "condolenciasOrdersFound": 0,
  "migrationNeeded": true,
  "ready": true
}
```

### Phase 2: Condolencias Protection

**Critical:** Only 14 Condolencias products require special handling

**Risk Assessment:**
```
IF (orders.product_category = 'condolencias') THEN
  → BLOCK migration unless admin confirms
  → Log warning in audit trail
  → Provide option to proceed at admin risk
END
```

**Check Query:**
```sql
SELECT COUNT(*) FROM order_items 
WHERE product_category = 'condolencias';
```

If count > 0:
- Show warning in UI
- Require explicit checkbox: "Permitir sobrescritura de condolencias (bajo mi responsabilidad)"
- Only proceed if explicitly confirmed
- Log this risk acknowledgment

### Phase 3: Product Migration

**Endpoint:** `POST /api/admin/migrate-catalog`

Request:
```json
{
  "dryRun": true,  // Optional: test without DB changes
  "allowCondolenciasOverwrite": false  // Only if condolencias orders exist
}
```

For each of 54 products:

#### Step 2a: Create Product
```typescript
// Input from catalog.ts
{
  name: "Ramo Felicidad",
  description: "...",
  category: "ramos",
  active: true,
  cover_image_url: "/assets/imagen_ramo_3.png",
  has_color_variants: false,  // true only for rosas-eternas
  sync_status: "pending",
  sync_error: null
}

// Output: products.id
```

#### Step 2b: Create Product Options
Price tiers based on priceMin/priceMax logic:

**Single Price:**
```
priceMin: 25, priceMax: undefined
→ 1 option: "Estándar" @ €25
```

**Price Range:**
```
priceMin: 30, priceMax: 45
→ 3 options:
  - "Estándar" @ €30
  - "Especial" @ €37.50 (mid-point)
  - "Premium" @ €45
```

For each option:
- Generate SKU via `generateSKU(category)` 
- Create `product_options` record:
  ```
  {
    product_id: UUID,
    name: "Estándar" | "Especial" | "Premium",
    price_amount: number,
    discount_percent: 0,
    stock_quantity: null,  // No tracking initially
    sku: "FL-RAM-0001",    // Auto-generated
    active: true
  }
  ```

#### Step 2c: Link Product Images
Map asset imports to image records:

```typescript
// From catalog.ts imports
import imgRamos from "@/assets/imagen_ramo_3.png";

// Create product_images record
{
  product_id: UUID,
  ghl_product_id: "",  // Will sync with GHL later
  storage_path: "/assets/imagen_ramo_3.png",
  url: "/assets/imagen_ramo_3.png",
  sort_order: 0,
  is_primary: true
}
```

#### Step 2d: Handle Color Variants
Only for `rosas-eternas` products with colors defined:

```typescript
// Input from catalog
roseColors = ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]

// Create color_variants per product
FOR EACH color IN product.colors:
  → INSERT INTO color_variants (
      product_id, name, sort_order, active
    )
```

### Phase 4: Status per Product

Each product returns:

```typescript
{
  catalogId: "ramo-felicidad",
  name: "Ramo Felicidad",
  category: "ramos",
  status: "created" | "updated" | "already_migrated" | "failed" | "skipped_condolencias_unsafe",
  productId: "UUID",
  optionsCount: 3,
  imagesCount: 1,
  error?: "Optional error message"
}
```

### Phase 5: Migration Response

```json
{
  "success": true,
  "dryRun": false,
  "timestamp": "2026-09-04T12:00:00Z",
  "summary": {
    "total": 54,
    "created": 52,
    "updated": 0,
    "already_migrated": 0,
    "skipped": 2,  // Condolencias if unsafe
    "failed": 0
  },
  "condolenciasCheck": {
    "safe": true,
    "ordersFound": 0,
    "message": "No existing orders found - safe to migrate"
  },
  "results": [
    {
      "catalogId": "ramo-felicidad",
      "name": "Ramo Felicidad",
      "category": "ramos",
      "status": "created",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "optionsCount": 3,
      "imagesCount": 1
    }
    // ... 53 more products
  ],
  "errors": []
}
```

---

## Verification Strategy

### 1. Count Verification
```sql
-- After migration
SELECT COUNT(*) FROM products;
-- Expected: 54 (all products from catalog.ts)

SELECT COUNT(*) FROM product_options;
-- Expected: ~130-160 (multiple options per product)

SELECT COUNT(*) FROM color_variants;
-- Expected: ~42 (6 colors × 7 rosas-eternas products)
```

### 2. Category Verification
```sql
SELECT category, COUNT(*) FROM products GROUP BY category;
-- Expected:
-- ramos:           5
-- plantas:         8
-- rosas-eternas:   4
-- complementos:    13
-- condolencias:    14 (or 12 if skipped due to unsafe state)
```

### 3. SKU Uniqueness
```sql
SELECT COUNT(DISTINCT sku) FROM product_options;
-- Expected: = COUNT(*) FROM product_options
-- If equal: all SKUs are unique ✓
```

### 4. Image Linking
```sql
SELECT COUNT(*) FROM product_images 
WHERE product_id IS NOT NULL AND url IS NOT NULL;
-- Expected: ≥ 54 (at least one per product)
```

### 5. Price Range Validation
```sql
-- Check for price tiers
SELECT po.name, COUNT(*) as option_count
FROM product_options po
JOIN products p ON p.id = po.product_id
WHERE p.category = 'rosas-eternas'
GROUP BY po.name;
-- Expected: "Estándar", "Especial", "Premium" for multi-tier products
```

### 6. Condolencias Safety
```sql
-- Verify Condolencias products exist (unless skipped)
SELECT COUNT(*) FROM products WHERE category = 'condolencias';
-- Expected: 14 (if safe) or 12-13 (if skipped)

-- Check no order corruption
SELECT COUNT(DISTINCT product_category) FROM order_items;
-- Should not have new/altered categories
```

---

## Frontend Implementation

### Admin Settings Page
**Location:** `src/routes/_authenticated/admin/settings.tsx`

**New Component:** `CatalogMigrationCard`
- Shows current progress (X/54 products)
- Displays status badges (pending/completed)
- Lists stats: products migrated, options created, images linked
- Warns about Condolencias if orders exist

### Migration Dialog
**Component:** `CatalogMigrationDialog`

**Features:**
1. **Dry Run Option**
   - Test migration without DB changes
   - Shows what would happen
   - Safe to run multiple times

2. **Condolencias Warning**
   - Red alert if orders reference Condolencias
   - Requires explicit checkbox confirmation
   - Logs admin acknowledgment in audit trail

3. **Progress Display**
   - Real-time per-product status
   - Success/error breakdown
   - Retry failed products

4. **Audit Trail**
   - Who initiated migration
   - When it ran
   - With what parameters
   - Logged in `audit_logs` table

---

## Error Handling Strategy

### Per-Product Error Handling
- ✅ Non-blocking: One product failure doesn't stop others
- ✅ Logged: Error messages per product returned
- ✅ Retriable: Failed products can be re-attempted
- ✅ Atomic: Options+images created together with product or rolled back

### Recovery Options
1. **Retry Failed Products:** Re-run migration (idempotent)
2. **Manual Fix:** Edit product in admin panel
3. **Rollback:** Delete from `products` (cascades to options/images)
4. **Support:** Check audit logs for exact error

### Idempotency
```
IF (product_by_name_and_category EXISTS) THEN
  → Skip (status: "already_migrated")
  → Don't create duplicate
ELSE
  → Create new
END
```

---

## Condolencias Protection Specifics

### Why Condolencias Needs Protection
- 14 funeral/sympathy products
- May be referenced in existing orders
- Overwriting could lose order history
- Financial/legal implications

### Safety Mechanism
1. Query: `SELECT * FROM order_items WHERE product_category = 'condolencias'`
2. If count > 0:
   - Show warning in UI
   - Require explicit checkbox: "I understand the risks"
   - Log risk acknowledgment with admin ID
   - Only proceed if confirmed
3. If count = 0:
   - Proceed safely
   - Log successful migration

### What Gets Protected
- Product names/descriptions
- Original pricing
- Order history linking

### What Gets Migrated
- Product data to new schema
- Category tags
- Images
- Pricing tiers

---

## Rollback Plan

If migration fails catastrophically:

1. **Identify Failed Products**
   - Check `migration.results[].status = "failed"`
   - Review error messages

2. **Partial Rollback**
   ```sql
   -- Delete products created in this migration
   DELETE FROM products 
   WHERE created_at > '2026-09-04T12:00:00Z'
   AND sync_status = 'pending'
   -- Cascades to product_options, product_images, color_variants
   ```

3. **Restart Migration**
   - Dry run again to verify
   - Fix underlying issues
   - Re-execute

4. **Fallback**
   - Catalog frontend continues using hardcoded products
   - No user-facing impact
   - Admin notified to retry

---

## Implementation Checklist

- [x] API Endpoint: `src/routes/api.admin.migrate-catalog.ts`
  - [x] GET: Check migration status
  - [x] POST: Execute migration
  - [x] Condolencias safety check
  - [x] Per-product error handling
  - [x] Audit logging

- [x] Frontend Components:
  - [x] `CatalogMigrationCard`: Settings card display
  - [x] `CatalogMigrationDialog`: Migration execution UI
  - [x] Dry run option
  - [x] Condolencias warning
  - [x] Progress display

- [x] Admin Settings Integration:
  - [x] Add card to `settings.tsx`
  - [x] Trigger button
  - [x] Status polling

- [ ] Testing:
  - [ ] Unit tests for migration logic
  - [ ] Integration test with real data
  - [ ] Dry run test
  - [ ] Condolencias safety test
  - [ ] Rollback test

- [ ] Documentation:
  - [ ] Run migration guide
  - [ ] Verification steps
  - [ ] Troubleshooting FAQ

---

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/api.admin.migrate-catalog.ts` | Migration API endpoint |
| `src/components/admin/CatalogMigrationCard.tsx` | Settings card UI |
| `src/components/admin/CatalogMigrationDialog.tsx` | Migration execution dialog |
| `src/routes/_authenticated/admin/settings.tsx` | Integrated settings page |
| `src/data/catalog.ts` | Source data (unchanged) |
| `supabase/migrations/20260903_redesign_product_schema.sql` | Target schema |

---

## Success Criteria

✅ All 54 products in Supabase (or 52 if Condolencias unsafe)
✅ Product options match priceMin/priceMax tiers
✅ All SKUs unique and generated
✅ Category counts correct
✅ Images linked properly
✅ No duplicate products
✅ Audit trail complete
✅ Zero order corruption
✅ Condolencias protected

---

## Timeline

1. **Pre-check:** Admin runs "GET /api/admin/migrate-catalog"
2. **Dry run:** Admin clicks "Ejecutar prueba seca" (0 risk)
3. **Review:** Admin verifies results in response
4. **Confirm:** Admin acknowledges Condolencias warning if needed
5. **Execute:** Admin clicks "Migrar ahora"
6. **Verify:** Run verification queries
7. **Done:** Hardcoded catalog removed in next update

---

## Support & Troubleshooting

**Issue:** Migration fails on specific product
- Check error message in results
- Verify product exists in catalog.ts
- Check disk space on DB
- Retry specific products via re-running migration

**Issue:** Condolencias warning appears but shouldn't
- Manually check: `SELECT COUNT(*) FROM order_items WHERE product_category = 'condolencias'`
- If 0: clear any cached state, retry
- If > 0: review orders before proceeding

**Issue:** SKU duplication error
- Check for existing SKUs: `SELECT sku, COUNT(*) FROM product_options GROUP BY sku HAVING COUNT(*) > 1`
- Delete duplicates manually if needed
- Retry migration

**Issue:** Image URLs broken after migration
- Verify `/assets/` files exist
- Check Supabase Storage configuration
- Update URL format if needed

---

## Notes for Backend Engineers

- Non-blocking error handling: One product failure ≠ stop entire migration
- Idempotent: Safe to re-run without creating duplicates
- Atomic operations: Product + options + images created together
- Audit trail: All admin actions logged with timestamp/user/risk acknowledgment
- Type-safe: Full TypeScript with Database union types
- Conditional Condolencias handling: Requires explicit admin confirmation if orders exist
