# BLOQUE 4 REDESIGN - DEPLOYMENT GUIDE

**Version:** 1.0
**Date:** 2026-09-03
**Risk Level:** MEDIUM (schema changes, backward compatible with legacy table)

## PREREQUISITES

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Git access to repository
- Vercel access for deployment
- Admin credentials for GHL testing

## STEP 1: APPLY DATABASE MIGRATIONS

### Option A: Via Supabase CLI (Recommended for development)

```bash
# Navigate to project directory
cd c:\Users\josia\Desktop\Websites_Clientes\floristeria_lucia\Ultima_Version_Floristeria_Lucia

# Link to your Supabase project if not already linked
supabase link --project-ref <YOUR_PROJECT_REF>

# Push migrations to database
supabase db push

# Verify migration was applied
supabase db list
```

### Option B: Via Supabase Dashboard (Recommended for production)

1. Go to Supabase Dashboard (supabase.com)
2. Select your project
3. Go to "SQL Editor"
4. Create new query
5. Copy content from: `supabase/migrations/20260903_redesign_product_schema.sql`
6. Execute the SQL
7. Verify all 3 new tables created:
   - `products`
   - `product_options`
   - `color_variants`

### Verification

After migration, run this query to verify:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'product_options', 'color_variants', 'product_images');

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'products';
SELECT indexname FROM pg_indexes WHERE tablename = 'product_options';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('products', 'product_options', 'color_variants');
```

## STEP 2: BUILD AND TEST LOCALLY

```bash
# Install dependencies (if needed)
npm install

# Run TypeScript compiler check
npm run build

# Check for any TS errors (should be 0)
# If errors found, fix them before proceeding

# Clean build output
rm -rf .vercel/output .nuxt .dist dist
```

## STEP 3: ENVIRONMENT VARIABLES

Ensure these are set in `.env.local`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-location-id
```

## STEP 4: CREATE TEST PRODUCTS (Optional)

Create a test script to verify the new API works:

```bash
# Create test_products.mjs
cat > test_products.mjs << 'EOF'
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/admin/products';
const AUTH_TOKEN = 'your-auth-token';

const testProducts = [
  {
    name: 'Ramo Rosa Simple',
    category: 'ramos',
    description: 'Ramo simple de rosas frescas',
    options: [
      { name: 'Estándar', price_amount: 45, discount_percent: 0 }
    ]
  },
  {
    name: 'Ramo Rosas Premium',
    category: 'ramos',
    description: 'Ramo premium de rosas variadas',
    options: [
      { name: 'Básico', price_amount: 50, discount_percent: 0, stock_quantity: 10 },
      { name: 'Estándar', price_amount: 75, discount_percent: 0, stock_quantity: 10 },
      { name: 'Premium', price_amount: 100, discount_percent: 10, stock_quantity: 5 }
    ]
  }
];

async function createTestProducts() {
  for (const product of testProducts) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(product)
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`✓ Created: ${product.name}`);
        console.log(`  Product ID: ${data.product.id}`);
        console.log(`  GHL ID: ${data.product.ghl_product_id}`);
        console.log(`  Options: ${data.product.options.length}`);
      } else {
        console.error(`✗ Failed: ${product.name}`);
        console.error(`  Error: ${data.error}`);
      }
    } catch (error) {
      console.error(`✗ Exception: ${product.name}`);
      console.error(`  ${error.message}`);
    }
  }
}

createTestProducts();
EOF

# Run test (requires local dev server running)
node test_products.mjs
```

## STEP 5: VERIFY SUPABASE DATA

After creating test products, run these queries:

```sql
-- Verify products created
SELECT id, ghl_product_id, name, category, active 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify options created
SELECT po.id, po.name, po.price_amount, po.discount_percent, po.price_final, po.sku
FROM product_options po
JOIN products p ON po.product_id = p.id
ORDER BY po.created_at DESC
LIMIT 10;

-- Verify color variants (if any)
SELECT cv.id, cv.name, p.name as product_name
FROM color_variants cv
JOIN products p ON cv.product_id = p.id;

-- Check for orphans
SELECT * FROM product_images WHERE product_id IS NULL;
SELECT * FROM products WHERE deleted_at IS NOT NULL;
```

## STEP 6: VERIFY GHL INTEGRATION

After creating test products, check GoHighLevel:

1. Go to GoHighLevel Dashboard
2. Navigate to Products → Catalog
3. Verify products exist:
   - [ ] Product appears in catalog
   - [ ] Name matches
   - [ ] Description matches
   - [ ] Price visible
   - [ ] SKU visible (FL-CAT-NNNN format)
   - [ ] Collection assigned (if category mapped)
4. Check prices:
   - [ ] Multiple prices created (one per option)
   - [ ] Price amounts correct
   - [ ] compareAtPrice set for discounted items
5. Check stock (if enabled):
   - [ ] trackInventory: true
   - [ ] availableQuantity matches

## STEP 7: DEPLOY TO VERCEL

```bash
# Ensure all changes committed
git status

# Add new files
git add -A

# Commit
git commit -m "feat: BLOQUE 4 - Complete product model redesign

- New schema: products, product_options, color_variants tables
- Multiple pricing support per product
- Discount and stock management
- Color variants for Rosas Eternas
- Admin API endpoints for full CRUD
- GHL synchronization with idempotency
- Build: ✓ PASS (0 TS errors)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# Push to remote
git push origin main

# Vercel will auto-deploy from main branch
# Monitor deployment at: https://vercel.com/dashboard
```

### Verify Vercel Deployment

1. Go to Vercel Dashboard
2. Check deployment status
3. Wait for build to complete (5-10 minutes)
4. Test production endpoints:

```bash
# Test API endpoint
curl -X GET https://your-domain.vercel.app/api/admin/products \
  -H "Authorization: Bearer your-token"

# Expected response:
# { "success": true, "products": [...], "total": N }
```

## STEP 8: VERIFICATION CHECKLIST

After deployment, verify:

### Database ✓
- [ ] All 3 new tables created
- [ ] All indexes created
- [ ] RLS policies in place
- [ ] Foreign keys working
- [ ] Triggers for updated_at working

### API Endpoints ✓
- [ ] POST /api/admin/products → creates product + options + colors
- [ ] GET /api/admin/products → lists all products
- [ ] GET /api/admin/products/{id} → gets product with options
- [ ] PUT /api/admin/products/{id} → updates product
- [ ] DELETE /api/admin/products/{id} → soft deletes
- [ ] POST /api/admin/products/{id}/options → creates option
- [ ] PUT /api/admin/products/{id}/options/{optionId} → updates option
- [ ] DELETE /api/admin/products/{id}/options/{optionId} → deletes option
- [ ] POST /api/admin/products/{id}/colors → creates color
- [ ] DELETE /api/admin/products/{id}/colors/{colorId} → deletes color

### GHL Sync ✓
- [ ] Products appear in GHL catalog
- [ ] Prices created in GHL (one per option)
- [ ] SKUs generated and populated
- [ ] Stock synced (if enabled)
- [ ] No duplicate products/prices

### Security ✓
- [ ] All endpoints require auth (withAdminGuard)
- [ ] RLS policies enforced
- [ ] Audit logs recorded
- [ ] No test endpoints exposed

### Build ✓
- [ ] TypeScript: 0 errors
- [ ] Linting: passes
- [ ] No console warnings (from our code)
- [ ] Bundle size reasonable

## ROLLBACK PLAN

If issues occur:

### Option 1: Revert Migration (Careful!)

```bash
# Delete the new tables (WARNING: DATA LOSS)
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS color_variants;
DROP TABLE IF EXISTS product_options;
DROP TABLE IF EXISTS products;

# Note: product_metadata remains intact
```

### Option 2: Keep New Schema, Revert Code

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# This keeps database schema but old API still works
# New endpoints not available but no data loss
```

### Option 3: Partial Rollback - Disable New Features

```sql
-- Keep tables but disable public access
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE color_variants DISABLE ROW LEVEL SECURITY;

-- Then re-enable after fixing issues
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
...
```

## MONITORING & LOGGING

After deployment, monitor:

### Supabase Dashboard
- Database Health
- Query Performance
- Storage Usage
- API Usage

### Vercel Deployment
- Function Runtime
- Error Logs
- Performance Metrics
- Build Failures

### Application Logs
- Check for API errors
- GHL sync failures
- Validation errors

```bash
# View Vercel logs
vercel logs --follow

# View Supabase logs
supabase logs push
supabase logs pull
```

## TROUBLESHOOTING

### Migration Fails
- **Error:** Foreign key constraint
  - **Solution:** Ensure product_images table exists first
  
- **Error:** Column already exists
  - **Solution:** Migration already applied, safe to ignore

- **Error:** RLS policy error
  - **Solution:** Check schema name is 'public'

### API Endpoint 404
- **Solution:** Ensure route files are in correct path:
  - `src/routes/api.admin.products.ts`
  - `src/routes/api.admin.products.$id.ts`
  - `src/routes/api.admin.products.$id.options.ts`
  - `src/routes/api.admin.products.$id.colors.ts`

### GHL Sync Failed
- Check GHL_API_KEY and GHL_LOCATION_ID in env
- Check location has sufficient permissions
- Verify network connectivity
- Check GHL API rate limits

### Duplicate Products
- **Cause:** Missing ghl_product_id UNIQUE constraint
- **Fix:** Manually delete duplicates, check constraint exists

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules .nuxt .dist
npm install
npm run build
```

## SUPPORT & DOCUMENTATION

- Database schema: `supabase/migrations/20260903_redesign_product_schema.sql`
- Library functions: `src/lib/products.server.ts`
- API endpoints: `src/routes/api.admin.products*`
- Types: `src/integrations/supabase/types.ts`
- Summary: `BLOQUE_4_IMPLEMENTATION_SUMMARY.md`

## FINAL NOTES

- **Backward Compatibility:** Old product_metadata table remains intact
- **Data Migration:** Product data NOT automatically migrated (done via admin panel)
- **GHL Integration:** Uses existing functions, no breaking changes
- **Admin-Only:** All new endpoints require authentication
- **Soft Deletes:** No data permanently deleted, always recoverable
