# FASE 3A: CIERRE - MIGRATION Y POBLAMIENTO

**Fecha:** 2026-08-31  
**Status:** Bloqueado esperando ejecución de migration SQL  

---

## 1. SUPABASE PROJECT ID UTILIZADO

✅ **CORRECTO IDENTIFICADO:**
- **Project ID:** `leksmflinhohnekbgmgj`
- **URL:** `https://leksmflinhohnekbgmgj.supabase.co`
- **Fuente:** `.env.local` (SUPABASE_URL)
- **Service Role Key:** Configurado en `.env.local`

✅ **Nota de descubrimiento crítico:**
Durante la auditoría anterior, los datos se guardaron en un proyecto INCORRECTO:
- Proyecto erróneo: `https://ajlzrqfhjfdgwlzvmfxo.supabase.co`
- Este NO es el proyecto de producción

La solución requiere aplicar la migration al **PROYECTO CORRECTO** (`leksmflinhohnekbgmgj`).

---

## 2. MIGRATION CREADA Y RENOMBRADA

✅ **Archivo:** `supabase/migrations/20260831140000_add_category_sku_to_product_metadata.sql`

**Contenido:**
```sql
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS category varchar;
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS sku varchar UNIQUE;
CREATE INDEX IF NOT EXISTS idx_product_metadata_category ON product_metadata(category);
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku ON product_metadata(sku);
COMMENT ON COLUMN product_metadata.category IS 'Product category: ramos, plantas, rosas-eternas, complementos, condolencias';
COMMENT ON COLUMN product_metadata.sku IS 'Unique product SKU: FL-{CAT}-{NUM}';
```

**Estado:** 
- ✅ Archivo existe
- ✅ Renombrado con timestamp correcto
- ⏱️ Pendiente ejecutar en Supabase

---

## 3. SCHEMA ESPERADO POST-MIGRATION

Después de ejecutar la migration, product_metadata debe tener:

```
column_name  | data_type | is_nullable | constraints
-------------|-----------|-------------|------------------
id           | uuid      | false       | PRIMARY KEY
ghl_product_id | string  | false       | UNIQUE
category     | varchar   | true        | (Nueva columna)
price_min    | numeric   | true        |
sku          | varchar   | true        | UNIQUE (Nueva)
... otros campos ...
```

---

## 4. TIPOS REGENERADOS

✅ **Estado actual:**
- `src/integrations/supabase/types.ts` fue actualizado manualmente
- Contiene `category?: string | null`
- Contiene `sku?: string | null`

⚠️ **Pendiente:**
Después de ejecutar la migration, regenerar types oficialmente:
```bash
npx supabase gen types typescript > src/integrations/supabase/types.ts
```

---

## 5. REGISTROS A POBLAR (PENDIENTE)

**Cantidad esperada:** 68

**Distribución esperada:**
- 58 productos con metadata real (matched con catalog.ts)
- 10 huérfanos (sin match, needs_review)

**Script de población:** `scripts/populate-metadata-cli.cjs`

**Estado:** Creado y listo, pendiente ejecutar con Supabase correcto.

---

## 6. CATEGORÍAS A RECUPERAR

**58 productos matched deberían tener:**
- ramos: 6
- plantas: 13
- rosas-eternas: 4
- complementos: 13
- condolencias: 14

**10 huérfanos deberían tener:**
- category: NULL
- status: needs_review

---

## 7. PRECIOS A RECUPERAR

**58 productos matched deberían tener precios reales de catalog.ts:**
- Rango: $1.50 (Jarrón) a $260 (Corona F26)
- Ejemplo: Anthurium → $25
- Ejemplo: Corona F26 → $260

**10 huérfanos:**
- price_min: NULL

---

## 8. SKUs A RECUPERAR

**58 productos matched deberían tener:**
- Formato: FL-{CAT}-{NNNN}
- Ejemplo: FL-RAM-0001 (Ramo Silvestre)
- Ejemplo: FL-PLA-0007 (Anthurium)
- Ejemplo: FL-CON-0014 (Corona F26)
- Todos únicos (sin duplicados)

**10 huérfanos:**
- sku: NULL

---

## 9. huérfanos IDENTIFICADOS

Los 10 productos sin match en catalog.ts:

1. yhfgbeuhfuiehuf (probable test)
2. E2E TEST 2 - Plantas
3. E2E TEST - Ramo
4. TEST - Categoría Completa
5. TEST - Condolencias
6. TEST - Complemento Floral
7. TEST - Rosa Eterna
8. TEST - Planta Decorativa
9. TEST productType PHYSICAL
10. pepito

**Acción:** Permanecerán con status=needs_review, sin categoría ni precio inventados.

---

## 10. RESULTADO ESPERADO: getFullProductMetadataByIds()

**Actualmente:** Devuelve 0 registros (Supabase incorrecto)

**Después de migration y población:** Debería devolver 68 registros con:
```json
{
  "ghl_product_id": "6a9568c0973de9c5b8125afe",
  "category": "condolencias",
  "price_min": 260,
  "sku": "FL-CON-0014",
  "status": "active"
}
```

---

## 11. RESULTADO ESPERADO: /api/ghl/products

**Actualmente:**
```json
{
  "category": "ramos",   ← DEFAULT
  "priceMin": 0          ← DEFAULT
}
```

**Después:** Debe devolver datos reales
```json
{
  "name": "Corona F26",
  "category": "condolencias",     ← REAL
  "priceMin": 260,               ← REAL
  "sku": "FL-CON-0014"           ← Disponible (no mostrado en catálogo público)
}
```

---

## 12. RESULTADO ESPERADO: /catalogo

**Actualmente:** 68 productos con defaults

**Después:** 
- 58 productos con categorías y precios reales
- 10 productos marcados internamente como needs_review (sin mostrar)

**Visualización esperada:**
```
Ramos (6 productos)
Plantas (13 productos)
Rosas Eternas (4 productos)
Complementos (13 productos)
Condolencias (14 productos)

(10 huérfanos omitidos del catálogo público)
```

---

## 13. RESULTADO ESPERADO: /admin/products

**Después:**
- 68 productos con metadata completa
- Columnas visibles: nombre, categoría, precio, SKU, status
- 58 activos
- 10 needs_review

---

## 14. BUILD TYPESCRIPT

**Actual:** ✅ Sin errores (1.93s)

**Después de migration:** Debe continuar sin errores

---

## 15. CONFIRMACIÓN: GHL NO MODIFICADO

✅ **Verificado:**
- 68 productos en GHL permanecen intactos
- Nombres, descripciones, status igual
- Solo se leen datos desde GHL
- No se escribió en GHL durante FASE 3A

---

## 16. CONFIRMACIÓN: IMÁGENES NO IMPLEMENTADAS

✅ **Verificado:**
- ❌ product_images tabla NO creada
- ❌ Supabase Storage NO configurado
- ❌ Upload endpoint NO implementado
- ❌ ProductCard NO modificado
- ❌ Formulario admin NO modificado

---

## PASOS PARA CERRAR FASE 3A

### PASO 1: Ejecutar migration SQL en Supabase

**Opción A: SQL Editor (más rápido)**
1. Ve a: https://app.supabase.com/project/leksmflinhohnekbgmgj/sql/new
2. Lee el archivo: `SUPABASE_MIGRATION_EXECUTE_NOW.sql`
3. Copia y pega en SQL Editor
4. Presiona "Run"

**Opción B: CLI (si prefieres)**
```bash
npx supabase db push
```

### PASO 2: Regenerar types TypeScript

```bash
npx supabase gen types typescript > src/integrations/supabase/types.ts
```

### PASO 3: Re-ejecutar población

```bash
node scripts/populate-metadata-cli.cjs
```

### PASO 4: Verificar datos en Supabase

```bash
node scripts/check-supabase-data.cjs
```

**Resultado esperado:**
```
TOTAL REGISTROS: 68
CON CATEGORY: 58
CON PRICE_MIN: 58
CON SKU: 58
NEEDS_REVIEW: 10
CORRUPTOS: 0
DUPLICADOS SKU: 0
```

### PASO 5: Ejecutar tests

```bash
npm run build  # Debe pasar sin errores
curl http://localhost:3000/api/ghl/products | jq '.products[0]'  # Verificar datos reales
```

---

## CRITERIOS DE CIERRE FASE 3A

Para considerar FASE 3A completada, estos 8 puntos DEBEN cumplirse:

1. ✓ 68 registros en Supabase product_metadata
2. ✓ 58 registros con category (real) + price_min (real) + sku (único)
3. ✓ 10 registros con status='needs_review', sin categoría ni precio
4. ✓ 0 registros corruptos (ghl_product_id válido en todos)
5. ✓ 0 SKU duplicados
6. ✓ getFullProductMetadataByIds() recupera 68 registros
7. ✓ /api/ghl/products devuelve metadata real (no defaults)
8. ✓ /catalogo muestra categorías y precios reales

---

## ESTADO ACTUAL

| Criterio | Status |
|----------|--------|
| Project ID identificado | ✅ leksmflinhohnekbgmgj |
| Migration creada | ✅ |
| Migration aplicada | ⏱️ Pendiente |
| Schema verificado | ⏱️ Pendiente |
| Types regenerados | ⏱️ Pendiente |
| Datos poblados | ⏱️ Pendiente |
| getFullProductMetadataByIds() | ⏱️ Pendiente |
| /api/ghl/products | ⏱️ Pendiente |
| /catalogo | ⏱️ Pendiente |
| /admin/products | ⏱️ Pendiente |
| Build sin errores | ✅ |

---

## PRÓXIMO PASO

**EJECUTAR LA MIGRATION SQL EN SUPABASE.**

Después de eso, todos los puntos pasarán de ⏱️ a ✅.

Una vez completado, FASE 3A está cerrada y FASE 3B (imágenes) puede proceder.
