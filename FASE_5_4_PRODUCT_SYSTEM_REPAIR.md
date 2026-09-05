# FASE 5.4 — REPARACIÓN DEFINITIVA DEL SISTEMA DE PRODUCTOS

**Proyecto:** Floristería Lucía  
**Fuente única de verdad:** Supabase  
**Objetivo:** Dejar funcionando de extremo a extremo el nuevo sistema de productos antes de continuar con nuevas funcionalidades.

---

## 1. OBJETIVO

La arquitectura definitiva debe ser:

```text
ADMIN PANEL
  └─ Crear / editar / activar / desactivar / eliminar productos
                  ↓
              SUPABASE
                  ↓
PUBLIC
  ├─ Catálogo
  ├─ Categorías
  ├─ Página de producto
  ├─ Favoritos
  └─ Carrito
```

**GoHighLevel (GHL) NO forma parte del nuevo sistema de productos.**

La cadena crítica debe funcionar así:

```text
ADMIN CREA PRODUCTO
        ↓
     SUPABASE
        ↓
   CATÁLOGO PÚBLICO
        ↓
   PRODUCT DETAIL
        ↓
      CARRITO
```

No declarar la fase completa solamente porque los tests de Node.js o Supabase pasen. Debe verificarse también el frontend cuando el entorno lo permita.

---

# 2. PROBLEMAS QUE DEBEN RESOLVERSE

Actualmente existen tres problemas confirmados:

### A. Admin muestra productos como inactivos

Investigar el valor real de:

```text
products.active
products.deleted_at
```

y revisar:

- query del Admin
- mapping de datos
- formulario de creación
- formulario de edición
- endpoints POST/PUT
- valores por defecto
- UI del estado

Reglas:

```text
Público:
active = true
AND
deleted_at IS NULL
```

```text
Inactivo:
active = false
AND
deleted_at IS NULL
```

```text
Eliminado:
deleted_at IS NOT NULL
```

No confundir `active` con `deleted_at`.

---

### B. Error de ProductImagesEditor

Corregir:

```text
Identifier `ProductImage` has already been declared
```

Archivo:

```text
src/components/admin/ProductImagesEditor.tsx
```

Actualmente hay una declaración tipo:

```ts
type ProductImage = Tables<"product_images">;
```

y otra:

```ts
interface ProductImage { ... }
```

Debe quedar una sola definición coherente.

No crear un segundo nombre como parche sin analizar primero todos los usos.

Después ejecutar:

```bash
npm run build
```

---

### C. Error PGRST201

Error observado:

```text
PGRST201
Could not embed because more than one relationship was found for
'products' and 'product_images'
```

Las migraciones anteriores intentaron eliminar la ambigüedad.

Debe verificarse nuevamente en:

1. Supabase/PostgreSQL.
2. Node.js.
3. Cliente Supabase del navegador.
4. `useSupabaseProducts`.
5. `/catalogo`.

**No asumir automáticamente que es "caché del navegador".** Si continúa, encontrar y corregir la causa estructural.

---

# 3. SUPABASE COMO ÚNICA FUENTE

Productos públicos y administrativos deben proceder de Supabase.

Buscar en todo el repositorio:

```text
fallbackProducts
getGHLProducts
GHL
GoHighLevel
hardcoded products
products = [
const products = [
legacy fallback
```

Cada resultado debe clasificarse.

No eliminar a ciegas migraciones o columnas históricas de GHL. Diferenciar:

- código activo
- código legacy
- migraciones históricas
- documentación
- datos legacy
- integraciones ajenas al sistema de productos

Para el sistema nuevo:

```text
ADMIN → SUPABASE
CATÁLOGO → SUPABASE
PRODUCT DETAIL → SUPABASE
FAVORITOS → SUPABASE
```

Nunca:

```text
ADMIN → GHL
CATÁLOGO → GHL
PRODUCT DETAIL → GHL
```

---

# 4. MODELO DE PRODUCTO

Antes de modificar formularios, inspeccionar el schema real.

El sistema debe soportar, según las tablas existentes:

## products

- id
- name
- slug/identificador si existe
- description
- category
- precio/base price si existe
- active
- deleted_at
- created_at
- updated_at

## product_options

- product_id
- nombre/label
- precio
- orden
- estado si existe

## product_images

- product_id
- URL/path
- alt si existe
- sort_order
- primary
- metadata existente

## color_variants

- product_id
- nombre/valor
- orden
- estado si existe

**No inventar columnas. Utilizar el schema real.**

---

# 5. FLUJO DE CREACIÓN

El nuevo producto debe seguir:

```text
Admin
 ↓
Nuevo Producto
 ↓
Datos básicos
 ↓
Categoría
 ↓
Opciones/precios
 ↓
Colores/variantes
 ↓
Imágenes
 ↓
Estado
 ↓
Guardar
 ↓
Supabase
 ↓
Invalidar cache
 ↓
Admin actualizado
 ↓
Catálogo actualizado
```

Al crear:

1. Validar obligatorios.
2. Crear `products`.
3. Obtener `product.id`.
4. Crear opciones.
5. Crear variantes.
6. Crear/sincronizar imágenes.
7. Verificar relaciones por `product_id`.
8. Si se crea como activo, guardar `active=true`.
9. `deleted_at=NULL`.
10. Invalidar queries.
11. Verificar Admin.
12. Verificar Catálogo.

No crear duplicados.

---

# 6. ESTADO DEL PRODUCTO

El Admin debe distinguir claramente:

```text
Activo
Inactivo
Eliminado
```

### Activo

```text
active=true
deleted_at=NULL
```

Aparece en catálogo.

### Inactivo

```text
active=false
deleted_at=NULL
```

No aparece en catálogo.

### Eliminado

```text
deleted_at != NULL
```

No aparece en catálogo.

El Admin puede mostrar inactivos/eliminados para gestión administrativa si el diseño lo permite.

---

# 7. CATÁLOGO

`/catalogo` debe utilizar únicamente Supabase.

Debe cargar:

- productos
- categoría
- imágenes
- opciones/precios
- variantes necesarias

Filtro público:

```text
active=true
AND
deleted_at IS NULL
```

Debe funcionar:

```text
/catalogo
/catalogo?categoria=rosas-eternas
```

y los demás filtros existentes.

Verificar que el hook no solamente recibe datos, sino que el componente realmente los renderiza.

---

# 8. PRODUCT DETAIL

La página de producto debe:

1. Recibir id/slug.
2. Consultar Supabase.
3. Respetar visibilidad.
4. Cargar datos y relaciones.
5. Mostrar loading.
6. Mostrar not found/error correctamente.
7. No usar fallback hardcoded.
8. No usar GHL.

Un producto inactivo o eliminado no debe ser público.

---

# 9. ADMIN PANEL

La lista debe mostrar correctamente:

- nombre
- categoría
- precio
- imagen principal
- estado
- fecha
- acciones

Acciones:

- Crear
- Editar
- Activar/desactivar
- Soft delete
- Gestionar imágenes
- Gestionar precios/opciones
- Gestionar colores/variantes

El estado mostrado debe corresponder al valor real de Supabase.

---

# 10. CATEGORÍAS

Las categorías deben proceder de Supabase.

Verificar:

- SELECT
- RLS
- categorías activas
- creación
- edición
- filtro del catálogo

No introducir una segunda lista hardcodeada como solución.

---

# 11. IMÁGENES

Verificar:

- agregar
- eliminar
- ordenar
- imagen principal
- reemplazar
- relación `product_id`

Debe existir una relación inequívoca:

```text
product_images.product_id → products.id
```

No introducir FK duplicadas.

Un producto sin imagen debe usar el placeholder real del proyecto sin romper:

- catálogo
- detalle
- favoritos
- carrito

---

# 12. PRECIOS

Investigar productos sin precio.

No aceptar silenciosamente:

```text
€0
```

si significa producto mal configurado.

Determinar la regla comercial a partir de la implementación existente. Puede requerirse:

- precio base
- opción de precio
- estado no publicable
- "Consultar precio"

La misma regla debe aplicarse en Admin, Catálogo, Detalle, Carrito y Checkout.

No inventar una regla comercial sin evidencia en el proyecto.

---

# 13. CACHE

Después de:

- crear
- editar
- activar
- desactivar
- eliminar

invalidar las queries relevantes.

Revisar:

```text
useSupabaseProducts
useSupabaseProduct
useSupabaseProductsByCategory
```

No usar "limpiar caché del navegador" como solución estructural.

---

# 14. DATOS EXISTENTES

Antes de borrar o modificar productos:

1. Contar productos.
2. Revisar cuáles son reales.
3. Identificar productos de prueba.
4. Identificar legacy.
5. Revisar `active`.
6. Revisar `deleted_at`.
7. Revisar imágenes.
8. Revisar precios/opciones.
9. Revisar categorías.

No borrar datos reales sin evidencia.

Identificar explícitamente productos de pruebas como:

```text
TEST_FASE_5_3_...
```

y similares.

---

# 15. ELIMINACIÓN DE GHL

Buscar todas las referencias.

Para cada una decidir:

```text
ELIMINAR
MANTENER COMO LEGACY
MIGRAR
DOCUMENTAR
```

GHL no debe intervenir en el nuevo CRUD de productos.

No eliminar migraciones históricas únicamente para que el buscador quede limpio.

---

# 16. TEST END-TO-END

Crear un producto de prueba con:

```text
Nombre único
Categoría válida
≥ 1 opción de precio
≥ 1 imagen
variante de color si aplica
active=true
deleted_at=NULL
```

Comprobar:

```text
ADMIN CREATE
↓
SUPABASE
↓
ADMIN READ
↓
CATALOG
↓
PRODUCT DETAIL
↓
ADD TO CART
```

Editar:

```text
nombre
precio
imagen
color
```

Verificar cambios.

Desactivar:

```text
active=false
```

Debe desaparecer del catálogo.

Reactivar:

```text
active=true
```

Debe reaparecer.

Soft delete:

```text
deleted_at != NULL
```

Debe desaparecer.

---

# 17. RLS Y SEGURIDAD

Verificar:

### Público

Solo debe acceder a productos permitidos por las políticas, especialmente:

```text
active=true
deleted_at IS NULL
```

### Admin/server

Debe gestionar productos mediante los mecanismos protegidos existentes.

Nunca exponer:

```text
SERVICE_ROLE_KEY
```

al navegador.

---

# 18. BROWSER TESTING

Si existe navegador automatizable, usarlo.

Comprobar:

```text
/catalogo
/catalogo?categoria=rosas-eternas
/producto/...
/admin/...
```

Revisar:

```text
PGRST201
TypeError
ReferenceError
404
500
Hydration mismatch
```

Distinguir errores causados por extensiones.

El warning visto anteriormente con:

```text
inject_vt_svd
cz-shortcut-listen
```

parece relacionado con atributos inyectados por una extensión; verificarlo antes de modificar SSR de la aplicación.

---

# 19. BUILD Y LINT

Ejecutar:

```bash
npm run build
```

y lint según los scripts reales del proyecto.

Diferenciar:

- errores preexistentes
- errores nuevos
- warnings
- errores causados por esta fase

No ocultar errores con:

```text
server.hmr.overlay=false
```

Eso no corrige el problema.

---

# 20. REGLAS CONTRA PARCHES

NO:

- volver a hardcoded products
- añadir fallback de productos
- volver a GHL
- desactivar RLS
- exponer service role
- ocultar errores
- devolver arrays vacíos para esconder fallos
- duplicar tipos
- crear FK duplicadas
- borrar datos reales sin comprobar
- usar cache clear como solución permanente
- afirmar "production ready" sin verificar frontend

SÍ:

- encontrar causa raíz
- corregir arquitectura
- verificar datos reales
- probar backend y frontend
- documentar limitaciones

---

# 21. ORDEN OBLIGATORIO DE EJECUCIÓN

## BLOQUE A — INVENTARIO

1. Inspeccionar estructura.
2. Revisar schema y migraciones.
3. Revisar hooks.
4. Revisar API.
5. Revisar Admin.
6. Revisar Catálogo.
7. Revisar Product Detail.
8. Buscar GHL.
9. Buscar hardcoded products.
10. Crear diagnóstico.

## BLOQUE B — COMPILACIÓN

Corregir `ProductImage` duplicado.

Ejecutar build.

## BLOQUE C — ESTADO

Investigar por qué Admin muestra inactivo.

Corregir causa real.

## BLOQUE D — RELACIONES

Verificar definitivamente:

```text
products → product_images
products → product_options
products → color_variants
products → categories
```

## BLOQUE E — CATÁLOGO

Verificar query, hook, transformación y renderizado.

## BLOQUE F — PRODUCT DETAIL

Verificar carga y visibilidad.

## BLOQUE G — CREATE/EDIT

Verificar formulario y persistencia.

## BLOQUE H — IMÁGENES

Verificar CRUD/sync/primary/order.

## BLOQUE I — CACHE

Verificar invalidación de React Query.

## BLOQUE J — E2E

Ejecutar pruebas completas.

---

# 22. CRITERIOS DE ÉXITO

No marcar FASE 5.4 como completa hasta que:

- [ ] ProductImage duplicado corregido.
- [ ] Build PASS.
- [ ] Admin muestra estado real.
- [ ] Productos activos tienen `active=true`.
- [ ] Productos públicos tienen `deleted_at=NULL`.
- [ ] Catálogo consulta Supabase.
- [ ] Catálogo renderiza productos.
- [ ] Product Detail funciona.
- [ ] Create funciona.
- [ ] Edit funciona.
- [ ] Soft Delete funciona.
- [ ] Activar/desactivar funciona.
- [ ] Cache invalidation funciona.
- [ ] Imágenes funcionan.
- [ ] Opciones/precios funcionan.
- [ ] Colores funcionan.
- [ ] Categorías funcionan.
- [ ] RLS funciona.
- [ ] No hay fallback hardcoded.
- [ ] No hay GHL en el nuevo flujo de productos.
- [ ] No hay secrets en frontend.
- [ ] No hay errores nuevos de TypeScript.
- [ ] Lint evaluado honestamente.
- [ ] Browser testing realizado si está disponible.
- [ ] Tests críticos pasan.

---

# 23. REPORTE FINAL

Crear:

```text
FASE_5_4_FINAL_REPORT.md
```

Debe incluir:

1. Problemas encontrados.
2. Causa raíz.
3. Archivos modificados.
4. Migraciones.
5. Datos modificados.
6. Tests.
7. Build.
8. TypeScript.
9. Lint.
10. Browser.
11. Estado de GHL.
12. Estado de hardcoded products.
13. Admin.
14. Catálogo.
15. Product Detail.
16. CRUD.
17. RLS.
18. Limitaciones.
19. Blockers.
20. Commits.
21. Veredicto.

Veredictos permitidos:

```text
🟢 COMPLETE
```

solo si todos los criterios obligatorios pasan.

Si queda algo pendiente:

```text
🟠 INCOMPLETE
```

y enumerar exactamente qué falta.

---

# 24. ARQUITECTURA FINAL

```text
                    ┌─────────────────┐
                    │    SUPABASE     │
                    │                 │
                    │ products        │
                    │ product_options │
                    │ product_images  │
                    │ color_variants  │
                    │ categories      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ADMIN PANEL       API/SERVER     PUBLIC
              │              │              │
              ▼              ▼              ▼
       Nuevo Producto      CRUD          Catálogo
       Editar Producto                    │
       Imágenes                           ▼
       Opciones                       Detalle
       Colores                           │
       Estado                            ▼
                                    Carrito
                                      │
                                      ▼
                                   Checkout
```

GHL:

```text
GHL ❌
```

Hardcoded products:

```text
Hardcoded products ❌
```

Fallbacks:

```text
Fallback products ❌
```

---

# 25. PRINCIPIO FINAL

La fase no se considera terminada porque una capa funcione.

Debe funcionar toda la cadena:

```text
DATABASE
   ↓
API / HOOK
   ↓
REACT
   ↓
BROWSER
   ↓
USER
```

El objetivo final es que un administrador pueda crear un producto en el panel, guardarlo en Supabase y verlo correctamente en el catálogo y en su página de producto, sin GHL, sin hardcoded data, sin fallbacks, sin PGRST201 y sin errores de compilación.

Solo después de conseguirlo se puede continuar con la siguiente fase.
