# FASE 3 - DIAGNÓSTICO DEL ESTADO ACTUAL

## ✅ INFRAESTRUCTURA EXISTENTE

### API Endpoints Implementados
- ✅ POST /api/admin/products - Crear producto con opciones y colores
- ✅ GET /api/admin/products - Listar productos
- ✅ GET /api/admin/products/$id - Obtener producto
- ✅ PUT /api/admin/products/$id - Actualizar producto
- ✅ DELETE /api/admin/products/$id - Soft delete (protegido)
- ✅ POST /api/admin/products/$id/options - Crear opción
- ✅ PUT /api/admin/products/$id/options/{optionId} - Actualizar opción
- ✅ DELETE /api/admin/products/$id/options/{optionId} - Eliminar opción
- ✅ POST /api/admin/products/$id/colors - Crear variante
- ✅ DELETE /api/admin/products/$id/colors/{colorId} - Eliminar variante

### Biblioteca Supabase
- ✅ products.server.ts completo con CRUD
- ✅ Todas las funciones de gestión de opciones y colores
- ✅ Soft delete implementado
- ✅ Admin guard y logging de acciones

### UI Components
- ✅ ProductForm.tsx (implementación principal)
- ✅ ProductFormNew.tsx (implementación alternativa - DUPLICADA)
- ✅ ProductOptionsEditor.tsx
- ✅ ProductImagesEditor.tsx
- ✅ ColorVariantsSection.tsx (en ProductFormNew)

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. Referencia GHL Residual
**Archivo**: src/routes/api.admin.products.$id.options.ts
**Líneas 66-78**: 
- Aún intenta sincronizar precios con GHL
- Llama a ensureProductPrice()
- Busca GHL_LOCATION_ID
- Guarda ghl_price_id

**Usuario dijo**: NO usar GHL en FASE 3

### 2. Falta de Endpoints de Imágenes
**Problema**: No existen endpoints CRUD para product_images
**Impacto**: ProductImagesEditor UI no tiene backend
**Falta**:
- POST /api/admin/products/$id/images - Crear/agregar imagen
- PUT /api/admin/products/$id/images/{imageId} - Actualizar (marcar primaria, reordenar)
- DELETE /api/admin/products/$id/images/{imageId} - Eliminar imagen

### 3. Color Variants - Falta PUT
**Problema**: No se pueden EDITAR variantes de color
**Falta**:
- PUT /api/admin/products/$id/colors/{colorId} - Actualizar variante

### 4. Duplicación: ProductForm vs ProductFormNew
**Estado**: Dos implementaciones paralelas
- ProductForm.tsx: Más completa, mejor UX (uses Cards, Error handling elegante)
- ProductFormNew.tsx: Más simple, usa CreateProductRequest
- **DECISIÓN NECESARIA**: Consolidar en ProductForm.tsx, eliminar ProductFormNew.tsx

### 5. Categorías Hardcodeadas
**Problema**: ProductForm usa categoryLabels de data/catalog.ts
**Solución**: Cargar dinámicamente desde categories table de Supabase
**Impacto**: Si se agregan categorías en Supabase, no aparecen en selector

### 6. Schema Inconsistencia en listProducts
**Archivo**: src/lib/products.server.ts línea 101
**Problema**: Filtra por "category" (string) cuando debería ser "category_id" (FK)
**Impacto**: Filtros por categoría probablemente no funcionan

### 7. ProductImagesEditor Integration
**Problema**: ProductForm usa ProductImagesEditor pero:
- No hay endpoint de imágenes para guardar
- Images state existe pero no se envía al servidor
- No hay validación en backend

### 8. Validaciones Incompletas
**Actualizar**: Validar en endpoints de edición que no se dupliquen relaciones

## 📋 TRABAJO NECESARIO PARA FASE 3

### TIER 1: Crítico
1. Limpiar referencia GHL en endpoints de opciones
2. Crear endpoints CRUD completos de imágenes
3. Agregar PUT para editar variantes de color
4. Consolidar ProductForm (eliminar ProductFormNew)

### TIER 2: Importante
5. Cargar categorías dinámicamente
6. Reparar filtro de categoría en listProducts
7. Integrar ProductImagesEditor con backend
8. Validar no duplicación en UPDATE

### TIER 3: Polish
9. Mejorar mensajes de error
10. Agregar confirmaciones antes de eliminar
11. Invalidar React Query después de cambios
12. Tests de integración

## 📊 ARCHIVOS A MODIFICAR

### APIs
- src/routes/api.admin.products.$id.options.ts (LIMPIAR GHL)
- src/routes/api.admin.products.images.ts (CREAR)
- src/routes/api.admin.products.$id.colors.ts (AGREGAR PUT)

### Biblioteca
- src/lib/products.server.ts (REPARAR listProducts)
- Posiblemente agregar createProductImage, updateProductImage, deleteProductImage

### UI
- src/components/admin/ProductForm.tsx (CONSOLIDAR)
- src/components/admin/ProductFormNew.tsx (ELIMINAR)
- src/components/admin/ProductImagesEditor.tsx (INTEGRAR)

## 🔍 SIGUIENTE PASO

Revisar el schema de product_images para entender la estructura exacta
Revisar la tabla categories para parametrizar selector
Revisar el flujo actual de edición
