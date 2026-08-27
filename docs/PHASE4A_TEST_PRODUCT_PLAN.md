# FASE 4A: PRODUCTO DE PRUEBA - PLAN DE EJECUCIÓN

**Proyecto:** Floristería Lucía  
**Fecha:** 2026-08-27  
**Status:** PLAN DE EJECUCIÓN (sin ejecutar aún)  
**Auditoría:** READ-ONLY completada  

---

## AUDITORÍA COMPLETADA

### Configuración confirmada

✅ **GHL Configuration:**
- `GHL_API_BASE`: `https://api.gohighlevel.com/v1`
- `GHL_LOCATION_ID`: `vOq7yOWR63XGU4qQ7XWd`
- `GHL_PRIVATE_INTEGRATION_TOKEN`: Configurado en .env (oculto)
- `GHL_TIMEOUT`: 10000ms

✅ **Supabase Configuration:**
- `SUPABASE_URL`: `https://leksmflinhohnekbgmgj.supabase.co`
- `SUPABASE_PROJECT_ID`: `leksmflinhohnekbgmgj`
- `product_metadata`: Tabla creada y verificada

✅ **Cliente GHL:**
- Función `ghlFetch<T>()` para requests
- Token management implementado
- Error handling implementado

✅ **Types disponibles:**
```typescript
type GHLProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  image?: string;
  images?: string[];
  sku?: string;
  category?: string;
  status?: "active" | "inactive";
  inventory?: number;
  [key: string]: unknown;
};
```

---

## A. PRODUCTO ELEGIDO PARA PRUEBA

**Nombre:** Ramo Silvestre  
**catalog.ts ID:** `ramo-silvestre`  
**Categoría:** `ramos`

### Justificación
- ✅ Producto simple (sin fields especiales)
- ✅ Tiene precio min/max (validar rango)
- ✅ Tiene imagen (validar URL)
- ✅ No tiene colors, badge, ni rose_step (mantiene test limpio)
- ✅ Primera en lista de ramos

### Datos en catalog.ts
```typescript
{
  id: "ramo-silvestre",
  name: "Ramo Silvestre",
  category: "ramos",
  priceMin: 30,
  priceMax: 45,
  image: imgRamos,
  description: "Flor variada de temporada con aire campestre y mucho movimiento."
}
```

---

## B. PAYLOAD EXACTO PARA GHL

### Endpoint
```
POST /locations/{locationId}/products
POST /locations/vOq7yOWR63XGU4qQ7XWd/products
```

### Request Body (JSON)

```json
{
  "name": "Ramo Silvestre",
  "description": "Flor variada de temporada con aire campestre y mucho movimiento.",
  "price": 30,
  "image": "https://PRODUCTION_URL_NEEDED/cat-ramos.jpg",
  "category": "Ramos y Arreglos",
  "status": "active"
}
```

### Campos enviados

| Campo | Valor | Origen | Notas |
|-------|-------|--------|-------|
| **name** | "Ramo Silvestre" | catalog.ts | REQUERIDO |
| **description** | "Flor variada..." | catalog.ts | Opcional (pero incluir) |
| **price** | 30 | catalog.ts.priceMin | REQUERIDO (GHL solo soporta precio único) |
| **image** | "https://PRODUCTION_URL/..." | Asset local | **VER SECCIÓN D ABAJO** |
| **category** | "Ramos y Arreglos" | Mapping de categoria | Convertir "ramos" → etiqueta legible |
| **status** | "active" | Hardcoded | Estándar para nuevo producto |

### Campos NO enviados

| Campo | Razón |
|-------|-------|
| `priceMax` (45) | GHL no soporta rango. Se guardarán en product_metadata |
| `colors` | No aplica a este producto |
| `badge` | GHL no soporta. Se guardará en product_metadata |
| `roseStep` | No aplica a este producto |
| `id` | GHL lo asignará automáticamente |
| `cost` | No aplicable |
| `sku` | Podría añadirse como legacy_catalog_id, pero por ahora no |
| `inventory` | No usamos inventario |

---

## C. ENDPOINT EXACTO

### Método
```
POST
```

### URL
```
https://api.gohighlevel.com/v1/locations/vOq7yOWR63XGU4qQ7XWd/products
```

### Headers
```
Authorization: Bearer {GHL_PRIVATE_INTEGRATION_TOKEN}
Content-Type: application/json
```

### Client existente
El cliente en `src/lib/ghl/client.server.ts` tiene la función `ghlFetch<T>()` que:
- ✅ Construye la URL base
- ✅ Obtiene el token de .env
- ✅ Configura headers de autorización
- ✅ Maneja errores

**Necesitaremos crear una función nueva:** `createGHLProduct()`

```typescript
export async function createGHLProduct(
  locationId: string,
  productData: GHLProduct
): Promise<GHLProduct | GHLError> {
  try {
    const response = await ghlFetch<GHLProduct>(
      `/locations/${locationId}/products`,
      {
        method: "POST",
        body: JSON.stringify(productData),
      }
    );
    console.log(`[GHL] Product created: ${response.id}`);
    return response;
  } catch (error) {
    // Error handling...
  }
}
```

---

## D. PROBLEMA CRÍTICO: IMÁGENES

### Estado actual

**catalog.ts usa:**
```typescript
import imgRamos from "@/assets/cat-ramos.jpg";
```

**En runtime:** Vite procesa esto → genera URL tipo `/assets/cat-ramos-HASH.jpg`

**Problema:** GHL necesita URL **pública absoluta**, no relativa.

### Ejemplos de URLs válidas para GHL

```
https://floristeria-lucia.vercel.app/cat-ramos.jpg
https://floristeria-lucia.com/assets/cat-ramos.jpg
https://cdn.floristeria-lucia.com/products/cat-ramos.jpg
```

### Soluciones identificadas

#### Opción A: Usar dominio de producción (RECOMENDADO)

Si la app está deployada en Vercel:
```
https://floristeria-lucia.vercel.app/cat-ramos.jpg
```

**Requisito:** Assets deben estar en carpeta `public/`

**Status:** ❌ NO CONFIRMADO - necesito que confirmes el dominio

#### Opción B: Usar URL de dominio custom

Si tienes dominio registrado (ej: floristeria-lucia.com):
```
https://floristeria-lucia.com/cat-ramos.jpg
```

**Status:** ❌ NO CONFIRMADO

#### Opción C: NO enviar imagen a GHL (fallback)

```json
{
  "name": "Ramo Silvestre",
  "description": "...",
  "price": 30,
  // image omitido
  "category": "Ramos y Arreglos",
  "status": "active"
}
```

**Desventaja:** GHL sin imágenes

### ⚠️ DECISIÓN BLOQUEADORA

**NO puedo proceder con FASE 4A sin saber qué URL usar para imágenes.**

Necesito que confirmes exactamente:

1. **¿Tiene un dominio de producción registrado?**
   - Si sí: ¿cuál es? (ej: floristeria-lucia.com)
   - Si no: ¿usa vercel.app?

2. **¿Dónde están los assets públicos?**
   - `public/cat-ramos.jpg`
   - `public/assets/cat-ramos.jpg`
   - Otra ruta

3. **¿Qué URL debo usar para pruebas?**
   - Completa y funcional que pueda verificar

**Ejemplo de respuesta válida:**
```
URL de producción: https://floristeria-lucia.vercel.app
Los assets están en: public/
Imagen test: https://floristeria-lucia.vercel.app/cat-ramos.jpg
```

---

## E. REPRESENTACIÓN DE CATEGORÍA

### Mapping: catalog.ts ID → GHL category string

```
catalog.ts           →  GHL category
"ramos"             →  "Ramos y Arreglos"
"plantas"           →  "Plantas y Composiciones"
"rosas-eternas"     →  "Rosas Eternas"
"complementos"      →  "Complementos"
"condolencias"      →  "Condolencias"
```

### Para FASE 4A

```json
"category": "Ramos y Arreglos"
```

### Implementación

Crear mapping en código:
```typescript
const CATEGORY_MAPPING: Record<CategoryId, string> = {
  "ramos": "Ramos y Arreglos",
  "plantas": "Plantas y Composiciones",
  "rosas-eternas": "Rosas Eternas",
  "complementos": "Complementos",
  "condolencias": "Condolencias",
};
```

---

## F. IMAGEN: DECISIÓN PENDIENTE

**Ver Sección D (BLOQUEADOR).**

Para FASE 4A, el payload será:

```json
{
  "image": "[URL_CONFIRMADA]/cat-ramos.jpg"
}
```

Donde `[URL_CONFIRMADA]` es lo que tú proporcionarás.

---

## G. GUARDAR ghl_product_id EN product_metadata

### Flujo de ejecución

1. **POST a GHL**
   ```typescript
   const ghlResponse = await createGHLProduct(
     GHL_LOCATION_ID,
     {
       name: "Ramo Silvestre",
       price: 30,
       ...
     }
   );
   
   // ghlResponse.id = algo como "ghl_product_abc123def456"
   const ghl_product_id = ghlResponse.id;
   ```

2. **INSERT en product_metadata**
   ```sql
   INSERT INTO product_metadata (
     location_id,
     ghl_product_id,
     legacy_catalog_id,
     price_min,
     price_max,
     available_colors,
     badge_label,
     rose_step,
     requires_quote,
     status,
     auto_created,
     created_at,
     updated_at,
     deleted_at
   ) VALUES (
     'vOq7yOWR63XGU4qQ7XWd',  -- location_id
     'ghl_product_abc123...',  -- Obtenido de GHL POST
     'ramo-silvestre',         -- legacy_catalog_id
     30,                       -- price_min
     45,                       -- price_max
     NULL,                     -- available_colors
     NULL,                     -- badge_label
     NULL,                     -- rose_step
     false,                    -- requires_quote
     'active',                 -- status
     false,                    -- auto_created (es manual)
     NOW(),                    -- created_at
     NOW(),                    -- updated_at
     NULL                      -- deleted_at
   );
   ```

3. **Verificar**
   ```sql
   SELECT * FROM product_metadata 
   WHERE legacy_catalog_id = 'ramo-silvestre';
   ```

### Implementación

Crear función:
```typescript
async function saveProductMetadata(
  ghlProductId: string,
  legacyId: string,
  metadata: {
    price_min: number;
    price_max?: number;
    available_colors?: string[] | null;
    badge_label?: string | null;
    rose_step?: number | null;
  }
) {
  // INSERT con Supabase client
}
```

---

## H. GARANTIZAR IDEMPOTENCIA

### Problema
Si el script falla a mitad (ej: GHL OK, pero Supabase falla), ¿evitamos duplicados al re-ejecutar?

### Solución: legacy_catalog_id como clave

**Paso 0: Antes de POST a GHL**
```typescript
// Verificar si ya existe
const existing = await supabase
  .from('product_metadata')
  .select('ghl_product_id')
  .eq('legacy_catalog_id', 'ramo-silvestre')
  .single();

if (existing?.data?.ghl_product_id) {
  console.log('✅ Ya existe. Saltar creación.');
  return existing.data.ghl_product_id;
}

// Si no existe, proceder
const ghlResponse = await createGHLProduct(...);
const newGhlId = ghlResponse.id;

// INSERT
await supabase.from('product_metadata').insert({...});
```

### En GHL

GHL puede crear duplicados si envías múltiples POST con mismo `name`.

**Mitigación:**
1. Verificar primero en product_metadata (local)
2. Si no existe, crear en GHL
3. Guardar mapping inmediatamente

**No hay clave de idempotencia en GHL.** Si GHL creó el producto pero Supabase falló:
- El producto existe en GHL (sin mapping en Supabase)
- Re-ejecutar intenta crear otro (potencial duplicado)

**Solución real:**
- Usar `legacy_catalog_id` como UNIQUE en product_metadata
- Verificar ANTES de cualquier POST

---

## I. ROLLBACK SI FALLA

### Escenario 1: GHL POST falló
```
✅ Nada que deshacer
- product_metadata sin insertar
- Intentar de nuevo
```

### Escenario 2: GHL OK, Supabase INSERT falló
```
⚠️ Producto creado en GHL pero sin metadata

Rollback manual:
1. Obtener ghl_product_id de respuesta
2. DELETE /locations/{id}/products/{ghl_product_id}
3. O dejar orphan y re-intentar INSERT
```

### Escenario 3: GHL OK, Supabase OK, pero verificación falló
```
✅ Nada que deshacer
- Producto existe en GHL
- Metadata existe en Supabase
- Reintentando verificaciones no causa daño
```

### Implementación

```typescript
async function createTestProduct() {
  const catalogProduct = findProduct('ramo-silvestre');
  
  try {
    // 1. Verificar idempotencia
    const existing = await checkProductMetadata('ramo-silvestre');
    if (existing) {
      console.log('✅ Ya existe');
      return;
    }
    
    // 2. POST a GHL
    const ghlResponse = await createGHLProduct(GHL_LOCATION_ID, {
      name: catalogProduct.name,
      price: catalogProduct.priceMin,
      ...
    });
    
    const ghlProductId = ghlResponse.id;
    console.log(`✅ Producto creado en GHL: ${ghlProductId}`);
    
    // 3. INSERT en product_metadata
    await saveProductMetadata(ghlProductId, catalogProduct);
    console.log(`✅ Metadata guardada`);
    
    // 4. Verificar
    await verifyProductCreation(ghlProductId, 'ramo-silvestre');
    console.log(`✅ Verificación completada`);
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    
    // Rollback si es necesario
    if (error.phase === 'supabase_insert') {
      console.log(`⚠️  Rollback: DELETE ${ghlProductId} de GHL`);
      // await deleteGHLProduct(GHL_LOCATION_ID, ghlProductId);
    }
    
    throw error;
  }
}
```

---

## J. COMPROBACIONES READ-ONLY POST-CREACIÓN

### Verificación 1: Confirmar en GHL

```typescript
// GET producto creado
const product = await getGHLProduct(ghlProductId, GHL_LOCATION_ID);

// Validar campos
console.assert(product.name === "Ramo Silvestre");
console.assert(product.price === 30);
console.assert(product.category === "Ramos y Arreglos");
console.assert(product.image !== undefined);
console.assert(product.status === "active");
```

### Verificación 2: Confirmar en product_metadata

```sql
SELECT * FROM product_metadata 
WHERE legacy_catalog_id = 'ramo-silvestre' 
AND status = 'active';
```

Validar:
- ✅ ghl_product_id no NULL
- ✅ legacy_catalog_id = 'ramo-silvestre'
- ✅ price_min = 30
- ✅ price_max = 45
- ✅ available_colors IS NULL
- ✅ badge_label IS NULL
- ✅ rose_step IS NULL
- ✅ requires_quote = false
- ✅ auto_created = false
- ✅ status = 'active'
- ✅ created_at recent
- ✅ deleted_at IS NULL

### Verificación 3: Listado en GHL

```typescript
const products = await getGHLProducts(GHL_LOCATION_ID);
const found = products.products.find(p => p.id === ghlProductId);
console.assert(found !== undefined, "Producto debe estar en lista");
```

### Verificación 4: Count actualizado

```sql
-- Debería haber exactamente 1 en product_metadata
SELECT COUNT(*) FROM product_metadata 
WHERE status = 'active';
-- Esperado: 1
```

---

## PLAN DE EJECUCIÓN FASE 4A

### Paso 1: Confirmar URL de imágenes (BLOQUEADOR)
- ❌ Esperar confirmación del usuario
- Necesario: PRODUCTION_URL funcional y verificable

### Paso 2: Crear función createGHLProduct() en src/lib/ghl/client.server.ts
- Basada en patrón de ghlFetch()
- Con manejo de errores
- Con logging

### Paso 3: Crear mapping de categorías
- Función CATEGORY_MAPPING
- O usar inline en la función

### Paso 4: Crear script test
- `scripts/phase4a-test-product.mjs` o similar
- Función main() con try/catch
- Logging exhaustivo

### Paso 5: EJECUTAR (cuando usuario apruebe)
```bash
node scripts/phase4a-test-product.mjs
```

### Paso 6: Verificar
- ✅ GHL dashboard - visualizar producto
- ✅ SQL query - verificar metadata
- ✅ Logs - validar todos los pasos

### Paso 7: DECISION
- ✅ Si OK → proceder a FASE 4B (40 productos restantes)
- ❌ Si falla → rollback + investigar + reintentarintentar

---

## RESUMEN DE DECISIONES PENDIENTES

| Decisión | Opciones | Estado |
|----------|----------|--------|
| **URL Producción** | Vercel app / Custom domain / Otra | ❌ **BLOQUEADOR** |
| **Ruta assets públicos** | public/ / public/assets/ / otra | ❌ **BLOQUEADOR** |
| **Imagen test** | URL completa y funcional | ❌ **BLOQUEADOR** |
| **Producto test** | ramo-silvestre | ✅ DECIDIDO |
| **Categoría mapping** | Ramos y Arreglos | ✅ DECIDIDO |
| **Endpoint** | POST /locations/{id}/products | ✅ DECIDIDO |
| **Idempotencia** | legacy_catalog_id check | ✅ DECIDIDO |
| **Rollback** | DELETE de GHL si Supabase falla | ✅ DECIDIDO |

---

## PRÓXIMOS PASOS

### Para que yo continúe:

1. **Proporciona PRODUCTION_URL**
   ```
   Ejemplo: https://floristeria-lucia.vercel.app
   O: https://floristeria-lucia.com
   ```

2. **Confirma ruta de assets**
   ```
   Ejemplo: public/cat-ramos.jpg
   O: assets/images/cat-ramos.jpg
   ```

3. **Confirma que las imágenes son accesibles**
   ```
   Abre en navegador: https://tu-url/cat-ramos.jpg
   Verifica que la imagen se carga
   ```

4. **Aprueba el plan**
   ```
   "Procede con FASE 4A usando..."
   ```

Entonces yo:
- ✅ Crearé createGHLProduct()
- ✅ Crearé script de test
- ✅ Ejecutaré FASE 4A
- ✅ Verificaré resultado
- ✅ Reportaré éxito/fallo

---

**Status:** BLOQUEADO EN DECISIÓN D (URL de imágenes)  
**Tipo de bloqueo:** Usuario debe proporcionar PRODUCTION_URL  
**Impacto:** Sin esto, no puedo proceder

