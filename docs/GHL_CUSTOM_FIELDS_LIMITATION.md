# Limitación Crítica: Custom Fields para Productos en GoHighLevel

**Fecha:** 2026-08-26  
**Estado:** HALLAZGO CRÍTICO - Impacta diseño del catálogo  
**Verificado:** Via API de GHL directamente

---

## 🔴 LIMITACIÓN IDENTIFICADA

### Declaración Oficial de GHL API

**Custom Fields en GHL se limitan a 2 modelos únicamente:**

```
"Model value need to be either `contact` or `opportunity`"
```

**Fuente:** Error 400 al intentar crear custom field con `model: "product"`

---

## ❌ LO QUE NO FUNCIONA

Los 6 custom fields propuestos originalmente **NO pueden crearse para productos**:

```
✗ legacy_catalog_id
✗ price_max
✗ rose_step
✗ available_colors
✗ badge_label
✗ requires_quote
```

**Razón:** GHL Products API no soporta custom fields a nivel de producto

---

## ✅ OPCIONES VIABLE

Después del hallazgo, tenemos 4 opciones principales:

### Opción 1: Almacenar Metadatos en Supabase (RECOMENDADA)

**Concepto:**
- Productos viven en GHL (name, description, price, image, category)
- Metadatos especiales viven en Supabase (legacy_catalog_id, price_max, colors, roseStep, badge, etc.)

**Implementación:**

```typescript
// Tabla en Supabase:
CREATE TABLE product_metadata (
  id UUID PRIMARY KEY,
  ghl_product_id TEXT,           // ID que GHL asigna
  legacy_catalog_id TEXT,        // ID original de catalog.ts
  price_max DECIMAL,             // Precio máximo
  rose_step INTEGER,             // Multiplicador rosas
  available_colors TEXT[],       // Array de colores
  badge_label TEXT,              // Badge visual
  requires_quote BOOLEAN,        // Requiere cotización
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Flujo:**
```
1. Usuario abre producto desde catálogo
2. Frontend obtiene datos de GHL (price, name, etc.)
3. Frontend consulta Supabase por metadatos (price_max, colors, etc.)
4. Frontend combina ambos datasets
5. Se muestran datos completos al usuario
```

**Ventajas:**
- ✅ Soportado 100% por GHL
- ✅ Flexibilidad total en campos
- ✅ Migración segura (Supabase está en la pila)
- ✅ RLS puede proteger datos
- ✅ Sin dependencia de API GHL para campos extras
- ✅ Fácil revertir si es necesario

**Desventajas:**
- ⚠️ Requiere sincronización entre dos sistemas
- ⚠️ Latencia de 2 llamadas (GHL + Supabase)

---

### Opción 2: Variantes Nativas de GHL

**Concepto:**
- Usar `variants` de GHL para representar precio/color/tamaño

**Implementación:**

Un "Ramo de Rosas" tendría variantes:
```json
{
  "name": "Ramo de Rosas",
  "variants": [
    { "name": "Rojo - Estándar", "price": 24 },
    { "name": "Rojo - Especial", "price": 36 },
    { "name": "Rojo - Premium", "price": 48 },
    { "name": "Rosa - Estándar", "price": 24 },
    { "name": "Rosa - Especial", "price": 36 },
    { "name": "Rosa - Premium", "price": 48 },
    // ... 6 colores × 3 tamaños = 18 variantes
  ]
}
```

**Ventajas:**
- ✅ Nativo de GHL
- ✅ No requiere tabla extra en Supabase

**Desventajas:**
- ❌ Explosión combinatoria (6 colores × 3 precios = 18 variantes por producto)
- ❌ Ramo de Rosas = 18 variantes, Caja Rosas Eternas = 18 variantes, Cupido = 18 variantes
- ❌ Total: ~200+ variantes adicionales en catálogo
- ❌ UX compleja en selector de variantes
- ❌ Difícil sincronización futura
- ❌ Genera duplicación de datos

---

### Opción 3: Incrustar Metadatos en Descripción (NO RECOMENDADA)

**Concepto:**
- Guardar metadatos como JSON en el campo `description`

**Ejemplo:**
```json
{
  "description": "<h2>Ramo de Rosas Frescas</h2><p>Ramo de rosas frescas...</p><script>/*META:{\"priceMax\":48,\"roseStep\":6,\"colors\":[...]}*/</script>"
}
```

**Ventajas:**
- ✅ No requiere tabla extra
- ✅ Datos junto al producto

**Desventajas:**
- ❌ Frágil (cambios en descripción rompen datos)
- ❌ Contaminación de contenido
- ❌ Difícil de parsear y mantener
- ❌ Riesgos de seguridad
- ❌ No profesional

---

### Opción 4: Usar Opportunity Custom Fields (EXPERIMENTAL)

**Concepto:**
- Crear una "Opportunity" por cada producto con custom fields
- Ligar mediante ID

**Ventajas:**
- ✅ Sí soporta custom fields

**Desventajas:**
- ❌ Abusa de modelo de datos de GHL
- ❌ Opportunities son para ventas, no para catálogo
- ❌ Performance pobre (queries cruzadas)
- ❌ Mantenimiento muy complejo

---

## 🎯 RECOMENDACIÓN FINAL

### **OPCIÓN 1: Supabase para Metadatos**

**Porque:**
1. ✅ Completamente compatible con GHL
2. ✅ Supabase ya está en la pila
3. ✅ RLS puede proteger datos
4. ✅ Migración segura y reversible
5. ✅ No poluciona modelo de datos de GHL
6. ✅ Performance razonable (caché en frontend)
7. ✅ Escalable a futuros campos

**Tabla en Supabase:**

```sql
CREATE TABLE product_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,        -- Floristería Lucía location
  ghl_product_id TEXT NOT NULL,     -- ID asignado por GHL al crear
  legacy_catalog_id TEXT UNIQUE,    -- ID original de catalog.ts
  price_max DECIMAL(10,2),          -- Precio máximo
  rose_step INTEGER,                -- Multiplicador rosas (ej: 6)
  available_colors TEXT[],          -- Array de colores disponibles
  badge_label TEXT,                 -- Badge visual
  requires_quote BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_ghl_id UNIQUE(location_id, ghl_product_id),
  CONSTRAINT unique_legacy_id UNIQUE(legacy_catalog_id)
);

-- RLS Policy: Permitir lectura pública, escritura solo desde server
ALTER TABLE product_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON product_metadata
  FOR SELECT USING (true);

CREATE POLICY "server_write" ON product_metadata
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "server_update" ON product_metadata
  FOR UPDATE USING (auth.role() = 'service_role');
```

**Frontend - Nueva arquitectura:**

```typescript
// antes (estático)
import { products } from '@/data/catalog';
const product = products.find(p => p.id === 'ramo-rosas');

// después (híbrido)
const { data: ghlProduct } = useGHLProduct(productId); // De GHL
const { data: metadata } = useProductMetadata(ghlProduct.legacy_catalog_id); // De Supabase

const complete = { ...ghlProduct, ...metadata };
```

---

## 📊 COMPARATIVA DE OPCIONES

| Criterio | Opción 1: Supabase | Opción 2: Variantes | Opción 3: Description | Opción 4: Opportunity |
|----------|---|---|---|---|
| **Compatible con GHL** | ✅ 100% | ✅ 100% | ✅ 100% | ❌ 50% |
| **Requiere API extra** | ✅ (Supabase) | ❌ No | ❌ No | ✅ (GHL) |
| **Complejidad implementación** | 🟡 Media | 🟢 Baja | 🔴 Alta | 🔴 Alta |
| **Escalabilidad** | ✅ Alta | ❌ Baja | ❌ Media | ❌ Media |
| **Mantenibilidad** | ✅ Alta | ⚠️ Media | ❌ Baja | ❌ Baja |
| **Performance** | ✅ Buena | ✅ Excelente | ✅ Excelente | ❌ Mala |
| **Número de registros** | 58 (metadata) | 200+ (variantes) | N/A | 58 (opportunities) |
| **Facilidad de revertir** | ✅ Fácil | ❌ Difícil | ⚠️ Media | ❌ Muy difícil |
| **Costo adicional** | ❌ No | ❌ No | ❌ No | ✅ Sí (GHL) |
| **Recomendación** | 🟢 **USAR ESTA** | ❌ | ❌ | ❌ |

---

## 🔄 IMPLICACIONES PARA EL PLAN

### Cambios Necesarios

1. **Crear tabla en Supabase:**
   - `product_metadata` con 8 campos
   - RLS policies para lectura pública/escritura server

2. **Actualizar script de migración:**
   - Al migrar producto a GHL, guardar mapping en Supabase
   - Mapeo: legacy_catalog_id → ghl_product_id

3. **Actualizar frontend:**
   - `useGHLProduct()` → obtiene de GHL (sin metadatos)
   - `useProductMetadata()` → obtiene de Supabase (custom fields)
   - Componentes combinan ambos datasets

4. **Actualizar server-side:**
   - API route `/api/ghl/products/:id` → combina GHL + Supabase

5. **NO cambiar:**
   - src/data/catalog.ts (sigue siendo fuente de verdad local)
   - Autenticación
   - Carrito/Favoritos

---

## 🛑 PRÓXIMOS PASOS

1. ✋ **PAUSAR** creación de custom fields en GHL (imposible)
2. ✅ **CREAR** tabla `product_metadata` en Supabase
3. ✅ **MIGRAR** con esta nueva arquitectura
4. ✅ **VALIDAR** con 2-3 productos de prueba

---

## 📝 CAMBIOS AL DISEÑO ORIGINAL

| Elemento | Diseño Original | Nuevo Diseño |
|----------|---|---|
| Almacén de metadatos | GHL custom fields | Supabase table |
| Tabla en GHL | products + 6 custom fields | products (nativos) |
| Tabla en Supabase | profiles + auth | profiles + auth + product_metadata |
| Llamadas API | GET /products + custom fields | GET /products + GET product_metadata |
| Complejidad GHL | 🔴 Imposible | ✅ Solo 5 campos nativos |
| Complejidad Supabase | ✅ Nada | 🟡 +1 tabla pequeña |

---

## ✅ CONCLUSIÓN

**La limitación es CRÍTICA pero SOLUCIONABLE.**

Cambio de enfoque:
- ❌ No almacenar metadatos en GHL
- ✅ Almacenar metadatos en Supabase
- ✅ GHL = catálogo público (productos básicos)
- ✅ Supabase = metadatos internos (custom fields)

**Esta arquitectura es:**
- Más limpia
- Más segura
- Más flexible
- Más sostenible a largo plazo

---

**ESPERA APROBACIÓN DEL USUARIO antes de proceder.**

