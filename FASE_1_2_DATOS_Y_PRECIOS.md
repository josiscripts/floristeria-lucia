# FASE 1.2 - AUDITORÍA COMPLETA DE DATOS Y PRECIOS
**Estado: COMPLETO - Requiere aprobación antes de FASE 2**
**Fecha: 2026-09-04**

---

## PARTE 1: SCHEMA ACTUAL DE SUPABASE
(Según types.ts - SIN aplicar las 3 migraciones creadas)

### Tabla: `products`
**Estado: NO SINCRONIZADO CON MIGRACIONES**
- `id` (UUID, PK) ✓
- `ghl_product_id` (VARCHAR, REQUIRED NOT NULL) ⚠️ PROBLEMA: debería ser nullable
- `name` (VARCHAR)
- `description` (TEXT)
- `category` (VARCHAR) - SIN FK a categories (tabla no existe)
- `cover_image_url` (VARCHAR)
- `active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP) - soft delete pattern
- **FALTA**: `sync_status`, `sync_error` (definidas en migration pero no aplicadas)
- **FALTA**: `has_color_variants` (mencionado en products.server.ts pero no en schema actual)

### Tabla: `product_options`
**Estado: INTERMEDIARIO - existe pero sin product_id FK verificado**
- `id` (UUID, PK) ✓
- `product_id` (FK→products) - CRÍTICO: ¿es NOT NULL? ¿realmente FK?
- `ghl_price_id` (VARCHAR, nullable)
- `name` (VARCHAR)
- `price_amount` (DECIMAL)
- `discount_percent` (DECIMAL, default 0)
- `price_final` (GENERATED AS: price_amount * (1 - discount_percent/100)) - Auto-calculado
- `stock_quantity` (INTEGER, nullable)
- `sku` (VARCHAR, UNIQUE) - determinístico o aleatorio?
- `active` (BOOLEAN)
- `deleted_at` (TIMESTAMP)

### Tabla: `product_images`
**Estado: PARCIALMENTE DEFINIDA - problemas de integridad**
- `id` (UUID, PK)
- `product_id` (FK→products, NULLABLE) ⚠️ PROBLEMA: debería ser NOT NULL
- `image_url` (VARCHAR)
- `is_primary` (BOOLEAN)
- `sort_order` (INTEGER)
- `color_variant_id` (FK→color_variants, nullable)

### Tabla: `color_variants`
**Estado: BUENO**
- `id` (UUID, PK)
- `product_id` (FK→products, NOT NULL)
- `name` (VARCHAR)
- `sort_order` (INTEGER)
- `active` (BOOLEAN)

### Tabla: `orders`
**Estado: PARCIALMENTE DEFINIDA - PROBLEMA CRÍTICO: SIN product_id**
- `id` (UUID, PK)
- `order_number` (VARCHAR, UNIQUE)
- `ghl_contact_id` (VARCHAR, nullable) - GHL legacy
- `ghl_opportunity_id` (VARCHAR, nullable) - GHL legacy
- `customer_name` (VARCHAR)
- `customer_email` (VARCHAR)
- `customer_phone` (VARCHAR)
- `address` (VARCHAR)
- `city` (VARCHAR)
- `postal_code` (VARCHAR)
- `country` (VARCHAR)
- `subtotal` (DECIMAL)
- `total` (DECIMAL)
- `delivery_date` (DATE, nullable)
- `dedicatory` (TEXT, nullable)
- `notes` (TEXT, nullable)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP)
- `user_id` (UUID, FK→auth.users, nullable)
- **FALTA**: `product_id` - NO EXISTE, imposible vincular con tabla products
- **FALTA**: Cualquier relación a product table

### Tabla: `order_items`
**Estado: CRÍTICO - COMPLETAMENTE GHL-CÉNTRICO**
- `id` (UUID, PK)
- `order_id` (FK→orders, NOT NULL)
- `ghl_product_id` (VARCHAR, REQUIRED) ⚠️ PROBLEMA CRÍTICO:
  * Se usa como si fuera PK o FK pero NO es FK a products.ghl_product_id
  * Almacena UUIDs de Supabase products (confusión semántica)
- `product_name` (VARCHAR) - snapshot del nombre en orden time
- `unit_price` (DECIMAL) - snapshot del precio en orden time
- `subtotal` (DECIMAL) - snapshot (qty * unit_price)
- `quantity` (INTEGER)
- `size` (VARCHAR)
- `color` (VARCHAR, nullable)
- `special_instructions` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- **FALTA**: `product_id` - NO EXISTE, imposible auditabilidad
- **FALTA**: `product_option_id` - NO EXISTE, imposible vincular a opciones

### Tabla: `product_metadata` (LEGACY PARALELA)
**Estado: VIVO PERO LEGADO - referenciado por 9 archivos**
- `id` (UUID, PK)
- `ghl_product_id` (VARCHAR, REQUIRED NOT NULL) - ÚNICA forma de FK a products en legacy
- `location_id` (VARCHAR, REQUIRED)
- `category` (VARCHAR)
- `price_min` (DECIMAL)
- `price_max` (DECIMAL)
- `sku` (VARCHAR)
- `available_colors` (TEXT[])
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- **PROBLEMA**: Existe en paralelo a products, causando duplicación y confusión

### Tabla: `categories` (CREADA POR MIGRATION)
**Estado: MIGRACIÓN CREADA PERO NO APLICADA**
- Definida en `20260904_create_categories_table.sql`
- Nunca verificado en BD live

---

## PARTE 2: FLUJO DE DATOS - CARRITO → ORDEN

```
FRONTEND (producto.$id.tsx)
├─ Obtiene supabaseProduct via useSupabaseProduct(id)
│  └─ SELECT FROM products WHERE id=? (busca por UUID Supabase)
│  └─ Devuelve: {id: UUID, ghl_product_id: ?, product_options: [...], ...}
│
├─ Convierte via supabaseProductToLegacy()
│  └─ product.id = supabaseProduct.id (UUID)
│
└─ Llama addLine({productId: UUID, name, price, size, ...})
   └─ Guarda en ShopContext.lines (localStorage)

CHECKOUT (checkout.tsx)
└─ cartLines: CartLine[] = {
     productId: UUID ← AQUÍ: se asume que es ID de producto
     name: string
     price: number (desde product_options[tierIndex].price_final)
     qty: number
     size: string
     image: string
   }

API POST /api/orders (api.orders.ts + orders.server.ts)
├─ Recibe: {cartLines: CartLine[], customer...}
├─ Calcula: subtotal = SUM(line.price * line.qty) ← Precio viene del frontend
├─ Crea order en tabla orders (sin product_id FK)
└─ Mapea order_items: {
     order_id: ?,
     ghl_product_id: line.productId ← ⚠️ BUG: UUID de Supabase guardado como ghl_product_id
     product_name: line.name (snapshot)
     unit_price: line.price (snapshot)
     quantity: line.qty
   }
```

**DESCUBRIMIENTO CRÍTICO**: `line.productId` es un UUID de Supabase products, NO un ID de GHL. Sin embargo, se guarda en `order_items.ghl_product_id`, causando:
- Semántica incorrecta (Supabase UUID siendo guardado como GHL ID)
- Imposibilidad de hacer FK a products.ghl_product_id (que es NULL o diferente)
- Imposibilidad de auditar qué producto fue realmente vendido

---

## PARTE 3: AUDITORÍA DEL PRICING SYSTEM

### Dónde vive el precio actualmente:

1. **En SUPABASE (NUEVO - Product Options)**:
   - `product_options.price_amount` (precio base)
   - `product_options.discount_percent` (% descuento)
   - `product_options.price_final` (GENERATED: auto-calculado)
   - Cada opción = 1 tier de precio

2. **EN FRONTEND (LEGACY - Catalog hardcoded)**:
   - `/src/data/catalog.ts` - array productos con priceMin/priceMax
   - `priceTiers(product)` - devuelve tiers manuales
   - **Fallback**: Si no hay Supabase, usa esto

3. **EN CARTLINE (FRONTEND)**:
   - `CartLine.price` = seleccionado por usuario desde UI
   - Calculado en `producto.$id.tsx:line 97`: `unitPrice = tier?.price ?? product.priceMin`
   - Viene de: `getSupabasePriceTiers(product_options)` si Supabase, else `priceTiers(product)`

4. **EN ORDER_ITEMS (SNAPSHOT)**:
   - `order_items.unit_price` = CartLine.price (congelado en tiempo de orden)
   - `order_items.subtotal` = unit_price * quantity
   - No se recalcula después

### Todos los campos relacionados con precio:

| Tabla | Campo | Tipo | Propósito | Actualizable |
|-------|-------|------|-----------|-------------|
| product_options | price_amount | DECIMAL | Precio base | ✓ Admin |
| product_options | discount_percent | DECIMAL | % descuento | ✓ Admin |
| product_options | price_final | GENERATED | Auto: price_amount * (1 - disc/100) | ✗ Auto |
| product_options | ghl_price_id | VARCHAR | ID en GHL (legacy) | ✗ GHL |
| product_options | stock_quantity | INTEGER | Stock disponible | ✓ Admin |
| order_items | unit_price | DECIMAL | Precio snapshot @ order time | ✗ Congelado |
| order_items | subtotal | DECIMAL | qty × unit_price snapshot | ✗ Congelado |
| orders | subtotal | DECIMAL | SUM(order_items.subtotal) | ✗ Congelado |
| orders | total | DECIMAL | subtotal (sin adicionales hoy) | ✗ Congelado |
| product_metadata | price_min | DECIMAL | LEGACY: precio mínimo | ✓ Admin |
| product_metadata | price_max | DECIMAL | LEGACY: precio máximo | ✓ Admin |
| catalog.ts | priceMin/priceMax | Hardcoded | LEGACY: en código | ✓ Deploy |

### Cálculo de precio en CHECKOUT:

```typescript
// producto.$id.tsx línea 97
unitPrice = tier?.price ?? product.priceMin
// tier = getSupabasePriceTiers(product_options)[tierIndex]
// tier.price = option.price_final (auto-calculado en BD)

// CartLine.price = unitPrice
// CartLine enviado a checkout

// checkout.tsx línea 127
total = cartLines.reduce((sum, line) => sum + line.price * line.qty, 0)
// Total calculado COMPLETAMENTE en frontend, NO revalidado en backend
```

**VULNERABILIDAD DE PRICING**: El precio se calcula en frontend, se confía en el cliente, NO se revalida en backend. Si cliente tampera CartLine.price, se crea orden con precio incorrecto.

### Participación de product_options en checkout:

| Punto | Referencia | Cómo se usa |
|-------|-----------|----------|
| Selección de tier | `producto.$id.tsx:73` | Usuario elige tierIndex → se carga option de array |
| Cálculo de precio | `producto.$id.tsx:97` | `tier.price = option.price_final` |
| Envío a carrito | `producto.$id.tsx:335` | CartLine.price = unitPrice (ya calculado) |
| En order_items | `orders.server.ts:173` | Solo se guarda snapshot, NO se guarda option_id |

**CONCLUSIÓN**: product_options NO se puede eliminar - es la fuente de verdad para precios. Pero tampoco se referencia en order_items (missing linkage).

---

## PARTE 4: AUDITORÍA DE ARCHIVOS CRÍTICOS

### Archivos que TOCAN PRICING:

| Archivo | Línea | Qué hace | Crítico |
|---------|-------|----------|---------|
| src/data/catalog.ts | - | Hardcoded products + priceTiers() | ✓ Fallback |
| src/lib/convert-supabase-product.ts | 42-50 | getSupabasePriceTiers() → mapea product_options | ✓✓✓ CRÍTICO |
| src/routes/producto.$id.tsx | 70-76 | Elige tiers de Supabase o fallback | ✓✓✓ CRÍTICO |
| src/routes/producto.$id.tsx | 97 | Calcula unitPrice = tier.price | ✓✓✓ CRÍTICO |
| src/routes/producto.$id.tsx | 333-342 | addLine(productId, price, ...) | ✓✓✓ CRÍTICO |
| src/routes/checkout.tsx | 146 | Envía cartLines sin validación | ⚠️ VULNERABLE |
| src/lib/orders.server.ts | 127 | Calcula subtotal = SUM(qty*price) | ⚠️ NO VALIDADO |
| src/routes/api.orders.ts | 127-136 | cartLines incluye price (confiado) | ⚠️ VULNERABLE |
| src/components/ProductCard.tsx | - | Muestra priceMin/priceMax (legacy) | ~ Fallback |
| src/context/ShopContext.tsx | 70-78 | addLine guarda CartLine.price | ✓ Por diseño |
| src/hooks/useSupabaseProducts.ts | - | Carga products + product_options | ✓ Fuente de verdad |
| src/lib/products.server.ts | 204-228 | createProductOption() | ✓✓ Crítico |

### Archivos que REFERENCIAN product_metadata (LEGACY):

**9 archivos hallados en FASE 1.1, pendiente verificar si aún activos:**
- [ ] src/lib/ghl/client.server.ts
- [ ] src/lib/price-sync.server.ts
- [ ] src/lib/category-collection.server.ts
- [ ] src/lib/ghl/sync.server.ts (posible)
- [ ] src/routes/api.admin.sync-catalog.ts (posible)
- [ ] (otros - requiere verificación)

---

## PARTE 5: DESCUBRIMIENTOS DE AUDITORÍA

### CRÍTICO - Bloquea FASE 2:

1. **BUG: order_items.ghl_product_id almacena UUIDs de Supabase**
   - Severidad: CRÍTICO
   - Efecto: Imposible rastrear qué product real fue vendido
   - Línea: orders.server.ts:169
   - Solución: Cambiar a `product_id: line.productId` (o similar)

2. **MISSING: order_items NO tiene `product_id` FK**
   - Severidad: CRÍTICO
   - Efecto: Sin auditoría, sin integridad referencial
   - Schema actual: NO EXISTE
   - Solución: Agregar `product_id` FK, llenar con products.id

3. **VULNERABLE: Precio no validado en backend**
   - Severidad: ALTO
   - Efecto: Cliente puede tamperar CartLine.price
   - Línea: checkout.tsx:146 → api.orders.ts → orders.server.ts:127
   - Solución: En POST /api/orders, re-fetch product_options y recalcular precio

4. **INCOMPATIBILIDAD: Migraciones creadas pero NO aplicadas**
   - Severidad: ALTO
   - Migraciones: sync_status, categories, ghl_product_id nullable
   - Línea: 20260904_*.sql
   - Solución: Ejecutar migraciones en Supabase live

### MAYOR - Requiere decisión en FASE 2:

5. **DUALIDAD: product_metadata (LEGACY) en paralelo a products**
   - Severidad: ALTO
   - Efecto: Confusión, duplicación, inconsistencia
   - Archivos: product_metadata referenciado en 9+ archivos
   - Decisión: ¿Migrar todo a products o deprecar gradualmente?

6. **FALTA: categories tabla creada pero NO vinculada**
   - Severidad: MEDIO
   - Campo: products.category es VARCHAR, debería ser FK
   - Solución: Aplicar migration, agregar FK constraint

7. **INCOMPLETO: Color variants en product_images**
   - Severidad: BAJO
   - Campo: product_images.product_id es NULLABLE (debería NOT NULL)
   - Solución: Migration + datos cleanup

### MINOR - Puede esperar:

8. **SKU Generator usa Math.random()**
   - Severidad: MEDIO (no thread-safe para concurrencia)
   - Línea: src/lib/sku-generator.server.ts
   - Solución: Usar secuencias BD o timestamps determinísticos

9. **product_images sin límite de 10**
   - Severidad: BAJO
   - Campo: No hay CONSTRAINT en BD
   - Solución: Agregar CHECK constraint en migration

10. **No hay validación de stock en checkout**
    - Severidad: BAJO
    - Efecto: Puede ordenar más de stock_quantity
    - Solución: Validar en POST /api/orders antes de crear

---

## PARTE 6: TABLA RESUMEN - ELEMENTO | ESTADO | SE PUEDE ELIMINAR | DEPENDENCIAS | ACCIÓN

| ELEMENTO | ESTADO | ¿ELIMINAR? | DEPENDENCIAS | ACCIÓN RECOMENDADA |
|----------|--------|-----------|-------------|-------------------|
| **products.ghl_product_id** | Requerido, NO nullable | ✗ NO | orders (FK faltante), product_metadata | CAMBIAR a nullable en FASE 2, aplicar migration |
| **product_options** | VIVO, usado | ✗ NO | producto.$id.tsx (precios), checkout, order snapshots | MANTENER - Fuente de verdad de precios |
| **product_options.price_final** | Generado auto | ✓ KEEP | Todo cálculo de precios | MANTENER generado automáticamente |
| **product_options.ghl_price_id** | Legacy, sin FK | ✗ NO (por ahora) | Posibles integraciones GHL futuras | DEPRECATE con GHL removal, eliminar en FASE 3 |
| **product_options.sku** | Usado, UNIQUE | ✗ NO | Auditoría, tracking | MANTENER, mejorar generador en FASE 2 |
| **product_images** | Parcial, product_id nullable | ~ MAYBE | Mostrar fotos en frontend | FIX en FASE 2: product_id NOT NULL |
| **color_variants** | VIVO | ✗ NO | producto.$id.tsx selección de colores | MANTENER |
| **product_metadata (tabla completa)** | LEGACY, paralela | ✓ MAYBE | 9+ archivos, price_min/price_max | AUDIT archivos, DEPRECATE luego GHL removal |
| **product_metadata.ghl_product_id** | Legacy FK | ✓ MAYBE | 9+ archivos | Revisar cada uso, reemplazar con products.id |
| **orders.ghl_contact_id** | Legacy, puede NULL | ✓ MAYBE | Sync a GHL (being removed) | ELIMINAR en FASE 3 con GHL |
| **orders.ghl_opportunity_id** | Legacy, puede NULL | ✓ MAYBE | Sync a GHL (being removed) | ELIMINAR en FASE 3 con GHL |
| **order_items.ghl_product_id** | BUG: UUID en lugar de GHL | ✗ NO | Trazabilidad de orden | RENAME a product_id, llenar con products.id |
| **order_items (sin product_id FK)** | MISSING | ✗ NO | Integridad referencial | AGREGAR product_id FK en FASE 2 |
| **order_items (sin product_option_id)** | MISSING | ✗ NO | Auditoría de opciones vendidas | CONSIDERAR agregar en FASE 2+ |
| **categories tabla** | Migration hecha, NO aplicada | ✗ NO | products.category FK | APLICAR migration + ADD FK constraint FASE 2 |
| **catalog.ts (hardcoded)** | LEGACY, fallback | ✓ MAYBE | Fallback si Supabase no disponible | MANTENER fallback, DEPRECATE cuando Supabase sea 100% |
| **Ribbon pricing logic** | En código, no normalizado | ~ MAYBE | Cálculo especial en producto.$id | CONSIDERAR normalizar a product_options |
| **convert-supabase-product.ts** | VIVO, conversion layer | ✗ NO | Compatibilidad Supabase ↔ legacy | MANTENER para gradual migration |
| **Sync retry infrastructure** | Creado, sin processor | ✓ MAYBE | Non-blocking product sync (being removed) | ELIMINAR con GHL en FASE 3 |
| **sync-retry.server.ts** | Implementation incomplete | ✓ MAYBE | GHL sync only (being removed) | ELIMINAR en FASE 3 |

---

## PARTE 7: DATOS REALES EN BD

**Requiere ejecución de queries en Supabase para verificar:**

```sql
-- Queries para ejecutar en BD live:
SELECT COUNT(*) FROM products WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM product_options WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM product_images;
SELECT COUNT(*) FROM color_variants WHERE active = true;
SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM order_items;
SELECT COUNT(*) FROM product_metadata;
SELECT COUNT(DISTINCT ghl_product_id) FROM order_items;
SELECT COUNT(DISTINCT product_id) FROM order_items WHERE product_id IS NOT NULL;
```

**Nota**: Sin acceso directo a BD en este audit, estos queries deben ejecutarse manualmente.

---

## PARTE 8: CONCLUSIONES FASE 1.2

### Readiness para FASE 2 (Schema Changes):

**🔴 NO LISTO sin fixes:**
1. Confirmar migraciones aplicadas en BD live (sync_status, categories, nullable ghl_product_id)
2. Corregir order_items.ghl_product_id → product_id semántica
3. Agregar FK constraints en order_items → products
4. Validar datos en BD (ejecutar queries de Parte 7)

### Plan FASE 2 (Recomendado):

```
1. VERIFICACIÓN PRE-MIGRACIÓN (0.5h)
   ├─ Ejecutar queries de datos reales
   ├─ Confirmar estado actual de migraciones
   └─ Backup de datos

2. SCHEMA FIXES (1h)
   ├─ Aplicar 3 migraciones pendientes
   ├─ Agregar product_id FK en order_items
   ├─ Fijar product_images.product_id NOT NULL
   └─ Agregar categories FK en products

3. CÓDIGO FIXES (2h)
   ├─ orders.server.ts: cambiar ghl_product_id → product_id
   ├─ api.orders.ts: agregar validación de precio
   ├─ ProductForm: actualizar para usar categories FK
   └─ Tests

4. DATA MIGRATION (1-2h)
   ├─ Backfill order_items.product_id desde productos
   ├─ Verificar integridad después
   └─ Document changes
```

### Próximo paso:
✅ **USUARIO APRUEBA esta auditoría** → Procede a FASE 2
❌ **USUARIO RECHAZA/REVISA** → Vuelve a auditar secciones específicas

---

## Archivos de referencia para esta auditoría:

- `FASE_1_AUDITORIA_COMPLETA.md` - Audit de 31 archivos GHL
- `src/integrations/supabase/types.ts` - Schema actual
- `supabase/migrations/` - Migraciones creadas (no aplicadas)
- `src/lib/orders.server.ts` - Flujo de creación de órdenes
- `src/routes/producto.$id.tsx` - Flujo de frontend
- `src/lib/convert-supabase-product.ts` - Conversión precios
- `IMPLEMENTATION_PROGRESS.md` - Estado anterior

