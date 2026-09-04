# BLOQUE 4 - AUDITORÍA ESTADO INICIAL

**Fecha:** 2026-09-03
**Objetivo:** Documentar estado actual antes del redesign completo

## 1. ANÁLISIS ACTUAL DEL CÓDIGO

### 1.1 Estructura de Datos en Código

**src/data/catalog.ts:**

- Tipo `Product` con campos:
  - id, name, category, priceMin, priceMax
  - image, description, badge
  - quoteOnly, roseStep, colors

- Categorías: ramos, plantas, rosas-eternas, complementos, condolencias

- Productos: ~20-30 productos estáticos

### 1.2 Bases de Datos (Supabase)

**Tablas Actuales:**

- `product_metadata` - Metadatos de productos (ghl_product_id, price_min, price_max, available_colors, etc.)
- `product_images` - Imágenes de productos (ghl_product_id, storage_path, image_url, sort_order, is_primary)
- `orders` - Pedidos
- `order_items` - Items de pedidos
- `webhook_events` - Eventos de webhooks
- `admin_roles` - Roles de admin
- `audit_logs` - Logs de auditoría
- `category_to_ghl_collection` - Mapeo de categorías a colecciones GHL

**Estado de product_metadata:**

- Migración: 20260826000001_create_product_metadata.sql
- Última actualización: 20260901130000 (agregó ghl_price_id)
- Índices: ghl_product_id, legacy_catalog_id, status, location_id, created_at

**Estado de product_images:**

- Migración: 20260831150000_create_product_images.sql
- FK a ghl_product_id (no es true FK a tabla products)
- Índices: ghl_product_id, sort_order

### 1.3 Integración GHL Actual

**API Endpoints:**

- `POST /api/products` - Create (createGHLProduct)
- `GET /api/products` - List (getGHLProducts)
- `GET /api/products/{id}` - Get (getGHLProduct)
- `PUT /api/products/{id}` - Update (updateGHLProduct)
- `DELETE /api/products/{id}` - Delete (deleteGHLProduct)

**Sincronización:**

- Un precio por producto (ghl_price_id en metadata)
- SKU generado automáticamente (FL-{CATEGORY}-NNNN)
- Relación: product_metadata.ghl_product_id ↔ GHL Product

### 1.4 Panel de Administración Actual

**Componentes Existentes:**

- `ProductForm.tsx` - Formulario para crear/editar producto
- `ProductsTable.tsx` - Tabla de productos
- `ProductImageUpload.tsx` - Upload de imágenes
- `ProductImageGallery.tsx` - Galería de imágenes
- `ProductImageItem.tsx` - Item de imagen individual

**Funcionalidades:**

- Crear/editar producto con nombre, descripción, categoría
- Upload de imágenes
- Borrar productos

## 2. LIMITACIONES DEL MODELO ACTUAL

1. ✗ Solo 1 precio por producto (no soporta múltiples opciones/tallas)
2. ✗ Sin control de descuentos
3. ✗ Sin stock administrable
4. ✗ Sin variantes de color (aunque existen en catalog.ts)
5. ✗ Sin tabla `products` (solo metadata vinculada a GHL)
6. ✗ Sin tabla `product_options` (no hay múltiples precios)
7. ✗ Sin tabla `color_variants` (colores hardcoded)
8. ✗ product_images vinculada por ghl_product_id (sin tabla products como FK)

## 3. PROBLEMAS IDENTIFICADOS

### 3.1 Relaciones

- `product_images.ghl_product_id` no es FK a tabla products (product_metadata no es "products")
- Potencial para huérfanos: imágenes sin producto válido

### 3.2 Precios

- Solo 1 precio en `product_metadata.ghl_price_id`
- Sin soporte para descuentos
- Sin soporte para múltiples opciones

### 3.3 Stock

- `product_metadata` no tiene campo stock
- No hay tracking de inventario

## 4. ESTADO DE DATOS ESPERADO

**productos_en_ghl:** Desconocido (requiere query a GHL API)
**productos_en_product_metadata:** Desconocido (requiere query Supabase)
**precios_en_ghl:** Desconocido
**imágenes_en_product_images:** Desconocido

**ACCIÓN REQUERIDA:** Ejecutar queries Supabase y GHL API para obtener conteos exactos.

## 5. HUÉRFANOS ESPERADOS

### 5.1 product_metadata sin ghl_product_id válido

```sql
SELECT * FROM product_metadata WHERE ghl_product_id IS NULL;
```

### 5.2 product_images sin producto

```sql
SELECT * FROM product_images WHERE ghl_product_id NOT IN (
  SELECT ghl_product_id FROM product_metadata WHERE status = 'active'
);
```

### 5.3 product_metadata duplicada

```sql
SELECT ghl_product_id, COUNT(*) as cnt FROM product_metadata
GROUP BY ghl_product_id HAVING COUNT(*) > 1;
```

## 6. MODELO NUEVO ESPERADO

### Nuevas Tablas:

- `products` - Reemplaza relación con GHL product
  - id, ghl_product_id, name, description, category, active, cover_image_url, has_color_variants
  - FK: category_id (opcional)

- `product_options` - Múltiples precios/opciones por producto
  - id, product_id, ghl_price_id, name, price_amount, discount_percent, price_final
  - stock_quantity, sku

- `color_variants` - Solo para rosas-eternas
  - id, product_id, name, sort_order, active

- `product_images` - MODIFICADA
  - Agregar: product_id FK, color_variant_id FK

### Eliminadas:

- `product_metadata` (deprecada, puede mantenerse como legacy)

### Modificadas:

- `product_images` - Agregar FKs a products y color_variants

## 7. PRÓXIMOS PASOS

1. Conectar a Supabase y obtener conteos exactos
2. Conectar a GHL y obtener conteos exactos
3. Identificar y documentar huérfanos
4. Crear script de backup SQL
5. Crear migraciones para nueva schema
6. Migrar datos existentes
7. Crear API endpoints nuevos
8. Crear componentes admin nuevos
9. Crear/editar 5 productos de prueba
10. Verificar sincronización
11. Pruebas de edición e idempotencia

## 8. NOTAS IMPORTANTES

- **NO eliminar datos** sin análisis previo
- **Respetar ghl_product_id** existentes (no borrar de GHL)
- **Mantener product_metadata** como legacy mientras se migra
- **Idempotencia obligatoria** en sincronización
- **Verificar Vercel** después de deploy
