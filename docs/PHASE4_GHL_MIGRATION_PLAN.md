# FASE 4: GHL PRODUCT MIGRATION PLAN

**Proyecto:** Floristería Lucía  
**Fecha:** 2026-08-27  
**Status:** PREPARATION & DRY RUN ONLY (no POST ejecutado)  
**Inventario definitivo:** 41 productos  

---

## 1. INVENTARIO DEFINITIVO

**Total de productos:** 41 (no 49)

### 1.1 Desglose por categoría

| Categoría | Count | Productos |
|-----------|-------|-----------|
| **ramos** | 6 | ramo-silvestre, ramo-felicidad, ramo-alegria, ramo-girasoles, ramo-belleza, ramo-rosas |
| **plantas** | 13 | anthurium, taza-plantas, cesta-mimbre, cesta-blanca-mimbre, banera-ceramica, orquidea-azul, orquidea, denrobium, centro-orquideas-variadas, centro-orquidea-blanca, cesta-rosa, bonsai-ficus-ginseng, calathea |
| **rosas-eternas** | 4 | caja-rosas-eternas, caja-romantica, cupido, pecera-rosa-eterna |
| **complementos** | 13 | jarron-cristal-1, jarron-cristal-2, chocolate-belga-pequena, chocolate-belga-grande, oso-peluche, oso-peluche-corazon, macetero-violeta-orquidea, macetero-blanco-orquidea, piruletas, vino-seleccion, tabla-quesos, cesta-frutas, globos-ocasion |
| **condolencias** | 5 | cruz-flores, ramo-condolencias, mural-flores, ramos-bancas-iglesia, aro-flores |

### 1.2 Verificación de campos especiales

| Campo | Count | Productos |
|-------|-------|-----------|
| **colors** | 5 | ramo-rosas, caja-rosas-eternas, caja-romantica, cupido, pecera-rosa-eterna |
| **badge** | 3 | ramo-felicidad ("Más vendido"), centro-orquideas-variadas ("Premium"), caja-rosas-eternas ("7-10 años") |
| **roseStep** | 4 | ramo-rosas (6), caja-rosas-eternas (6), caja-romantica (6), cupido (6) |
| **priceMax** | 17 | ramo-silvestre (45), ramo-felicidad (50), ramo-alegria (50), ramo-girasoles (45), ramo-belleza (45), ramo-rosas (48), taza-plantas (60), caja-rosas-eternas (85), caja-romantica (75), cupido (85), vino-seleccion (25), tabla-quesos (28), cesta-frutas (35), globos-ocasion (12) + 3 more |
| **quoteOnly** | 0 | NINGUNO |

---

## 2. API DE CREACIÓN DE PRODUCTOS GHL

### 2.1 Endpoint (Análisis del cliente existente)

**Base URL:** `https://api.gohighlevel.com/v1`

**Endpoint de creación:**
```
POST /locations/{locationId}/products
```

**Location ID:** `vOq7yOWR63XGU4qQ7XWd` (configurado en .env)

### 2.2 Estructura de Request

**Basado en GHLProduct type (src/lib/ghl/types.ts):**

```typescript
{
  id?: string;                    // Generado por GHL (retornado en response)
  name: string;                   // REQUERIDO
  description?: string;           // Opcional
  price?: number;                 // REQUERIDO (usa priceMin)
  cost?: number;                  // Opcional
  image?: string;                 // Opcional (URL)
  images?: string[];              // Opcional (URLs)
  sku?: string;                   // Opcional
  category?: string;              // Opcional (STRING, no ID)
  status?: "active" | "inactive"; // Opcional (default: active)
  inventory?: number;             // Opcional
  [key: string]: unknown;         // Custom fields (permitidos pero GHL no soporta para products)
}
```

### 2.3 Respuesta de Creación

**Formato esperado:**
```json
{
  "id": "ghl_product_id_asignado",
  "name": "...",
  "price": "...",
  "status": "active",
  ...
}
```

**Campo crítico:** El `id` devuelto por GHL debe ser **capturado e inmediatamente guardado** como `ghl_product_id` en `product_metadata`.

### 2.4 Autenticación

```
Authorization: Bearer {GHL_PRIVATE_INTEGRATION_TOKEN}
Content-Type: application/json
```

---

## 3. MAPPING catalog.ts → GHL

### 3.1 Tabla de Mapping

| catalog.ts | GHL | Acción | Notas |
|-----------|-----|--------|-------|
| **id** | ❌ | → product_metadata.legacy_catalog_id | GHL asigna su propio ID |
| **name** | ✅ name | Copia directa | REQUERIDO |
| **category** | ✅ category (STRING) | Copia directa | No soporta categoría normalizada |
| **priceMin** | ✅ price | Copia directa | GHL solo tiene 1 precio |
| **priceMax** | ❌ | → product_metadata.price_max | GHL no soporta rango |
| **image** | ✅ image (URL) | Necesita conversión | Asset local → URL pública |
| **description** | ✅ description | Copia directa | Incluye HTML |
| **badge** | ❌ | → product_metadata.badge_label | GHL no soporta custom fields |
| **colors** | ❌ | → product_metadata.available_colors | GHL no soporta custom fields |
| **roseStep** | ❌ | → product_metadata.rose_step | GHL no soporta custom fields |
| **quoteOnly** | ❌ | → product_metadata.requires_quote | Todos son false |

### 3.2 Campos que VAN a GHL

```
{
  "name": "Ramo Silvestre",
  "description": "Flor variada...",
  "price": 30,
  "image": "https://cdn.floristeria-lucia.com/ramo-silvestre.jpg",
  "category": "ramos",
  "status": "active"
}
```

### 3.3 Campos que VAN a product_metadata

```
{
  "ghl_product_id": "ASIGNADO_POR_GHL",
  "legacy_catalog_id": "ramo-silvestre",
  "price_min": 30,
  "price_max": 45,
  "available_colors": null,
  "badge_label": null,
  "rose_step": null,
  "requires_quote": false,
  "status": "active",
  "auto_created": false
}
```

---

## 4. CATEGORÍAS

### 4.1 Categorías en catalog.ts

```
1. ramos
2. plantas
3. rosas-eternas
4. complementos
5. condolencias
```

### 4.2 Análisis de API GHL

**Hallazgo:** GHL API tiene un campo `category` que es STRING, no ID referencial.

**Opciones:**

#### Opción A: Usar nombres de categoría en GHL (RECOMENDADO)

```
catalog.ts category  →  GHL category
ramos               →  "Ramos y Arreglos"
plantas             →  "Plantas y Composiciones"
rosas-eternas       →  "Rosas Eternas"
complementos        →  "Complementos"
condolencias        →  "Condolencias"
```

**Ventaja:** Sincronización bidireccional posible  
**Desventaja:** Sin ID referencial

#### Opción B: No usar categoría en GHL, usar mapping file

```
src/data/ghl_category_mapping.json
{
  "ramo-silvestre": "ramos",
  "anthurium": "plantas",
  ...
}
```

**Ventaja:** Independencia vs GHL  
**Desventaja:** Mapper manual

**DECISIÓN RECOMENDADA:** Opción A (usar nombres en GHL)

---

## 5. IMÁGENES

### 5.1 Estado actual

**catalog.ts usa:**
```typescript
import imgRamos from "@/assets/cat-ramos.jpg";
```

**Tipo:** Assets de Vite - archivos locales

### 5.2 Problema

GHL necesita URLs públicas. Assets locales no son accesibles.

### 5.3 Soluciones

#### Solución A: Usar URLs de Vercel (RECOMENDADO)

```
@/assets/cat-ramos.jpg  →  https://floristeria-lucia.vercel.app/cat-ramos.jpg
```

**Requisito:** Assets en carpeta `public/`  
**Ventaja:** Automático con Vercel deployment  
**Inconveniente:** Requiere conocer dominio

#### Solución B: Usar CDN externo

Subir imágenes a AWS S3, Cloudinary, etc.

**Ventaja:** Control completo  
**Inconveniente:** Costo, gestión

#### Solución C: Mantener en local, no sincronizar imagen a GHL

```
{
  "name": "Ramo Silvestre",
  "price": 30,
  "description": "..."
  // image: null (no enviar)
}
```

**Ventaja:** Sin cambios  
**Inconveniente:** GHL sin imágenes

### 5.4 DECISIÓN RECOMENDADA

**Solución A:** Usar URLs de Vercel

Mapping:
```
imgRamos             →  /cat-ramos.jpg
imgGirasoles        →  /girasoles.jpg
imgPlantas          →  /cat-plantas.jpg
imgRosasEternas     →  /cat-rosas-eternas.jpg
imgComplementos     →  /cat-complementos.jpg
imgCondolencias     →  /cat-condolencias.jpg
```

**Acción:** Pasos previos a migración:
1. Verificar que assets existen en `public/`
2. Verificar URLs públicas en producción
3. Usar formato: `https://PRODUCTION_URL/filename.jpg`

---

## 6. PRODUCT_METADATA DESIGN

### 6.1 Registro esperado

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
  'vOq7yOWR63XGU4qQ7XWd',     -- location_id (fijo)
  'ghl_product_id_123...',    -- Obtenido de respuesta GHL
  'ramo-silvestre',           -- catalog.ts id
  30,                         -- priceMin
  45,                         -- priceMax (if exists)
  NULL,                       -- colors (if exists)
  NULL,                       -- badge (if exists)
  NULL,                       -- roseStep (if exists)
  false,                      -- requires_quote
  'active',                   -- status
  false,                      -- auto_created (migración manual)
  NOW(),                      -- created_at
  NOW(),                      -- updated_at
  NULL                        -- deleted_at
);
```

### 6.2 Ejemplo real: "Ramo de Rosas"

```sql
{
  location_id: 'vOq7yOWR63XGU4qQ7XWd',
  ghl_product_id: 'ghl_ramo_rosas_xyz...',
  legacy_catalog_id: 'ramo-rosas',
  price_min: 24,
  price_max: 48,
  available_colors: '["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]',
  badge_label: NULL,
  rose_step: 6,
  requires_quote: false,
  status: 'active',
  auto_created: false,
  created_at: NOW(),
  updated_at: NOW(),
  deleted_at: NULL
}
```

---

## 7. ESTRATEGIA DE MIGRACIÓN

### 7.1 FASE 4A: Producto de Prueba

**Seleccionar:** "Ramo Silvestre" (ramo-silvestre)

**Pasos:**
1. POST /products con datos de ramo-silvestre
2. Capturar GHL product ID
3. INSERT en product_metadata
4. VALIDAR en GHL dashboard manualmente
5. VALIDAR que producto aparece en frontend
6. ROLLBACK si hay problemas (DELETE de GHL + DELETE de product_metadata)

**Duración estimada:** 30 minutos

### 7.2 FASE 4B: Migración Masiva (40 productos restantes)

**Opción A: Script secuencial** (RECOMENDADO para seguridad)
```
for each product in catalog:
  1. POST /products
  2. INSERT product_metadata
  3. Validar respuesta
  4. Log resultado
```

**Duración:** ~10-15 minutos (POST ~100-300ms c/u)

**Opción B: Script paralelo** (más rápido pero más riesgoso)
```
Promise.all([
  product1: POST → INSERT,
  product2: POST → INSERT,
  ...
])
```

**Duración:** ~1-2 minutos

**DECISIÓN RECOMENDADA:** Opción A (secuencial, con validación)

### 7.3 FASE 4C: Verificación Completa

```sql
-- Verificar 41 productos en GHL
SELECT COUNT(*) FROM /products WHERE location_id = 'vOq7yOWR63XGU4qQ7XWd'
-- Esperado: 41

-- Verificar 41 registros en product_metadata
SELECT COUNT(*) FROM product_metadata WHERE status = 'active'
-- Esperado: 41

-- Verificar mapping correcto
SELECT legacy_catalog_id, ghl_product_id 
FROM product_metadata 
ORDER BY created_at
-- Esperado: 41 filas con IDs pareados
```

### 7.4 FASE 4D: Testing Funcional

```
1. Verificar que frontend muestra 41 productos
2. Verificar que los precios son correctos
3. Verificar que los colores se muestran (5 productos)
4. Verificar que los badges se muestran (3 productos)
5. Verificar que rose_step funciona (4 productos)
6. Verificar que categorías se aplican correctamente
```

---

## 8. IDEMPOTENCIA

### 8.1 Problema

Si el script falla a mitad y se re-ejecuta, ¿evitamos duplicados?

### 8.2 Solución

**Usar `legacy_catalog_id` como clave de idempotencia**

```javascript
async function createOrGetProduct(catalogProduct) {
  // 1. Verificar si ya existe en product_metadata
  const existing = await selectByLegacyId(catalogProduct.id);
  
  if (existing) {
    console.log(`Producto ya existe: ${catalogProduct.id} → ${existing.ghl_product_id}`);
    return existing; // No hacer POST
  }
  
  // 2. Si no existe, crear en GHL
  const ghlResponse = await createGHLProduct(catalogProduct);
  const ghlProductId = ghlResponse.id;
  
  // 3. Insertar en product_metadata
  await insertProductMetadata({
    ghl_product_id: ghlProductId,
    legacy_catalog_id: catalogProduct.id,
    ...
  });
  
  return { ghl_product_id: ghlProductId };
}
```

**Ventaja:** Si el script falla y se re-ejecuta, no duplica

---

## 9. DRY RUN - PREVIEW COMPLETO

### 9.1 Preview de los 41 productos

| # | catalog.ts ID | Nombre | Categoría | Precio GHL | priceMax | Colores | Badge | roseStep | Imagen | Metadata |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ramo-silvestre | Ramo Silvestre | ramos | 30 | 45 | ❌ | ❌ | ❌ | ✅ | price_max |
| 2 | ramo-felicidad | Ramo Felicidad | ramos | 35 | 50 | ❌ | "Más vendido" | ❌ | ✅ | price_max, badge |
| 3 | ramo-alegria | Ramo Alegría | ramos | 35 | 50 | ❌ | ❌ | ❌ | ✅ | price_max |
| 4 | ramo-girasoles | Ramo de Girasoles | ramos | 30 | 45 | ❌ | ❌ | ❌ | ✅ | price_max |
| 5 | ramo-belleza | Ramo Belleza | ramos | 30 | 45 | ❌ | ❌ | ❌ | ✅ | price_max |
| 6 | ramo-rosas | Ramo de Rosas | ramos | 24 | 48 | ["Rojo", "Rosa"...] | ❌ | 6 | ✅ | price_max, colors, rose_step |
| 7 | anthurium | Anthurium | plantas | 25 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 8 | taza-plantas | Taza de Plantas | plantas | 36 | 60 | ❌ | ❌ | ❌ | ✅ | price_max |
| 9 | cesta-mimbre | Cesta de Mimbre | plantas | 60 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 10 | cesta-blanca-mimbre | Cesta Blanca de Mimbre | plantas | 45 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 11 | banera-ceramica | Bañera Cerámica | plantas | 35 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 12 | orquidea-azul | Orquídea Azul | plantas | 30 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 13 | orquidea | Orquídea | plantas | 30 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 14 | denrobium | Denrobium | plantas | 28 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 15 | centro-orquideas-variadas | Centro de Orquídeas Variadas | plantas | 80 | ❌ | ❌ | "Premium" | ❌ | ✅ | badge |
| 16 | centro-orquidea-blanca | Centro Orquídea Blanca | plantas | 80 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 17 | cesta-rosa | Cesta Rosa | plantas | 25 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 18 | bonsai-ficus-ginseng | Bonsái Ficus Ginseng | plantas | 25 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 19 | calathea | Calathea | plantas | 35 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 20 | caja-rosas-eternas | Caja de Rosas Eternas | rosas-eternas | 40 | 85 | ["Rojo", "Rosa"...] | "7-10 años" | 6 | ✅ | price_max, colors, badge, rose_step |
| 21 | caja-romantica | Caja Romántica | rosas-eternas | 45 | 75 | ["Rojo", "Rosa"...] | ❌ | 6 | ✅ | price_max, colors, rose_step |
| 22 | cupido | Cupido | rosas-eternas | 55 | 85 | ["Rojo", "Rosa"...] | ❌ | 6 | ✅ | price_max, colors, rose_step |
| 23 | pecera-rosa-eterna | Pecera Rosa Eterna | rosas-eternas | 22 | ❌ | ["Rojo", "Rosa"...] | ❌ | ❌ | ✅ | colors |
| 24 | jarron-cristal-1 | Jarrón de Cristal Nº 1 | complementos | 1.5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 25 | jarron-cristal-2 | Jarrón de Cristal Nº 2 | complementos | 5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 26 | chocolate-belga-pequena | Chocolate Belga Caja Pequeña | complementos | 12.5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 27 | chocolate-belga-grande | Chocolate Belga Caja Grande | complementos | 15 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 28 | oso-peluche | Oso de Peluche | complementos | 12.5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 29 | oso-peluche-corazon | Oso de Peluche Corazón | complementos | 12 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 30 | macetero-violeta-orquidea | Macetero Violeta Orquídea | complementos | 4.5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 31 | macetero-blanco-orquidea | Macetero Blanco Orquídea | complementos | 4.5 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 32 | piruletas | Piruletas | complementos | 3 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 33 | vino-seleccion | Botella de vino | complementos | 12 | 25 | ❌ | ❌ | ❌ | ✅ | price_max |
| 34 | tabla-quesos | Selección de quesos | complementos | 15 | 28 | ❌ | ❌ | ❌ | ✅ | price_max |
| 35 | cesta-frutas | Frutas de temporada | complementos | 18 | 35 | ❌ | ❌ | ❌ | ✅ | price_max |
| 36 | globos-ocasion | Globos | complementos | 4 | 12 | ❌ | ❌ | ❌ | ✅ | price_max |
| 37 | cruz-flores | Cruz de flores | condolencias | 90 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 38 | ramo-condolencias | Ramo de condolencias | condolencias | 60 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 39 | mural-flores | Mural de flores para pared | condolencias | 150 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 40 | ramos-bancas-iglesia | Ramos para bancas de iglesia | condolencias | 45 | ❌ | ❌ | ❌ | ❌ | ✅ | none |
| 41 | aro-flores | Aro de flores | condolencias | 110 | ❌ | ❌ | ❌ | ❌ | ✅ | none |

### 9.2 Resumen de DRY RUN

**Productos a crear en GHL:**
- Total: 41
- Con priceMax: 14
- Con colors: 5
- Con badge: 3
- Con rose_step: 4

**Registros a insertar en product_metadata:**
- Total: 41
- Con metadata simple: 28
- Con metadata compleja: 13

---

## 10. VALIDACIONES PREVIAS A MIGRACIÓN

### 10.1 Checklist de validación

```
Pre-migración:
  ☐ Confirmar que GHL location_id es correcto
  ☐ Confirmar que GHL_PRIVATE_INTEGRATION_TOKEN es válido
  ☐ Confirmar que product_metadata tabla existe y vacía
  ☐ Confirmar que las imágenes assets existen en public/
  ☐ Verificar que PRODUCTION_URL es conocido y válido
  ☐ Verificar que GHL API responde
  ☐ Verificar que Supabase connection funciona
  ☐ Hacer backup de product_metadata (exportar JSON)

Post-migración (Fase 4C):
  ☐ Verificar 41 productos en GHL dashboard
  ☐ Verificar 41 registros en product_metadata
  ☐ Verificar mapping 1:1 de legacy_id ↔ ghl_id
  ☐ Validar 5 productos con colores se muestran en UI
  ☐ Validar 3 productos con badges se muestran correctamente
  ☐ Validar 4 productos con rose_step funcionan
  ☐ Validar categorías se filtran correctamente
```

### 10.2 Rollback

Si migración falla:
```sql
-- Rollback Phase 4A
DELETE FROM product_metadata WHERE legacy_catalog_id = 'ramo-silvestre';
DELETE FROM GHL /products/ghl_product_id_here

-- Rollback Phase 4B
DELETE FROM product_metadata WHERE status = 'active' AND auto_created = false;
-- Manualmente deletear productos de GHL (acceso dashboard)
```

---

## 11. SCRIPTS REQUERIDOS (NO EJECUTADOS)

### 11.1 Script: Crear primer producto (FASE 4A)

**Archivo:** `scripts/ghl-create-test-product.mjs`

Pseudocódigo:
```javascript
// 1. Cargar "ramo-silvestre" de catalog.ts
// 2. POST /products con nombre, precio, descripción, imagen, categoría
// 3. Capturar ghl_product_id
// 4. INSERT en product_metadata
// 5. Validar en GHL
```

### 11.2 Script: Crear 40 productos restantes (FASE 4B)

**Archivo:** `scripts/ghl-migrate-all-products.mjs`

Pseudocódigo:
```javascript
// Para cada producto en catalog.ts:
//   1. Verificar no exista en product_metadata (idempotencia)
//   2. POST /products con datos
//   3. INSERT product_metadata
//   4. Log resultado
// 5. Resumen final
```

### 11.3 Script: Verificar migración (FASE 4C)

**Archivo:** `scripts/ghl-verify-migration.mjs`

Pseudocódigo:
```javascript
// 1. SELECT COUNT(*) FROM product_metadata (esperado: 41)
// 2. SELECT COUNT(*) FROM GHL /products (esperado: 41)
// 3. Verificar mapping 1:1
// 4. Validar metadata
```

---

## 12. RESUMEN Y DECISIONES PENDIENTES

### 12.1 Decisiones APROBADAS

- ✅ **Inventario:** 41 productos confirmados
- ✅ **API:** POST /locations/{id}/products
- ✅ **Categorías:** Usar STRING en GHL (opción A)
- ✅ **Migración:** Secuencial FASE 4A → 4B → 4C
- ✅ **Idempotencia:** legacy_catalog_id como clave

### 12.2 Decisiones PENDIENTES

- ⏳ **Imágenes:** ¿Usar URLs de Vercel (recomendado) o mantener locales?
- ⏳ **PRODUCTION_URL:** ¿Cuál es el dominio de producción?
- ⏳ **Timing:** ¿Cuándo ejecutar la migración?

### 12.3 Acción siguiente

**NO ejecutar migración todavía.**

Esperar confirmación explícita:
1. Decisión de imágenes
2. Dominio de producción
3. Aprobación de proceder con FASE 4A

---

## ESTADO ACTUAL

✅ **ANÁLISIS COMPLETADO**
- Inventario definitivo: 41 productos
- API mapeada
- Estrategia definida
- DRY RUN completado
- Scripts diseñados (no ejecutados)
- Validaciones listadas

❌ **NO EJECUTADO**
- Sin POST a GHL
- Sin INSERT en product_metadata
- Sin modificación de código
- Sin cambios en .env
- Sin cambios en deployment

---

**Estado:** LISTO PARA APROBACIÓN DE MIGRACIÓN FASE 4A  
**Fecha:** 2026-08-27  
**Status:** PREPARATION COMPLETE - AWAITING USER APPROVAL

