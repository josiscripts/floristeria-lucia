# Product Management API Specification

## Overview

Complete REST API for product management with GoHighLevel (GHL) synchronization, supporting:
- Full CRUD operations (Create, Read, Update, Delete)
- Product options (pricing tiers, sizes, variants)
- Product images and color variants
- Automatic synchronization with GHL
- Order protection (soft delete for products with order history)
- Comprehensive error tracking and sync status monitoring

**Base URL:** `/api/admin/products`

**Authentication:** All endpoints require admin role via `withAdminGuard` middleware

---

## Core Concepts

### Sync Status Tracking

Products maintain a `sync_status` field to track GHL synchronization state:

| Status | Meaning | Behavior |
|--------|---------|----------|
| `pending` | Awaiting sync to GHL | Sync attempted during creation; may retry |
| `synced` | Successfully synchronized | Product linked to GHL and orders can reference it |
| `error` | Sync failed | `sync_error` contains failure details; manual intervention needed |

### Deletion Strategy

Products are deleted based on order history:

| Scenario | Action | Result |
|----------|--------|--------|
| Product has orders | Soft delete | Set `deleted_at`, mark inactive in GHL, preserve history |
| No orders | Hard delete | Cascade delete to options, images, colors; remove from GHL |

### Product Relationships

```
Product (1) ──┬─→ (N) Product Options
              ├─→ (N) Product Images
              ├─→ (N) Color Variants
              └─→ (1) GHL Product
```

---

## Endpoints

### 1. LIST PRODUCTS
**GET** `/api/admin/products`

Retrieve paginated list of products with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category: `ramos`, `plantas`, `rosas-eternas`, `complementos`, `condolencias` |
| `active` | boolean | No | Filter by active status (`true` or `false`) |
| `search` | string | No | Search by product name (case-insensitive, partial match) |
| `sync_status` | string | No | Filter by sync status: `pending`, `synced`, `error` |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/admin/products?category=ramos&active=true&search=Rojo" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ghl_product_id": "prod_xyz123",
      "name": "Ramo Rojo Premium",
      "description": "Arreglo elegante de rosas rojas",
      "category": "ramos",
      "active": true,
      "cover_image_url": "https://cdn.example.com/products/ramo-rojo.jpg",
      "has_color_variants": false,
      "sync_status": "synced",
      "sync_error": null,
      "created_at": "2026-09-04T10:30:00Z",
      "updated_at": "2026-09-04T10:35:00Z",
      "deleted_at": null,
      "options": [
        {
          "id": "option-id-1",
          "product_id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Básico",
          "price_amount": "39.99",
          "discount_percent": "0",
          "price_final": "39.99",
          "stock_quantity": 15,
          "sku": "FL-RAM-0001",
          "ghl_price_id": "price_123",
          "active": true,
          "created_at": "2026-09-04T10:30:00Z",
          "updated_at": "2026-09-04T10:30:00Z",
          "deleted_at": null
        },
        {
          "id": "option-id-2",
          "product_id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Premium",
          "price_amount": "59.99",
          "discount_percent": "10",
          "price_final": "53.99",
          "stock_quantity": 8,
          "sku": "FL-RAM-0002",
          "ghl_price_id": "price_124",
          "active": true,
          "created_at": "2026-09-04T10:30:30Z",
          "updated_at": "2026-09-04T10:30:30Z",
          "deleted_at": null
        }
      ],
      "colors": []
    }
  ],
  "total": 1
}
```

---

### 2. CREATE PRODUCT
**POST** `/api/admin/products`

Create a new product with options, images, and optional color variants.

#### Request Body

```typescript
{
  // Required
  name: string;                    // Product name (non-empty)
  options: ProductOptionInput[];   // At least 1 option required
  
  // Optional
  description?: string;            // Product description
  category?: CategoryId;           // One of: ramos, plantas, rosas-eternas, complementos, condolencias
  active?: boolean;                // Default: true
  cover_image_url?: string;        // Primary display image URL
  has_color_variants?: boolean;    // Default: false (true only for rosas-eternas)
  
  // Nested: Product Options
  options: [
    {
      name: string;                // "Básico", "Premium", "Pequeño", etc.
      price_amount: number;        // Price in EUR (must be > 0)
      discount_percent?: number;   // 0-100 (default: 0)
      stock_quantity?: number;     // Inventory count (null = no tracking)
      sku?: string;                // Auto-generated if not provided
    }
  ]
  
  // Nested: Images
  images?: [
    {
      url: string;                 // Image URL
      alt_text?: string;           // Accessibility text
      is_primary?: boolean;        // First image auto-marked primary
      color_variant_id?: string;   // Link to color variant (rosas-eternas only)
    }
  ]
  
  // Nested: Color Variants (rosas-eternas only)
  color_variants?: [
    {
      name: string;                // "Rojo", "Rosa", "Blanco", etc.
      sort_order?: number;         // Display order (0-based)
    }
  ]
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/admin/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramo Rojo Premium",
    "description": "Arreglo elegante de rosas rojas",
    "category": "ramos",
    "active": true,
    "cover_image_url": "https://cdn.example.com/products/ramo-rojo.jpg",
    "has_color_variants": false,
    "options": [
      {
        "name": "Básico",
        "price_amount": 39.99,
        "discount_percent": 0,
        "stock_quantity": 20,
        "sku": "FL-RAM-0001"
      },
      {
        "name": "Premium",
        "price_amount": 59.99,
        "discount_percent": 10,
        "stock_quantity": 10,
        "sku": "FL-RAM-0002"
      }
    ],
    "images": [
      {
        "url": "https://cdn.example.com/products/ramo-rojo-1.jpg",
        "alt_text": "Ramo de rosas rojas vista principal",
        "is_primary": true
      },
      {
        "url": "https://cdn.example.com/products/ramo-rojo-2.jpg",
        "alt_text": "Ramo de rosas rojas vista lateral"
      }
    ]
  }'
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ghl_product_id": "prod_xyz123",
    "name": "Ramo Rojo Premium",
    "description": "Arreglo elegante de rosas rojas",
    "category": "ramos",
    "active": true,
    "cover_image_url": "https://cdn.example.com/products/ramo-rojo.jpg",
    "has_color_variants": false,
    "sync_status": "synced",
    "sync_error": null,
    "created_at": "2026-09-04T10:30:00Z",
    "updated_at": "2026-09-04T10:30:00Z",
    "deleted_at": null,
    "options": [
      {
        "id": "opt-1",
        "name": "Básico",
        "price_amount": "39.99",
        "discount_percent": "0",
        "price_final": "39.99",
        "stock_quantity": 20,
        "sku": "FL-RAM-0001",
        "ghl_price_id": "price_123",
        "active": true
      },
      {
        "id": "opt-2",
        "name": "Premium",
        "price_amount": "59.99",
        "discount_percent": "10",
        "price_final": "53.99",
        "stock_quantity": 10,
        "sku": "FL-RAM-0002",
        "ghl_price_id": "price_124",
        "active": true
      }
    ],
    "colors": []
  },
  "syncStatus": "synced",
  "syncError": null
}
```

#### Error Responses

```json
// 400 - Validation Error
{
  "success": false,
  "error": "Product name is required and must be a non-empty string"
}

// 400 - Invalid Category
{
  "success": false,
  "error": "Invalid category. Must be one of: ramos, plantas, rosas-eternas, complementos, condolencias"
}

// 400 - Missing Options
{
  "success": false,
  "error": "At least one option is required"
}

// 500 - GHL Sync Failed (non-blocking)
{
  "success": true,
  "data": { /* product created in Supabase */ },
  "syncStatus": "error",
  "syncError": "GHL_LOCATION_ID not configured"
}
```

---

### 3. GET PRODUCT BY ID
**GET** `/api/admin/products/:id`

Retrieve a single product with all its relations (options, images, colors).

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ghl_product_id": "prod_xyz123",
    "name": "Ramo Rojo Premium",
    "description": "Arreglo elegante de rosas rojas",
    "category": "ramos",
    "active": true,
    "cover_image_url": "https://cdn.example.com/products/ramo-rojo.jpg",
    "has_color_variants": false,
    "sync_status": "synced",
    "sync_error": null,
    "created_at": "2026-09-04T10:30:00Z",
    "updated_at": "2026-09-04T10:30:00Z",
    "deleted_at": null,
    "options": [ /* array of product options */ ],
    "colors": [ /* array of color variants (empty if has_color_variants=false) */ ]
  }
}
```

#### Error Responses

```json
// 404 - Product Not Found
{
  "success": false,
  "error": "Product not found"
}

// 400 - Missing ID
{
  "success": false,
  "error": "Missing product ID"
}
```

---

### 4. UPDATE PRODUCT
**PUT** `/api/admin/products/:id`

Update product metadata and/or manage relations (options, images, colors).

#### Request Body (Partial)

```typescript
{
  // Update metadata (all optional)
  name?: string;
  description?: string;
  category?: CategoryId;
  active?: boolean;
  cover_image_url?: string;
  has_color_variants?: boolean;
  
  // Manage options
  options?: {
    add?: ProductOptionInput[];           // Create new options
    update?: Array<{                      // Modify existing options
      id: string;
      name?: string;
      price_amount?: number;
      discount_percent?: number;
      stock_quantity?: number | null;
      sku?: string;
    }>;
    delete?: string[];                    // Remove options (by ID)
  };
  
  // Manage images
  images?: {
    add?: ProductImageInput[];            // Create new images
    delete?: string[];                    // Remove images (by ID)
  };
  
  // Manage color variants
  color_variants?: {
    add?: ColorVariantInput[];            // Create new colors
    delete?: string[];                    // Remove colors (by ID)
  };
}
```

#### Request Examples

**Update metadata only:**
```bash
curl -X PUT "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramo Rojo Premium - Edición 2026",
    "description": "Arreglo elegante de rosas rojas con follaje premium",
    "active": true
  }'
```

**Add new option:**
```bash
curl -X PUT "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "add": [
        {
          "name": "Deluxe",
          "price_amount": 79.99,
          "discount_percent": 5,
          "stock_quantity": 5,
          "sku": "FL-RAM-0003"
        }
      ]
    }
  }'
```

**Update and delete options:**
```bash
curl -X PUT "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "update": [
        {
          "id": "opt-1",
          "price_amount": 44.99,
          "stock_quantity": 25
        }
      ],
      "delete": ["opt-old-id"]
    }
  }'
```

**Add images:**
```bash
curl -X PUT "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": {
      "add": [
        {
          "url": "https://cdn.example.com/products/ramo-rojo-3.jpg",
          "alt_text": "Detalle de flores"
        }
      ]
    }
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": { /* updated product with all relations */ }
}
```

#### Error Responses

```json
// 404 - Product Not Found
{
  "success": false,
  "error": "Product not found"
}

// 500 - GHL Sync Error (recorded in product)
{
  "success": false,
  "error": "Failed to sync to GHL: API rate limit exceeded"
}
```

---

### 5. DELETE PRODUCT
**DELETE** `/api/admin/products/:id`

Delete a product with intelligent soft/hard delete based on order history.

#### Deletion Logic

1. **Has Orders** → Soft delete
   - Set `deleted_at` timestamp
   - Deactivate in GHL (`status: inactive`)
   - Preserve order history for reconciliation
   - Return `method: soft`

2. **No Orders** → Hard delete
   - Cascade delete: options, images, color variants
   - Remove from GHL
   - Complete record removal
   - Return `method: hard`

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/admin/products/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Response (200 OK) - Soft Delete

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

#### Response (200 OK) - Hard Delete

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

#### Error Responses

```json
// 404 - Product Not Found
{
  "success": false,
  "error": "Product not found"
}

// 400 - Missing ID
{
  "success": false,
  "error": "Missing product ID"
}
```

---

## Data Models

### Product

```typescript
interface Product {
  id: UUID;
  ghl_product_id: string | null;      // GoHighLevel product ID
  name: string;                       // Product name
  description: string | null;         // Optional description
  category: 'ramos' | 'plantas' | 'rosas-eternas' | 'complementos' | 'condolencias' | null;
  active: boolean;                    // Soft delete flag
  cover_image_url: string | null;     // Primary image URL
  has_color_variants: boolean;        // Color selection UI toggle
  sync_status: 'pending' | 'synced' | 'error';  // GHL sync status
  sync_error: string | null;          // Last sync error message
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
  deleted_at: ISO8601Timestamp | null;  // Soft delete marker
}
```

### ProductOption

```typescript
interface ProductOption {
  id: UUID;
  product_id: UUID;                   // Foreign key to products
  ghl_price_id: string | null;        // GoHighLevel price ID
  name: string;                       // Option name ("Básico", "Premium", etc.)
  price_amount: Decimal;              // Base price in EUR
  discount_percent: Decimal;          // Discount 0-100%
  price_final: Decimal;               // Auto-calculated final price
  stock_quantity: integer | null;     // Inventory (null = no tracking)
  sku: string;                        // Stock Keeping Unit
  active: boolean;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
  deleted_at: ISO8601Timestamp | null;
}
```

### ProductImage

```typescript
interface ProductImage {
  id: UUID;
  product_id: UUID;                   // Foreign key to products
  color_variant_id: UUID | null;      // Optional FK to color_variants
  image_url: string;                  // S3/CDN URL
  alt_text: string | null;            // Accessibility text
  is_primary: boolean;                // Display as main product image
  sort_order: integer;                // Display order
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
}
```

### ColorVariant

```typescript
interface ColorVariant {
  id: UUID;
  product_id: UUID;                   // Foreign key to products
  name: string;                       // Color name ("Rojo", "Rosa", etc.)
  sort_order: integer;                // Display order (0-based)
  active: boolean;
  created_at: ISO8601Timestamp;
  updated_at: ISO8601Timestamp;
}
```

---

## GHL Synchronization

### How Sync Works

1. **Product Creation (POST)**
   - Create product in Supabase with `sync_status='pending'`
   - Create options with generated SKUs
   - Attempt GHL sync (non-blocking)
   - On success: Update `ghl_product_id` and set `sync_status='synced'`
   - On failure: Record error in `sync_error`, keep `sync_status='error'`

2. **Product Update (PUT)**
   - Update metadata in Supabase
   - Handle option/image/color changes
   - Re-sync product metadata to GHL if changed
   - Update prices in GHL for option changes
   - Update `sync_status` based on result

3. **Product Deletion (DELETE)**
   - If has orders: Soft delete, deactivate in GHL
   - If no orders: Hard delete, remove from GHL
   - GHL failures don't block deletion (logged only)

### Sync Error Recovery

Products with `sync_status='error'` require manual intervention:

```typescript
// Admin can retry sync by:
// 1. Update the product (PUT) with no changes
// 2. This triggers re-sync attempt
// 3. Check sync_status and sync_error after operation
```

---

## Category & SKU Management

### Valid Categories

| Category | Use Case |
|----------|----------|
| `ramos` | Flower bouquets |
| `plantas` | Potted plants |
| `rosas-eternas` | Preserved roses (supports color variants) |
| `complementos` | Gifts, cards, accessories |
| `condolencias` | Sympathy arrangements |

### SKU Generation

- Auto-generated if not provided: `FL-{CATEGORY}-{SEQUENCE}`
- Example: `FL-RAM-0001`, `FL-PLANT-0042`
- Unique constraint enforced at database level
- Can be overridden during product creation

---

## Validation Rules

### Product Name
- Required, non-empty string
- Max 255 characters (database constraint)
- Trimmed of leading/trailing whitespace

### Options
- Minimum 1 required per product
- Price amount must be > 0
- Discount percent must be 0-100
- Stock quantity can be null (no tracking) or >= 0

### Category
- Must be from allowed list if provided
- null is valid (no category assigned)
- Used for SKU generation and GHL collection mapping

### Color Variants
- Only for `has_color_variants=true`
- Typically used for rosas-eternas category
- Unique per product (product_id, name constraint)
- Sort order 0-based

---

## Error Handling

### Non-Blocking vs Blocking Errors

**Blocking Errors** (fail the request):
- Missing required fields
- Invalid input (negative prices, invalid categories)
- Database errors (product not found, FK violations)
- Authentication/authorization failures

**Non-Blocking Errors** (logged but don't fail):
- GHL sync failures (product still created in Supabase)
- GHL deactivation/deletion during product deletion
- Partial GHL sync (some prices succeed, some fail)
- Missing GHL_LOCATION_ID (product created but sync fails)

### Error Response Format

```typescript
// Blocking error
{
  "success": false,
  "error": "Error description"
}

// Non-blocking error (creation succeeded despite GHL sync failure)
{
  "success": true,
  "data": { /* created product */ },
  "syncStatus": "error",
  "syncError": "GHL sync failed: API rate limit"
}
```

---

## Implementation Checklist

- [x] POST /api/admin/products - Create with GHL sync
- [x] GET /api/admin/products - List with filters
- [x] GET /api/admin/products/:id - Get single
- [x] PUT /api/admin/products/:id - Update with option/image/color management
- [x] DELETE /api/admin/products/:id - Soft/hard delete based on orders
- [x] Validation and error handling
- [x] Admin logging for all actions
- [x] Sync status tracking and error recording
- [x] TypeScript types without `as any`
- [x] Product image management
- [x] Color variant support
- [x] Order protection (soft delete)
- [x] GHL collection mapping

---

## Integration Example

```typescript
// Frontend: Create product with options
async function createProduct(data) {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramo Rojo Premium',
      category: 'ramos',
      active: true,
      options: [
        { name: 'Básico', price_amount: 39.99, stock_quantity: 20 },
        { name: 'Premium', price_amount: 59.99, discount_percent: 10, stock_quantity: 10 }
      ],
      images: [
        { url: 'https://cdn.example.com/ramo-rojo-1.jpg', alt_text: 'Main image', is_primary: true }
      ]
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Product created:', result.data.id);
    console.log('GHL sync status:', result.syncStatus);
    if (result.syncError) {
      console.warn('GHL sync error:', result.syncError);
    }
  } else {
    console.error('Creation failed:', result.error);
  }
}

// Frontend: Update product pricing
async function updateProductPricing(productId, optionUpdates) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      options: {
        update: optionUpdates.map(opt => ({
          id: opt.id,
          price_amount: opt.newPrice,
          stock_quantity: opt.newStock
        }))
      }
    })
  });
  
  return await response.json();
}

// Frontend: Delete product (automatic soft/hard based on orders)
async function deleteProduct(productId) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: 'DELETE'
  });
  
  const result = await response.json();
  console.log(`Product deleted using ${result.data.method} delete`);
  console.log('Message:', result.data.message);
}
```

---

## See Also

- [Database Schema](./DATABASE.md)
- [GHL Integration Guide](./ARCHITECTURE.md#ghl-integration)
- [Admin Operations](./SECURITY.md#admin-endpoints)
