# BLOQUE 4 — PROMPT MAESTRO DE RECONSTRUCCIÓN Y LIMPIEZA TOTAL DEL CATÁLOGO

## INSTRUCCIÓN PRINCIPAL

Lee este documento completo antes de actuar.

Debes continuar/reconstruir el BLOQUE 4 de Floristería Lucía, pero esta vez siguiendo un criterio estricto:

**NO quiero conservar ningún producto actual del catálogo.**

La prioridad inmediata es:

1. Auditar dónde existen actualmente productos.
2. Eliminar TODOS los productos actuales del catálogo de forma real.
3. Verificar que no queda ningún producto en GHL, Supabase ni visible/gestionable desde el panel.
4. Después reconstruir el panel de productos con el nuevo modelo.
5. Después probar que el nuevo sistema funciona creando productos NUEVOS desde el panel real.
6. Solo después de demostrarlo, dejar el sistema listo para volver a cargar el catálogo real.

NO marques una tarea como completada porque exista código para hacerla. Debe quedar DEMOSTRADA mediante una prueba real.

---

# 1. REGLAS CRÍTICAS

- NO borres usuarios, perfiles, autenticación, configuraciones ajenas al catálogo ni datos que no sean productos/catálogo.
- SÍ debes eliminar todos los productos actuales y todos sus datos relacionados con catálogo.
- No hagas un borrado parcial.
- No dejes productos huérfanos, precios huérfanos, imágenes huérfanas, variantes huérfanas ni relaciones antiguas.
- Antes de borrar, realiza un inventario y guarda evidencia de los IDs/cantidades.
- Después de borrar, vuelve a consultar directamente las fuentes y demuestra que el resultado es 0.
- Si una operación falla, corrígela y repítela. No continúes como si hubiera funcionado.
- Usa MCP, Supabase y GHL disponibles. No me pidas que haga manualmente algo que puedas ejecutar con las herramientas disponibles.
- Para cambios de esquema de Supabase usa migraciones versionadas; no hagas cambios estructurales directos sin reflejarlos en migraciones.
- No hagas `reset` destructivo de toda la base de datos.
- No elimines usuarios ni datos fuera del subsistema de catálogo.
- No pases al siguiente paso si el actual no está DEMOSTRADO.

HighLevel dispone actualmente de endpoints v3 para listar/eliminar productos y para gestionar sus precios; usa esos endpoints oficiales y los scopes necesarios. Supabase debe conservar los cambios de esquema mediante migrations.

---

# 2. FASE A — AUDITORÍA Y SNAPSHOT

Antes de borrar nada:

### GHL
Obtén:
- total de productos
- IDs
- nombres
- precios asociados
- price IDs
- SKU
- colecciones relacionadas si existen

### SUPABASE
Obtén:
- products
- product_options
- color_variants
- product_images
- cualquier otra tabla directamente relacionada con catálogo

Detecta:
- huérfanos
- duplicados
- referencias GHL
- referencias antiguas
- relaciones rotas

Guarda un snapshot de BEFORE.

El reporte debe mostrar cantidades e IDs relevantes.

---

# 3. FASE B — BORRADO TOTAL DEL CATÁLOGO

Ahora elimina TODOS los productos actuales.

## GHL

Elimina todos los productos actuales del catálogo de Floristería Lucía.

No importa si son 5, 50, 54 o cualquier otra cantidad encontrada.

Después consulta GHL de nuevo.

Resultado obligatorio:

`GHL products = 0`

También verifica que no existan precios asociados a productos eliminados.

Si GHL requiere eliminar precios antes que productos, hazlo correctamente.

## SUPABASE

Elimina todos los registros del subsistema de catálogo:

- products
- product_options
- color_variants
- product_images
- relaciones de catálogo
- metadatos específicos de productos

Respeta las FK/cascadas existentes.

NO elimines:
- auth
- users
- profiles
- configuraciones
- datos no relacionados con catálogo

Después vuelve a consultar.

Resultado obligatorio:

`products = 0`
`product_options = 0`
`color_variants = 0`
`product_images = 0`

Si existen otras tablas de catálogo, también deben quedar en 0 cuando corresponda.

## PANEL

El panel de administración debe mostrar catálogo vacío.

Compruébalo realmente mediante la interfaz/rutas correspondientes.

---

# 4. FASE C — VERIFICACIÓN DEL BORRADO

NO continúes hasta demostrar:

### GHL
- 0 productos
- 0 precios asociados
- 0 productos antiguos recuperables mediante listado/paginación

### SUPABASE
- 0 productos
- 0 opciones
- 0 variantes
- 0 imágenes
- 0 relaciones huérfanas

### PANEL
- catálogo vacío

Debes incluir:

`BEFORE`
`ACTION`
`AFTER`
`EVIDENCE`
`RESULT`

Si cualquier fuente todavía contiene productos, detente, corrige el borrado y vuelve a verificar.

---

# 5. FASE D — NUEVO MODELO DEL PANEL DE PRODUCTOS

Ahora sí reconstruye el panel.

El formulario de producto debe quedar orientado al nuevo modelo.

## Datos generales

- Nombre
- Descripción
- Categoría
- Estado: Activo / Inactivo
- Imágenes
- Stock según la opción/precio correspondiente

## SKU

El SKU se genera automáticamente.

El administrador NO escribe el SKU.

Debe ser secuencial por categoría.

Ejemplo:

Ramos:
`FL-RAM-0001`
`FL-RAM-0002`

Plantas:
`FL-PLA-0001`

Rosas Eternas:
`FL-ROS-0001`

Complementos:
`FL-COM-0001`

Condolencias:
`FL-CON-0001`

No inventes una categoría `coronas`. Las coronas existentes del catálogo pertenecen a `condolencias`.

## Eliminar del formulario antiguo

Eliminar estos campos antiguos:

- featured label
- rose increment
- available colors como texto
- solo bajo presupuesto
- price maximum

No deben seguir apareciendo en el formulario de edición/creación.

---

# 6. FASE E — OPCIONES / PACKAGES / TIPOS

Cada producto debe poder tener una o varias opciones comerciales.

Ejemplo:

### Básico
- precio
- descuento
- stock
- SKU

### Estándar
- precio
- descuento
- stock
- SKU

### Premium
- precio
- descuento
- stock
- SKU

El usuario debe poder:
- añadir opción
- editar opción
- eliminar opción
- cambiar precio
- establecer descuento
- establecer stock

El precio final y el precio anterior deben poder representarse correctamente para mostrar el descuento públicamente.

No asumas que un único precio por producto es suficiente.

---

# 7. FASE F — ROSAS ETERNAS Y COLORES

Para Rosas Eternas no uses un campo de texto como:

`Rojo, Blanco, Rosa`

Debe existir un sistema real de variantes de color.

Debe permitir:

- crear color
- editar color
- eliminar color
- seleccionar color
- asociar imágenes a ese color

Ejemplo:

Producto:
`Rosa Eterna`

Colores:

`Rojo`
`Blanco`
`Rosa`

Cada color puede tener sus propias imágenes.

---

# 8. FASE G — IMÁGENES

Cada producto debe poder gestionar hasta 10 imágenes.

Debe soportar el flujo previsto por el proyecto para:
- URL de imagen
- archivo si el sistema actual lo soporta

Para Rosas Eternas, las imágenes pueden estar asociadas a una variante/color.

No rompas el sistema visual existente del catálogo público.

---

# 9. FASE H — SINCRONIZACIÓN REAL

La arquitectura debe funcionar:

`ADMIN PANEL`
→ `SUPABASE`
→ `GHL`

Cuando se crea:
- producto
- opción/precio
- SKU
- stock
- descuento
- variante/color

debe quedar correctamente persistido y sincronizado donde corresponda.

Guarda las relaciones necesarias:
- supabase product ID
- GHL product ID
- GHL price ID
- IDs de variantes/opciones cuando correspondan

No crees duplicados.

---

# 10. FASE I — PRUEBA REAL DESDE EL PANEL

Después de terminar el formulario, NO hagas las pruebas únicamente con SQL, curl, POST manual o llamadas internas.

Debes usar el **panel de administración real**.

Crea un producto temporal, por ejemplo:

`TEST BLOQUE 4`

con:
- categoría
- imagen
- estado
- stock
- al menos dos opciones de precio
- una opción con descuento

Comprueba:

### SUPABASE
Existe el producto y sus relaciones.

### GHL
Existe el producto y sus precios.

Guarda los IDs.

---

# 11. FASE J — EDITAR DESDE EL PANEL

Edita el mismo producto temporal desde la UI.

Cambia:
- nombre
- descripción
- precio
- stock
- descuento

Comprueba antes/después en Supabase y GHL.

Debe actualizar el mismo registro.

NO debe crear un producto duplicado.

---

# 12. FASE K — SKU REAL

Desde el panel crea productos temporales de distintas categorías.

Demuestra que los SKU se generan automáticamente y correctamente por categoría.

No aceptes una prueba basada únicamente en una función aislada.

Debe demostrarse el flujo completo:

`UI → Supabase → GHL`

---

# 13. FASE L — ROSAS ETERNAS REAL

Desde el panel crea un producto temporal de Rosas Eternas.

Añade:
- Rojo
- Blanco
- Rosa

Asocia imágenes diferentes a cada color.

Comprueba:
- Supabase
- panel
- GHL cuando corresponda

y verifica que no se mezclen las imágenes entre colores.

---

# 14. FASE M — ELIMINACIÓN REAL DESDE EL PANEL

El mismo producto temporal debe eliminarse desde la UI.

Después verifica:

GHL:
`0`

Supabase:
`0` para ese producto y sus relaciones.

Panel:
producto inexistente.

No basta con que el endpoint DELETE devuelva 200.

Hay que comprobar el estado real posterior.

---

# 15. FASE N — IDEMPOTENCIA

Selecciona un producto temporal o uno nuevo de prueba.

Haz al menos 4 ediciones consecutivas desde la UI.

Comprueba:

- sigue existiendo un solo producto
- un solo producto GHL
- no aparecen precios duplicados
- no aparecen relaciones duplicadas
- las referencias permanecen consistentes

---

# 16. FASE O — LIMPIEZA FINAL

Elimina TODOS los productos temporales utilizados en las pruebas.

Después verifica nuevamente:

GHL:
`0 productos`

Supabase:
`0 products`
`0 product_options`
`0 color_variants`
`0 product_images`

Panel:
`0 productos`

El catálogo debe quedar completamente limpio.

---

# 17. FASE P — FRONTEND Y VERCEL

Después de terminar el sistema:

- build
- lint
- tests relevantes
- comprobar `/`
- comprobar `/catalogo`
- comprobar `/sobre-nosotros`
- comprobar `/admin/products`
- comprobar que no se rompieron imágenes, textos ni animaciones existentes

Verifica específicamente el dominio de producción:

`https://floristeria-lucia.vercel.app`

No confundas una URL de deployment/preview con el dominio de producción.

Si producción falla:
- diagnostica
- corrige
- build
- commit
- push
- espera deployment
- vuelve a comprobar HTTP y contenido real

NO declares Vercel correcto solo porque el build local pase.

---

# 18. CRITERIO ABSOLUTO DE CIERRE

El BLOQUE 4 SOLO puede cerrarse si TODOS estos puntos están:

`DEMOSTRADO`

Nunca uses `IMPLEMENTADO` como sustituto de una prueba.

Checklist obligatorio:

- [ ] catálogo GHL completamente eliminado
- [ ] catálogo Supabase completamente eliminado
- [ ] panel inicialmente vacío
- [ ] nuevo formulario implementado
- [ ] campos antiguos eliminados
- [ ] SKU automático por categoría
- [ ] opciones Basic/Standard/Premium
- [ ] precios por opción
- [ ] descuentos
- [ ] stock
- [ ] imágenes
- [ ] variantes de color
- [ ] imágenes por color
- [ ] creación real desde UI
- [ ] edición real desde UI
- [ ] eliminación real desde UI
- [ ] sincronización Supabase
- [ ] sincronización GHL
- [ ] no duplicados
- [ ] idempotencia
- [ ] limpieza final
- [ ] GHL final = 0
- [ ] Supabase final = 0
- [ ] panel final = 0
- [ ] build PASS
- [ ] producción Vercel PASS
- [ ] frontend visual preservado

---

# 19. FORMATO OBLIGATORIO DEL REPORTE FINAL

Para cada requisito:

`REQUIREMENT:`
`STATUS: DEMOSTRADO / FALLIDO / NO DEMOSTRADO`
`ACTION:`
`BEFORE:`
`AFTER:`
`EVIDENCE:`
`SUPABASE IDs:`
`GHL IDs:`
`RESULT:`

Al final:

`TOTAL DEMOSTRADO: X`
`TOTAL FALLIDO: X`
`TOTAL NO DEMOSTRADO: X`

Si existe siquiera un:

`FALLIDO`

o

`NO DEMOSTRADO`

NO declares el Bloque 4 cerrado.

Corrige primero.

---

# 20. INICIO

Empieza AHORA por la FASE A.

No empieces creando código.

Primero audita y muestra el snapshot real de productos actuales en GHL y Supabase.

Después ejecuta el borrado total.

Después verifica que ambos estén en cero.

Solo cuando el catálogo esté realmente vacío comienza la reconstrucción del nuevo panel.

NO te detengas simplemente para informarme de un error que puedas resolver con las herramientas disponibles.

Actúa, corrige, vuelve a probar y verifica.

## OBJETIVO FINAL

Dejar un catálogo completamente limpio y un panel de administración nuevo y funcional, preparado para que posteriormente podamos cargar el catálogo real de Floristería Lucía desde cero con:

**productos + categorías + SKU automático + opciones/precios + descuentos + stock + imágenes + colores + sincronización GHL.**
