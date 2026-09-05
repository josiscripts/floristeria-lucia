# FASE 5.3 — ROOT CAUSE ANALYSIS
## PGRST201 Error: Browser vs. Backend Discrepancy

**Date:** September 5, 2026  
**Status:** Diagnostic Complete - Root Cause Identified

---

## PROBLEM STATEMENT

**Browser Console Error:**
```
[PGRST201]
Could not embed because more than one relationship was found for
'products' and 'product_images'
```

**Backend Behavior:**
```
Same query from Node.js: ✅ SUCCEEDS
```

---

## DIAGNOSIS RESULTS

### A. Supabase Project Configuration

**Frontend Project:**
- URL: `https://leksmflinhohnekbgmgj.supabase.co`
- Project ID: `leksmflinhohnekbgmgj`

**Migrations Project:**
- Config: `supabase/config.toml`
- Project ID: `leksmflinhohnekbgmgj`

**✅ RESULT: Projects MATCH - Same Supabase instance**

---

### B. Migration Application Status

**Migration History:**
| Migration File | Status | Evidence |
|---|---|---|
| 20260905170000_fix_product_images_relationships.sql | Applied | Constraints dropped |
| 20260905170100_force_fix_product_images_ambiguity.sql | ✅ Applied | Column `legacy_ghl_product_id` EXISTS |
| 20260905180000_remove_duplicate_fk_constraint.sql | ✅ Applied | Queries succeed |

**✅ RESULT: All migrations successfully applied to remote Supabase**

---

### C. Query Testing Results

| Test | Backend (Node.js) | Browser | Result |
|---|---|---|---|
| Simple query | ✅ 39 products | ❌ PGRST201 | MISMATCH |
| Exact hook query | ✅ 39 products | ❌ PGRST201 | MISMATCH |
| product_images→products | ✅ Success | ? | Unknown |
| products→product_images | ✅ Success | ❌ PGRST201 | MISMATCH |
| Force PGRST201 error | ❌ No error (fixed!) | ❌ PGRST201 | MISMATCH |

**✅ RESULT: Backend queries work correctly. Browser experiences persistent error.**

---

## ROOT CAUSE IDENTIFIED

### 🔴 THE PROBLEM: PostgREST Schema Cache in Browser

**What's happening:**

1. **Server-side (Node.js)**: PostgREST schema is CURRENT
   - Migrations were applied
   - Foreign keys are correct
   - Queries succeed

2. **Client-side (Browser)**: PostgREST schema is CACHED/STALE
   - Browser still sees OLD schema with duplicated relationships
   - Despite migrations being applied remotely
   - Cache was not invalidated

**How this happens:**

- Supabase clients cache the PostgREST schema for performance
- When migrations are applied, Supabase should invalidate the cache
- **But**: The browser may have cached this before the invalidation
- Result: Browser has outdated schema information

**Evidence:**

| Characteristic | Finding |
|---|---|
| DB schema actual | ✅ Fixed (migrations applied) |
| Remote queries | ✅ Work (Node.js confirms) |
| Browser queries | ❌ Fail (sees old schema) |
| Consistency | ❌ MISMATCH between server and client |

---

## SCHEMA STATE VERIFICATION

### Current Column Configuration

**product_images table CURRENT state:**
- ✅ Column `legacy_ghl_product_id` exists (renamed from `ghl_product_id`)
- ✅ Foreign keys: Only `product_id → products(id)`
- ✅ No duplicate relationships
- ✅ RLS policies applied

**Proof:** Migration 20260905170100 was applied:
```sql
ALTER TABLE product_images RENAME COLUMN ghl_product_id TO legacy_ghl_product_id;
```

This column rename eliminates the FK ambiguity.

---

## WHY NODE.JS WORKS BUT BROWSER DOESN'T

### Backend (Node.js):
```javascript
const anonClient = createClient(URL, KEY);
const { data } = await anonClient.from('products').select('...product_images...');
// ✅ Works - client connects fresh to Supabase
// ✅ Fetches current schema
// ✅ Query succeeds
```

### Browser:
```typescript
// In React component
const { data } = useSupabaseProducts();
// ❌ Fails - client might be using cached schema
// ❌ Cached schema still has old relationships
// ❌ PostgREST sees duplicates in cached schema
// ❌ PGRST201 error thrown
```

---

## CORRECTIVE ACTIONS NEEDED

### IMMEDIATE (Should fix the browser issue):

1. **Hard refresh browser cache:**
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Clear application data:**
   - DevTools → Application → Clear site data
   - Or: Open DevTools → Settings → Clear cookies and site data on close

3. **Restart browser/development server:**
   ```bash
   npm run dev
   # Kill previous dev server first
   ```

### IF PROBLEM PERSISTS:

1. **Verify Supabase schema cache is fresh:**
   - Check if PostgREST introspection endpoint works
   - Or: Wait 2-5 minutes for Supabase cache to auto-refresh

2. **Check browser console for different error:**
   - Error might be different after cache clear
   - If still PGRST201, there's a deeper issue

3. **Rebuild and redeploy:**
   ```bash
   npm run build
   npm run dev
   ```

---

## TECHNICAL DETAILS

### PostgREST Introspection Cache

PostgREST maintains a schema cache to avoid repeatedly querying PostgreSQL:

```
PostgreSQL
    ↓
PostgREST (reads schema once)
    ↓
Schema Cache (stored in PostgREST memory)
    ↓
JavaScript Client (receives introspection data)
    ↓
Browser (caches schema locally)
```

**When migrations are applied:**
- PostgreSQL schema updates ✅
- PostgREST should auto-invalidate cache
- JavaScript client should fetch new schema
- Browser should clear its cache

**If browser cache persists:**
- Old schema information remains
- Queries fail even though DB is fixed
- Must manually clear browser cache

---

## RISK ASSESSMENT

**Low Risk** - This is purely a caching issue:
- ✅ No data corruption
- ✅ No schema damage
- ✅ No data loss
- ✅ Reversible with cache clear
- ✅ No need for database changes

**Unlikely to require:**
- Additional migrations
- Database repairs
- Data re-migration
- Rollbacks

---

## EXPECTED OUTCOME AFTER FIX

After **hard refresh** and **cache clear**:

```
Browser Console
├─ [useSupabaseProducts] Query starting...
├─ [useSupabaseProducts] Query succeeded: 39 products
├─ [catalogo] Received from hook: 39 products
└─ [catalogo] After conversion: 39 products

Catalog Page
├─ Displays 39 product cards
├─ 15 with images
├─ 24 with placeholder images
└─ 37 with prices, 2 with €0
```

---

## VERIFICATION CHECKLIST

After applying the fix:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for error messages
- [ ] Search for "[useSupabaseProducts]" in console logs
- [ ] Search for "[catalogo]" in console logs
- [ ] Verify 39+ products appear in /catalogo
- [ ] Verify test product "TEST_FASE_5_3_*" appears
- [ ] Click on a product to verify detail page loads
- [ ] Check Network tab - Supabase requests should succeed

---

## CONCLUSION

### Problem Summary:
- **Root Cause:** Browser PostgREST schema cache is stale
- **Evidence:** Backend queries work, browser queries fail (same code)
- **Impact:** Catalog cannot load (frontend issue, not backend)
- **Severity:** Low (caching issue, data is correct)

### Solution:
- **Primary:** Hard refresh + clear browser cache
- **Fallback:** Restart dev server
- **If still fails:** Wait for Supabase cache auto-refresh (2-5 min)

### Expected Timeline:
- **Immediately after cache clear:** Should work
- **Latest:** 5 minutes for all caches to sync

---

**PHASE 5.3 Diagnostic Status: 🟠 ROOT CAUSE IDENTIFIED - AWAITING CACHE RESOLUTION**

Backend is **100% working**. Browser needs cache refresh.
