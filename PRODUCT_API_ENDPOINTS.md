# Product API Endpoints Reference

## Quick Reference

| Method | Endpoint | Purpose | Auth | Returns |
|--------|----------|---------|------|---------|
| GET | `/api/admin/products` | List all products | Admin | Products array |
| POST | `/api/admin/products` | Create product | Admin | Created product |
| GET | `/api/admin/products/:id` | Get single product | Admin | Product with relations |
| PUT | `/api/admin/products/:id` | Update product | Admin | Updated product |
| DELETE | `/api/admin/products/:id` | Delete product | Admin | Delete method + status |

---

## Endpoint Summary

### GET /api/admin/products - List Products

```
Purpose:    Retrieve all products with optional filtering
Method:     GET
Auth:       Admin required
Status:     200 OK | 500 Internal Server Error

Query Parameters:
  ?category=ramos
  ?active=true
  ?search=Rojo
  ?sync_status=synced

Response:
  {
    "success": true,
    "products": [{ id, name, category, options[], colors[], ... }],
    "total": 15
  }
```

### POST /api/admin/products - Create Product

```
Purpose:    Create new product with options, images, colors
Method:     POST
Auth:       Admin required
Status:     201 Created | 400 Bad Request | 500 Internal Server Error

Required Body:
  {
    "name": "Ramo Rojo",
    "options": [
      { "name": "Básico", "price_amount": 39.99, ... }
    ]
  }

Optional Body:
  {
    "description": "...",
    "category": "ramos",
    "active": true,
    "cover_image_url": "...",
    "has_color_variants": false,
    "images": [{ "url": "...", "alt_text": "..." }],
    "color_variants": [{ "name": "Rojo", ... }]
  }

Response:
  {
    "success": true,
    "data": { product object with all relations },
    "syncStatus": "synced",
    "syncError": null
  }
```

### GET /api/admin/products/:id - Get Product

```
Purpose:    Retrieve single product with all relations
Method:     GET
Auth:       Admin required
Status:     200 OK | 404 Not Found | 500 Internal Server Error

Path Parameters:
  :id = Product UUID

Response:
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "Ramo Rojo",
      "category": "ramos",
      "options": [{ id, name, price_amount, price_final, ... }],
      "colors": [{ id, name, sort_order, ... }],
      "sync_status": "synced",
      "sync_error": null,
      ...
    }
  }
```

### PUT /api/admin/products/:id - Update Product

```
Purpose:    Update product metadata and/or manage relations
Method:     PUT
Auth:       Admin required
Status:     200 OK | 400 Bad Request | 404 Not Found | 500 Internal Server Error

Path Parameters:
  :id = Product UUID

Body (all optional):
  {
    "name": "New Name",
    "description": "New description",
    "category": "ramos",
    "active": true,
    "cover_image_url": "...",
    "has_color_variants": false,
    
    "options": {
      "add": [{ name, price_amount, ... }],
      "update": [{ id, name, price_amount, ... }],
      "delete": ["opt-id-1", "opt-id-2"]
    },
    
    "images": {
      "add": [{ url, alt_text, ... }],
      "delete": ["img-id-1"]
    },
    
    "color_variants": {
      "add": [{ name, sort_order }],
      "delete": ["color-id-1"]
    }
  }

Response:
  {
    "success": true,
    "data": { updated product object }
  }
```

### DELETE /api/admin/products/:id - Delete Product

```
Purpose:    Delete product (soft if has orders, hard if clean)
Method:     DELETE
Auth:       Admin required
Status:     200 OK | 404 Not Found | 500 Internal Server Error

Path Parameters:
  :id = Product UUID

Response (Soft Delete - Has Orders):
  {
    "success": true,
    "data": {
      "method": "soft",
      "message": "Product archived (soft delete) - Order history preserved",
      "productId": "uuid"
    }
  }

Response (Hard Delete - No Orders):
  {
    "success": true,
    "data": {
      "method": "hard",
      "message": "Product permanently deleted",
      "productId": "uuid"
    }
  }
```

---

## Request/Response Examples

### Example: Create Ramo (Bouquet) with Multiple Options

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Ramo Rojo Premium",
    "description": "Arreglo elegante de rosas rojas frescas",
    "category": "ramos",
    "active": true,
    "cover_image_url": "https://cdn.example.com/ramo-rojo-main.jpg",
    "has_color_variants": false,
    "options": [
      {
        "name": "Básico",
        "price_amount": 39.99,
        "discount_percent": 0,
        "stock_quantity": 25,
        "sku": "FL-RAM-RED-001"
      },
      {
        "name": "Premium",
        "price_amount": 59.99,
        "discount_percent": 10,
        "stock_quantity": 12,
        "sku": "FL-RAM-RED-002"
      },
      {
        "name": "Deluxe",
        "price_amount": 89.99,
        "discount_percent": 15,
        "stock_quantity": 5,
        "sku": "FL-RAM-RED-003"
      }
    ],
    "images": [
      {
        "url": "https://cdn.example.com/ramo-rojo-main.jpg",
        "alt_text": "Ramo de rosas rojas vista principal",
        "is_primary": true
      },
      {
        "url": "https://cdn.example.com/ramo-rojo-detail.jpg",
        "alt_text": "Detalle de flores y follaje"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ghl_product_id": "prod_abc123xyz",
    "name": "Ramo Rojo Premium",
    "description": "Arreglo elegante de rosas rojas frescas",
    "category": "ramos",
    "active": true,
    "cover_image_url": "https://cdn.example.com/ramo-rojo-main.jpg",
    "has_color_variants": false,
    "sync_status": "synced",
    "sync_error": null,
    "created_at": "2026-09-04T10:30:00.000Z",
    "updated_at": "2026-09-04T10:30:00.000Z",
    "deleted_at": null,
    "options": [
      {
        "id": "opt-001",
        "product_id": "550e8400-e29b-41d4-a716-446655440000",
        "ghl_price_id": "price_abc001",
        "name": "Básico",
        "price_amount": "39.99",
        "discount_percent": "0.00",
        "price_final": "39.99",
        "stock_quantity": 25,
        "sku": "FL-RAM-RED-001",
        "active": true,
        "created_at": "2026-09-04T10:30:00.000Z",
        "updated_at": "2026-09-04T10:30:00.000Z",
        "deleted_at": null
      },
      {
        "id": "opt-002",
        "product_id": "550e8400-e29b-41d4-a716-446655440000",
        "ghl_price_id": "price_abc002",
        "name": "Premium",
        "price_amount": "59.99",
        "discount_percent": "10.00",
        "price_final": "53.99",
        "stock_quantity": 12,
        "sku": "FL-RAM-RED-002",
        "active": true,
        "created_at": "2026-09-04T10:30:00.000Z",
        "updated_at": "2026-09-04T10:30:00.000Z",
        "deleted_at": null
      },
      {
        "id": "opt-003",
        "product_id": "550e8400-e29b-41d4-a716-446655440000",
        "ghl_price_id": "price_abc003",
        "name": "Deluxe",
        "price_amount": "89.99",
        "discount_percent": "15.00",
        "price_final": "76.49",
        "stock_quantity": 5,
        "sku": "FL-RAM-RED-003",
        "active": true,
        "created_at": "2026-09-04T10:30:00.000Z",
        "updated_at": "2026-09-04T10:30:00.000Z",
        "deleted_at": null
      }
    ],
    "colors": []
  },
  "syncStatus": "synced",
  "syncError": null
}
```

---

### Example: Create Rosas Eternas (Preserved Roses) with Color Variants

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Rosa Eterna Premium",
    "description": "Flor preservada que dura años",
    "category": "rosas-eternas",
    "active": true,
    "cover_image_url": "https://cdn.example.com/rosa-eterna-main.jpg",
    "has_color_variants": true,
    "options": [
      {
        "name": "Standard Box",
        "price_amount": 49.99,
        "stock_quantity": 30
      }
    ],
    "color_variants": [
      { "name": "Rojo", "sort_order": 0 },
      { "name": "Rosa", "sort_order": 1 },
      { "name": "Blanco", "sort_order": 2 },
      { "name": "Morado", "sort_order": 3 }
    ],
    "images": [
      {
        "url": "https://cdn.example.com/rosa-rojo-main.jpg",
        "alt_text": "Rosa Eterna Rojo",
        "is_primary": true,
        "color_variant_id": null
      }
    ]
  }'
```

---

### Example: Update Product Pricing

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "options": {
      "update": [
        {
          "id": "opt-001",
          "price_amount": 44.99,
          "stock_quantity": 30
        },
        {
          "id": "opt-002",
          "price_amount": 64.99,
          "discount_percent": 12,
          "stock_quantity": 15
        }
      ]
    }
  }'
```

---

### Example: Add New Option to Product

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "options": {
      "add": [
        {
          "name": "Mega",
          "price_amount": 119.99,
          "discount_percent": 20,
          "stock_quantity": 3,
          "sku": "FL-RAM-RED-004"
        }
      ]
    }
  }'
```

---

### Example: Delete Product (Auto Soft/Hard)

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response if has orders (Soft Delete):**
```json
{
  "success": true,
  "data": {
    "method": "soft",
    "message": "Product archived (soft delete) - Order history preserved",
    "productId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response if no orders (Hard Delete):**
```json
{
  "success": true,
  "data": {
    "method": "hard",
    "message": "Product permanently deleted",
    "productId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Error Examples

### 400 - Missing Required Field

```json
{
  "success": false,
  "error": "Product name is required and must be a non-empty string"
}
```

### 400 - Invalid Category

```json
{
  "success": false,
  "error": "Invalid category. Must be one of: ramos, plantas, rosas-eternas, complementos, condolencias"
}
```

### 400 - No Options

```json
{
  "success": false,
  "error": "At least one option is required"
}
```

### 400 - Invalid Price

```json
{
  "success": false,
  "error": "Option 2: name and positive price_amount are required"
}
```

### 404 - Product Not Found

```json
{
  "success": false,
  "error": "Product not found"
}
```

### 500 - GHL Sync Failed (Product Still Created)

```json
{
  "success": true,
  "data": { "id": "...", "name": "..." },
  "syncStatus": "error",
  "syncError": "GHL_LOCATION_ID not configured"
}
```

### 500 - Database Error

```json
{
  "success": false,
  "error": "Database connection failed"
}
```

---

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | GET, PUT, DELETE successful |
| 201 | Created | POST successful |
| 400 | Bad Request | Validation error, missing required fields |
| 401 | Unauthorized | Missing admin authorization |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Product doesn't exist |
| 500 | Server Error | Database or GHL API failure |

---

## Common Workflows

### Workflow 1: Create Product for Sale

```
1. POST /api/admin/products
   - Create with name, category, options
   - Result: Product synced to GHL with prices
   
2. Check sync_status
   - If "synced" → Ready for sale
   - If "error" → Review sync_error, retry with PUT
   
3. Customers can now order using this product
```

### Workflow 2: Update Pricing

```
1. GET /api/admin/products/:id
   - Review current prices and options
   
2. PUT /api/admin/products/:id
   - Update option prices
   - Discount percent applied
   - Prices re-synced to GHL
   
3. Verify sync_status
   - Changes live immediately for new orders
```

### Workflow 3: Archive Product (Has Orders)

```
1. DELETE /api/admin/products/:id
   
2. API checks order history
   - Finds existing orders
   - Performs SOFT delete
   
3. Result:
   - Product marked deleted_at
   - Shows in GHL as inactive
   - Orders preserved for history
```

### Workflow 4: Remove Product (No Orders)

```
1. DELETE /api/admin/products/:id
   
2. API checks order history
   - No orders found
   - Performs HARD delete
   
3. Result:
   - Product completely removed
   - Cascade deletes options, images, colors
   - Removed from GHL
```

---

## Implementation Notes

### No Type Casting Required

All endpoints use strong TypeScript types from the database schema:

```typescript
// ✓ Safe - Typed
const product: Product = await getProduct(id);

// ✗ Avoided - Type casting
const product = await getProduct(id) as any;
```

### Non-Blocking Error Handling

GHL sync failures don't prevent product creation:

```typescript
// Product created in Supabase ✓
// GHL sync failed ✗
// Result: sync_status = 'error', but product usable

// Admin can retry by updating product (PUT)
```

### Automatic SKU Generation

SKUs auto-generated if not provided:

```typescript
// Provided SKU
{ name: "Básico", price_amount: 39.99, sku: "FL-RAM-001" }

// Auto-generated SKU
{ name: "Básico", price_amount: 39.99 }
// Result: FL-RAM-0042 (next in sequence)
```

### Soft Delete Protection

Products with orders automatically soft-deleted:

```
DELETE /api/admin/products/id
  ↓
Check order_items.ghl_product_id
  ├─ Found → soft delete (preserves history)
  └─ Not found → hard delete (complete removal)
```

---

## See Also

- [Specification](./PRODUCT_API_SPECIFICATION.md) - Detailed API docs
- [Implementation](./PRODUCT_API_IMPLEMENTATION.md) - Code guide
- [Database](./DATABASE.md) - Schema details
