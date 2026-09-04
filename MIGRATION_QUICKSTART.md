# Migration Quick Start Guide

**Goal:** Move 54 hardcoded products from `catalog.ts` to Supabase  
**Time:** 15-30 minutes  
**Risk:** Low (dry run available, non-blocking errors, idempotent)  
**Who:** Admin user with database access  

---

## ⏱️ 5-Minute Overview

### What's Happening
- Reading 54 products from hardcoded array in `src/data/catalog.ts`
- Creating them in Supabase with pricing tiers, images, and colors
- Protecting "Condolencias" (funeral) products from data loss
- Providing dry run to test without making changes

### Why Now
- Needed to move from hardcoded fallback to database
- Enables product management UI in admin panel
- Prerequisite for GHL e-commerce sync
- Keeps catalog data centralized

### Safety Measures
- Dry run option (test first, no changes)
- Condolencias order checking (don't break existing orders)
- Per-product error handling (one failure doesn't stop others)
- Idempotent (safe to re-run)
- Full audit trail (who/when/what)

---

## 🚀 Step-by-Step Execution

### Step 1: Navigate to Settings
```
1. Login to admin panel
2. Click "Configuración" (Settings) in left sidebar
3. Scroll down to "Migración de catálogo" card
```

### Step 2: Check Status
```
Card shows:
- Progress bar (0/54 products → 54/54)
- Status badges (pending/completed)
- Stats (products, options, images)

If warning appears:
→ "Hay N pedido(s) que referencian productos de condolencias"
→ Read warning carefully
→ You'll need to confirm understanding before proceeding
```

### Step 3: Run Dry Run (Recommended)
```
1. Click "Iniciar migración" button
2. Dialog opens showing:
   - "Prueba seca" checkbox (should be ✓ checked)
   - "Permitir sobrescritura..." option (disabled if no warning)
   - "Ejecutar prueba seca" button

3. Click "Ejecutar prueba seca"
4. Wait for results (shows per-product status)
5. Review summary:
   - total: 54
   - created: 52-54 (expected)
   - failed: 0 (expected)

6. If all ✓ green, proceed to real migration
7. If errors ✗, note them and contact support
```

### Step 4: Execute Real Migration
```
1. Dialog still open, results visible from dry run
2. Uncheck "Prueba seca" checkbox
3. If Condolencias warning visible:
   - Read: "Hay N pedido(s) que referencian..."
   - Check: "Permitir sobrescritura de condolencias..."
   - Acknowledge: You're accepting responsibility
4. Click "Migrar ahora" button
5. Wait for completion (progress updates in real-time)
6. Review final results
```

### Step 5: Verify Success
```
In database (Supabase SQL editor):

SELECT COUNT(*) FROM products;
→ Expected: 54

SELECT COUNT(*) FROM product_options;
→ Expected: 120-200 (multiple options per product)

SELECT COUNT(*) FROM color_variants;
→ Expected: ~42 (6 colors × 7 products)

SELECT category, COUNT(*) FROM products GROUP BY category;
→ Expected:
   ramos: 5
   plantas: 8
   rosas-eternas: 4
   complementos: 13
   condolencias: 14 (or fewer if skipped)
```

---

## 📋 Pre-Checks

Before starting, verify:

- [ ] You're logged in as admin
- [ ] No users currently editing products in admin panel
- [ ] Supabase connection stable
- [ ] Backup taken (optional but recommended)
- [ ] Time available for 30 minutes uninterrupted

---

## ⚠️ Condolencias Warning Explained

### If You See:
```
🚨 ADVERTENCIA: Productos de Condolencias en uso
   Se encontraron X pedido(s) que referencian productos de condolencias.
```

### What This Means
- **X existing orders** contain funeral/sympathy products
- Migration could potentially affect those orders
- You must explicitly accept responsibility

### What To Do
```
OPTION A: Skip Condolencias (Recommended if uncertain)
→ Leave checkbox UNCHECKED
→ Migration will skip 12-14 condolencias products
→ Can migrate them later manually
→ Zero risk to existing orders

OPTION B: Override (Only if you understand implications)
→ Check checkbox: "Permitir sobrescritura..."
→ Migration will migrate condolencias products
→ Risk: Could affect existing order display
→ Mitigation: Make backup first

RECOMMENDATION: Choose Option A unless specifically told otherwise
```

### The Audit Trail
Migration logs:
- Who initiated it (your user ID)
- When (timestamp)
- Whether you confirmed override
- Results summary
- Any errors

---

## 📊 What Gets Created

### Products (54 records)
```
id (UUID)           | name | category | price_range
uuid-1              | Ramo Felicidad | ramos | €35-€50
uuid-2              | Anthurium | plantas | €25
...                 | ...  | ... | ...
uuid-54             | Corona F26 | condolencias | €260
```

### Product Options (120-200 records)
```
Per product, 1-3 pricing tiers based on priceMin/priceMax:

Ramo Felicidad (3 options):
  1. "Estándar" @ €35.00 [FL-RAM-0001]
  2. "Especial" @ €42.50 [FL-RAM-0002]
  3. "Premium" @ €50.00 [FL-RAM-0003]

Anthurium (1 option):
  1. "Estándar" @ €25.00 [FL-PLT-0001]
```

### Color Variants (~42 records)
```
Only for rosas-eternas with colors:

Ramo de Rosas:
  Rojo
  Rosa
  Blanco
  Azul
  Lila
  Amarillo
  Amarillo
```

### Product Images (54+ records)
```
One primary image per product:

Ramo Felicidad → /assets/imagen_ramo_3.png
Anthurium → /assets/imagen_plantas_3.png
...
```

---

## 🐛 Troubleshooting

### "Migration shows 0/54 even though I ran it"
**Solution:**
- Refresh the page (F5)
- Wait 5-10 seconds for status to update
- Check if response showed "success": true
- If still 0: Check browser console for errors

### "Condolencias warning shows but I don't see any orders"
**Solution:**
- Warning is based on database query
- If you're confident: check the box and proceed
- If unsure: skip condolencias (safer option)
- Manual query: `SELECT COUNT(*) FROM order_items WHERE product_category = 'condolencias'`

### "Some products failed, others succeeded"
**Solution:**
- This is expected with partial failures
- Review "errors" array in response
- Fix root cause (disk space, permissions, etc.)
- Re-run migration (idempotent, won't duplicate)
- Failed products will retry automatically

### "Getting 'SKU generation error'"
**Solution:**
- This is rare but recoverable
- Try again after a few minutes
- If persists: check database connectivity
- Contact support if issue continues

### "Image URLs show as broken after migration"
**Solution:**
- Verify image files exist in `/src/assets/`
- Check Supabase Storage configuration
- URLs should be like: `/assets/imagen_ramo_3.png`
- Test URL in browser directly
- Contact support if files missing

---

## ✅ Success Checklist

After migration completes:

- [ ] Response shows `"success": true`
- [ ] Summary shows `"failed": 0` (or acceptable number)
- [ ] Database count checks all pass (see Step 5)
- [ ] Catalog page still loads without errors
- [ ] Can add products to cart
- [ ] Audit log shows migration action
- [ ] No 404 errors on images
- [ ] Admin products list shows new entries

---

## 🔄 If Something Goes Wrong

### Partial Failure (Some Products Failed)
```
1. Review error messages in response
2. Note which products failed
3. Re-run migration (idempotent, won't break working ones)
4. Failed products will attempt again
5. Success on second run is common
```

### Complete Failure (Nothing Created)
```
1. Check Supabase connectivity
2. Verify permissions (admin role required)
3. Review browser console for API errors
4. Check `/api/admin/migrate-catalog` GET status
5. If still broken: contact support
6. Catalog continues working with hardcoded fallback
```

### Data Corruption (Unlikely but Possible)
```
1. Immediately contact support
2. Restore from backup (if available)
3. Migration can be re-run after restore
4. Check for database constraint violations
5. Support will investigate root cause
```

---

## 📞 Getting Help

### Quick Debug
1. Check browser console (F12 → Console tab)
2. Look for red error messages
3. Screenshot and note exact error text

### Check Logs
1. Admin → Settings → "Registro de auditoría"
2. Find your migration action
3. Check timestamp and what happened

### API Status
1. Open browser console
2. Run: `fetch('/api/admin/migrate-catalog').then(r => r.json()).then(console.log)`
3. Check endpoint status and counts

### Database Query
1. Go to Supabase Dashboard
2. SQL Editor
3. Run verification queries (see Step 5 above)
4. Note any missing data

### Contact Support
Provide:
- When migration ran (timestamp)
- Whether it was dry run or real
- Error messages from response
- Database counts from verification queries
- Browser console errors
- Audit log entry

---

## 💡 Pro Tips

1. **Backup First** (Optional)
   - Supabase has automatic backups
   - But manual backup gives peace of mind
   - Via Supabase Dashboard → Settings → Backups

2. **Test Dry Run First** (Recommended)
   - Always run with "Prueba seca" checked
   - Review results
   - Verify looks correct
   - Then uncheck and run real migration

3. **Read Warnings** (Important)
   - If Condolencias warning shows, read it carefully
   - It's protecting your order data
   - Don't skip the checkbox lightly
   - Log in audit trail is your proof of decision

4. **Don't Cancel Mid-Flight**
   - Dialog stays open during execution
   - Don't close tab or browser
   - Process continues in backend even if closed
   - But you won't see final results
   - Check status with refresh after 1 minute

5. **Verify After** (Critical)
   - Run verification queries
   - Confirm counts match expected
   - Test catalog frontend
   - Ensures no silent failures

---

## 🎯 Expected Outcome

### Timeline
- Step 1-2: 1 minute (navigate, check status)
- Step 3: 1 minute (dry run execution)
- Step 4: 3 minutes (real migration)
- Step 5: 5 minutes (verification queries)
- **Total: 10-15 minutes**

### What Changes
- 54 products in database ✅
- Admin panel shows products now ✅
- Frontend loads from DB instead of hardcoded ✅
- Next step: GHL e-commerce sync ✅

### What Stays Same
- Catalog page appearance (same products, images) ✅
- Pricing (same amounts) ✅
- Orders (all preserved) ✅
- Customer data (unchanged) ✅

---

## 🚫 What NOT To Do

❌ Don't interrupt the process mid-flight
❌ Don't run migration multiple times simultaneously
❌ Don't edit products during migration
❌ Don't delete from database if migration fails
❌ Don't override Condolencias warning without understanding

---

## 📝 Log Entries to Check

After migration, check Admin → Settings → Registro de auditoría:

```
Action: catalog.migrate
Resource: catalog
Timestamp: [when you ran it]
Metadata:
{
  "dryRun": false,
  "allowCondolenciasOverwrite": false,
  "total": 54,
  "created": 52,
  "updated": 0,
  "failed": 0,
  "condolenciasOrdersFound": 0
}
```

This proves:
- Who ran it (audit log shows user)
- When (timestamp)
- With what settings (dry run or real)
- What happened (summary)

---

## Next Steps After Success

1. **Monitor for Errors** (24-48 hours)
   - Watch error logs
   - Check for 404s on images
   - Monitor performance

2. **Test Functionality** (Real-world use)
   - Browse catalog
   - Add products to cart
   - Complete test order
   - Verify checkout flow

3. **Prepare for GHL Sync** (Next phase)
   - Products now in database
   - Ready for syncing to GoHighLevel
   - Check GHL products endpoint
   - Plan next phase migration

---

**You're ready! Good luck with the migration! 🎉**

Questions? Check the full strategy guide: `MIGRATION_STRATEGY.md`
