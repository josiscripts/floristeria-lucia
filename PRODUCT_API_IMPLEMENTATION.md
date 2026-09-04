# Product API Implementation Guide

## Quick Start

The complete Product Management API is implemented in a single comprehensive TypeScript file with full type safety and error handling.

### File Location

```
src/routes/api.admin.products.complete.ts
```

This file contains all 5 endpoints in a single, cohesive module:
- `GET /api/admin/products` - List products
- `POST /api/admin/products` - Create product
- `GET /api/admin/products/:id` - Get single product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

---

## Architecture

### Core Components

#### 1. Validation Layer
```typescript
validateCreateInput(body: unknown)
// - Validates name, options, category
// - Checks price amounts and option structure
// - Returns typed data or error message
```

#### 2. GHL Sync Layer
```typescript
syncProductToGHL(product, options, isUpdate?)
// - Creates/updates product in GoHighLevel
// - Syncs prices for each option
// - Returns SyncResult { success, ghlProductId, error }
```

#### 3. Relationship Management
```typescript
handleOptionChanges(productId, changes, ghlProductId)
handleImageChanges(productId, changes)
handleColorChanges(productId, changes)
// - Add, update, delete operations
// - Non-blocking error handling
```

#### 4. Deletion Logic
```typescript
hasProductOrders(productId)
// - Checks if product has order history
// - Determines soft vs hard delete strategy
```

---

## Type Safety (No `as any`)

All code uses explicit TypeScript types from database schema:

```typescript
import type { Database } from "@/integrations/supabase/types";

// Typed database access
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Product type from schema
type Product = Database["public"]["Tables"]["products"]["Row"];

// Option type from schema
type ProductOption = Database["public"]["Tables"]["product_options"]["Row"];

// Image type from schema
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];

// Color variant type from schema
type ColorVariant = Database["public"]["Tables"]["color_variants"]["Row"];
```

No unsafe type assertions (`as any`, `any`, etc.) used anywhere in the implementation.

---

## API Endpoint Details

### POST /api/admin/products (Create)

**Flow:**

```
1. Validate input (name, options, category)
   ↓
2. Create product in Supabase (sync_status='pending')
   ↓
3. Create options with auto-generated SKUs
   ↓
4. Create color variants if applicable
   ↓
5. Create images if provided
   ↓
6. Sync to GHL (non-blocking)
   ├─ Success → Update ghl_product_id, sync_status='synced'
   └─ Failure → Record error in sync_error, sync_status='error'
   ↓
7. Log admin action
   ↓
8. Return product with sync status
```

**Key Features:**
- Non-blocking GHL sync (product created even if GHL fails)
- Automatic SKU generation if not provided
- First image auto-marked as primary
- Sync status tracking for monitoring

**Example Implementation:**

```typescript
// Controller (frontend code)
const createProductFormData = {
  name: "Ramo Rojo Premium",
  description: "Arreglo elegante de rosas rojas",
  category: "ramos",
  active: true,
  options: [
    { name: "Básico", price_amount: 39.99, stock_quantity: 20 },
    { name: "Premium", price_amount: 59.99, discount_percent: 10, stock_quantity: 10 }
  ],
  images: [
    { url: "https://cdn.example.com/ramo-1.jpg", alt_text: "Main", is_primary: true }
  ]
};

// API call
const response = await fetch('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify(createProductFormData)
});

const { data, syncStatus, syncError } = await response.json();

if (syncStatus === 'error') {
  console.warn('Product created but GHL sync failed:', syncError);
  // Show warning but don't block user
} else {
  console.log('Product created and synced successfully');
}
```

---

### PUT /api/admin/products/:id (Update)

**Flow:**

```
1. Validate product exists
   ↓
2. Update metadata if provided (name, description, category, etc.)
   ↓
3. Handle option changes
   ├─ Add new options → Create in Supabase, create prices in GHL
   ├─ Update options → Update in Supabase
   └─ Delete options → Soft delete
   ↓
4. Handle image changes
   ├─ Add images → Create records
   └─ Delete images → Remove records
   ↓
5. Handle color variant changes
   ├─ Add colors → Create variants
   └─ Delete colors → Deactivate
   ↓
6. Re-sync to GHL if metadata changed
   ├─ Success → sync_status='synced'
   └─ Failure → sync_status='error'
   ↓
7. Log admin action
   ↓
8. Return updated product
```

**Partial Update Example:**

```typescript
// Update only price on an existing option
const updateData = {
  options: {
    update: [
      {
        id: "option-uuid-here",
        price_amount: 45.99,
        stock_quantity: 15
      }
    ]
  }
};

const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  body: JSON.stringify(updateData)
});
```

**Cascading Update Example:**

```typescript
// Update product + add new option + remove old image
const updateData = {
  name: "Ramo Rojo Premium - New Name",
  description: "Updated description",
  options: {
    add: [
      { name: "Deluxe", price_amount: 79.99, stock_quantity: 5 }
    ]
  },
  images: {
    delete: ["old-image-uuid"]
  }
};

const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  body: JSON.stringify(updateData)
});
```

---

### DELETE /api/admin/products/:id (Delete)

**Flow:**

```
1. Validate product exists
   ↓
2. Check if product has orders
   ├─ YES: Soft delete
   │  ├─ Set deleted_at timestamp
   │  ├─ Deactivate in GHL (status=inactive)
   │  ├─ Preserve order history
   │  └─ Log "product.delete.soft"
   │
   └─ NO: Hard delete
      ├─ Cascade delete options, images, colors
      ├─ Remove from GHL
      ├─ Complete record removal
      └─ Log "product.delete.hard"
   ↓
3. Return success with delete method
```

**Order Check Logic:**

```typescript
// Checks if any order_items reference this product
async function hasProductOrders(productId: string): Promise<boolean> {
  const product = await getProduct(productId);
  if (!product.data?.ghl_product_id) return false;
  
  // Query order_items by ghl_product_id
  const { data } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("ghl_product_id", product.data.ghl_product_id);
  
  return (data?.length ?? 0) > 0;
}
```

**Example:**

```typescript
// Delete product (automatic soft/hard)
const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'DELETE'
});

const { data } = await response.json();

if (data.method === 'soft') {
  console.log('Product archived (has order history)');
} else {
  console.log('Product permanently deleted');
}
```

---

## Error Handling Strategy

### Error Categories

#### 1. **Validation Errors** (400)
Caught before database operations, fail the request:
```typescript
if (!body.name || body.name.trim().length === 0) {
  return json({ error: "Product name is required" }, { status: 400 });
}
```

#### 2. **Database Errors** (404, 500)
Query failures, FK violations, missing records:
```typescript
if (!result.success) {
  return json({ error: result.error }, { status: 500 });
}
```

#### 3. **GHL Sync Errors** (Non-blocking)
Product created in Supabase even if GHL fails:
```typescript
const syncResult = await syncProductToGHL(product, options);
if (!syncResult.success) {
  // Product already created, just record error
  await updateProductSyncStatus(productId, "error", syncResult.error);
}

return json({
  success: true,  // Supabase operation succeeded
  data: product,
  syncStatus: "error",  // But GHL failed
  syncError: syncResult.error
});
```

### Sync Error Recording

Failed syncs are recorded in the product:

```typescript
// Database schema
sync_status: 'pending' | 'synced' | 'error'
sync_error: string | null  // Contains failure message (no secrets)

// Example error messages:
// - "GHL_LOCATION_ID not configured"
// - "Failed to update GHL product: API rate limit exceeded"
// - "Unknown GHL sync error"
```

---

## Integration with Existing Code

### Required Libraries (Already Installed)

```typescript
// TanStack Router & Start
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

// Database
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Admin functions
import { withAdminGuard, logAdminAction } from "@/lib/admin/guard.server";

// Product functions
import {
  createProduct,
  createProductOption,
  listProducts,
  getProductWithOptions,
  updateProduct,
  deleteProduct,
  /* ... more functions ... */
} from "@/lib/products.server";

// GHL functions
import {
  createGHLProduct,
  updateGHLProduct,
  deleteGHLProduct,
} from "@/lib/ghl/client.server";

// Utilities
import { generateSKU } from "@/lib/sku-generator.server";
import { ensureProductPrice } from "@/lib/price-sync.server";
import { getGHLCollectionIdForCategory } from "@/lib/category-collection.server";
```

### Environment Variables (Required)

Ensure these are configured in `.env.local`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# GoHighLevel
GHL_PRIVATE_INTEGRATION_TOKEN=bearer_...
GHL_LOCATION_ID=your_location_id
```

---

## Admin Logging

Every operation logs an audit trail:

```typescript
await logAdminAction({
  userId: admin.user.id,              // Admin who performed action
  action: "product.create",           // Action type
  resource: "products",               // Resource type
  recordId: productId,                // What was affected
  metadata: {                         // Additional context
    name: "Ramo Rojo",
    category: "ramos",
    options_count: 2,
    sync_status: "synced"
  }
});
```

**Action Types:**
- `product.create` - Product created
- `product.update` - Product updated
- `product.delete.soft` - Soft delete (has orders)
- `product.delete.hard` - Hard delete (no orders)

---

## Testing

### Manual Testing Commands

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Ramo",
    "category": "ramos",
    "options": [
      {"name": "Basic", "price_amount": 29.99}
    ]
  }'
```

**List Products:**
```bash
curl -X GET "http://localhost:3000/api/admin/products?category=ramos&active=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Get Single Product:**
```bash
curl -X GET http://localhost:3000/api/admin/products/{product-id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Update Product:**
```bash
curl -X PUT http://localhost:3000/api/admin/products/{product-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Updated Name",
    "options": {
      "add": [
        {"name": "Premium", "price_amount": 49.99}
      ]
    }
  }'
```

**Delete Product:**
```bash
curl -X DELETE http://localhost:3000/api/admin/products/{product-id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Unit Test Template

```typescript
describe("Product API", () => {
  describe("POST /api/admin/products", () => {
    it("should create product with options", async () => {
      const response = await request.post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Product",
          category: "ramos",
          options: [
            { name: "Basic", price_amount: 29.99 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.sync_status).toMatch(/pending|synced|error/);
    });

    it("should validate required fields", async () => {
      const response = await request.post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" }); // Missing options

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle GHL sync failures gracefully", async () => {
      // Mock GHL to fail
      jest.mock("@/lib/ghl/client.server");
      
      const response = await request.post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test",
          options: [{ name: "Basic", price_amount: 29.99 }]
        });

      expect(response.status).toBe(201); // Still succeeds
      expect(response.body.syncStatus).toBe("error");
      expect(response.body.syncError).toBeDefined();
    });
  });

  describe("DELETE /api/admin/products/:id", () => {
    it("should soft delete product with orders", async () => {
      // Setup: Product with orders
      const productId = await createTestProduct();
      await createTestOrder(productId);

      const response = await request.delete(`/api/admin/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.method).toBe("soft");

      // Verify deleted_at is set
      const deleted = await getProduct(productId);
      expect(deleted.data.deleted_at).toBeDefined();
    });

    it("should hard delete product without orders", async () => {
      const productId = await createTestProduct();

      const response = await request.delete(`/api/admin/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.method).toBe("hard");
    });
  });
});
```

---

## Performance Considerations

### Database Queries

- **List**: Single query with optional filters
- **Get by ID**: Single query + N+1 for relations (options, colors)
  - Consider using `getProductWithOptions` helper
- **Create**: 4-5 queries (product, options, colors, images)
- **Update**: 1-3 queries + cascade updates
- **Delete**: 1 query + FK cascade

### GHL API Calls

- **Create**: 1 product + N price calls (non-blocking)
- **Update**: 1 product + N price calls (if changed)
- **Delete**: 1 soft delete call (non-blocking)

### Optimization Tips

```typescript
// Batch option updates to reduce API calls
// Instead of:
for (const opt of options) {
  await updateProductOption(opt.id, opt.data); // N queries
}

// Consider:
// Update in bulk via database function or single transaction
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] GHL integration token valid and not expired
- [ ] GHL location ID correct
- [ ] Database migrations applied (products, options, colors, images tables)
- [ ] Admin role/permissions configured
- [ ] Audit logging enabled
- [ ] Error monitoring/Sentry configured
- [ ] Test data created for integration testing
- [ ] Admin UI updated to call new endpoints
- [ ] Documentation shared with team

---

## Troubleshooting

### Sync Status Stuck in "pending"

**Cause:** GHL_LOCATION_ID not configured
```bash
# Check environment
echo $GHL_LOCATION_ID  # Should output location ID
```

**Solution:** Add to `.env.local`:
```bash
GHL_LOCATION_ID=your_actual_location_id
```

### Product Created but No GHL Sync

**Expected behavior:** Check `sync_status`:
```typescript
if (product.sync_status === 'error') {
  console.error('GHL sync failed:', product.sync_error);
  // Product exists in Supabase but not in GHL
  // Orders can still reference it
}
```

**Recovery:** Update product (PUT) to retry sync

### Option Price Not Updating in GHL

**Cause:** `ghl_price_id` missing from option
```typescript
// Option created without GHL price
const opt = await getProductOption(optionId);
console.log(opt.ghl_price_id); // null

// Fix: Update option via PUT to create price
```

**Solution:** Add price through admin UI or API

### Orders Preventing Hard Delete

**Expected:** Products with orders use soft delete
```typescript
// This returns method: 'soft'
DELETE /api/admin/products/{id}

// Query order_items by ghl_product_id
// If any found → soft delete
// If none found → hard delete
```

**Debug:** Check orders for product
```sql
SELECT * FROM order_items 
WHERE ghl_product_id = 'prod_xyz123';
```

---

## See Also

- [API Specification](./PRODUCT_API_SPECIFICATION.md)
- [Database Schema](./DATABASE.md)
- [GHL Integration](./ARCHITECTURE.md#ghl-integration)
