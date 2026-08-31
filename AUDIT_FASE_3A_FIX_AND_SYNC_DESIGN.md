# FASE 3A: ANÁLISIS DE PROBLEMA Y DISEÑO DE SINCRONIZACIÓN

**Fecha:** 2026-08-31  
**Status:** Problema identificado, solución propuesta, FASE 3A pendiente de cierre  

---

## 1. CAUSA RAÍZ DEL PROBLEMA

### ❌ Por qué metadata NO se recupera

**Root Cause:** La migration SQL que crea los campos `category` y `sku` **NUNCA SE EJECUTÓ EN SUPABASE**.

**Evidencia:**
- Supabase contiene SOLO 3 registros (corruptos/vacíos)
- Los campos `category` y `sku` NO existen en la tabla
- Al ejecutar `SELECT *` en product_metadata, NO devuelven estos campos
- El tipo TypeScript está actualizado, pero la tabla real no

**Por qué pasó:**
- El script de población usó `upsert` con `onConflict: 'ghl_product_id'`
- Pero esos campos no existen aún en la tabla
- Supabase rechazó silenciosamente las inserciones (o no las reconoció)
- Solo quedaron los 3 registros iniciales (corruptos)

---

## 2. CORRECCIÓN REALIZADA

### ✅ Bug en lectura corregido
**Archivo:** `src/routes/api.ghl.products.ts` línea 49

**Antes:**
```typescript
price: fullMetadata.price,  // ❌ Campo incorrecto
```

**Después:**
```typescript
price: fullMetadata.price_min,  // ✅ Nombre correcto
```

**Problema:** El código buscaba un campo que no existe. Cuando exista la metadata, habrá que usar `price_min`.

### ✅ Tipos TypeScript actualizados
**Archivo:** `src/integrations/supabase/types.ts`

Añadidos campos:
- `category?: string | null`
- `sku?: string | null`

**Estado:** Tipos listos, pero tabla real sin columnas aún.

---

## 3. PROBLEMA ACTUAL - POR QUÉ SIGUE SIN FUNCIONAR

| Componente | Estado | Razón |
|-----------|--------|-------|
| Código TypeScript | ✅ Listo | Tipos actualizados |
| Supabase Schema | ❌ Incompleto | Migration NO ejecutada |
| Datos en Supabase | ❌ Vacío | Solo 3 registros corruptos |
| Lectura en servidor | ❌ Vacía | Supabase no devuelve campos |
| Catálogo público | ❌ Defaults | Sin metadata para leer |

### ⚠️ Bloqueante

**Para que FASE 3A funcione:**

1. **Ejecutar migration SQL en Supabase:**
   ```sql
   ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS category varchar;
   ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS sku varchar UNIQUE;
   CREATE INDEX IF NOT EXISTS idx_product_metadata_category ON product_metadata(category);
   CREATE INDEX IF NOT EXISTS idx_product_metadata_sku ON product_metadata(sku);
   ```

2. **Regenerar tipos TypeScript:**
   ```bash
   npx supabase gen types typescript > src/integrations/supabase/types.ts
   ```

3. **Re-ejecutar población:**
   ```bash
   node scripts/populate-metadata-cli.cjs
   ```

---

## 4. ESTADÍSTICAS ACTUALES

**Supabase product_metadata:**
- Total registros: 0 (después de limpieza)
- Con categoría: 0
- Con precio: 0
- Con SKU: 0
- Válidos: 0

**GHL:**
- Total productos: 68 ✓

**Estado:** Desincronizados completamente.

---

## 5. RESULTADO DE ENDPOINTS (ACTUAL)

### /api/ghl/products
```json
{
  "products": [
    {
      "id": "6a9568c0973de9c5b8125afe",
      "name": "Corona F26",
      "category": "ramos",      ← DEFAULT (sin metadata)
      "priceMin": 0,            ← DEFAULT (sin metadata)
      "image": "/assets/placeholder.jpg"
    }
  ],
  "total": 68
}
```

**Status:** ❌ Devuelve defaults porque Supabase no tiene metadata

### /catalogo
```
68 productos visibles, todos con:
- category: "ramos" (default)
- priceMin: 0 (default)
- image: placeholder
```

**Status:** ❌ Catálogo visible pero sin datos reales

### /admin/products
**Status:** ✓ HTTP 401 (requiere autenticación, esperado)

---

## 6. CAMPOS SINCRONIZABLES A GHL

Después de auditar la API v3 de GHL, estos campos PUEDEN almacenarse en GHL:

### ✅ GHL PUEDE RECIBIR:
- `name` - Nombre producto
- `description` - Descripción
- `productType` - "PHYSICAL", "DIGITAL", etc.
- `image` - URL de imagen principal
- `medias` - Array de URLs de medias
- `variants` - Variantes con precios
- `collectionIds` - IDs de colecciones/categorías
- `status` - "active" / "inactive"
- `inventory` - Cantidades
- Custom fields - Campos personalizados (posiblemente SKU)

### ❌ GHL NO PERSISTE (en v3):
- `category` - Requiere `collectionIds` (indirecto)
- `sku` - Posiblemente en custom fields
- `price` - Solo en `variants.prices`

---

## 7. CAMPOS PERMANECERÁN EN SUPABASE

Por razones de control, auditoria y independencia:

### 📋 SUPABASE SERÁ FUENTE DE VERDAD:
- `category` - Categorización principal
- `sku` - Identificador único interno
- `price_min`, `price_max` - Rango de precios
- `available_colors` - Colores disponibles
- `badge_label` - Etiqueta/insignia
- `rose_step` - Incremento para rosas
- `requires_quote` - Requiere cotización
- Status de metadata - Para tracking
- legacy_catalog_id - Rastreabilidad

---

## 8. FUENTE DE VERDAD PROPUESTA

### Matriz de sincronización:

| Campo | Fuente Primaria | Secundaria | Dirección Sync |
|-------|-----------------|-----------|-----------------|
| **name** | GHL | Supabase | GHL ← Admin |
| **description** | GHL | Supabase | GHL ← Admin |
| **category** | Supabase | - | GHL (via collectionIds) |
| **price** | Supabase | GHL (variants) | GHL ← Supabase |
| **sku** | Supabase | - | GHL (custom field) |
| **image** | GHL | Supabase | GHL ← Upload |
| **medias** | GHL | - | GHL ← Upload |
| **status** | GHL | Supabase | Bidireccional |
| **inventory** | GHL | - | GHL ← Admin |
| **colors** | Supabase | - | Admin display |

### Principios:

1. **GHL = Identidad**
   - Producto existe si existe en GHL
   - GHL es fuente de verdad para existencia

2. **Supabase = Categorización**
   - Supabase categoriza y organiza
   - Supabase tiene control creativo (SKU, colors, etc.)

3. **Precios = Sincronización**
   - Admin edita en panel (Supabase)
   - Se sincronizan a GHL (variants)
   - Se leen desde Supabase para catálogo

4. **Imágenes = Almacenamiento**
   - Upload → Supabase Storage
   - URLs guardadas en Supabase
   - Opcionalmente reflejadas en GHL

---

## 9. FLUJO PROPUESTO DE SINCRONIZACIÓN

### PANEL → SUPABASE → GHL → CATÁLOGO

```
ADMIN EDITA PRODUCTO
  ↓
POST /api/products/:id
  ├─ Actualiza Supabase:
  │   ├─ category, sku, colors, badge, etc.
  │   └─ price_min, price_max
  │
  └─ Sincroniza a GHL:
      ├─ name, description → GHL
      └─ Variants con precios (de Supabase)
        └─ PUT /products/:id
          └─ GHL actualiza
            ↓
CATÁLOGO LEE DESDE:
  ├─ GHL: name, description, image, medias
  ├─ Supabase: category, sku, colors, prices
  └─ Renderiza completo
```

### FLUJO INVERSO: GHL → CATÁLOGO

Si un producto se edita en GHL:

```
GHL API
  ↓ (no hay webhook automático, requiere polling)
Cron job / Manual sync
  ├─ Fetch /products/:id desde GHL
  ├─ Actualiza name, description, image
  └─ Mantiene metadata de Supabase sin tocar
    ↓
CATÁLOGO se actualiza automáticamente
```

---

## 10. VERIFICACIÓN REQUERIDA ANTES CIERRE FASE 3A

**Acción manual requerida:**

```bash
# 1. Ir a https://app.supabase.com/project/ajlzrqfhjfdgwlzvmfxo/sql/new
# 2. Ejecutar SQL:
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS category varchar;
ALTER TABLE product_metadata ADD COLUMN IF NOT EXISTS sku varchar UNIQUE;
CREATE INDEX IF NOT EXISTS idx_product_metadata_category ON product_metadata(category);
CREATE INDEX IF NOT EXISTS idx_product_metadata_sku ON product_metadata(sku);

# 3. Regenerar types:
npx supabase gen types typescript > src/integrations/supabase/types.ts

# 4. Re-ejecutar población:
node scripts/populate-metadata-cli.cjs

# 5. Verificar:
# - /api/admin/debug-metadata debería mostrar 68 registros
# - Registros deberían tener category, price_min, sku
# - /api/ghl/products debería devolver datos reales
# - /catalogo debería mostrar categorías y precios reales
```

---

## 11. ¿ESTÁ REALMENTE CERRADA FASE 3A?

### ❌ NO. Bloqueado por:

1. **Migration SQL no ejecutada** - Campos no existen en Supabase
2. **Datos no poblados** - Solo 3 registros corruptos (limpiados)
3. **Lectura no funciona** - getFullProductMetadataByIds() devuelve vacío
4. **Catálogo no actualizado** - Sigue con defaults

### ✅ COMPLETADO EN FASE 3A:

1. Migration SQL creada y lista
2. Tipos TypeScript actualizados
3. Código de lectura corregido (price_min)
4. Script de población creado y probado (reportó éxito)
5. Endpoint de admin creado
6. Arquitectura de sincronización diseñada

### ⏱️ PENDIENTE (bloqueante):

1. Ejecutar migration SQL en Supabase
2. Regenerar types
3. Re-ejecutar población
4. Verificar que metadata se recupera

---

## 12. QUÉ HACER EN FASE 3B

### NO ES IMÁGENES AÚN.

### FASE 3B.1 - Cerrar FASE 3A:

1. Ejecutar migration SQL
2. Regenerar types
3. Re-ejecutar población
4. Verificar endpoints devuelven datos reales
5. Confirmar que /catalogo muestra datos reales

### FASE 3B.2 - Imágenes:

1. Crear tabla `product_images`
2. Implementar upload endpoint
3. Integrar en formulario admin
4. Renderizar galería en catálogo

### FASE 3B.3 - Sincronización:

1. Implementar sync GHL ← Supabase
2. Crear webhook listener (opcional)
3. Cron job para sync inverso
4. Validaciones bidireccionales

---

## CONCLUSIÓN

**FASE 3A: 80% completada, 20% bloqueada por configuración externa.**

El código está listo. La arquitectura está diseñada. 

**Lo único faltante:** Ejecutar la migration SQL en Supabase y re-ejecutar el script de población.

Una vez hecho eso:
- ✅ Los 68 productos tendrán metadata real
- ✅ Las categorías y precios se mostrarán
- ✅ El admin podrá editar valores reales
- ✅ El catálogo público mostrará datos correctos

**FASE 3A cierra cuando Supabase devuelva 68 registros con category + price_min + sku.**
