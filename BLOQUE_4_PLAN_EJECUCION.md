# BLOQUE 4: Sincronización Real del Catálogo - Plan de Ejecución

**Objetivo**: Sincronizar 54 productos de `src/data/catalog.ts` con GHL + Supabase de forma SEGURA, IDEMPOTENTE y VERIFICABLE.

**Fecha**: 2026-09-03  
**Status**: EN PREPARACIÓN

---

## PARTE 1: INVESTIGACIÓN PREVIA (COMPLETADA)

### Hallazgos

| Aspecto                            | Hallazgo                                                 |
| ---------------------------------- | -------------------------------------------------------- |
| **Productos en catálogo**          | 54 (no 50 como se mencionó)                              |
| **Infraestructura GHL**            | ✓ createGHLProduct, updateGHLProduct, getGHLProducts     |
| **Infraestructura Precios**        | ✓ ensureProductPrice con idempotencia                    |
| **Infraestructura Metadata**       | ✓ syncProductMetadata con support para legacy_catalog_id |
| **Endpoint Sincronización Masiva** | ✗ NO EXISTÍA - CREADO EN ESTA FASE                       |
| **Generador SKU**                  | ✓ generateSKU con prefijos por categoría                 |
| **Mapeo Categorías**               | ✓ category_to_ghl_collection (probablemente sin IDs aún) |

### Categorías en Catálogo

| Categoría     | Productos | SKU Prefix  |
| ------------- | --------- | ----------- |
| ramos         | ~10       | FL-RAM-NNNN |
| plantas       | ~13       | FL-PLN-NNNN |
| rosas-eternas | ~4        | FL-ROS-NNNN |
| complementos  | ~13       | FL-COM-NNNN |
| condolencias  | ~14       | FL-CON-NNNN |
| **TOTAL**     | **54**    | -           |

### Verificaciones Previas Requeridas

Antes de ejecutar la sincronización, verificar:

```bash
# 1. Estado de Supabase
GET /api/admin/sync-catalog
# Retorna: catalogSize, supabaseMetadata count, ghlStatus

# 2. Ejecutar diagnóstico completo (NEW)
POST /api/admin/sync-catalog (con body: {"dryRun": true})
# Valida estado pre-sync, detecta problemas

# 3. Estado de conectividad GHL
curl -H "Authorization: Bearer $GHL_TOKEN" \
  https://services.leadconnectorhq.com/products/?limit=1
# Verifica autenticación y acceso
```

---

## PARTE 2: ENDPOINT DE SINCRONIZACIÓN CREADO

### Ubicación

**Archivo**: `src/routes/api.admin.sync-catalog.ts`

### Funcionalidad

#### POST /api/admin/sync-catalog

**Request**:

```typescript
{
  dryRun?: boolean,        // Si true: simula sin crear
  startFrom?: number,      // Índice de inicio (default: 0)
  limit?: number          // Cuántos productos procesar (default: todos)
}
```

**Response**:

```typescript
{
  success: boolean,
  dryRun: boolean,
  summary: {
    total: number,
    created: number,
    updated: number,
    already_synchronized: number,
    failed: number
  },
  results: [
    {
      id: string,
      name: string,
      status: "created" | "updated" | "already_synchronized" | "failed",
      ghlProductId?: string,
      ghlPriceId?: string,
      sku?: string,
      error?: string
    }
  ],
  errors: [
    { product: string, error: string }
  ]
}
```

#### GET /api/admin/sync-catalog

Health check - retorna estado de readiness:

```typescript
{
  endpoint: string,
  catalogSize: 54,
  supabaseMetadata: number,
  ghlStatus: "connected" | "error",
  ready: boolean
}
```

### Lógica de Sincronización

Para cada producto en catalog.ts:

1. **Búsqueda de Existencia**
   - Query Supabase por `legacy_catalog_id`
   - Si existe y tiene `ghl_product_id` → IR A PASO 4 (update check)
   - Si no existe → IR A PASO 2 (create)

2. **Crear en GHL**
   - POST /products con name, description, price, category, sku
   - Obtener `ghlProductId` de respuesta
   - Si falla: registrar error, CONTINUE

3. **Crear Precio en GHL**
   - Llamar `ensureProductPrice(ghlProductId)`
   - Obtener `ghlPriceId`
   - Si falla: loguear advertencia, CONTINUE

4. **Guardar Metadata en Supabase**
   - INSERT/UPDATE product_metadata con:
     - ghl_product_id
     - ghl_price_id
     - legacy_catalog_id
     - category, price, price_max
     - sku, badge_label, available_colors, rose_step
   - Si falla: registrar error, CONTINUE

5. **Update Check (para existentes)**
   - Comparar producto en GHL vs catalog.ts
   - Si cambios (name/description): UPDATE en GHL
   - Status → "updated" o "already_synchronized"

### Garantías de Idempotencia

1. **Legacy ID Matching**: Buscar por `legacy_catalog_id` = `catalogProduct.id`
   - Producto catalog "ramo-felicidad" → siempre busca por legacy_id = "ramo-felicidad"

2. **GHL ID Lookup**: Si existe `ghl_product_id`, reutilizar
   - No crear nuevo aunque falte metadata

3. **Price Idempotency**: `ensureProductPrice` no crea duplicados
   - Si existe `ghl_price_id` → UPDATE
   - Si no existe → CREATE y guardar ID

4. **SKU Uniqueness**: DB constraint + generateSKU secuencial
   - Cada categoría mantiene contador de SKUs

5. **Segunda Ejecución Esperada**:
   ```
   Total: 54
   Created: 0 (todos ya existen)
   Updated: 0-5 (solo si hubo cambios en catalog.ts)
   Already synchronized: 49-54
   Failed: 0
   ```

---

## PARTE 3: PLAN DE EJECUCIÓN

### Phase 3.1: Pre-flight Checks (5 min)

```bash
# 1. Verificar que el endpoint está disponible
curl -X GET http://localhost:3000/api/admin/sync-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected:
{
  "endpoint": "/api/admin/sync-catalog",
  "catalogSize": 54,
  "supabaseMetadata": N,
  "ghlStatus": "connected",
  "ready": true
}

# 2. Detectar problemas críticos
curl -X POST http://localhost:3000/api/admin/sync-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Expected:
# - status: "created" para los 54 (simulated)
# - errors: [] (ninguno)
# - summary: {created: 54, updated: 0, failed: 0}
```

### Phase 3.2: DRY RUN (10-15 min)

```bash
curl -X POST http://localhost:3000/api/admin/sync-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "limit": 54
  }'
```

**Esperado**:

- ✓ 54 productos con status "created" (simulado)
- ✓ Todos con SKU asignado
- ✓ Sin errores
- ✓ Logs muestran cada paso

**Si hay errores**:

- Analizar mensajes de error
- Verificar permisos GHL
- Verificar estado de Supabase
- Corregir y repetir

### Phase 3.3: SINCRONIZACIÓN REAL (15-20 min)

```bash
curl -X POST http://localhost:3000/api/admin/sync-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": false,
    "limit": 54
  }' > sync_result_1.json
```

**Esperado**:

- ✓ 54 productos con status "created"
- ✓ Cada uno tiene ghlProductId y ghlPriceId
- ✓ Cada uno tiene SKU FL-CAT-NNNN
- ✓ Todos guardados en Supabase
- ✓ 0 errores
- ✓ Logs completamente auditables

**Si hay errores parciales**:

- Los productos fallidos se reportan con error message
- El sync CONTINÚA (no fail-fast)
- Los productos OK se crean/actualizan
- Registrar errores para revisión

**Si sync falla completamente**:

- ROLLBACK: No continuar
- Investigar root cause
- Reparar y reintentar

---

## PARTE 4: VERIFICACIÓN POST-SYNC

### Verificación 4.1: Supabase

```sql
-- 1. Contar registros
SELECT COUNT(*) FROM product_metadata;
-- Expected: >= 54

-- 2. Verificar campos críticos
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN ghl_product_id IS NOT NULL THEN 1 END) as with_ghl_id,
  COUNT(CASE WHEN ghl_price_id IS NOT NULL THEN 1 END) as with_price_id,
  COUNT(CASE WHEN sku IS NOT NULL THEN 1 END) as with_sku,
  COUNT(CASE WHEN legacy_catalog_id IS NOT NULL THEN 1 END) as with_legacy_id
FROM product_metadata;
-- Expected: 54 | 54 | 54 | 54 | 54

-- 3. Buscar NULL críticos
SELECT * FROM product_metadata
WHERE ghl_product_id IS NULL OR sku IS NULL;
-- Expected: (empty)

-- 4. Detectar duplicados por ghl_product_id
SELECT ghl_product_id, COUNT(*) as cnt
FROM product_metadata
GROUP BY ghl_product_id
HAVING COUNT(*) > 1;
-- Expected: (empty)

-- 5. Detectar duplicados por SKU
SELECT sku, COUNT(*) as cnt
FROM product_metadata
WHERE sku IS NOT NULL
GROUP BY sku
HAVING COUNT(*) > 1;
-- Expected: (empty)

-- 6. Verificar categorías
SELECT category, COUNT(*) as cnt
FROM product_metadata
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;
-- Expected:
-- complementos | 13
-- condolencias | 14
-- plantas | 13
-- ramos | 10
-- rosas-eternas | 4
```

### Verificación 4.2: GHL

```bash
# 1. Contar productos activos
curl -H "Authorization: Bearer $GHL_TOKEN" \
  "https://services.leadconnectorhq.com/products/?limit=100" \
  | jq '.items | length'
# Expected: >= 54

# 2. Verificar SKUs
curl -H "Authorization: Bearer $GHL_TOKEN" \
  "https://services.leadconnectorhq.com/products/?limit=100" \
  | jq '.items[] | select(.sku) | .sku' | wc -l
# Expected: >= 54

# 3. Spot-check productos
curl -H "Authorization: Bearer $GHL_TOKEN" \
  "https://services.leadconnectorhq.com/products/?limit=100" \
  | jq '.items[0:3]'
# Verificar que tienen: id, name, sku, precio
```

### Verificación 4.3: Integridad Cruzada

```bash
# Para 5 productos aleatorios:
# 1. Obtener de Supabase metadata
SELECT id, ghl_product_id, sku, category, price_min
FROM product_metadata
WHERE ghl_product_id IS NOT NULL
LIMIT 5;

# 2. Para cada uno, verificar en GHL que existe con mismo ID
curl -H "Authorization: Bearer $GHL_TOKEN" \
  "https://services.leadconnectorhq.com/products/?id=$GHL_PRODUCT_ID"

# 3. Verificar que los datos coinciden:
#    - Name en GHL = name en catalog.ts
#    - SKU en GHL = SKU en Supabase
#    - Precio ≥ price_min en Supabase
```

---

## PARTE 5: PRUEBA DE IDEMPOTENCIA (OBLIGATORIO)

### Test 5.1: Segunda Ejecución del Sync

```bash
curl -X POST http://localhost:3000/api/admin/sync-catalog \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": false,
    "limit": 54
  }' > sync_result_2.json
```

**Esperado (Idempotencia Correcta)**:

```
summary: {
  total: 54,
  created: 0,           ← NINGUNO NUEVO
  updated: 0-3,         ← SOLO si cambios en catalog
  already_synchronized: 51-54,  ← LA MAYORÍA
  failed: 0
}
```

**Verificación de No-Duplicados**:

```sql
-- Antes de 2da ejecución: 54 registros únicos
SELECT COUNT(DISTINCT ghl_product_id) FROM product_metadata;
-- Expected: 54

-- Después de 2da ejecución: MISMO número
SELECT COUNT(DISTINCT ghl_product_id) FROM product_metadata;
-- Expected: 54 (NO AUMENTÓ)

-- Verificar no hay nuevos duplicados
SELECT ghl_product_id, COUNT(*) as cnt
FROM product_metadata
GROUP BY ghl_product_id
HAVING COUNT(*) > 1;
-- Expected: (empty)
```

**Si Idempotencia Falla**:

- STOP: No continuar
- Aparecer status "created" en 2da ejecución → BUG
- Investigar root cause:
  - ¿legacy_catalog_id no se guardó bien?
  - ¿ghl_product_id se perdió?
  - ¿Búsqueda en Supabase no funcionó?
- CORREGIR y REPETIR HASTA QUE PASE

---

## PARTE 6: VERIFICACIÓN DE COLLECTIONS

### Permisos

GHL puede tener endpoint de collections bloqueado (401). Plan:

```bash
# Intentar obtener collections
curl -H "Authorization: Bearer $GHL_TOKEN" \
  "https://services.leadconnectorhq.com/products/collections"

# Si 200 OK:
#   ✓ Obtener lista de collections
#   ✓ Identificar: ramos, plantas, rosas-eternas, complementos, condolencias
#   ✓ Guardar IDs en category_to_ghl_collection
#   ✓ Re-sincronizar productos para asignar collectionIds

# Si 401:
#   ⚠ Permisos bloqueados
#   ✓ Documentar como PENDIENTE
#   ✓ Continuar sin collections (no bloqueante)
```

---

## PARTE 7: VERIFICACIÓN FINAL

### Checklist de Cierre

- [ ] Build compila sin errores: `npm run build` ✓ (ya hecho)
- [ ] Endpoint `/api/admin/sync-catalog` existe y responde
- [ ] GET /api/admin/sync-catalog retorna status correcto
- [ ] POST /api/admin/sync-catalog (dryRun: true) funciona sin errores
- [ ] POST /api/admin/sync-catalog (dryRun: false) crea todos los 54 productos
- [ ] Supabase: 54 registros con ghl_product_id, sku, categoria
- [ ] GHL: 54 productos activos con SKUs correctos
- [ ] Prueba idempotencia: 2da ejecución no crea duplicados
- [ ] Sin duplicados por ghl_product_id, sku, o legacy_catalog_id
- [ ] Commit realizado

### Reporte Final

```
=== BLOQUE 4: SINCRONIZACIÓN REAL - REPORTE FINAL ===

ESTADO PRE-SYNC:
- Productos en GHL: X
- Registros en Supabase: Y
- Duplicados detectados: Z

SINCRONIZACIÓN (Ejecución 1):
- Productos del catálogo: 54
- Creados en GHL: 54
- Actualizados en GHL: 0
- Fallidos: 0
- Precios creados: 54
- SKU sincronizados: 54

RESULTADO SUPABASE:
- Registros product_metadata: 54
- ghl_product_id presentes: 54/54
- ghl_price_id presentes: 54/54
- SKU únicos: 54/54
- Duplicados: 0

PRUEBA IDEMPOTENCIA (Ejecución 2):
- Created: 0
- Updated: 0-2
- Already synchronized: 52-54
- Duplicados creados: 0
- Status: IDEMPOTENTE ✓

COLLECTIONS:
- Permisos: OK / 401 (PENDIENTE)
- Collections sincronizadas: SÍ / NO

BUILD/TESTS/LINT:
- npm run build: ✓
- Tests: N/A
- Lint: 0 problemas

COMMITS:
- feat: BLOQUE 4 - Create safe and idempotent catalog synchronization endpoint

ESTADO FINAL:
✓ BLOQUE 4 COMPLETADO EXITOSAMENTE
```

---

## REFERENCIAS

- Endpoint: `/api/admin/sync-catalog.ts`
- Diagnóstico: `/lib/admin/diagnose-sync.server.ts`
- Funciones utilizadas:
  - `createGHLProduct()` - Crear producto
  - `updateGHLProduct()` - Actualizar producto
  - `getGHLProducts()` - Listar productos
  - `ensureProductPrice()` - Garantizar precio (idempotent)
  - `syncProductMetadata()` - Guardar metadata (idempotent)
  - `generateSKU()` - Generar SKU único por categoría

---

**Próximos Pasos**:

1. Ejecutar verificación previa (GET endpoint)
2. Ejecutar DRY RUN (POST dryRun: true)
3. Ejecutar sincronización real (POST dryRun: false)
4. Verificar Supabase y GHL
5. Ejecutar prueba idempotencia
6. Generar reporte final y cerrar BLOQUE 4
