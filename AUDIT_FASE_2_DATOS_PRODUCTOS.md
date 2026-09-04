# AUDITORÍA FASE 2: ESTADO ACTUAL DE LOS 68 PRODUCTOS

**Fecha:** 2026-08-31  
**Objetivo:** Mapear exactamente qué información existe en GHL y Supabase antes de FASE 3  
**Status:** AUDITORÍA COMPLETADA - SIN MODIFICACIONES

---

## RESUMEN EJECUTIVO

| Métrica                        | Cantidad | Estado                                      |
| ------------------------------ | -------- | ------------------------------------------- |
| **Productos en GHL**           | 68       | Visibles, sin metadata                      |
| **Productos en Supabase**      | 3        | Incompletos (0 con categoría, 0 con precio) |
| **Productos en catalog.ts**    | 50       | Referencia legacy                           |
| **Coincidencia GHL ↔ catalog** | ~51/68   | Parcial (~75%)                              |
| **Collections en GHL**         | 0        | Token sin acceso / no existen               |

---

## FASE 1: AUDITORÍA GHL - ESTRUCTURA DE LOS 68 PRODUCTOS

### Campos presentes en cada producto:

```
_id, locationId, name, description, productType, variants,
isTaxesEnabled, taxes, excludedStoreIds, status, displayPriority,
trackProductInventory, createdAt, updatedAt, variantsLength,
hasVariants, hasPrices, <algunos tienen: image>
```

### Hallazgos críticos:

| Campo             | Con datos | Sin datos | % Completitud |
| ----------------- | --------- | --------- | ------------- |
| **image**         | 1         | 67        | 1.5%          |
| **medias**        | 0         | 68        | 0%            |
| **variants**      | 0         | 68        | 0%            |
| **hasPrices**     | 0         | 68        | 0%            |
| **priceIds**      | 0         | 68        | 0%            |
| **collectionIds** | 0         | 68        | 0%            |
| **category**      | 0         | 68        | 0%            |
| **sku**           | 0         | 68        | 0%            |
| **price**         | 0         | 68        | 0%            |

### Análisis de productos específicos:

**Productos de prueba detectados:**

- "TEST - Ramo Silvestre" (ID: 6a9560bcc330eca0575c4b20)
- "TEST productType PHYSICAL" (ID: 6a9560adbfd47b2be50b50ec)
- "pepito" (ID: 6a87b91004c302157108f01d)

**Productos reales:** ~65/68

### Conclusión GHL:

✗ **CRÍTICO:** No hay precios en GHL  
✗ **CRÍTICO:** No hay categorías en GHL  
✗ **CRÍTICO:** No hay imágenes (excepto 1)  
✗ **CRÍTICO:** No hay medias/files  
✗ **CRÍTICO:** No hay variants con precios  
✗ **CRÍTICO:** No hay collections asignadas

**Razón:** GHL v3 API solo persiste: `_id, name, description, productType`.  
Todos los campos adicionales deben estar en **Supabase** o en **otro servicio**.

---

## FASE 2: AUDITORÍA SUPABASE - PRODUCT_METADATA

### Estado de metadata:

```
Total registros: 3
├── Con categoría: 0
├── Con precio: 0
├── Con SKU: 0
├── Con legacy_catalog_id: 0
├── Con colores: 1
├── Con badge: 1
├── Con rose_step: 1
├── Con requires_quote: 0
├── Activos: 3
└── Eliminados (soft delete): 0
```

### Muestras de registros existentes:

**Registro 1:**

- GHL ID: `6a956539324935c27b152bb5`
- Category: MISSING
- Price: MISSING
- SKU: MISSING
- Legacy ID: MISSING
- Status: active

**Registro 2:**

- GHL ID: `undefined` ❌ **CORRUPTO**
- Category: MISSING
- Price: MISSING
- SKU: MISSING

**Registro 3:**

- GHL ID: `6a9568c0973de9c5b8125afe`
- Category: MISSING
- Price: MISSING
- SKU: MISSING

### Problemas detectados:

**CRÍTICO:** Solo 3 registros cuando hay 68 productos GHL  
**CRÍTICO:** Ningún registro tiene categoría  
**CRÍTICO:** Ningún registro tiene precio  
**CRÍTICO:** Un registro tiene ghl_product_id undefined (corrupto)  
**CRÍTICO:** Los 65 productos GHL NO tienen metadata en Supabase

### Conclusión Supabase:

✗ **CRÍTICO:** 65/68 productos sin metadata en Supabase  
✗ **CRÍTICO:** Metadata existente está incompleta (sin categoría, sin precio, sin SKU)  
✗ **CRÍTICO:** Un registro está corrupto (ghl_product_id undefined)

---

## FASE 3: AUDITORÍA PRODUCT COLLECTIONS - GHL

**Endpoint:** `GET /products/collections/?locationId=vOq7yOWR63XGU4qQ7XWd`  
**Status:** HTTP 401 - Token no autorizado  
**Resultado:** No se pudo verificar si existen collections

### Conclusión Collections:

✗ **ALTO:** Token no tiene permisos para collections  
✗ **ALTO:** Si existen collections, 0 productos están asignados (verificado vía collectionIds vacío)

---

## FASE 4: COMPARACIÓN CATALOG.TS vs GHL

### Totales:

- **catalog.ts:** 50 productos con metadata completa
- **GHL:** 68 productos (incluye 50 de catalog + 18 adicionales/test)
- **Coincidencia:** ~51/68 (75%)

### Distribución catalog.ts por categoría:

```
ramos: 6
plantas: 13
rosas-eternas: 4
complementos: 13
condolencias: 14
TOTAL: 50
```

### Productos GHL sin equivalente en catalog.ts:

- ~18 productos (incluye 3 de prueba, otros huérfanos)

### Conclusión Comparativa:

✗ **MEDIO:** catalog.ts NO está sincronizado con GHL  
✗ **MEDIO:** Los 68 productos GHL no son migración de catalog.ts  
✓ **Información:** catalog.ts conserva estructura correcta (categorías, precios)

---

## FASE 5: AUDITORÍA DE IMÁGENES

### Estado de imágenes en GHL:

```
Productos con image: 1/68 (1.5%)
Productos con medias: 0/68 (0%)

Desglose de medias:
- 0 medias: 0
- 1 media: 0
- >1 medias: 0
```

### Conclusión Imágenes:

✗ **CRÍTICO:** 67/68 productos sin imagen  
✗ **CRÍTICO:** 0 productos con medias/files  
⚠ **IMPACTO:** Catálogo actual muestra placeholder.jpg para todos

---

## RESUMEN POR SEVERIDAD

### 🔴 PROBLEMAS CRÍTICOS (Bloquean FASE 3)

1. **Sin precios en ningún lado**
   - GHL: 0 precios
   - Supabase: 0 precios
   - Impacto: Catálogo muestra priceMin: 0 para todos

2. **Sin categorías en ningún lado**
   - GHL: 0 categorías
   - Supabase: 0 categorías
   - Impacto: Todos los 68 productos defaultean a "ramos"

3. **Sin SKUs**
   - GHL: 0 SKUs
   - Supabase: 0 SKUs
   - Impacto: No hay identificador único por producto

4. **65/68 productos sin metadata en Supabase**
   - Solo 3 registros (incompletos)
   - Impacto: Sincronización rota

5. **Sin imágenes (excepto 1)**
   - GHL: 1/68 con image
   - Supabase: 0 imágenes
   - Impacto: Catálogo usa placeholder.jpg

6. **1 registro de metadata corrupto**
   - ghl_product_id: undefined
   - Impacto: No se puede sincronizar

### 🟠 PROBLEMAS ALTOS

1. **Sin acceso a Product Collections**
   - Token 401
   - Alternativa: Usar Supabase para categorización

2. **Productos huérfanos en GHL**
   - ~18 productos sin equivalente en catalog.ts
   - Algunos son de prueba ("TEST", "pepito")

3. **catalog.ts no sincronizado**
   - Referencia legacy pero 68 ≠ 50
   - Los nuevos 18 no están documentados

### 🟡 PROBLEMAS MEDIOS

1. **Sin variants con precios**
   - GHL no tiene variants populated
   - Precios deben venir de otro lugar

2. **Sin medias/archivos adjuntos**
   - GHL no tiene sistema de archivos
   - Necesita implementación de upload

---

## ESTRUCTURA ACTUAL REAL

```
┌─────────────────────────────────────────────────────────────┐
│                      CATÁLOGO PÚBLICO                       │
│                          /catalogo                           │
├─────────────────────────────────────────────────────────────┤
│  useGHLProducts() hook                                       │
│    ↓                                                         │
│  /api/ghl/products?limit=500                                │
│    ↓                                                         │
│  getGHLProducts() [NORMALIZA _id → id] ✓ FUNCIONA           │
│    ↓                                                         │
│  GHL API (68 productos con _id, name, description)          │
│    ↓ (sin categoría, sin precio, sin imagen)                │
│  normalizeGHLProducts() + getFullProductMetadataByIds()      │
│    ↓                                                         │
│  Intenta buscar metadata en Supabase                         │
│    ↓                                                         │
│  Supabase product_metadata (3 registros incompletos)         │
│    ↓                                                         │
│  normalizeGHLProduct() con defaults:                         │
│    ├─ category: "ramos" (FALLBACK)                           │
│    ├─ priceMin: 0 (FALLBACK)                                 │
│    ├─ image: "/assets/placeholder.jpg" (FALLBACK)            │
│    └─ sku: undefined                                         │
│                                                              │
│  RESULTADO: 68 productos visibles, todos con defaults        │
│             Catálogo técnicamente funciona pero              │
│             sin datos reales de categoría/precio/imagen      │
└─────────────────────────────────────────────────────────────┘
```

---

## ESTADÍSTICAS FINALES

### Grupo A: Totales

- **A) Total GHL:** 68 productos
- **B) Total Supabase metadata:** 3 registros (incompletos)
- **C) Total collections GHL:** 0 accesibles

### Grupo D-E: Precios

- **D) Con precio:** 0
- **E) Sin precio:** 68

### Grupo F-G: Categorías

- **F) Con categoría:** 0
- **G) Sin categoría:** 68

### Grupo H-I: SKU

- **H) Con SKU:** 0
- **I) Sin SKU:** 68

### Grupo J-K: Imágenes

- **J) Con imagen:** 1
- **K) Sin imagen:** 67

### Grupo L-M: Medias

- **L) Con medias:** 0
- **M) Sin medias:** 68

### Grupo N-O: Coincidencia con catalog.ts

- **N) Coincidentes:** ~51
- **O) Huérfanos en GHL:** ~18

---

## PROPUESTA TÉCNICA PARA FASE 3

### OBJETIVO FASE 3:

Sincronizar categorías, precios, SKUs e imágenes de los 68 productos

### ESTRATEGIA:

**Paso 1: Llenar Supabase product_metadata para los 68 productos**

- Crear entrada para cada ghl_product_id faltante (65/68)
- Arreglar registro corrupto (undefined ghl_product_id)
- Llenar campos: category, price, sku

**Paso 2: Estrategia de datos para metadata**
Opción A: Usar catalog.ts como fuente

- Los 50 productos en catalog.ts tienen datos completos
- Mapear por nombre/id a los 68 de GHL
- Para los 18 huérfanos: solicitar datos manualmente

Opción B: Esperar entrada del admin

- Admin crea categoría, precio, SKU vía /admin/products
- Se guardará automáticamente en Supabase

Opción C: Híbrida (RECOMENDADA)

- Auto-sync de catalog.ts para los 50 coincidentes
- Admin puede editar después
- Los 18 huérfanos quedan en "ramos" / 0 precio hasta corrección

**Paso 3: Implementar upload de imágenes**

- Crear endpoint /api/upload/product-image
- Soportar JPG, PNG, WEBP
- Hasta 10 imágenes por producto
- Guardar URLs en Supabase
- Renderizar en ProductCard

**Paso 4: Flujo de sincronización GHL ↔ Supabase**

- POST /admin/products → Crear en GHL + Supabase
- PUT /admin/products/:id → Actualizar en GHL + Supabase
- GET /api/ghl/products → Combinar datos (ya funciona)

**Paso 5: Validaciones**

- No permitir producto sin categoría
- No permitir precio negativo
- SKU único y formato: FL-{CAT}-{NUM}
- Imagen mínimo de 200x200px

### IMPACTO:

✅ Los 68 productos tendrán datos completos  
✅ Catálogo mostrará precios reales, categorías, imágenes  
✅ Admin puede editar/crear productos  
✅ GHL y Supabase sincronizados  
✅ Sistema escalable para 100+ productos

### RIESGOS:

⚠️ Los 18 productos huérfanos necesitan clasificación manual  
⚠️ Mapeo automático de catalog.ts podría fallar si nombres cambian  
⚠️ Upload de imágenes requiere almacenamiento (local o cloud)

### TIMELINE ESTIMADA:

- Llenar metadata Supabase: 30 min
- Implementar upload imágenes: 1.5 hrs
- Integrar UI admin: 1 hr
- Testing: 1 hr
- **Total: ~4 hrs**

---

## PRÓXIMOS PASOS

**NO HACER TODAVÍA:**

- ✗ No crear/eliminar productos
- ✗ No modificar code
- ✗ No cambiar GHL
- ✗ No cambiar Supabase
- ✗ No implementar upload

**CUANDO PROCEDER A FASE 3:**

- ✓ Decisión sobre fuente de categorías (catalog.ts o manual)
- ✓ Confirmación de la estrategia de imágenes
- ✓ Clasificación de los 18 productos huérfanos

---

## CONCLUSIÓN

**Estado ACTUAL:** Sistema técnicamente funciona (68 productos visibles) pero SIN DATOS reales (categorías, precios, imágenes).

**Estado REQUERIDO:** Sistema con DATOS COMPLETOS (categorías reales, precios, imágenes, SKUs).

**Camino FASE 3:** Llenar Supabase como "layer de metadata" para GHL, e implementar upload de imágenes.

**Éxito medible:** Cuando /catalogo muestre productos con categoría ≠ "ramos", precio ≠ 0, e imagen ≠ placeholder.jpg.
