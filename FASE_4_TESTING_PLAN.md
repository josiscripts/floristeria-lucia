# FASE 4 - TESTING & VERIFICATION PLAN

**Status:** IN PROGRESS  
**Start Date:** 2026-09-04  
**Objective:** Verify all FASE 3 implementations work correctly in real scenarios

---

## TEST SUITE 1: CREATE PRODUCT - FULL FLOW

### Prerequisites
- Dev server running on port 3002
- Admin user authenticated
- Supabase connected
- No products in catalog (fresh start)

### TEST 1.1: Create Product with Basic Info
```
Input:
  - Name: "Ramo Rojo Clásico"
  - Description: "Hermoso ramo de rosas rojas"
  - Category: Select from dynamic dropdown
  - Active: true
  - Cover Image: URL provided

Expected Result:
  ✓ Category dropdown loads dynamically from Supabase
  ✓ Product created in Supabase.products
  ✓ Product ID returned from API
  ✓ Toast notification: "Ramo Rojo Clásico creado correctamente"
  ✓ Redirect to /admin/products list
```

### TEST 1.2: Create Product with Prices
```
Input:
  - 1st Price: Name="Ramo Pequeño", Amount=75, Discount=10%, Stock=50
  - 2nd Price: Name="Ramo Grande", Amount=125, Discount=5%, Stock=30

Expected Result:
  ✓ Both options created in product_options
  ✓ No duplicate options
  ✓ Price amounts correctly saved
  ✓ Discount percentages applied
  ✓ Stock quantities stored
```

### TEST 1.3: Create Product with Images
```
Input:
  - Image 1: "https://example.com/img1.jpg" (Primary)
  - Image 2: "https://example.com/img2.jpg"
  - Image 3: "https://example.com/img3.jpg"

Expected Result:
  ✓ All 3 images created in product_images
  ✓ First image marked as is_primary=true
  ✓ sort_order maintained
  ✓ No duplicate images
  ✓ Sync automatically via syncProductImages()
```

### TEST 1.4: Create Product with Color Variants
```
Input:
  - Category: "rosas-eternas"
  - Has Color Variants: true
  - Colors: ["Rojo", "Blanco", "Rosado"]

Expected Result:
  ✓ Color variants section appears only for rosas-eternas
  ✓ All 3 colors created in color_variants
  ✓ sort_order preserved
  ✓ No duplicates
```

---

## TEST SUITE 2: EDIT PRODUCT - MODIFICATIONS

### TEST 2.1: Edit Product Basic Info
```
Input:
  - Change name to "Ramo Rojo Elegante"
  - Update description
  - Change category to different one
  - Toggle active status

Expected Result:
  ✓ All changes saved to Supabase
  ✓ No data loss from options, images, colors
  ✓ Cache invalidated correctly
  ✓ No duplicates created
```

### TEST 2.2: Edit Product Prices
```
Actions:
  - Add new price option: "Ramo Extra Grande" = 200
  - Modify existing: "Ramo Pequeño" price 75 → 85
  - Delete price option: "Ramo Grande"

Expected Result:
  ✓ New option created
  ✓ Existing option updated (no duplicate)
  ✓ Deleted option removed from product_options
  ✓ No orphaned records
```

### TEST 2.3: Edit Product Images (Sync)
```
Actions:
  - Upload new image 4
  - Delete image 2
  - Reorder images (change sort_order)
  - Change image 1 primary to image 3 primary

Expected Result:
  ✓ New image created via POST /api/admin/products/{id}/images
  ✓ Deleted image removed via DELETE
  ✓ sort_order updated via PUT
  ✓ is_primary changed via PUT
  ✓ syncProductImages() detects changes correctly
  ✓ No duplicates, no orphaned images
```

### TEST 2.4: Edit Product Colors
```
Actions:
  - Add new color "Naranja"
  - Modify color "Rojo" → "Rojo Intenso"
  - Delete color "Blanco"

Expected Result:
  ✓ Color variants CRUD works
  ✓ No duplicates
  ✓ sort_order maintained
```

---

## TEST SUITE 3: CATEGORIES - DYNAMIC LOADING

### TEST 3.1: Categories Load Dynamically
```
Expected:
  ✓ useSupabaseCategories hook loads from categories table
  ✓ Only active=true categories shown
  ✓ Ordered by display_order
  ✓ SelectItem uses cat.id (UUID), not cat.name
  ✓ Category value stored as category_id (UUID) in products table
  ✓ React Query cache works (5 minute TTL)
  ✓ No hardcoded categoryLabels from data/catalog.ts
```

---

## TEST SUITE 4: CATALOG VISIBILITY

### TEST 4.1: Created Products Appear in /catalogo
```
Expected:
  ✓ Products with active=true appear in catalog
  ✓ Products with active=false do NOT appear
  ✓ All 4 categories visible
  ✓ Product images display correctly
  ✓ Prices shown correctly
  ✓ No hardcoded fallback visible
```

### TEST 4.2: Soft Delete Products
```
Actions:
  - Deactivate product via panel (soft delete)
  - Verify product disappears from /catalogo
  - Check database: deleted_at is set, product still exists in DB
  - Verify order_items related to product are preserved

Expected:
  ✓ Product no longer visible in catalog
  ✓ Product soft-deleted (deleted_at set)
  ✓ Historical orders preserved
  ✓ No hard delete occurred
```

---

## TEST SUITE 5: CART & CHECKOUT

### TEST 5.1: Add to Cart
```
Actions:
  - Browse to product in /catalogo
  - Select price option
  - Add to cart
  - Verify cart updates

Expected:
  ✓ Product loads correctly
  ✓ Price options available
  ✓ Cart increments quantity
  ✓ Cart shows correct total
```

### TEST 5.2: Checkout Flow
```
Actions:
  - Proceed to checkout
  - Enter shipping info
  - Enter payment info
  - Complete order

Expected:
  ✓ Order created with order_items referencing product_id
  ✓ Payment processed
  ✓ Order confirmation shown
  ✓ Product remains available for future orders
```

---

## VERIFICATION CHECKLIST

- [ ] Categories dynamically load from Supabase (not hardcoded)
- [ ] Create product works end-to-end
- [ ] Edit product preserves all data
- [ ] Images sync correctly (new/modified/deleted)
- [ ] Soft delete works (no hard delete of active orders)
- [ ] Products appear in /catalogo when active=true
- [ ] Products disappear from /catalogo when active=false or deleted_at set
- [ ] Cart and checkout work with Supabase products
- [ ] No duplicate options/images/colors created
- [ ] React Query cache invalidation works
- [ ] Build successful (npm run build)
- [ ] No TypeScript errors
- [ ] No lint errors (except pre-existing)
- [ ] All tests pass (if available)

---

## BUGS FOUND & FIXES

(Will be updated as testing progresses)

---

## BUILD VERIFICATION

```bash
npm run build → BEFORE TESTING
npm run build → AFTER FIXES
npm run lint  → Check warnings
npm run typecheck → Check compilation
npm test      → If available
```

---

## REPORT TEMPLATE

**FASE 4 - TESTING RESULTS**

| Test Suite | Status | Issues | Notes |
|-----------|--------|--------|-------|
| 1. Create Product | ? | ? | Testing in progress |
| 2. Edit Product | ? | ? | Testing in progress |
| 3. Categories | ? | ? | Testing in progress |
| 4. Catalog | ? | ? | Testing in progress |
| 5. Cart/Checkout | ? | ? | Testing in progress |

**Total Bugs Found:** 0 (so far)
**Total Bugs Fixed:** 0 (so far)
**Build Status:** ✅ Last: 2.51s (no errors)

