# DIAGNÓSTICO COMPLETO - FLUJO DE PRODUCTOS

## Estado Actual (2026-08-31)

### GHL (GoHighLevel)
- **Ubicación:** vOq7yOWR63XGU4qQ7XWd
- **Productos:** 1 solo ("pepito", sin categoría, sin imagen)
- **Product Collections:** NO accesibles (401 Unauthorized - permisos insuficientes)
- **Campos disponibles:** id, name, description, price, cost, image, images, sku, category (vacío), status
- **Capacidades limitadas:** El token no tiene acceso a colecciones

### Catálogo Estático (catalog.ts)
- **Productos:** 46 totales
- **Categorías:** 5 (ramos, plantas, rosas-eternas, complementos, condolencias)
- **Distribución:**
  - Ramos: 5 productos
  - Plantas: 12 productos  
  - Rosas eternas: 4 productos
  - Complementos: 12 productos
  - Condolencias: 14 productos

### Supabase product_metadata
- **Tabla:** product_metadata
- **Campos:** ghl_product_id, legacy_catalog_id, price_max, available_colors, badge_label, rose_step, requires_quote, status, created_at, updated_at, deleted_at
- **Registros:** 0 (vacía)

## FLUJOS DE DATOS ACTUALES

### FLUJO 1: Admin Panel (/admin/products)
```
/admin/products/index.tsx
  ↓
useQueryClient + fetchProducts()
  ↓
GET /api/products (admin endpoint)
  ↓
getGHLProducts(locationId)
  ↓
GHL API /products/?locationId=...
  ↓
Respuesta: { products: [pepito], total: 1 }
  ↓
Normalización local (búsqueda/filtrado en memoria)
  ↓
Retorna al admin con paginación
```

**Problema:** Solo muestra "pepito", no ve los 46 del catálogo estático.

### FLUJO 2: Catálogo Público (/catalogo)
```
catalogo.tsx
  ↓
useGHLProducts({ limit: 500 })
  ↓
GET /api/ghl/products
  ↓
getGHLProducts(locationId)
  ↓
normalizeGHLProducts() → map a tipo frontend Product
  ↓
Si devuelve [pepito]:
  → "pepito" no tiene categoria válida
  → normalizeCategory() retorna undefined
  → producto se descarta (retorna null)
  → array final vacío
  ↓
FALLBACK a fallbackProducts (catalog.ts)
  ↓
Muestra 46 productos estáticos
```

**Resultado:** Catálogo público ve 46 productos, admin ve 1.

### FLUJO 3: Detalle Público (/producto/:id)
```
producto.$id.tsx
  ↓
useGHLProduct(id)
  ↓
GET /api/ghl/products/{id}
  ↓
Si falla (id no en GHL):
  ↓
FALLBACK a findProduct(id) de catalog.ts
  ↓
Muestra producto del catálogo estático
```

**Resultado:** Depende del fallback a catalog.ts.

### FLUJO 4: Edición/Creación Admin
```
/admin/products/new
  ↓
POST /api/products
  ↓
createGHLProduct()
  ↓
GHL API /products/ (POST)
  ↓
Crea en GHL
  ↓
Sincroniza metadata a Supabase
  ↓
Invalida queries
  ↓
Producto visible en /admin/products
```

**Problema:** ¿Aparece en catálogo público? Depende de si la normalización funciona.

## PROBLEMAS IDENTIFICADOS

### P1: Dos fuentes de verdad
- **GHL:** 1 producto (vacío de datos)
- **catalog.ts:** 46 productos (completos)
- **Resultado:** Admin ve GHL, público ve catalog.ts (INCONSISTENCIA)

### P2: Normalización rompe productos de GHL
- `normalizeGHLProduct()` requiere `category` válido
- "pepito" no tiene categoría
- Se descarta automáticamente
- Catalog público fallback a catalog.ts

### P3: Sin Product Collections
- GHL soporta collectionIds
- El token no tiene permisos para acceder
- El código nunca intenta usarlas
- No hay mapeo de categorías locales → colecciones GHL

### P4: Imágenes
- GHL devuelve fields vacíos para "pepito"
- No hay lógica de galería
- Fallback a placeholder.jpg

### P5: Metadata desincronizada
- Supabase product_metadata está vacío
- No hay sincronización automática
- Información adicional se pierde

### P6: Búsqueda/Filtrado
- Admin busca en memoria post-fetch (max 100 productos)
- No hay índices en GHL
- Performance O(n)

## ARQUITECTURA PROPUESTA

Para que GHL sea la fuente de verdad sin romper lo existente:

```
GHL (Source of Truth)
  ├─ Productos (actualizados)
  ├─ Metadata (sincronizado con Supabase)
  └─ Categoría por mapping: category → CategoryId local
  
Supabase
  ├─ product_metadata (enriquecimiento)
  ├─ Orders
  ├─ Opportunities
  └─ Users
  
Frontend Admin
  └─ GET /api/products → GHL products + metadata
  
Frontend Public
  └─ GET /api/ghl/products → GHL products + metadata
  └─ Fallback a catalog.ts solo para demo/testing
```

## ACCIONES INMEDIATAS REQUERIDAS

1. **Investigar permisos GHL:**
   - ¿Por qué no funciona /locations/?
   - ¿Por qué no funciona /collections/?
   - ¿El token necesita permisos elevados?

2. **Crear productos de prueba en GHL:**
   - TEST - Ramo Silvestre (category: "ramos")
   - TEST - Planta Decorativa (category: "plantas")
   - TEST - Rosa Eterna (category: "rosas-eternas")
   - TEST - Complemento Floral (category: "complementos")
   - TEST - Condolencias (category: "condolencias")

3. **Normalizar la normalización:**
   - Asegurar que AMBOS flujos (admin + público) usen la misma lógica
   - No duplicar normalización
   - Centralizar en un único lugar

4. **Sincronizar catalog.ts → GHL (OPCIONAL pero ideal):**
   - Script de migración de 46 productos
   - Crear en GHL en lotes
   - Mapear legacy_catalog_id → ghl_product_id

5. **Validar flujo completo:**
   - Crear producto en admin
   - Verificar que aparece en catálogo público
   - Editar producto
   - Verificar cambios reflejados

## IMPACTO DE CAMBIOS

Los cambios NO romperán:
- Autenticación
- Checkout
- Órdenes
- Usuarios
- Webhooks de oportunidades
- Sidebar
- Navegación
- Estilos

Los cambios SÍ afectarán:
- `/admin/products` - mostrará productos reales de GHL
- `/catalogo` - si tiene normalización correcta
- `/producto/:id` - dependerá de qué hay en GHL

