# Resumen Ejecutivo: Distribución de Datos

**Análisis completado:** 2026-08-26  
**Estado:** Pendiente aprobación

---

## 📊 MATRIZ DE DECISIONES

### TABLA 1: ¿Dónde va cada dato?

| Campo catalog.ts        | GHL        | Supabase                      | Frontend      | ¿Editable cliente? |
| ----------------------- | ---------- | ----------------------------- | ------------- | ------------------ |
| `id` → "ramo-rosas"     | ❌         | ✅ metadata.legacy_catalog_id | ❌            | ❌ No              |
| `name` → "Ramo Rosas"   | ✅         | ❌                            | ❌            | ✅ Sí (GHL)        |
| `description`           | ✅         | ❌                            | ❌            | ✅ Sí (GHL)        |
| `image`                 | ✅         | ❌                            | ❌            | ✅ Sí (GHL)        |
| `category`              | ✅         | ❌                            | ❌            | ✅ Sí (GHL)        |
| `priceMin`              | ✅ (price) | ❌                            | ❌            | ✅ Sí (GHL)        |
| `priceMax` → 45         | ❌         | ✅ metadata.price_max         | ✅ (cálculo)  | ⚠️ Vercel admin    |
| `badge` → "Más vendido" | ❌         | ✅ metadata.badge_label       | ✅ (mostrar)  | ⚠️ Vercel admin    |
| `roseStep` → 6          | ❌         | ✅ metadata.rose_step         | ✅ (lógica)   | ❌ No (fijo)       |
| `colors` → array        | ❌         | ✅ metadata.available_colors  | ✅ (selector) | ⚠️ Vercel admin    |
| `quoteOnly`             | ❌         | ✅ (futuro)                   | ❌            | ❌ No (futuro)     |

---

## 🎯 DISTRIBUCIÓN RECOMENDADA

### EN GOLIGHLEVEL (ADMINISTRABLE DIRECTAMENTE)

```
✅ Cliente puede editar AQUÍ desde GHL Dashboard:
   ├─ name (nombre del producto)
   ├─ description (descripción)
   ├─ image (imagen)
   ├─ category (categoría)
   ├─ price (precio base = priceMin)
   ├─ status (activo/inactivo)
   └─ availableInStore (disponible)

Total: 7 campos críticos, todos editables en GHL
```

### EN SUPABASE (METADATOS TÉCNICOS)

```
✅ Se almacenan AQUÍ (NO editables directamente en GHL):
   ├─ ghl_product_id (link a GHL) - AUTO
   ├─ legacy_catalog_id (link a catalog.ts) - AUTO
   ├─ price_max (rango) - ⚠️ EDITABLE DESDE ADMIN
   ├─ available_colors (personalización) - ⚠️ EDITABLE DESDE ADMIN
   ├─ badge_label (etiqueta) - ⚠️ EDITABLE DESDE ADMIN
   ├─ rose_step (multiplicador) - ❌ NO EDITABLE (fijo)
   └─ requires_quote (futuro) - ❌ NO EDITABLE (futuro)

Total: 7 campos técnicos
```

### EN FRONTEND (CALCULADO)

```
✅ Se CALCULA en tiempo real (no se almacena):
   ├─ Rango de precios: "${priceMin} - ${priceMax}€"
   ├─ Selector de colores: dropdown con available_colors
   ├─ Badge visual: mostrar si badge_label existe
   ├─ Multiplicador rosas: "1 unidad = {rose_step} rosas"
   └─ (Otros cálculos según necesidad)

Total: N/A (dinámico)
```

---

## 🔄 FLUJO DE DATOS

### Flujo 1: Cliente EDITA producto existente en GHL

```
┌─ CLIENTE EDITA EN GHL
│  └─ Cambia name, description, price, image, category, status
│
├─ GHL GUARDA cambios
│  └─ Actualiza _id, name, description, image, category, price, status
│
├─ WEBHOOK O POLLING
│  └─ Vercel detecta cambios en GHL
│
├─ VERCEL OBTIENE DATOS
│  ├─ GET /products → datos de GHL
│  └─ SELECT product_metadata → datos de Supabase
│
├─ FRONTEND COMBINA
│  ├─ ghl data (name, price, description, etc.)
│  └─ + supabase data (price_max, colors, badge, etc.)
│
└─ USUARIO VE producto actualizado (5-10 seg latencia)
```

### Flujo 2: Cliente CREA producto NUEVO en GHL

```
┌─ CLIENTE CREA EN GHL
│  └─ Completa name, description, price, image, category, status
│
├─ GHL CREA producto
│  └─ Asigna _id: "ABC123XYZ"
│
├─ WEBHOOK dispara
│  └─ POST /api/webhooks/ghl-product
│
├─ VERCEL CREA METADATA
│  └─ INSERT INTO product_metadata (
│     ghl_product_id: "ABC123XYZ",
│     legacy_catalog_id: null,  ← sin referencia a catalog.ts
│     price_max: null,
│     available_colors: null,
│     badge_label: null,
│     rose_step: null
│  )
│
├─ FRONTEND OBTIENE
│  ├─ GHL: name, description, price, image, etc.
│  └─ Supabase: todos null (producto simple)
│
└─ USUARIO VE producto nuevo (automáticamente)
```

### Flujo 3: Cliente PERSONALIZA METADATOS desde Vercel Admin

```
┌─ CLIENTE ACCEDE A /admin/products
│  └─ Dashboard privado en Vercel
│
├─ VE listado de productos
│  ├─ Datos de GHL (read-only):
│  │  └─ name, description, price, category
│  └─ Campos editables:
│     ├─ Price Max: [45]
│     ├─ Colors: ☑ Rojo ☑ Rosa ...
│     └─ Badge: [Más vendido]
│
├─ CLIENTE EDITA y GUARDA
│  └─ PUT /api/products/{id}/metadata
│
├─ VERCEL ACTUALIZA SUPABASE
│  └─ UPDATE product_metadata SET price_max=45, available_colors=...
│
├─ FRONTEND SE REFRESCA
│  └─ Query Supabase, combina datos, actualiza UI
│
└─ CAMBIOS VISIBLES inmediatamente (< 1 seg)
```

---

## 💾 ESTRUCTURA DE DATOS EN SUPABASE

### Tabla `product_metadata`

```sql
CREATE TABLE product_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Claves foráneas
  ghl_product_id TEXT NOT NULL UNIQUE,      -- FK a GHL
  legacy_catalog_id TEXT UNIQUE,             -- Mapeo a catalog.ts (si existe)

  -- Metadatos de precio
  price_max DECIMAL(10,2),                   -- Precio máximo (NULL = sin rango)

  -- Personalización
  available_colors TEXT[],                   -- Array JSON: ["Rojo", "Rosa", ...]
  badge_label TEXT,                          -- "Más vendido", "Premium", etc.

  -- Lógica específica
  rose_step INTEGER,                         -- 6 para productos de rosas
  requires_quote BOOLEAN DEFAULT false,      -- Para cotizaciones futuras

  -- Auditoría
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Restricciones
  CHECK (price_max IS NULL OR price_max > 0)
);

-- Índices
CREATE INDEX idx_ghl_product_id ON product_metadata(ghl_product_id);
CREATE INDEX idx_legacy_catalog_id ON product_metadata(legacy_catalog_id);

-- RLS Policies
ALTER TABLE product_metadata ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede LEER metadatos
CREATE POLICY "public_read" ON product_metadata
  FOR SELECT USING (true);

-- Solo server-side puede ESCRIBIR
CREATE POLICY "server_write" ON product_metadata
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "server_update" ON product_metadata
  FOR UPDATE USING (auth.role() = 'service_role');
```

---

## 🔗 MAPEOS CRÍTICOS

### Mapeo 1: Legacy catalog.ts → GHL → Supabase

```
catalog.ts Product:
{
  id: "ramo-rosas",
  name: "Ramo de Rosas",
  priceMin: 24,
  priceMax: 48,
  colors: ["Rojo", "Rosa", "Blanco", ...],
  roseStep: 6,
  category: "ramos"
}

    ↓↓↓ Migración inicial ↓↓↓

GHL Product:
{
  _id: "6a87b91004c302157108f01d",
  name: "Ramo de Rosas",
  price: 24,
  category: "ramos",
  description: "..."
}

Supabase product_metadata:
{
  id: "uuid-...",
  ghl_product_id: "6a87b91004c302157108f01d",
  legacy_catalog_id: "ramo-rosas",
  price_max: 48,
  available_colors: ["Rojo", "Rosa", "Blanco", ...],
  rose_step: 6,
  created_at: "2026-08-26T...",
  updated_at: "2026-08-26T..."
}
```

### Mapeo 2: Frontend obtiene datos combinados

```typescript
// Frontend usa esto:
const product = {
  // De GHL
  _id: "6a87b91004c302157108f01d",
  name: "Ramo de Rosas",
  description: "Ramo de rosas frescas...",
  price: 24,
  category: "ramos",
  image: "https://...",
  status: "active",

  // De Supabase
  legacy_catalog_id: "ramo-rosas",
  price_max: 48,
  available_colors: ["Rojo", "Rosa", ...],
  rose_step: 6,
  badge_label: null,
  requires_quote: false
};

// Cálculos
const priceRange = `${product.price}€ - ${product.price_max}€`;
const colors = product.available_colors; // ["Rojo", "Rosa", ...]
const roseMultiplier = `1 unidad = ${product.rose_step} rosas`;
```

---

## ⚙️ SINCRONIZACIÓN AUTOMÁTICA

### Método: Webhook desde GHL

```
┌─ CLIENTE CREA/EDITA EN GHL DASHBOARD
│
├─ GHL envía evento a:
│  └─ POST https://vercel-app.com/api/webhooks/ghl-product
│
├─ Vercel recibe:
│  ├─ type: "product.created" | "product.updated"
│  ├─ product: { _id, name, price, description, ... }
│
├─ Vercel procesa:
│  ├─ if product.created:
│  │  └─ INSERT INTO product_metadata (ghl_product_id, ...)
│  └─ if product.updated:
│     └─ No hace nada (datos de GHL ya están sincronizados)
│
└─ ✅ Metadatos creados automáticamente
```

### Configuración en GHL (manual, una sola vez)

```
1. Ir a GHL Dashboard
2. Settings → Webhooks
3. Crear nuevo webhook:
   - URL: https://vercel-app.com/api/webhooks/ghl-product
   - Eventos: product.created, product.updated
   - HTTP Method: POST
4. Probar y guardar
```

---

## ❓ PREGUNTAS COMUNES

### ¿Cómo edita el cliente el priceMax, colors, badge?

**Opción recomendada:** Dashboard admin en Vercel

```
URL: /admin/products (privada)
Login: OAuth con Supabase
Acceso: Solo la usuario de Floristería Lucía

Campos editables:
  - Price Max
  - Available Colors
  - Badge Label

Campos read-only (de GHL):
  - Name
  - Description
  - Price
  - Category
```

### ¿Qué pasa si cliente elimina un producto en GHL?

```
GHL: Elimina producto
 ↓
Webhook dispara: "product.deleted"
 ↓
Vercel: Soft-delete en Supabase
 ↓
product_metadata.deleted_at = now()
 ↓
Frontend: No muestra producto (WHERE deleted_at IS NULL)
```

### ¿Qué pasa si el cliente edita un producto LEGADO (de catalog.ts)?

```
Producto tiene legacy_catalog_id = "ramo-rosas"
 ↓
Cliente edita en GHL: name, price, description
 ↓
Metadata en Supabase tiene:
  - legacy_catalog_id: "ramo-rosas"
  - price_max: 48
  - available_colors: [...]
  - etc.
 ↓
Frontend combina:
  - Datos nuevos de GHL (editados)
  - Datos viejos de Supabase (configurados)
 ↓
Producto actualizado con nueva info
```

### ¿Qué pasa si cliente edita precio en GHL?

```
GHL: Cambia price: 24 → 30
 ↓
Webhook detecta cambio
 ↓
Vercel: Obtiene nuevo precio
 ↓
Frontend: Muestra precio nuevo en 5 seg
 ↓
✅ Actualización automática
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Preparación

- [ ] Aprobación de esta arquitectura
- [ ] Crear tabla `product_metadata` en Supabase
- [ ] Crear RLS policies en Supabase
- [ ] Crear índices en Supabase

### FASE 2: Sincronización

- [ ] Crear webhook handler: `/api/webhooks/ghl-product`
- [ ] Configurar webhook en GHL Dashboard (manual)
- [ ] Probar creación automática de metadatos

### FASE 3: Migración

- [ ] Migrar 2-3 productos de prueba a GHL
- [ ] Crear entradas en `product_metadata` para cada uno
- [ ] Validar que frontend obtiene datos combinados correctamente

### FASE 4: Admin (Optional en Fase 1)

- [ ] Crear ruta `/admin/products` en Vercel
- [ ] Interfaz para editar metadatos
- [ ] Validación y guardado en Supabase

---

## ✅ CONCLUSIÓN

**Arquitectura propuesta:**

```
GHL = Catálogo administrable + datos básicos
Supabase = Metadatos técnicos + configuración especial
Frontend = Combinación inteligente de ambos
Webhook = Sincronización automática
```

**Beneficios:**

- ✅ Cliente administra desde GHL (donde debe ser)
- ✅ Datos técnicos protegidos en Supabase
- ✅ Sincronización automática de cambios
- ✅ Escalable a nuevos campos/funcionalidades
- ✅ Sin intervención manual

**Listo para aprobación y ejecución.**
