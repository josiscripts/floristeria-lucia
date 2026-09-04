# Implementation Next Steps - READY TO CONTINUE

**Status:** 30% complete. Infrastructure in place. Ready for API/Frontend implementation.

**Last updated:** 2026-09-04 (session just ended with full audit + db migrations + server libs created)

---

## IMMEDIATE NEXT ACTIONS (In Order)

### 1. Update `/src/routes/api.admin.products.ts` POST Handler

**File:** `src/routes/api.admin.products.ts` lines 87-227 (POST handler)

**Problem:** Current code tries to create GHL FIRST. If GHL fails, entire product creation fails.

**Solution:** Create Supabase FIRST with `sync_status='pending'`, then try GHL. If GHL fails, just queue retry.

**Exact change needed:**

Replace lines 100-135 with this logic:

```typescript
// NEW FLOW: Create Supabase first, then GHL

// Step 1: Generate product-level SKU
const skuRes = await generateSKU(body.category || "complementos");
if (!skuRes.success) {
  return json({ error: `SKU generation failed: ${skuRes.error}` }, { status: 500 });
}
const productSku = skuRes.sku; // e.g., "FL-RAM-000123"

// Step 2: Create product in Supabase with sync_status='pending'
const productRes = await createProduct({
  ghl_product_id: null, // Will be filled after GHL succeeds
  name: body.name,
  description: body.description,
  category: body.category,
  active: body.active ?? true,
  cover_image_url: body.cover_image_url,
  has_color_variants: body.has_color_variants ?? false,
  sync_status: 'pending',
  sync_error: null,
});

if (!productRes.success) {
  return json({ error: `Failed to create product: ${productRes.error}` }, { status: 500 });
}

const productId = productRes.data!.id;

// Step 3: Try to create in GHL (non-blocking failure)
let ghlProductId: string | null = null;
let ghlError: string | null = null;

const ghlPayload: Record<string, any> = {
  name: body.name,
  description: body.description || "",
  category: body.category || "",
  status: "active",
};

if (body.category) {
  const collectionResult = await getGHLCollectionIdForCategory(body.category);
  if (collectionResult.success && collectionResult.collectionId) {
    ghlPayload["collectionIds"] = [collectionResult.collectionId];
  }
}

const ghlResult = await createGHLProduct(ghlPayload);

if (!("code" in ghlResult && "statusCode" in ghlResult)) {
  // GHL success
  ghlProductId = ghlResult.id;
  // Update product to synced
  await supabase.from("products")
    .update({ ghl_product_id: ghlProductId, sync_status: "synced" })
    .eq("id", productId);
} else {
  // GHL failed - but product already created in Supabase
  ghlError = `${ghlResult.code}: ${ghlResult.message}`;
  // Update product to error state with retry queued
  await supabase.from("products")
    .update({ sync_status: "error", sync_error: ghlError })
    .eq("id", productId);
  await queueSyncRetry(productId, "create", ghlError);
  // DO NOT return error - product was created successfully in Supabase
}

// Step 4: Create options with derived SKUs
// Use productSku from step 1: FL-RAM-000123 → FL-RAM-000123-01, FL-RAM-000123-02, etc.
// ONLY try GHL if we have ghlProductId from step 3

const createdOptions = [];
for (let i = 0; i < body.options.length; i++) {
  const opt = body.options[i];
  const optionSku = `${productSku}-${(i + 1).toString().padStart(2, "0")}`;
  
  // Try to create price in GHL only if product was synced
  let ghlPriceId: string | null = null;
  if (ghlProductId) {
    const locationId = process.env["GHL_LOCATION_ID"];
    const priceRes = await ensureProductPrice({
      ghlProductId,
      amount: opt.price_amount,
      currency: "EUR",
      sku: optionSku,
      priceName: opt.name,
      locationId,
    });
    ghlPriceId = priceRes.success ? priceRes.ghlPriceId : null;
  }

  // Create option in Supabase (regardless of GHL status)
  const optionRes = await createProductOption({
    product_id: productId,
    ghl_price_id: ghlPriceId || undefined,
    name: opt.name,
    price_amount: opt.price_amount,
    discount_percent: opt.discount_percent ?? 0,
    stock_quantity: opt.stock_quantity,
    sku: optionSku,
    active: true,
  });

  if (optionRes.success) {
    createdOptions.push(optionRes.data);
  }
}
```

**Then continue with Step 5 (colors), Step 6 (logging), Step 7 (return):**

Lines 182-227 can stay mostly the same, except:
- Remove the check that ghlProductId must exist (it might be pending)
- Return product with sync_status indicator

---

### 2. Add imports at top of `/src/routes/api.admin.products.ts`

**Add this import:**

```typescript
import { queueSyncRetry, updateSyncStatus } from "@/lib/sync-retry.server";
```

---

### 3. Update `src/components/admin/ProductForm.tsx`

Current state: Old form for product_metadata schema
New state: Unified form for new schema

**Create NEW `/src/components/admin/ProductForm.tsx`:**

Key features:
- Basic info: name, description, category, active switch
- SKU: Read-only display (auto-generated)
- Sync status: Badge showing pending/synced/error
- Options section: Embedded component listing options with add/edit/delete
- Images section: Embedded component with 10-image limit, URL input, reorder, primary selection
- Submit button: Creates new product OR updates existing
- Use conditional: `isEdit` prop to determine POST vs PUT

**Sections needed:**

```typescript
interface ProductFormProps {
  isEdit?: boolean;
  initialProduct?: SupabaseProduct;
  onSuccess?: (product: SupabaseProduct) => void;
}

export function ProductForm({ isEdit = false, initialProduct, onSuccess }: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialProduct?.category ?? "");
  const [active, setActive] = useState(initialProduct?.active ?? true);
  const [sku] = useState(initialProduct?.sku ?? "(auto-generated)");
  const [syncStatus] = useState(initialProduct?.sync_status ?? "pending");
  const [syncError] = useState(initialProduct?.sync_error ?? null);
  
  const [options, setOptions] = useState(initialProduct?.product_options ?? []);
  const [images, setImages] = useState(initialProduct?.product_images ?? []);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const endpoint = isEdit ? `/api/admin/products/${initialProduct!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";
    
    const payload = {
      name,
      description,
      category: categoryId,
      active,
      options: options.map(o => ({
        name: o.name,
        price_amount: o.price_amount,
        discount_percent: o.discount_percent,
        stock_quantity: o.stock_quantity,
      })),
      images: images.map(img => ({
        url: img.url,
        is_primary: img.is_primary,
        position: img.sort_order,
      })),
    };
    
    const response = await fetch(endpoint, {
      method,
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    if (data.success) {
      onSuccess?.(data.product);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Categoría *</Label>
            <CategorySelector value={categoryId} onChange={setCategoryId} />
          </div>
          <div className="flex items-center gap-2">
            <Label>Producto activo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div>
            <Label>SKU (Auto-generado)</Label>
            <Input value={sku} disabled />
          </div>
          {syncStatus === "error" && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              Error de sincronización: {syncError}
            </div>
          )}
          {syncStatus === "pending" && (
            <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
              Esperando sincronización con GoHighLevel...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Options Section */}
      <ProductOptionsEditor options={options} onChange={setOptions} />

      {/* Images Section */}
      <ProductImagesEditor images={images} onChange={setImages} />

      {/* Submit */}
      <Button type="submit">{isEdit ? "Actualizar" : "Crear"} Producto</Button>
    </form>
  );
}
```

---

### 4. Create `/src/components/admin/ProductOptionsEditor.tsx`

```typescript
interface ProductOption {
  id?: string;
  name: string;
  price_amount: number;
  discount_percent: number;
  stock_quantity: number | null;
  sku?: string; // Read-only, auto-generated
}

export function ProductOptionsEditor({ 
  options, 
  onChange 
}: { 
  options: ProductOption[];
  onChange: (opts: ProductOption[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newOption, setNewOption] = useState<ProductOption>({
    name: "",
    price_amount: 0,
    discount_percent: 0,
    stock_quantity: null,
  });

  const handleAdd = () => {
    onChange([...options, newOption]);
    setNewOption({ name: "", price_amount: 0, discount_percent: 0, stock_quantity: null });
  };

  const handleUpdate = (index: number, updated: ProductOption) => {
    const newOptions = [...options];
    newOptions[index] = updated;
    onChange(newOptions);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opciones / Precios</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio €</th>
              <th>Desc. %</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt, i) => (
              <tr key={i}>
                <td>{opt.name}</td>
                <td>{opt.price_amount}</td>
                <td>{opt.discount_percent}</td>
                <td>{opt.stock_quantity ?? "—"}</td>
                <td>
                  <Button variant="ghost" onClick={() => setEditingIndex(i)}>Editar</Button>
                  <Button variant="ghost" onClick={() => handleDelete(i)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add new option form */}
        <div className="mt-4 space-y-2">
          <Input placeholder="Nombre (ej: Básico)" value={newOption.name} onChange={e => setNewOption({...newOption, name: e.target.value})} />
          <Input type="number" placeholder="Precio €" value={newOption.price_amount} onChange={e => setNewOption({...newOption, price_amount: Number(e.target.value)})} />
          <Input type="number" placeholder="Descuento %" value={newOption.discount_percent} onChange={e => setNewOption({...newOption, discount_percent: Number(e.target.value)})} />
          <Input type="number" placeholder="Stock (opcional)" value={newOption.stock_quantity ?? ""} onChange={e => setNewOption({...newOption, stock_quantity: e.target.value ? Number(e.target.value) : null})} />
          <Button onClick={handleAdd}>+ Agregar Opción</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 5. Create `/src/components/admin/ProductImagesEditor.tsx`

**Key features:**
- Display X/10 counter
- Tab UI: Upload / URL
- Drag-to-reorder
- Delete button per image
- Radio button for primary image
- Reject 11th image

```typescript
interface ProductImage {
  id?: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  image_url?: string; // For Supabase schema compatibility
}

export function ProductImagesEditor({ images, onChange }: { images: ProductImage[]; onChange: (imgs: ProductImage[]) => void; }) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");

  const handleUpload = async (file: File) => {
    if (images.length >= 10) {
      alert("Máximo 10 imágenes");
      return;
    }
    // Upload to Supabase Storage (use existing upload endpoint)
    // const url = await uploadImage(file);
    // Then add to images
  };

  const handleUrlAdd = () => {
    if (images.length >= 10) {
      alert("Máximo 10 imágenes");
      return;
    }
    const newImage: ProductImage = {
      url: urlInput,
      is_primary: images.length === 0,
      sort_order: images.length,
    };
    onChange([...images, newImage]);
    setUrlInput("");
  };

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If deleted was primary, set first as primary
    if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
      newImages[0].is_primary = true;
    }
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(newImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imágenes ({images.length}/10)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab selector */}
        {images.length < 10 && (
          <Tabs value={tab} onValueChange={v => setTab(v as "upload" | "url")}>
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </TabsContent>
            <TabsContent value="url">
              <div className="flex gap-2">
                <Input placeholder="https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                <Button onClick={handleUrlAdd}>Añadir</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Image gallery */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url} alt={`Imagen ${i + 1}`} className="h-24 w-24 object-cover rounded" />
              {img.is_primary && <span className="absolute top-1 right-1 text-lg">⭐</span>}
              <div className="absolute bottom-1 left-1 right-1 flex gap-1">
                <button onClick={() => handleSetPrimary(i)} className="text-xs bg-blue-500 text-white px-1">★</button>
                <button onClick={() => handleDelete(i)} className="text-xs bg-red-500 text-white px-1">×</button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Database Migrations Already Created

✓ `20260904_add_sync_status_to_products.sql`
✓ `20260904_create_categories_table.sql`
✓ `20260904_make_ghl_product_id_nullable.sql`

**Status:** READY TO APPLY. Run these migrations on Supabase.

---

## Files Already Modified

- ✓ `src/lib/products.server.ts` - Updated CreateProductInput interface
- ✓ `src/lib/sync-retry.server.ts` - Created retry infrastructure
- ✗ `src/routes/api.admin.products.ts` - PARTIALLY MODIFIED (needs Step 1 completion above)

---

## Testing After Implementation

1. Create product via admin panel
   - Should save with sync_status='pending' immediately
   - Should then try GHL
   - Should update to 'synced' or 'error'

2. View product in catalog
   - Should appear if active=true

3. Edit product
   - Should preserve SKU
   - Should update both Supabase and GHL

4. Delete product
   - Should fail (403) if Condolencias category
   - Should fail (409) if product has orders
   - Should soft-delete otherwise

---

## Remaining Work (est. 10-13 hours total)

After these steps are implemented:

1. Complete routes for PUT/DELETE `/api/admin/products/$id`
2. Implement soft delete with order checking
3. Data migration endpoint for catalog.ts → Supabase
4. Update catalog frontend to prefer Supabase
5. Testing and verification
6. Documentation updates

---

**Ready for next session. No ambiguity. Just follow the exact changes above.**
