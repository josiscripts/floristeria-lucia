# FASE 3D.3 — Migration Instructions

## Supabase Migration: Orders and Order Items

The SQL migration for creating `orders` and `order_items` tables is in:

```
migrations.sql
```

### How to Execute

Since the Supabase JavaScript client cannot execute raw SQL directly, you must execute this migration manually using one of these methods:

#### Method 1: Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com/projects
2. Select project: **floristeria-lucia**
3. In left menu, click **SQL Editor**
4. Click **New Query**
5. Copy all content from `migrations.sql`
6. Paste into the SQL editor
7. Click **Run** (blue button)
8. Wait for confirmation message

#### Method 2: Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Create migration
supabase migration create orders_and_items

# Edit the generated migration file: supabase/migrations/[timestamp]_orders_and_items.sql
# Paste the content from migrations.sql

# Push to database
supabase db push
```

#### Method 3: psql (if you have direct PostgreSQL access)

```bash
psql -h db.xxxx.supabase.co -U postgres -d postgres -f migrations.sql
```

### What Gets Created

- **Table: `orders`** (143 rows / columns defined)
  - Primary key: id (UUID)
  - Foreign relationship: order_items (1:N)
  - Constraints: email format, status enum, totals ≥ 0
  - Indexes: email, ghl_contact_id, status, created_at, delivery_date
  - Triggers: automatic updated_at timestamp

- **Table: `order_items`** (with foreign key to orders)
  - Primary key: id (UUID)
  - Foreign key: order_id → orders.id (ON DELETE CASCADE)
  - Constraints: quantity > 0, prices > 0
  - Indexes: order_id, ghl_product_id
  - Triggers: automatic updated_at timestamp

### After Migration

Verify tables were created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items');
```

Should return:
```
orders
order_items
```

### Next Steps (FASE 3D.4)

After confirming the migration succeeded:

1. Implement `src/routes/api.orders.ts`
2. Implement `src/routes/checkout.tsx`
3. Implement `src/routes/confirmation.$orderId.tsx`
4. Implement order creation logic

### TypeScript Types

The TypeScript types for `orders` and `order_items` have been added to:

```
src/integrations/supabase/types.ts
```

These are ready to use immediately after the migration succeeds.

### Important Notes

- ✅ Token protection: GHL_PRIVATE_INTEGRATION_TOKEN remains server-side only
- ✅ Data safety: No user data modified during migration
- ✅ Backward compatible: product_metadata table unchanged
- ⚠️ Manual execution required: JavaScript client limitation
- 📌 Verify after 5 minutes: Allow time for Supabase indexing

## Status

- Migration file: ✅ Ready (`migrations.sql`)
- TypeScript types: ✅ Added (`src/integrations/supabase/types.ts`)
- Build: ✅ Successful
- Supabase execution: ⏳ Pending (manual execution required)
