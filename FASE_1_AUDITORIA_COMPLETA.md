# FASE 1: AUDITORÍA COMPLETA - SISTEMA DE PRODUCTOS

Fecha: 2026-09-04  
Objetivo: Auditar el estado actual ANTES de simplificar a Supabase-only sin GHL

---

## 1. ESQUEMA ACTUAL EN SUPABASE (según types.ts)

### 1.1 Tabla `products`

**COLUMNAS ACTUALES:**
```
Row: {
  active: boolean
  category: string | null          ← STRING, no FK
  cover_image_url: string | null
  created_at: string
  deleted_at: string | null
  description: string | null
  ghl_product_id: string           ← REQUIRED (NOT NULL)
  has_color_variants: boolean
  id: string                        ← UUID PK
  name: string
  updated_at: string
}
```

**ANÁLISIS:**
- ✓ Tiene estructura básica correcta
- ✗ ghl_product_id es REQUIRED (NOT NULL) - PROBLEMA para Supabase-only
- ✗ category es VARCHAR, no FK - debe ser category_id con FK
- ✗ Sin sync_status/sync_error (migraciones no aplicadas)
- ✗ Sin SKU a nivel de producto

---

### 1.2 Tabla `product_options`

**COLUMNAS ACTUALES:**
```
Row: {
  active: boolean
  created_at: string
  deleted_at: string | null
  discount_percent: number
  ghl_price_id: string | null      ← FK a GHL
  id: string                        ← UUID PK
  name: string
  price_amount: number
  price_final: number
  product_id: string               ← FK a products ✓
  sku: string | null
  stock_quantity: number | null
  updated_at: string
}
```

**ANÁLISIS:**
- ✓ Estructura correcta
- ✓ Tiene FK a products
- ✗ ghl_price_id debe eliminarse
- ✗ SKU está aquí, no en products

---

### 1.3 Tabla `product_images`

**COLUMNAS ACTUALES:**
```
Row: {
  color_variant_id: string | null  ← FK a color_variants
  created_at: string | null
  id: string                        ← UUID PK
  image_url: string
  is_primary: boolean
  position: number | null
  product_id: string | null        ← FK a products (puede ser NULL ⚠️)
  sort_order: number | null
  updated_at: string | null
}
```

**ANÁLISIS:**
- ✓ Estructura correcta
- ⚠️ product_id puede ser NULL - debe ser NOT NULL
- ✓ No tiene referencias a GHL
- ✓ Tiene color_variant_id para rosas-eternas

---

### 1.4 Tabla `color_variants`

**COLUMNAS ACTUALES:**
```
Row: {
  active: boolean
  created_at: string
  id: string                        ← UUID PK
  name: string
  product_id: string               ← FK a products ✓
  sort_order: integer
  updated_at: string
}
```

**ANÁLISIS:**
- ✓ Estructura correcta
- ✓ FK a products
- ✓ No tiene referencias a GHL

---

### 1.5 Tabla `product_metadata`

**COLUMNAS ACTUALES:**
```
Row: {
  auto_created: boolean | null
  available_colors: string[] | null
  badge_label: string | null
  category: string | null
  created_at: string | null
  deleted_at: string | null
  ghl_price_id: string | null
  ghl_product_id: string           ← REQUIRED
  id: string                        ← UUID PK
  legacy_catalog_id: string | null
  location_id: string              ← REQUIRED
  price_max: number | null
  price_min: number | null
  requires_quote: boolean | null
  rose_step: number | null
  sku: string | null
  status: string | null
  updated_at: string | null
}
```

**ANÁLISIS:**
- ⚠️ SISTEMA ANTIGUO - Tabla paralela a products
- ✗ Mucho acoplamiento a GHL (location_id, ghl_product_id)
- ? ¿Se está usando actualmente en producción?

---

### 1.6 Tabla `categories` (PROPUESTA)

**ESTADO:**
- Migration file EXISTS: `20260904_create_categories_table.sql`
- **PERO NO HA SIDO APLICADA** a Supabase (no aparece en types.ts)

---

### 1.7 Tabla `orders`

**COLUMNAS QUE NOS IMPORTAN:**
```
product_id: string | null        ← Referencia a ¿qué tabla? ⚠️
ghl_contact_id: string | null
ghl_opportunity_id: string | null
```

**ANÁLISIS:**
- ⚠️ order.product_id NO tiene FK definida en tipos
- ⚠️ Usa ghl_contact_id y ghl_opportunity_id

---

## 2. MIGRACIONES CREADAS PERO NO APLICADAS

| Archivo | Estado | Contenido |
|---------|--------|-----------|
| `20260904_add_sync_status_to_products.sql` | ❌ NO APLICADA | Agrega sync_status, sync_error a products |
| `20260904_create_categories_table.sql` | ❌ NO APLICADA | Crea tabla categories con ghl_collection_id |
| `20260904_make_ghl_product_id_nullable.sql` | ❌ NO APLICADA | Hace ghl_product_id nullable (NOT NULL → NULL) |

**DECISIÓN:** Estas migraciones fueron diseñadas para GHL. Para Supabase-only, necesitaremos **NUEVAS migraciones**.

---

## 3. ANÁLISIS DE DEPENDENCIAS - ARCHIVOS QUE USAN GHL

### Tier 1: CRÍTICOS (Importados por rutas activas)

| Archivo | Usado Por | Función | Puede Eliminarse |
|---------|-----------|---------|-----------------|
| `src/lib/products.server.ts` | `/api/admin/products.ts` | Crear/actualizar productos | ❌ NO - modificar para Supabase-only |
| `src/lib/orders.server.ts` | `/api/orders.ts` | Gestionar órdenes | ⚠️ REVISAR - usos de GHL |
| `src/routes/api.admin.products.ts` | Admin panel | POST crear producto | ❌ NO - reescribir |
| `src/routes/api.admin.products.$id.ts` | Admin panel | PUT/DELETE producto | ❌ NO - reescribir |
| `src/hooks/useSupabaseProducts.ts` | `catalogo.tsx` | Cargar productos | ❌ NO - verificar |
| `src/routes/catalogo.tsx` | Catálogo público | Mostrar productos | ❌ NO - modificar |

### Tier 2: SECUNDARIOS (Utilidades/Servicios)

| Archivo | Usado Por | Función | Puede Eliminarse |
|---------|-----------|---------|-----------------|
| `src/lib/ghl/client.server.ts` | Múltiples | Cliente GHL API | ✅ SÍ - eliminar completamente |
| `src/lib/ghl/types.ts` | Múltiples | Tipos GHL | ✅ SÍ - eliminar completamente |
| `src/lib/sync-retry.server.ts` | `/api/admin/products.ts` | Retry GHL sync | ✅ SÍ - eliminar |
| `src/lib/price-sync.server.ts` | `/api/admin/products.ts` | Sync precios GHL | ✅ SÍ - eliminar |
| `src/lib/category-collection.server.ts` | `/api/admin/products.ts` | Mapeo categoría-GHL | ✅ SÍ - eliminar |
| `src/lib/normalize-ghl-product.ts` | Scripts/debug | Normalizar GHL | ✅ SÍ - eliminar |
| `src/lib/convert-supabase-product.ts` | `catalogo.tsx` | Conversión formato | ⚠️ REVISAR - ver qué hace |
| `src/lib/product-metadata.server.ts` | Múltiples endpoints | Gestionar product_metadata | ⚠️ REVISAR - quién lo usa |

### Tier 3: ENDPOINTS/RUTAS ESPECIALIZADAS

| Archivo | Ruta | Función | Puede Eliminarse |
|---------|------|---------|-----------------|
| `src/routes/api.webhooks.ghl-product.ts` | `/api/webhooks/ghl-product` | Webhook productos GHL | ✅ SÍ - eliminar |
| `src/routes/api.webhooks.ghl-opportunity.ts` | `/api/webhooks/ghl-opportunity` | Webhook oportunidades GHL | ✅ SÍ - eliminar |
| `src/routes/api.ghl.products.ts` | `/api/ghl/products` | GET productos GHL | ✅ SÍ - eliminar |
| `src/routes/api.ghl.products.$id.ts` | `/api/ghl/products/$id` | GET producto GHL | ✅ SÍ - eliminar |
| `src/lib/admin/populate-product-metadata.server.ts` | Debug | Populate product_metadata | ✅ SÍ - eliminar |
| `src/lib/admin/diagnose-sync.server.ts` | Debug | Diagnóstico sync GHL | ✅ SÍ - eliminar |
| `src/routes/api.admin.diagnose-metadata.ts` | Debug | Debug metadata | ✅ SÍ - eliminar |
| `src/routes/api.admin.debug-metadata.ts` | Debug | Debug metadata | ✅ SÍ - eliminar |
| `src/routes/api.admin.sync-catalog.ts` | Batch migrate | Sync catalog GHL | ✅ MODIFICAR - para Supabase |
| `src/routes/api.admin.migrate-catalog.ts` | Batch migrate | Migrate catalog GHL | ✅ MODIFICAR - para Supabase |

### Tier 4: HOOKS ESPECIALIZADOS

| Archivo | Usado Por | Función | Puede Eliminarse |
|---------|-----------|---------|-----------------|
| `src/hooks/useGHLProduct.ts` | ¿? | Hook producto GHL | ✅ SÍ - eliminar |
| `src/hooks/useGHLProducts.ts` | ¿? | Hook productos GHL | ✅ SÍ - eliminar |

### Tier 5: COMPONENTES ADMIN

| Archivo | Usado Por | Función | Puede Eliminarse |
|---------|-----------|---------|-----------------|
| `src/components/admin/GHLStatusBadge.tsx` | Rutas admin | Badge estado GHL | ✅ SÍ - eliminar |
| `src/components/admin/ProductFormNew.tsx` | `products.new.tsx` | Formulario crear | ❌ MODIFICAR - eliminar referencias GHL |
| `src/components/admin/ProductForm.tsx` | `products.$id.tsx` | Formulario editar | ❌ MODIFICAR - eliminar referencias GHL |

---

## 4. BÚSQUEDA DE REFERENCIAS A product_metadata

```
ARCHIVOS QUE IMPORTAN product_metadata:

✗ src/routes/api.admin.debug-metadata.ts
✗ src/routes/api.admin.diagnose-metadata.ts
✗ src/routes/api.admin.sync-catalog.ts
✗ src/routes/api.upload.product-image.ts
✗ src/lib/admin/api.ts
✗ src/lib/admin/diagnose-sync.server.ts
✗ src/lib/admin/populate-product-metadata.server.ts
✗ src/integrations/supabase/types.ts (solo tipos)
✗ src/lib/product-metadata.server.ts

PREGUNTA: ¿Alguno de estos es parte de un flujo ACTIVO en producción?
```

---

## 5. BÚSQUEDA DE REFERENCIAS A catalog.ts

```
ARCHIVOS QUE IMPORTAN catalog.ts:

✓ src/routes/catalogo.tsx         (catalogo público - activo)
✓ src/routes/catalogo.$productId.tsx (detalle producto)
✓ src/components/admin/ProductForm.tsx (formulario)
✓ src/components/admin/ProductFormNew.tsx (formulario)
✓ src/lib/admin/api.ts (tipos)
✓ src/i18n/catalog-text.ts (i18n)
✓ src/data/services.ts (servicios relacionados)

PREGUNTA: ¿Se puede reemplazar catalog.ts → products de Supabase?
```

---

## 6. ANÁLISIS DE FLUJOS ACTIVOS

### 6.1 Admin: Crear Producto

```
products.new.tsx
  ↓
ProductFormNew
  ↓
createProductNew() en src/lib/admin/api.ts
  ↓
POST /api/admin/products
  ↓
src/routes/api.admin.products.ts
  ↓
Imports: products.server.ts, ghl/client.server.ts, sync-retry, price-sync, category-collection
```

**CONCLUSIÓN:** Este flujo está 100% acoplado a GHL. Necesita reescritura completa.

---

### 6.2 Admin: Editar Producto

```
products.$id.tsx
  ↓
ProductForm
  ↓
updateProduct() en src/lib/admin/api.ts
  ↓
PUT /api/admin/products/$id
  ↓
src/routes/api.admin.products.$id.ts
  ↓
Imports: products.server.ts, ghl/client.server.ts
```

**CONCLUSIÓN:** Este flujo está acoplado a GHL. Necesita reescritura.

---

### 6.3 Admin: Desactivar Producto

```
products.$id.tsx (botón Desactivar)
  ↓
deactivateProduct() en src/lib/admin/api.ts
  ↓
PUT /api/admin/products/$id?action=deactivate
  ↓
src/routes/api.admin.products.$id.ts
```

**CONCLUSIÓN:** Este flujo toca GHL. Necesita reescritura.

---

### 6.4 Catálogo Público

```
catalogo.tsx
  ↓
useSupabaseProducts()
  ↓
Queries Supabase: products, product_options, product_images, color_variants
  ↓
convert-supabase-product (?)
  ↓
Mostrar en catálogo
```

**CONCLUSIÓN:** Este flujo YA es Supabase-based. Solo verificar que funciona correctamente.

---

## 7. ESTADO ACTUAL DE DATOS

### 7.1 ¿Qué hay en Supabase actualmente?

**VERIFICACIÓN NECESARIA:**
```
- ¿Cuántos registros en products?
- ¿Cuántos en product_options?
- ¿Cuántos en product_images?
- ¿Cuántos en product_metadata?
- ¿Hay datos duplicados?
- ¿Las IDs de GHL están pobladas?
```

### 7.2 ¿Qué hay en src/data/catalog.ts?

```
- 54 productos hardcodeados (según documentación anterior)
- Necesitan migrar a products si falta alguno
```

---

## 8. CHECKLIST DE COSAS QUE REQUIEREN DECISIÓN

### 8.1 ¿Qué hacemos con ghl_product_id en products?

```
OPCIÓN A: Hacer nullable (permite crear sin GHL)
OPCIÓN B: Eliminar la columna directamente
OPCIÓN C: Migrar a columna legacy_ghl_product_id (histórico)
```

**RECOMENDACIÓN:** Opción A (nullable) es más segura. Permite migración gradual.

### 8.2 ¿Qué hacemos con product_metadata?

```
OPCIÓN A: Mantener tabla para histórico
OPCIÓN B: Migrar datos → products y eliminar
OPCIÓN C: Dejar como está (deprecated)
```

**RECOMENDACIÓN:** Primero verificar si se usa en algún flujo activo.

### 8.3 ¿Qué hacemos con category como VARCHAR?

```
OPCIÓN A: Migrar a category_id con FK a nueva tabla categories
OPCIÓN B: Mantener como está (simple pero no normalizado)
```

**RECOMENDACIÓN:** Opción A (normalizar con FK).

### 8.4 ¿Orders.product_id tiene FK definida?

```
VERIFICACIÓN NECESARIA: Ver tipos de Supabase y migraciones
¿Es FK a products?
¿Es FK a product_metadata?
¿Sin FK?
```

---

## 9. MIGRACIONES QUE NECESITAMOS CREAR

### 9.1 Para Supabase-only (NO GHL)

```
1. Hacer ghl_product_id nullable
   - Razón: Permite crear productos sin sincronizar con GHL

2. Crear tabla categories
   - id, name, slug, display_order (SIN ghl_collection_id)
   
3. Agregar category_id FK a products
   - Migrar values de category VARCHAR → category_id
   
4. Hacer product_images.product_id NOT NULL
   - Garantizar integridad referencial

5. (Opcional) Crear column SKU en products
   - Actualmente solo existe en product_options
```

---

## 10. RESUMEN PARA FASE 1

| Aspecto | Estado | Acción |
|--------|--------|--------|
| Schema actual | Parcialmente OK | Necesita ajustes menores |
| Migraciones GHL | No aplicadas | Descartar, crear nuevas |
| Flujos admin | 100% acoplados GHL | Reescribir sin GHL |
| Catálogo público | Ya Supabase-based | Verificar que funciona |
| Datos en Supabase | ¿? | Auditar cantidad y estado |
| Datos en catalog.ts | 54 productos | Mantener hasta migrar |
| product_metadata | Usado en ? | Verificar si se usa |
| catalog.ts | Usado en 6 archivos | Reemplazar por products |

---

## 11. PRÓXIMOS PASOS (NO IMPLEMENTAR AÚN)

1. ✅ AUDITORÍA COMPLETADA (Este documento)
2. ⏳ FASE 1.2: Verificar datos actuales en Supabase
3. ⏳ FASE 1.3: Mapear exactamente cuáles archivos se pueden eliminar con seguridad
4. ⏳ FASE 2: Definir schema final propuesto
5. ⏳ FASE 3: Reescribir CRUD sin GHL
6. ⏳ FASE 4: Verificar catálogo
7. ⏳ FASE 5: Comparar datos catalog.ts vs Supabase
8. ⏳ FASE 6: Regenerar tipos
9. ⏳ FASE 7: Limpiar código (SOLO cuando todo funcione)

---

**IMPORTANTE: NO BORRES NI MODIFIQUES CÓDIGO TODAVÍA**

Este documento es un DIAGNÓSTICO. Sirve para tomar decisiones informadas antes de implementar cambios.

