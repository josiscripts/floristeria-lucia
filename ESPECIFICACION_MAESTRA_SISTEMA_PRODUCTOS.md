# ESPECIFICACIÓN MAESTRA — RECONSTRUCCIÓN DEL SISTEMA DE PRODUCTOS

## 0. Propósito y regla de oro

Este documento es la especificación funcional y técnica de referencia para reconstruir el sistema de productos de la aplicación.

El objetivo NO es hacer solamente un cambio visual del panel. El objetivo es conseguir un flujo completo, persistente, seguro y sincronizado de extremo a extremo.

La regla de oro del nuevo sistema es:

**PANEL ADMIN → BACKEND → SUPABASE + GOHIGHLEVEL → CATÁLOGO WEB**

El administrador debe crear, editar, activar, desactivar y eliminar productos exclusivamente desde el panel de administración.

Cuando el administrador crea un producto desde el panel:

1. El panel recoge y valida los datos.
2. El backend procesa la operación.
3. El producto se crea en Supabase.
4. El producto correspondiente se crea en GoHighLevel (GHL).
5. Los precios/opciones se crean en GHL.
6. Las imágenes se gestionan correctamente.
7. Las categorías se relacionan correctamente.
8. Los identificadores de GHL se guardan en Supabase.
9. La operación queda marcada como sincronizada o con error.
10. El catálogo público obtiene el producto desde Supabase.

El administrador NO debe tener que entrar a GHL para crear manualmente el producto.

No debe existir una segunda gestión manual paralela.

Supabase será la fuente de datos del catálogo de la aplicación.

GHL será el sistema externo sincronizado con los productos.

El catálogo público dejará de depender de productos reales escritos directamente en el código.

---

# 1. Instrucción de trabajo para Claude

Antes de modificar código, inspecciona el repositorio completo y entiende la arquitectura existente.

No inventes la estructura del proyecto.

No inventes tablas.

No inventes endpoints.

No inventes integraciones.

No asumas que una funcionalidad funciona porque parece funcionar desde la interfaz.

Comprueba el código real.

La IA puede agrupar internamente las tareas y trabajar de forma autónoma. No es necesario dividir la implementación en pequeños pasos conversacionales. Sin embargo, debe respetar el orden lógico de análisis, migración, implementación y verificación establecido en este documento.

El objetivo es que el resultado final sea funcional de extremo a extremo, no un prototipo.

No quiero mocks.

No quiero datos temporales.

No quiero arrays ficticios que simulen Supabase o GHL.

No quiero una solución que solamente modifique el frontend.

---

# 2. Auditoría inicial obligatoria

Antes de realizar cambios estructurales, inspecciona todo el repositorio relevante.

Localiza y documenta internamente:

## Frontend

- Framework.
- Sistema de rutas.
- Componentes del catálogo.
- Componentes de tarjetas de producto.
- Página/listado de productos.
- Página de detalle de producto.
- Carrito.
- Checkout.
- Filtros.
- Búsqueda.
- Categorías.
- Sección Condolencias.
- Panel de administración.
- Lista de productos del panel.
- Nuevo producto.
- Editar producto.
- Eliminación de productos.
- Activación/desactivación.

## Backend

Localiza:

- API routes.
- Server actions.
- Controllers.
- Services.
- Repositories.
- Funciones de acceso a Supabase.
- Funciones de acceso a GHL.
- Validaciones.
- Middleware.
- Autorización administrativa.
- Procesamiento de imágenes.

## Supabase

Identifica:

- Tablas actuales.
- Columnas.
- Primary keys.
- Foreign keys.
- Índices.
- Unique constraints.
- RLS.
- Storage buckets.
- Triggers.
- Functions.
- Relaciones entre productos y otras entidades.
- Relaciones con pedidos históricos.
- Relaciones con Condolencias.

## GoHighLevel

Identifica:

- Integración existente.
- SDK o llamadas HTTP.
- Endpoints utilizados.
- Autenticación.
- Location ID.
- Scopes/permisos.
- Creación de productos.
- Actualización.
- Eliminación.
- Precios.
- Colecciones.
- Media.
- Inventario si existe.
- Manejo actual de errores.
- Variables de entorno.

## Datos hardcodeados

Localiza todos los lugares donde existan productos reales escritos directamente en:

- arrays;
- constantes;
- JSON;
- objetos;
- archivos de configuración;
- componentes;
- fixtures que realmente estén siendo usados en producción;
- listas de productos;
- precios;
- imágenes;
- categorías.

El objetivo final es eliminar la dependencia del catálogo público respecto a esos datos hardcodeados.

---

# 3. Análisis específico de Metadata (Supabase)

Actualmente existe una sección visual denominada:

**Metadata (Supabase)**

Con los campos:

- Etiqueta destacada.
- Incremento (rosas).
- Colores disponibles.
- Solo bajo presupuesto.

La intención es eliminar completamente estos campos si no son necesarios.

NO los mantengas solamente por compatibilidad.

Primero comprueba si:

- el catálogo los utiliza;
- los filtros los utilizan;
- las tarjetas los utilizan;
- el detalle del producto los utiliza;
- el carrito los utiliza;
- el checkout los utiliza;
- Condolencias los utiliza;
- alguna lógica de negocio los utiliza;
- alguna API los devuelve;
- alguna consulta de Supabase los necesita;
- alguna integración externa los necesita.

Si NO tienen una función real, deben desaparecer:

- del formulario;
- de edición;
- del modelo de datos si corresponde;
- de las consultas;
- de las validaciones;
- de las APIs;
- de los componentes;
- de la documentación interna relacionada.

Si alguno sí es necesario, NO lo elimines ciegamente. Identifica exactamente qué dependencia existe, qué funcionalidad aporta y cómo puede reemplazarse o conservarse sin volver a introducir una estructura de metadata innecesaria.

La sección de **Condolencias debe conservarse**.

---

# 4. Regla especial para Condolencias

La limpieza del catálogo NO puede destruir Condolencias.

Antes de cualquier operación destructiva:

1. Identifica los productos de Condolencias.
2. Identifica sus categorías.
3. Identifica sus imágenes.
4. Identifica sus relaciones.
5. Comprueba si existen pedidos históricos relacionados.
6. Comprueba si existe información que deba conservarse.
7. Define exactamente qué registros se conservan.

Nunca hagas un DELETE masivo sin saber qué registros están siendo afectados.

Los productos antiguos que no sean necesarios podrán eliminarse después de verificar las dependencias.

No borres usuarios.

No borres pedidos históricos.

No borres datos que no pertenezcan al catálogo.

Si una referencia histórica requiere conservar un registro de producto, utiliza una estrategia segura como desactivación/archivado en lugar de romper la integridad histórica.

---

# 5. Arquitectura definitiva

La arquitectura conceptual debe ser:

```text
                    ADMINISTRADOR
                          |
                          v
                 PANEL DE ADMIN
                          |
                          v
                       BACKEND
                      /       \
                     /         \
                    v           v
               SUPABASE       GHL
                    |
                    v
              CATÁLOGO WEB
```

El panel es el punto de entrada.

El backend es responsable de las operaciones sensibles.

Supabase almacena el modelo de aplicación.

GHL recibe la representación sincronizada.

La web pública obtiene los productos desde Supabase.

No debe existir una segunda fuente manual para crear productos.

---

# 6. Modelo definitivo de producto

El modelo debe representar un producto de forma coherente.

Conceptualmente:

## PRODUCTS

- id
- ghl_product_id
- name
- description
- category_id
- sku
- is_active
- created_at
- updated_at
- sync_status
- sync_error

Los nombres exactos pueden adaptarse a las convenciones existentes del proyecto, pero la información debe existir de forma equivalente.

## Reglas

### id

Identificador interno de Supabase.

### ghl_product_id

Identificador del producto correspondiente en GHL.

Puede ser NULL mientras una creación esté pendiente de sincronización, pero debe quedar guardado cuando GHL confirme la creación.

### name

Nombre visible del producto.

### description

Descripción del producto.

### category_id

Referencia a la categoría.

### sku

SKU generado automáticamente.

### is_active

Controla si el producto se muestra en el catálogo público.

### created_at

Fecha de creación.

### updated_at

Fecha de última modificación.

### sync_status

Estado de sincronización.

Estados mínimos recomendados:

- pending
- synced
- error

Puede ampliarse si la arquitectura lo necesita.

### sync_error

Información útil del último error de sincronización.

No debe mostrar secretos ni tokens.

---

# 7. SKU automático

El SKU NO debe ser introducido manualmente por el administrador.

Debe generarse automáticamente.

Debe ser:

- único;
- persistente;
- no editable manualmente;
- seguro ante concurrencia;
- seguro ante reintentos;
- almacenado en Supabase;
- sincronizado con GHL cuando corresponda.

Ejemplos posibles:

```text
RAM-000001
RAM-000002
ROS-000001
CON-000001
```

La estrategia concreta puede adaptarse al proyecto.

Lo importante es que dos operaciones simultáneas nunca produzcan el mismo SKU.

Debe existir una restricción UNIQUE en base de datos.

No dependas únicamente de comprobar desde el frontend que un SKU está libre.

---

# 8. Precios y opciones

NO utilizar:

- precio mínimo;
- precio máximo independiente.

Un producto puede tener una o varias opciones/precios.

Ejemplo:

```text
Ramo Primavera

Básico   30 €
Premium  45 €
Deluxe   60 €
```

Modelo conceptual:

## PRODUCT_PRICES

- id
- product_id
- ghl_price_id
- name
- price
- discount_percent
- stock
- sku
- created_at
- updated_at

El administrador podrá:

- añadir una opción;
- modificar una opción;
- eliminar una opción.

Los campos visibles serán:

- Nombre.
- Precio €.
- Descuento %.
- Stock.

No debe ser necesario introducir manualmente un SKU para cada opción.

Si GHL necesita SKU a nivel de precio, generar uno automáticamente de forma determinista.

Ejemplo:

```text
Producto:
RAM-000001

Opciones:
RAM-000001-01
RAM-000001-02
RAM-000001-03
```

La complejidad técnica no debe aparecer innecesariamente en la interfaz.

---

# 9. Descuentos

El panel puede permitir:

```text
Precio:
45 €

Descuento:
10 %
```

La representación interna debe ser consistente.

Si la API de GHL utiliza `compareAtPrice` u otro campo equivalente para representar precio comparativo, utiliza la estructura correcta de la API real.

No inventes propiedades de GHL.

Antes de implementar la integración, revisa la implementación/SDK/API real que utiliza el proyecto y respeta su contrato.

---

# 10. Stock

El stock es opcional.

Debe poder quedar vacío cuando un producto no requiera seguimiento de inventario.

Si el proyecto ya tiene una integración de inventario con GHL, respétala.

No introduzcas un sistema complejo de inventario que no sea necesario.

---

# 11. Categorías

Los productos deben tener una categoría.

Modelo conceptual:

## CATEGORIES

- id
- name
- slug
- ghl_collection_id

La categoría de Supabase debe poder mapearse con su equivalente en GHL.

Si GHL utiliza Product Collections para esta función, utiliza correctamente esas colecciones.

No crees una nueva colección de GHL cada vez que se crea un producto.

Una categoría debe reutilizar su colección existente.

Condolencias debe mantener su categoría y relación.

---

# 12. Sistema de imágenes

La gestión de imágenes debe reconstruirse.

NO crear:

- image1;
- image2;
- image3;
- image4;
- etc.

como columnas del producto.

Debe existir una relación:

```text
PRODUCT
   |
   +---- PRODUCT_IMAGES
             |
             +---- image 1
             +---- image 2
             +---- image 3
             ...
             +---- image 10
```

Modelo conceptual:

## PRODUCT_IMAGES

- id
- product_id
- url
- is_primary
- position
- source
- created_at

`source` puede indicar si procede de upload o URL si es útil.

Máximo:

**10 imágenes por producto.**

El sistema debe rechazar una undécima imagen.

---

# 13. Interfaz de imágenes

Debe existir UN SOLO BLOQUE visual de imágenes.

No quiero diez formularios separados.

El bloque debe permitir:

1. Subir archivos.
2. Añadir imágenes mediante URL.
3. Mostrar miniaturas.
4. Eliminar imágenes.
5. Elegir imagen primaria.
6. Reordenar imágenes.
7. Mostrar contador 0/10, 1/10, etc.
8. Mantener exactamente una imagen primaria.

Si el usuario no selecciona una primaria, la primera imagen puede convertirse automáticamente en primaria.

El mismo componente debe utilizarse en:

- Nuevo Producto.
- Editar Producto.

Si ya existe Supabase Storage, analizarlo y reutilizarlo correctamente.

No crear un sistema de almacenamiento paralelo innecesario.

---

# 14. Formulario Nuevo Producto

Debe quedar conceptualmente:

## INFORMACIÓN BÁSICA

### Nombre *

Campo obligatorio.

### Descripción

Campo opcional.

### Categoría *

Selector de categoría.

### Producto activo

Switch.

### SKU

Generado automáticamente.

Solo lectura.

No editable.

---

## OPCIONES / PRECIOS

Lista dinámica.

Cada fila:

- Nombre.
- Precio €.
- Descuento %.
- Stock.

Botón:

**+ Agregar opción**

Permitir:

- crear;
- editar antes de guardar;
- eliminar.

---

## IMÁGENES

Un único componente.

Debe permitir:

- upload;
- URL;
- preview;
- eliminación;
- primaria;
- orden;
- máximo 10.

---

## NO MOSTRAR METADATA SUPABASE

Si la auditoría confirma que no es necesaria, eliminar completamente:

- Etiqueta destacada.
- Incremento (rosas).
- Colores disponibles.
- Solo bajo presupuesto.

Tampoco mostrar:

- Precio máximo independiente.
- URL de imagen independiente.
- SKU manual.

---

# 15. Formulario Editar Producto

Nuevo Producto y Editar Producto deben utilizar el mismo modelo conceptual y, preferiblemente, los mismos componentes reutilizables.

Editar debe permitir:

- nombre;
- descripción;
- categoría;
- activo;
- opciones/precios;
- imágenes;
- primaria;
- orden.

SKU:

- visible;
- solo lectura;
- no editable.

Editar NO debe crear un nuevo producto.

Debe actualizar el recurso existente.

Para GHL utilizar:

- ghl_product_id;
- ghl_price_id.

Si se elimina una opción:

- eliminarla o desactivarla correctamente en GHL según la API y las reglas del proyecto.

Si se añade una opción:

- crearla en GHL.

Si se modifica:

- actualizarla.

Si se elimina una imagen:

- actualizar la representación de imágenes correspondiente.

---

# 16. Sincronización Supabase + GHL

Esta es una parte crítica.

La operación de creación debe ser real.

Flujo conceptual:

```text
PANEL
  |
  v
VALIDACIÓN
  |
  v
BACKEND
  |
  +----> SUPABASE
  |
  +----> GHL PRODUCT
             |
             +----> GHL PRICES
             |
             +----> GHL COLLECTION
             |
             +----> MEDIA
  |
  v
GUARDAR IDs GHL EN SUPABASE
  |
  v
SYNC STATUS
```

La estrategia exacta de orden puede adaptarse para garantizar consistencia.

El backend debe coordinar la operación.

No exponer tokens sensibles de GHL al frontend.

---

# 17. Idempotencia

La sincronización debe ser idempotente.

Si la misma operación se reintenta:

NO debe producir:

```text
Producto A
Producto A duplicado
```

Tampoco debe producir precios duplicados.

Utiliza:

- IDs persistidos;
- identificadores deterministas;
- restricciones únicas;
- comprobaciones seguras;
- operaciones de actualización cuando el recurso ya existe.

No confíes únicamente en un botón deshabilitado del frontend.

La idempotencia debe existir en backend.

---

# 18. Manejo de errores

Supabase y GHL pueden fallar de forma independiente.

Debe existir un estado claro.

Ejemplo:

```text
sync_status = pending
```

durante el proceso.

Si todo funciona:

```text
sync_status = synced
sync_error = null
```

Si GHL falla:

```text
sync_status = error
sync_error = "mensaje útil"
```

El administrador debe recibir un mensaje comprensible.

Ejemplo:

**Producto guardado, pero la sincronización con GoHighLevel requiere atención.**

Debe existir una estrategia de reintento.

El reintento NO debe crear duplicados.

No guardar tokens ni secretos dentro de `sync_error`.

---

# 19. CREATE

Al crear:

1. Validar datos.
2. Generar SKU.
3. Crear/persistir producto en Supabase.
4. Crear producto en GHL.
5. Guardar ghl_product_id.
6. Crear precios en GHL.
7. Guardar ghl_price_id.
8. Procesar imágenes.
9. Relacionar categoría/collection.
10. Actualizar estado.

Resultado esperado:

```text
SUPABASE
✓ Producto
✓ SKU
✓ Precios
✓ Imágenes
✓ Categoría
✓ ghl_product_id
✓ ghl_price_id

GHL
✓ Producto
✓ Precios
✓ Categoría/collection
✓ Media cuando corresponda

WEB
✓ Producto visible si está activo
```

---

# 20. UPDATE

Editar debe:

- actualizar Supabase;
- actualizar GHL;
- conservar el mismo ghl_product_id;
- conservar los price IDs cuando corresponda;
- crear los nuevos precios;
- actualizar los existentes;
- eliminar correctamente los eliminados;
- sincronizar imágenes;
- sincronizar categoría;
- actualizar activo.

Nunca crear un segundo producto por editar uno existente.

---

# 21. DELETE

Eliminar desde el panel debe sincronizarse.

Antes de borrar:

- comprobar dependencias;
- comprobar pedidos históricos;
- proteger referencias históricas.

Si una eliminación física rompe información histórica, utilizar desactivación/archivado.

La decisión debe basarse en la arquitectura real encontrada en el repositorio.

Cuando sea seguro eliminar:

```text
PANEL
 ↓
BACKEND
 ↓
SUPABASE
 ↓
GHL
```

Evitar dejar registros huérfanos.

---

# 22. ACTIVAR / DESACTIVAR

El panel debe permitir activar/desactivar.

Al desactivar:

```text
is_active = false
```

El catálogo público no debe mostrar el producto.

La representación correspondiente en GHL debe actualizarse según lo que soporte la integración actual.

Al reactivar:

```text
is_active = true
```

y debe volver a estar disponible en el catálogo.

---

# 23. Catálogo público

Actualmente existen productos reales directamente en el código.

Eso debe desaparecer.

El catálogo debe consultar Supabase.

Conceptualmente:

```text
CATÁLOGO
   |
   v
SUPABASE
   |
   v
PRODUCTOS ACTIVOS
   |
   v
RENDER
```

Debe utilizar:

- nombre;
- descripción;
- categoría;
- precios/opciones;
- imagen primaria;
- imágenes adicionales cuando corresponda.

Eliminar los arrays/listas hardcodeadas únicamente después de comprobar que el catálogo obtiene correctamente los datos de Supabase.

No romper:

- filtros;
- búsqueda;
- categorías;
- carrito;
- checkout;
- navegación;
- responsive;
- Condolencias.

---

# 24. Condolencias y nuevo modelo

Condolencias debe continuar funcionando.

Si utiliza una estructura antigua, migrarla al nuevo modelo cuando sea necesario.

No crear una arquitectura especial paralela solamente para Condolencias si puede funcionar con el modelo común.

La excepción es conservar cualquier comportamiento específico de negocio que realmente necesite.

---

# 25. Limpieza de Supabase

Los productos antiguos de GHL ya fueron eliminados manualmente.

En Supabase existen productos antiguos que ya no se quieren conservar, excepto Condolencias.

Antes de eliminar:

- identificar registros;
- identificar Condolencias;
- identificar referencias;
- identificar pedidos;
- identificar imágenes;
- identificar relaciones;
- evitar huérfanos.

No ejecutar:

```sql
DELETE FROM products;
```

sin comprobar qué consecuencias tiene.

La migración debe ser segura.

Debe quedar documentado:

- qué tablas se modifican;
- qué columnas se eliminan;
- qué columnas se crean;
- qué registros se eliminan;
- qué registros se conservan;
- qué relaciones se crean;
- qué índices se crean;
- qué constraints se crean.

---

# 26. Migraciones

Antes de crear una tabla nueva, comprobar si ya existe una tabla equivalente.

No duplicar estructuras.

Reutilizar las existentes cuando tenga sentido.

Si se cambia el esquema:

- crear migración reproducible;
- mantener integridad referencial;
- añadir foreign keys;
- añadir índices;
- añadir unique constraints;
- adaptar RLS;
- adaptar queries;
- adaptar APIs.

El SKU debe tener UNIQUE.

Las imágenes deben tener FK hacia producto.

Los precios deben tener FK hacia producto.

Las categorías deben tener FK o relación equivalente.

---

# 27. Seguridad

La integración GHL debe ser segura.

No exponer al cliente:

- API keys;
- access tokens;
- refresh tokens;
- credenciales;
- secretos.

Las operaciones sensibles deben realizarse en backend/server-side.

Validar datos:

- frontend;
- backend.

Comprobar autorización del usuario administrador.

Revisar:

- Supabase RLS;
- endpoints;
- server actions;
- middleware;
- permisos;
- variables de entorno.

No introducir secretos en:

- código;
- logs;
- errores;
- respuestas públicas;
- sync_error.

---

# 28. Experiencia de administración

El administrador no debería tener que conocer:

- ghl_product_id;
- ghl_price_id;
- IDs de Supabase;
- collection IDs;
- IDs internos de imágenes.

Todo debe manejarse automáticamente.

El flujo de usuario debe ser:

```text
Productos
   ↓
Nuevo producto
   ↓
Nombre
Descripción
Categoría
Opciones
Imágenes
   ↓
Guardar producto
```

Después:

**Producto creado correctamente**

y:

**Sincronizado con GoHighLevel**

si corresponde.

Si GHL falla:

**Producto guardado, pero la sincronización con GoHighLevel requiere atención.**

Con posibilidad de reintento.

---

# 29. Estado de sincronización en el panel

En la lista de productos puede ser útil mostrar:

- Sincronizado.
- Pendiente.
- Error.

Por ejemplo:

```text
Ramo Primavera
SKU: RAM-000001
✓ Sincronizado
```

o:

```text
Ramo Primavera
SKU: RAM-000001
⚠ Error de sincronización
```

Esto es recomendable para que el administrador pueda detectar problemas.

---

# 30. Validaciones

Validar como mínimo:

- nombre obligatorio;
- categoría válida;
- precio válido;
- descuento válido;
- stock válido si existe;
- máximo 10 imágenes;
- URL válida cuando se utiliza URL;
- una única imagen primaria;
- SKU único;
- opción válida;
- permisos administrativos.

No confiar exclusivamente en validación frontend.

---

# 31. Imágenes: comportamiento esperado

Ejemplo:

```text
Imágenes del producto 4/10

[ Imagen 1 ★ ] [ Imagen 2 ] [ Imagen 3 ] [ Imagen 4 ]

[ + Añadir imagen ]
```

Opciones:

- Upload.
- URL.

El administrador puede:

- eliminar;
- ordenar;
- elegir primaria.

Si se elimina la primaria y quedan imágenes:

la aplicación debe elegir una nueva primaria de forma segura o solicitar selección.

Nunca debe quedar una situación inválida con múltiples primarias.

---

# 32. Reutilización de componentes

Evita duplicar la lógica entre:

- Nuevo Producto;
- Editar Producto.

Crear componentes reutilizables cuando corresponda.

Especialmente:

- ProductForm;
- ProductPricesEditor;
- ProductImagesEditor;
- CategorySelector;
- SyncStatus.

La arquitectura concreta puede adaptarse al proyecto.

No sobreingenierizar si el repositorio tiene una convención más sencilla.

---

# 33. No modificar innecesariamente otras partes

No hagas una reescritura completa de la aplicación.

Mantén funcionando:

- autenticación;
- usuarios;
- pedidos;
- carrito;
- checkout;
- Condolencias;
- navegación;
- otras funcionalidades no relacionadas.

Modifica lo necesario para integrar correctamente el nuevo sistema.

---

# 34. Compatibilidad con pedidos históricos

Antes de eliminar productos:

comprueba si los pedidos guardan:

- product_id;
- product snapshot;
- nombre;
- precio;
- SKU;
- referencias.

Si los pedidos dependen de `product_id`, no rompas sus referencias.

Si la aplicación necesita mantener un producto histórico, utilizar:

- soft delete;
- archived;
- is_active=false;

o la estrategia que mejor encaje con el modelo existente.

La integridad histórica tiene prioridad sobre una limpieza física innecesaria.

---

# 35. Criterio de éxito funcional

El trabajo solamente se considera terminado si se puede hacer:

1. Entrar al panel.
2. Pulsar Nuevo producto.
3. Introducir nombre.
4. Introducir descripción.
5. Elegir categoría.
6. Ver SKU generado.
7. Añadir una opción.
8. Añadir varias opciones.
9. Añadir descuento.
10. Añadir stock.
11. Subir imágenes.
12. Añadir URLs de imágenes.
13. Tener hasta 10 imágenes.
14. Elegir primaria.
15. Ordenar imágenes.
16. Guardar.

Después debe comprobarse:

## Supabase

- producto creado;
- SKU;
- categoría;
- precios;
- imágenes;
- estado;
- GHL product ID;
- GHL price IDs.

## GHL

- producto creado;
- precios creados;
- categoría/collection;
- media cuando corresponda.

## Web

- producto aparece;
- datos correctos;
- imagen primaria correcta;
- catálogo proveniente de Supabase.

---

# 36. Pruebas obligatorias

Realizar pruebas reales o automatizadas cuando la arquitectura lo permita.

### Creación

- producto con una opción;
- producto con múltiples opciones;
- producto sin stock;
- producto con una imagen;
- producto con múltiples imágenes;
- producto con 10 imágenes;
- intento de 11 imágenes;
- URLs;
- SKU automático.

### Edición

- nombre;
- descripción;
- categoría;
- precio;
- descuento;
- stock;
- nueva opción;
- eliminación de opción;
- imagen;
- eliminación de imagen;
- primaria;
- orden.

### Estado

- desactivar;
- activar.

### Eliminación

- eliminar producto seguro;
- comprobar GHL;
- comprobar Supabase;
- comprobar catálogo.

### Sincronización

- creación;
- actualización;
- eliminación;
- reintento;
- fallo GHL;
- prevención de duplicados.

### Catálogo

- consulta Supabase;
- filtros;
- búsqueda;
- categorías;
- carrito;
- checkout;
- Condolencias.

---

# 37. Pruebas de concurrencia e idempotencia

Siempre que sea razonable, comprobar:

- doble clic;
- doble petición;
- reintento;
- timeout después de crear GHL;
- respuesta de GHL perdida;
- petición repetida.

El resultado no debe generar duplicados.

Si existe una ventana en la que GHL crea el producto pero la aplicación no recibe la respuesta, debe existir una estrategia razonable de recuperación utilizando identificadores o comprobación segura antes de crear otro producto.

---

# 38. Integración GHL

No asumas que todos los recursos de GHL funcionan exactamente igual.

Comprueba la documentación/API/SDK que utiliza el proyecto.

Determina correctamente:

- creación de producto;
- actualización;
- eliminación;
- precios;
- collections;
- media;
- inventario si aplica.

Respeta los scopes requeridos.

No inventes endpoints.

Si el proyecto ya tiene una integración funcional, reutilízala cuando sea correcta.

Si está mal diseñada, refactorízala.

---

# 39. Fuente de verdad

Para evitar ambigüedad:

## Administrador

Gestiona productos desde:

**Panel Admin**

## Aplicación

Obtiene catálogo desde:

**Supabase**

## Sincronización externa

Gestiona representación externa en:

**GHL**

No permitir que el catálogo público dependa de datos hardcodeados.

No crear una segunda base de productos paralela.

---

# 40. Resultado visual esperado

El formulario debe ser limpio.

Conceptualmente:

```text
NUEVO PRODUCTO

Información básica
────────────────────────────────

Nombre *
[_______________________________]

Descripción
[_______________________________]

Categoría *
[_______________________________]

Producto activo
[ ✓ ]

SKU
RAM-000001
(solo lectura)


Opciones / precios
────────────────────────────────

Nombre      Precio    Desc.    Stock

Básico      30 €      0%       —
Premium     45 €      10%      5

[ + Agregar opción ]


Imágenes del producto
────────────────────────────────

4/10

[ IMG ] [ IMG ] [ IMG ] [ IMG ]

[ Seleccionar imágenes ]

Añadir URL:
[______________________________]
[ + Añadir URL ]


[ GUARDAR PRODUCTO ]
```

No mostrar Metadata (Supabase) si no es funcionalmente necesaria.

---

# 41. Eliminaciones definitivas esperadas

Después de la implementación, si la auditoría confirma que no son necesarias, NO deben quedar:

- productos reales hardcodeados;
- SKU manual;
- precio máximo independiente;
- URL de imagen independiente;
- Metadata (Supabase);
- formularios separados para cada imagen;
- estructura image1/image2/image3;
- lógica de creación manual obligatoria en GHL.

---

# 42. Flujo definitivo esperado

## Crear

```text
ADMIN
  ↓
Nuevo producto
  ↓
Validación
  ↓
Backend
  ↓
Supabase + GHL
  ↓
IDs sincronizados
  ↓
Producto disponible
```

## Editar

```text
ADMIN
  ↓
Editar
  ↓
Backend
  ↓
Supabase + GHL
  ↓
Actualización
```

## Eliminar

```text
ADMIN
  ↓
Eliminar
  ↓
Backend
  ↓
Comprobar dependencias
  ↓
Supabase + GHL
```

## Catálogo

```text
SUPABASE
  ↓
Productos activos
  ↓
Catálogo público
```

---

# 43. Prioridad de decisiones

Si durante la implementación aparece un conflicto, priorizar en este orden:

1. Integridad de datos.
2. Seguridad.
3. No romper pedidos históricos.
4. No romper Condolencias.
5. Sincronización correcta Supabase/GHL.
6. Eliminación de duplicaciones.
7. Catálogo dinámico.
8. Experiencia del administrador.
9. Diseño visual.

No sacrificar integridad de datos por terminar más rápido.

---

# 44. Libertad técnica

La estructura descrita aquí es el objetivo funcional y conceptual.

Puedes adaptar:

- nombres de tablas;
- nombres de columnas;
- servicios;
- endpoints;
- patrones de arquitectura;
- hooks;
- server actions;
- repositories;
- validadores;

a las convenciones reales del proyecto.

No fuerces una tecnología nueva si el proyecto ya tiene una solución adecuada.

No introduzcas dependencias innecesarias.

Reutiliza lo que ya funciona.

---

# 45. Implementación autónoma

No es necesario pedir confirmación después de cada pequeño cambio.

Después de auditar el proyecto, implementa de forma autónoma todo lo necesario para alcanzar el objetivo.

Sin embargo, antes de una operación destructiva importante:

- identifica los datos afectados;
- comprueba dependencias;
- protege Condolencias;
- protege pedidos históricos;
- utiliza migraciones seguras.

Si existe una ambigüedad que puede provocar pérdida de datos, no adivines.

En ese caso, detén únicamente esa operación concreta y explica exactamente qué información falta.

Para cambios normales y no destructivos, procede autónomamente.

---

# 46. Verificación final

Antes de declarar el trabajo terminado, realiza una revisión del repositorio buscando:

- productos hardcodeados restantes;
- Metadata antigua;
- campos obsoletos;
- queries antiguas;
- APIs antiguas;
- componentes duplicados;
- endpoints inseguros;
- tokens expuestos;
- referencias a tablas antiguas;
- referencias a columnas eliminadas;
- imágenes almacenadas de forma antigua;
- SKU manual;
- precio máximo;
- URL de imagen individual.

También ejecuta:

- lint;
- typecheck;
- tests;
- build;

si el proyecto dispone de ellos.

Corrige los errores introducidos por esta implementación.

---

# 47. Informe final requerido

Cuando termines, NO respondas simplemente "hecho".

Entrega un informe concreto con:

## A. Auditoría

Qué encontraste en el proyecto.

## B. Base de datos

Qué tablas se modificaron.

Qué tablas se crearon.

Qué columnas se eliminaron.

Qué columnas se añadieron.

Qué migraciones se aplicaron.

## C. Productos

Cómo quedó el modelo.

## D. SKU

Cómo se genera y cómo se garantiza la unicidad.

## E. Precios

Cómo funcionan las opciones.

## F. Imágenes

Cómo se almacenan.

Cómo funciona el máximo de 10.

Cómo funciona la primaria.

## G. GHL

Cómo se sincroniza.

Qué IDs se guardan.

## H. Metadata

Qué ocurrió con:

- Etiqueta destacada;
- Incremento rosas;
- Colores;
- Solo bajo presupuesto.

Explicar si se eliminaron y por qué.

## I. Condolencias

Explicar cómo se protegieron y si fue necesario migrarlas.

## J. Catálogo

Explicar cómo dejó de depender de productos hardcodeados.

## K. Seguridad

Explicar cómo se protegieron las credenciales y operaciones GHL.

## L. Pruebas

Indicar qué pruebas se ejecutaron y sus resultados.

## M. Pendientes

Indicar únicamente problemas reales que todavía queden.

---

# 48. Definición final del sistema

La implementación final debe permitir que una persona sin conocimientos técnicos pueda hacer:

```text
Panel Admin
   ↓
Productos
   ↓
Nuevo producto
   ↓
Nombre
Descripción
Categoría
Precios
Imágenes
   ↓
Guardar
```

Y automáticamente:

```text
             PANEL ADMIN
                   |
                   v
                BACKEND
                 /    \
                /      \
               v        v
          SUPABASE     GHL
               |
               v
          CATÁLOGO WEB
```

Sin editar código.

Sin crear manualmente el producto en GHL.

Sin copiar productos entre sistemas.

Sin introducir SKU manualmente.

Sin gestionar diez campos de imágenes separados.

Sin Metadata innecesaria.

Sin duplicar estructuras de creación y edición.

Sin productos reales hardcodeados.

Manteniendo Condolencias.

Manteniendo pedidos históricos.

Manteniendo seguridad.

Manteniendo integridad de datos.

Este es el estado final que debe alcanzar el proyecto.
