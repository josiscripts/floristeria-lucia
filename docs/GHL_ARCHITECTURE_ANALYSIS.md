# Análisis Arquitectónico: GHL como Fuente Principal del Catálogo

**Documento:** Análisis de Distribución de Datos  
**Fecha:** 2026-08-26  
**Estado:** Análisis completado - Pendiente aprobación  
**Objetivo:** Determinar qué datos van a GHL vs Supabase vs Frontend

---

## 1. ESTRUCTURA ACTUAL DE PRODUCTO (catalog.ts)

### Campos actuales en TypeScript:

```typescript
type Product = {
  id: string; // "ramo-silvestre"
  name: string; // "Ramo Silvestre"
  category: CategoryId; // "ramos"
  priceMin: number; // 30
  priceMax?: number; // 45
  image: string; // imgRamos (ruta de import)
  description: string; // "Flor variada..."
  badge?: string; // "Más vendido"
  quoteOnly?: boolean; // false (no usado)
  roseStep?: number; // 6 (solo rosas)
  colors?: string[]; // ["Rojo", "Rosa", ...]
};
```

---

## 2. CAMPOS NATIVOS DE GHL PRODUCTS API

### Estructura real de producto devuelto por GHL:

```json
{
  "_id": "6a87b91004c302157108f01d", // GHL asigna
  "locationId": "vOq7yOWR63XGU4qQ7XWd", // Floristería Lucía
  "name": "pepito", // ✅ Editable
  "description": "<p>hola a todos</p>", // ✅ Editable
  "productType": "DIGITAL", // Tipo de producto
  "image": "https://assets.cdn.filesafe...", // ✅ Editable
  "availableInStore": true, // ✅ Disponibilidad
  "status": "active", // ✅ Activo/Inactivo
  "category": "categoría_string", // ✅ Editable (string libre)
  "isTaxesEnabled": false,
  "taxes": [],
  "trackProductInventory": false,
  "variants": [], // ✅ Soporta variantes
  "createdAt": "2026-08-21T02:33:52.386Z",
  "updatedAt": "2026-08-21T02:42:02.385Z",
  "createdBy": "lo5qk08B95EED4KHc2wz"
}
```

### Campos nativos que GHL PUEDE almacenar:

| Campo GHL          | Tipo            | Editable cliente | Corresponde a                      |
| ------------------ | --------------- | ---------------- | ---------------------------------- |
| `name`             | string          | ✅ Sí            | `name`                             |
| `description`      | string (HTML)   | ✅ Sí            | `description`                      |
| `image`            | URL             | ✅ Sí            | `image`                            |
| `category`         | string          | ✅ Sí            | `category`                         |
| `status`           | active/inactive | ✅ Sí            | - (nuevo)                          |
| `availableInStore` | boolean         | ✅ Sí            | - (nuevo)                          |
| `productType`      | string          | ✅ Sí            | - (nuevo)                          |
| `variants`         | array           | ✅ Sí            | - (podría reemplazar colors/sizes) |

---

## 3. ANÁLISIS DE CADA CAMPO DE PRODUCTOS

### 3.1 `id` (ID original: "ramo-silvestre")

| Criterio                  | Análisis                                         |
| ------------------------- | ------------------------------------------------ |
| **Qué es**                | Identificador único en catalog.ts                |
| **Formato**               | kebab-case string                                |
| **GHL puede almacenarla** | NO (GHL asigna su propio `_id`)                  |
| **¿Es crítica?**          | SÍ (mapeo legacy → GHL)                          |
| **Dónde guardarla**       | ✅ Supabase `product_metadata.legacy_catalog_id` |
| **Decisión**              | Supabase (metadata técnica)                      |
| **¿Editable cliente?**    | NO (es un identificador interno)                 |

### 3.2 `name` (Ejemplo: "Ramo Silvestre")

| Criterio                  | Análisis                          |
| ------------------------- | --------------------------------- |
| **Qué es**                | Nombre del producto visible       |
| **Formato**               | string UTF-8                      |
| **GHL puede almacenarla** | ✅ SÍ (campo nativo `name`)       |
| **¿Es crítica?**          | SÍ (lo más importante)            |
| **Dónde guardarla**       | ✅ **GHL**                        |
| **Decisión**              | **GHL** (cliente administra aquí) |
| **¿Editable cliente?**    | ✅ SÍ (desde GHL Dashboard)       |

### 3.3 `description` (Ejemplo: "Flor variada de temporada...")

| Criterio                  | Análisis                           |
| ------------------------- | ---------------------------------- |
| **Qué es**                | Descripción para mostrar en ficha  |
| **Formato**               | string, puede ser HTML             |
| **GHL puede almacenarla** | ✅ SÍ (campo nativo `description`) |
| **¿Es crítica?**          | SÍ (describe el producto)          |
| **Dónde guardarla**       | ✅ **GHL**                         |
| **Decisión**              | **GHL** (cliente administra aquí)  |
| **¿Editable cliente?**    | ✅ SÍ (desde GHL Dashboard)        |

### 3.4 `image` (Ejemplo: ruta de import)

| Criterio                  | Análisis                               |
| ------------------------- | -------------------------------------- |
| **Qué es**                | URL de imagen del producto             |
| **Formato actual**        | Import de Vite (src/assets)            |
| **Formato en GHL**        | URL absoluta (https://...)             |
| **GHL puede almacenarla** | ✅ SÍ (campo nativo `image`)           |
| **¿Es crítica?**          | SÍ (visual imprescindible)             |
| **Conversión necesaria**  | Subir a Supabase Storage o CDN         |
| **Dónde guardarla**       | ✅ **GHL** (URL pública)               |
| **Decisión**              | **GHL** (cliente sube imágenes en GHL) |
| **¿Editable cliente?**    | ✅ SÍ (desde GHL Dashboard)            |

### 3.5 `category` (Ejemplo: "ramos")

| Criterio                  | Análisis                                                            |
| ------------------------- | ------------------------------------------------------------------- |
| **Qué es**                | Categoría del producto                                              |
| **Valores actuales**      | "ramos", "plantas", "rosas-eternas", "complementos", "condolencias" |
| **GHL puede almacenarla** | ✅ SÍ (campo nativo `category` - string libre)                      |
| **¿Es crítica?**          | SÍ (agrupa productos)                                               |
| **Dónde guardarla**       | ✅ **GHL**                                                          |
| **Decisión**              | **GHL** (cliente administra aquí)                                   |
| **¿Editable cliente?**    | ✅ SÍ (desde GHL Dashboard)                                         |
| **Nota**                  | GHL no valida valores, acepta cualquier string                      |

### 3.6 `priceMin` (Ejemplo: 30)

| Criterio                  | Análisis                          |
| ------------------------- | --------------------------------- |
| **Qué es**                | Precio mínimo del producto        |
| **Formato**               | number (€)                        |
| **GHL puede almacenarla** | ✅ SÍ (campo nativo `price`)      |
| **¿Es crítica?**          | SÍ (esencial para e-commerce)     |
| **Dónde guardarla**       | ✅ **GHL**                        |
| **Decisión**              | **GHL** (como `price`)            |
| **¿Editable cliente?**    | ✅ SÍ (desde GHL Dashboard)       |
| **Nota**                  | GHL solo tiene 1 precio, no rango |

### 3.7 `priceMax` (Ejemplo: 45)

| Criterio                  | Análisis                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| **Qué es**                | Precio máximo (rango de precios)                                       |
| **Formato**               | number (€)                                                             |
| **Productos afectados**   | 25 de 58 (43%)                                                         |
| **GHL puede almacenarla** | ❌ NO (no hay campo nativo para rango)                                 |
| **¿Es crítica?**          | SÍ (define rango de precios)                                           |
| **Dónde guardarla**       | ✅ Supabase `product_metadata.price_max`                               |
| **Decisión**              | **Supabase** (dato técnico)                                            |
| **¿Editable cliente?**    | ⚠️ DEPENDE (ver abajo)                                                 |
| **Nota**                  | Cliente DEBE poder editarlo, pero desde GHL no es posible directamente |

### 3.8 `badge` (Ejemplo: "Más vendido")

| Criterio                  | Análisis                                    |
| ------------------------- | ------------------------------------------- |
| **Qué es**                | Etiqueta visual especial                    |
| **Valores**               | "Más vendido", "Premium", "7-10 años"       |
| **Productos afectados**   | 3 de 58 (5%)                                |
| **GHL puede almacenarla** | ❌ NO (no hay campo nativo)                 |
| **¿Es crítica?**          | NO (es decorativo)                          |
| **Dónde guardarla**       | ✅ Supabase `product_metadata.badge_label`  |
| **Decisión**              | **Supabase** (dato de presentación técnico) |
| **¿Editable cliente?**    | ⚠️ DEPENDE (ver abajo)                      |

### 3.9 `roseStep` (Valor: 6)

| Criterio                  | Análisis                                     |
| ------------------------- | -------------------------------------------- |
| **Qué es**                | Multiplicador para productos de rosas        |
| **Significado**           | 1 unidad = 6 rosas físicas                   |
| **Productos afectados**   | 4 de 58 (7%)                                 |
| **GHL puede almacenarla** | ❌ NO (no hay campo nativo)                  |
| **¿Es crítica?**          | SÍ (lógica de negocio)                       |
| **Dónde guardarla**       | ✅ Supabase `product_metadata.rose_step`     |
| **Decisión**              | **Supabase** (lógica específica del negocio) |
| **¿Editable cliente?**    | ❌ NO (es configuración técnica)             |

### 3.10 `colors` (Array: ["Rojo", "Rosa", ...])

| Criterio                  | Análisis                                                   |
| ------------------------- | ---------------------------------------------------------- |
| **Qué es**                | Colores disponibles para personalizar                      |
| **Productos afectados**   | 4 de 58 (7%)                                               |
| **Valores**               | 6 colores fijos (Rojo, Rosa, Blanco, Azul, Lila, Amarillo) |
| **GHL puede almacenarla** | ❌ NO (no hay campo nativo)                                |
| **¿Es crítica?**          | SÍ (opción de compra)                                      |
| **Dónde guardarla**       | ✅ Supabase `product_metadata.available_colors`            |
| **Decisión**              | **Supabase** (configuración de producto)                   |
| **¿Editable cliente?**    | ⚠️ DEPENDE (ver abajo)                                     |

### 3.11 `quoteOnly` (Valor: false, no usado)

| Criterio                  | Análisis                                                  |
| ------------------------- | --------------------------------------------------------- |
| **Qué es**                | Indica si requiere cotización                             |
| **Uso actual**            | NO UTILIZADO (todos los productos tienen false implícito) |
| **GHL puede almacenarla** | ❌ NO (no hay campo nativo)                               |
| **¿Es crítica?**          | NO (funcionalidad futura)                                 |
| **Decisión**              | **ELIMINAR O SUPABASE** (preparación futura)              |

---

## 4. DISTRIBUCIÓN FINAL DE DATOS

### 4.1 CAMPOS QUE VAN A GHL

**La cliente administra ESTOS campos directamente desde GHL Dashboard:**

| Campo GHL          | Campo catalog.ts | Tipo            | Editable | Crítico |
| ------------------ | ---------------- | --------------- | -------- | ------- |
| `name`             | `name`           | string          | ✅ Sí    | ✅ Sí   |
| `description`      | `description`    | string          | ✅ Sí    | ✅ Sí   |
| `image`            | `image`          | URL             | ✅ Sí    | ✅ Sí   |
| `category`         | `category`       | string          | ✅ Sí    | ✅ Sí   |
| `price`            | `priceMin`       | number          | ✅ Sí    | ✅ Sí   |
| `status`           | -                | active/inactive | ✅ Sí    | ✅ Sí   |
| `availableInStore` | -                | boolean         | ✅ Sí    | ⚠️ No   |
| `productType`      | -                | string          | ✅ Sí    | ⚠️ No   |

**Resumen:** 8 campos nativos, completamente administrables por cliente en GHL

### 4.2 CAMPOS QUE VAN A SUPABASE

**Datos técnicos que NO caben en GHL Products API:**

| Campo Supabase      | Campo catalog.ts | Tipo   | Editable           | Crítico | Automático    |
| ------------------- | ---------------- | ------ | ------------------ | ------- | ------------- |
| `legacy_catalog_id` | `id`             | string | ❌ No              | ✅ Sí   | ✅ Auto-mapeo |
| `price_max`         | `priceMax`       | number | ❓ Sí (pero cómo?) | ✅ Sí   | ❌ Manual     |
| `rose_step`         | `roseStep`       | number | ❌ No              | ✅ Sí   | ❌ Manual     |
| `available_colors`  | `colors`         | array  | ❓ Sí (pero cómo?) | ✅ Sí   | ❌ Manual     |
| `badge_label`       | `badge`          | string | ❓ Sí (pero cómo?) | ❌ No   | ❌ Manual     |
| `ghl_product_id`    | -                | string | ❌ No              | ✅ Sí   | ✅ Auto-mapeo |

**Problema:** Campos ❓ (price_max, available_colors, badge_label) DEBERÍAN ser editables por cliente, pero no hay UI en GHL para ellos.

### 4.3 CAMPOS QUE QUEDAN EN FRONTEND

**Datos que SOLO existen en React, NO se almacenan:**

| Dato                          | Propósito           | Cálculo                  |
| ----------------------------- | ------------------- | ------------------------ |
| `priceMin - priceMax` (rango) | Mostrar "30€ - 45€" | `priceMin` + `price_max` |
| Selector de color             | UI en ficha         | De `available_colors`    |
| Badge visual                  | UI en card          | De `badge_label`         |
| Multiplicador rosas           | Lógica en carrito   | De `rose_step`           |

---

## 5. PROBLEMA IDENTIFICADO

### ⚠️ La brecha de edición

Estos campos **NO pueden editarse desde GHL:**

- `priceMax` (25 productos lo necesitan)
- `available_colors` (4 productos)
- `badge_label` (3 productos)
- `roseStep` (4 productos)

**Opciones de solución:**

#### A) Crear interfaz admin en Vercel

```
Cliente en Vercel:
  Dashboard Admin privado (solo para cliente Floristería Lucía)
  → Editar GHL products (nombre, precio, descripción, imagen)
  → Editar metadatos técnicos (price_max, colors, badge)
  → El sistema sincroniza automáticamente
```

**Ventajas:** Completo, cliente todo en un lugar
**Desventajas:** Requiere desarrollo adicional

#### B) Aceptar que algunos campos NO se editan

```
Cliente edita en GHL: name, description, image, category, price, status
Campos que NO se editan una vez creados: priceMax, colors, roseStep, badge
→ Se configuran en la migración inicial, permanecen estáticos
```

**Ventajas:** Más simple, menos desarrollo
**Desventajas:** Menos flexible

#### C) Usar descripción enriquecida en GHL

```
Description HTML en GHL:
<h2>Ramo de Rosas</h2>
<p>Descripción...</p>
<script>/* META: {"priceMax": 48, "colors": [...]} */</script>
```

**Ventajas:** Nativo de GHL
**Desventajas:** Frágil, contaminado

---

## 6. CÓMO FUNCIONA EL FLUJO

### Escenario 1: Cliente EDITA producto existente en GHL

```
1. Cliente abre GHL Dashboard
2. Edita producto "Ramo de Rosas":
   - name: "Ramo de Rosas" ✅
   - description: "..." ✅
   - price: 24 ✅
   - image: [nueva imagen] ✅
   - category: "ramos" ✅
   - status: active ✅
3. Guarda en GHL

4. Vercel detecta cambio (polling u webhook):
   GET /products?locationId=...
   Obtiene el producto actualizado

5. Vercel combina con Supabase:
   SELECT * FROM product_metadata
   WHERE ghl_product_id = "6a87b91004c302157108f01d"
   Obtiene: { price_max: 48, available_colors: [...], rose_step: 6 }

6. Frontend refresca:
   product = { ...ghlData, ...supabaseMetadata }
   Muestra producto actualizado
```

**⏱️ Latencia:** Actualización tarda 5-10 segundos (fetch + refresh)

### Escenario 2: Cliente CREA producto nuevo en GHL

```
1. Cliente abre GHL Dashboard
2. Crea producto:
   name: "Nuevo Ramo"
   description: "..."
   price: 35
   category: "ramos"
   → GHL asigna ID: "ABC123XYZ"

3. Vercel detecta nuevo producto:
   GET /products?locationId=...
   Ve: ghl_product_id = "ABC123XYZ", name = "Nuevo Ramo"

4. ⚠️ PROBLEMA: ¿Es producto nuevo o actualización?
   ¿Tiene metadatos en Supabase?

   Si NO tiene metadatos:
   → Crear registro en Supabase con valores por defecto
   → legacy_catalog_id = null (no tiene, es nuevo)
   → price_max = null
   → available_colors = null
   → etc.

5. Frontend obtiene del producto:
   - Datos de GHL (completos)
   - Datos de Supabase (todas null → valores por defecto)
   → Muestra producto con datos básicos

6. ¿Cliente quiere personalizar? (ej: agregar colors)
   → OPCIÓN A: Interfaz admin en Vercel
   → OPCIÓN B: No se puede (producto simple)
```

**🔴 Problema crítico:** ¿Cómo crear automáticamente metadatos cuando cliente crea producto en GHL?

---

## 7. SINCRONIZACIÓN AUTOMÁTICA

### Opción 1: Webhook desde GHL (IDEAL)

```
1. Configurar webhook en GHL:
   POST /webhook → https://vercel-app.com/api/webhooks/ghl-product

2. Cuando cliente crea/edita producto en GHL:
   GHL envía evento:
   {
     "type": "product.created" | "product.updated",
     "product": { _id, name, price, ... }
   }

3. Vercel webhook procesa:
   a) Si product.created:
      → Crear registro en Supabase
      → INSERT product_metadata (ghl_product_id, default values)
   b) Si product.updated:
      → Actualizar datos si es necesario

4. ✅ Automático, sin intervención manual
```

**Ventaja:** GHL notifica cambios en tiempo real
**Desventaja:** Requiere configuración de webhook en GHL

### Opción 2: Polling periódico

```
1. Cron job cada 5 minutos:
   GET /products → Obtiene todos los productos

2. Compara con Supabase:
   Para cada producto en GHL:
     ¿Existe en Supabase?
     NO → Crear metadata
     SÍ → OK

3. ✅ Automático pero con latencia de 5 min
```

**Ventaja:** No requiere webhook
**Desventaja:** Latencia, más requests API

### Opción 3: Manual (NO RECOMENDADO)

```
Cliente crea producto en GHL
→ Cliente entra a dashboard admin en Vercel
→ Hace clic "Sincronizar desde GHL"
→ Sistema crea metadatos

❌ Requiere acción manual cada vez
```

---

## 8. PROPUESTA FINAL DE ARQUITECTURA

### FLUJO RECOMENDADO

```
┌─────────────────────────────────────────────────────┐
│ CLIENTE (Floristería Lucía)                         │
└─────────────────────────────────────────────────────┘
                        ↓
          Cliente edita productos en:
          ✅ GHL Dashboard (primario)
          ✅ Vercel Admin (secundario, metadatos)
                        ↓
┌─────────────────────────────────────────────────────┐
│ GOLIGHLEVEL (Catálogo principal)                    │
├─────────────────────────────────────────────────────┤
│ ✅ name, description, image, category               │
│ ✅ price, status, availableInStore                  │
│ ❌ NO: priceMax, colors, roseStep, badge           │
└─────────────────────────────────────────────────────┘
                        ↓
           Webhook o Polling periódico
           (detecta cambios/nuevos productos)
                        ↓
┌─────────────────────────────────────────────────────┐
│ SUPABASE (Metadatos técnicos)                       │
├─────────────────────────────────────────────────────┤
│ product_metadata:                                   │
│  - ghl_product_id (FK a GHL)                        │
│  - legacy_catalog_id (mapeo histórico)              │
│  - price_max (rango de precios)                     │
│  - available_colors (personalización)               │
│  - rose_step (lógica específica)                    │
│  - badge_label (etiqueta visual)                    │
└─────────────────────────────────────────────────────┘
                        ↓
                 Vercel (server-side)
        Combina GHL + Supabase en memoria
                        ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (React)                                    │
├─────────────────────────────────────────────────────┤
│ Muestra:                                            │
│  - Datos de GHL (administrable)                     │
│  - Datos de Supabase (técnicos)                     │
│  - Funcionalidad completa (colores, rango, etc.)   │
└─────────────────────────────────────────────────────┘
```

### TABLA COMPLETA DE DISTRIBUCIÓN

#### GHL (Lo que cliente edita directamente)

| Campo GHL     | Valor ejemplo              | Editable | Crítico |
| ------------- | -------------------------- | -------- | ------- |
| `name`        | "Ramo de Rosas"            | ✅ Sí    | ✅      |
| `description` | "Ramo de rosas frescas..." | ✅ Sí    | ✅      |
| `image`       | URL pública                | ✅ Sí    | ✅      |
| `category`    | "ramos"                    | ✅ Sí    | ✅      |
| `price`       | 24                         | ✅ Sí    | ✅      |
| `status`      | "active"                   | ✅ Sí    | ✅      |

#### SUPABASE (Metadatos técnicos)

| Campo Supabase      | Valor ejemplo      | Editable      | Crítico | Auto-creado          |
| ------------------- | ------------------ | ------------- | ------- | -------------------- |
| `ghl_product_id`    | "6a87b9..."        | ❌ No         | ✅      | ✅ Webhook/Poll      |
| `legacy_catalog_id` | "ramo-rosas"       | ❌ No         | ✅      | ✅ Migración inicial |
| `price_max`         | 48                 | ⚠️ Solo admin | ✅      | ❌ Manual/Admin      |
| `available_colors`  | ["Rojo","Rosa"...] | ⚠️ Solo admin | ✅      | ❌ Manual/Admin      |
| `rose_step`         | 6                  | ❌ No         | ✅      | ❌ Manual/Admin      |
| `badge_label`       | "Más vendido"      | ⚠️ Solo admin | ❌      | ❌ Manual/Admin      |

#### FRONTEND (Calculado en tiempo real)

| Dato                | Cálculo                               | Fuente         |
| ------------------- | ------------------------------------- | -------------- |
| Rango de precios    | `${price} - ${price_max}€`            | GHL + Supabase |
| Selector de color   | Dropdown con `available_colors`       | Supabase       |
| Badge visual        | Mostrar `badge_label` si existe       | Supabase       |
| Multiplicador rosas | "1 unidad = X rosas" (de `rose_step`) | Supabase       |

---

## 9. RELACIÓN ENTRE SISTEMAS

### Mapeos necesarios:

```
catalog.ts (LEGACY)
  ↓
  (Migración inicial)
  ↓
GHL Products + Supabase product_metadata
  ↓
  (Vinculación)
  ↓
ghl_product_id ←→ legacy_catalog_id ←→ old_catalog_id
```

**Ejemplo:**

```
catalog.ts:       id = "ramo-rosas"
    ↓
GHL:              _id = "6a87b91004c302157108f01d"
    ↓
Supabase:         ghl_product_id = "6a87b91004c302157108f01d"
                  legacy_catalog_id = "ramo-rosas"
```

---

## 10. SOLUCIÓN PARA CAMPOS EDITABLES POR CLIENTE

### Los campos problemáticos:

- `price_max` - Cliente DEBERÍA poder cambiar rango
- `available_colors` - Cliente DEBERÍA poder agregar/quitar colores
- `badge_label` - Cliente DEBERÍA poder cambiar etiqueta
- `roseStep` - Cliente NO debería tocar (es lógica fija)

### Solución recomendada: Dashboard Admin en Vercel

```
URL: /admin/products (privado, solo cliente Floristería Lucía)

Interfaz:
┌─────────────────────────────────────┐
│ Listado de productos                │
│ ┌──────────────────────────────────┐│
│ │ Ramo de Rosas                    ││
│ │ ─────────────────────────────────││
│ │ GHL Fields (read-only):          ││
│ │   Name: Ramo de Rosas            ││
│ │   Price: 24€                     ││
│ │   Category: ramos                ││
│ │                                  ││
│ │ Supabase Fields (editable):      ││
│ │   Price Max: [48] [GUARDAR]      ││
│ │   Colors: ☑ Rojo ☑ Rosa ...      ││
│ │   Badge: [Más vendido] [GUARDAR] ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘

Cuando cliente cambia:
→ Actualiza Supabase
→ Frontend se refresca
→ Cambios visibles inmediatamente
```

**Implementación:**

- Ruta: `/admin/products`
- Protegida: Solo ubicación "vOq7yOWR63XGU4qQ7XWd"
- Datos: GET /api/products (GHL + Supabase combinados)
- Actualización: PUT /api/products/{id}/metadata (Supabase)

---

## 11. SINCRONIZACIÓN AUTOMÁTICA DE NUEVOS PRODUCTOS

### Implementar Webhook en GHL

**Paso 1: Registrar webhook en GHL**

```
URL: https://vercel-app.com/api/webhooks/ghl-product
Eventos: product.created, product.updated
```

**Paso 2: Handler en Vercel**

```typescript
// src/routes/api/webhooks/ghl-product.ts
export async function POST(request: Request) {
  const event = await request.json();

  if (event.type === "product.created") {
    const { _id: ghlProductId, name } = event.product;

    // Crear metadata en Supabase
    await supabase.from("product_metadata").insert({
      ghl_product_id: ghlProductId,
      legacy_catalog_id: null, // No existe en catalog.ts
      price_max: null,
      available_colors: null,
      badge_label: null,
      rose_step: null,
      created_at: new Date(),
    });
  }

  return { ok: true };
}
```

**Resultado:**

- ✅ Cliente crea producto en GHL
- ✅ GHL envía webhook
- ✅ Vercel crea metadata automáticamente
- ✅ Frontend puede leer datos inmediatamente

---

## 12. SÍNTESIS FINAL

### ¿Qué administra el cliente desde GHL?

✅ **DESDE GHL DASHBOARD:**

- Nombre del producto
- Descripción
- Imagen
- Categoría
- Precio base
- Estado (activo/inactivo)
- Disponibilidad

### ¿Qué administra desde Vercel Admin?

✅ **DESDE VERCEL ADMIN:**

- Precio máximo (rango)
- Colores disponibles
- Etiqueta/badge
- (Otros metadatos futuros)

### ¿Qué NO se administra (fijos)?

❌ **CONFIGURACIÓN FIJA:**

- roseStep (siempre 6)
- legacy_catalog_id (asignado en migración)

---

## 13. PRÓXIMOS PASOS DESPUÉS DE APROBACIÓN

1. ✅ Crear tabla `product_metadata` en Supabase
2. ✅ Crear ruta `/admin/products` en Vercel (opcional en Fase 1)
3. ✅ Crear webhook handler para nuevos productos
4. ✅ Configurar webhook en GHL Dashboard (manual)
5. ✅ Migrar 2-3 productos de prueba
6. ✅ Validar sincronización

---

**DOCUMENTO LISTO PARA APROBACIÓN**

Pendiente confirmación de usuario antes de cualquier implementación.
