# BLOQUEADORES IDENTIFICADOS - GHL INTEGRACIÓN

## Fecha: 2026-08-31

## Status: CRÍTICO - Impide que GHL sea la fuente única de verdad

### 1. API v3 No Persiste Categoría

**Problema:** Cuando se crea un producto vía POST /products con `category: "ramos"`, GHL no lo guarda.

- Productos creados: ✓ Se crean correctamente por ID/nombre
- Categoría guardada: ✗ Se guarda como vacío
- Precio guardado: ✗ Se guarda como 0

**Intento:**

```javascript
POST /products/?locationId=...
{
  name: "TEST - Ramo Silvestre",
  category: "ramos",
  price: 35,
  productType: "PHYSICAL"
}
```

**Resultado:**

```javascript
{
  id: "6a9560bcc330eca0575c4b20",
  name: "TEST - Ramo Silvestre",
  category: "",  // ✗ Not saved
  price: 0       // ✗ Not saved
}
```

**Impacto:** Sin categoría, los productos no pueden ser filtrados públicamente.
**Solución requerida:**

- ¿GHL requiere collectionIds en lugar de category?
- ¿El token necesita permisos elevados?
- ¿Existe un endpoint diferente para categorizar?

### 2. API v3 No Permite Editar Productos

**Problema:** Ningún endpoint PUT funciona para actualizar productos existentes.

**Intentos:**

- `PUT /locations/{locationId}/products/{productId}` → 404 Not Found
- `PUT /products/{productId}?locationId=...` → 422 Unprocessable Entity
- `PUT /products/{productId}` → 422 Unprocessable Entity

**Impacto:** Una vez creado, un producto no se puede editar vía API.
**Solución requerida:**

- ¿Existe un endpoint correcto para PUT?
- ¿El token tiene permisos limitados?

### 3. Sin Acceso a Product Collections

**Problema:** El endpoint de Collections requiere permisos que este token no tiene.

**Intentos:**

- `GET /products/collections/?locationId=...` → 401 Unauthorized
- `GET /collections/?locationId=...` → Malformed response

**Impacto:** No se pueden:

- Asignar productos a colecciones (categorías en GHL)
- Validar o gestionar colecciones existentes

**Solución requerida:**

- Token necesita permisos elevados
- O este token está limitado a lectura de productos solo

### 4. Catálogo Estático No Sincronizado

**Estado Actual:**

- GHL: 7 productos (1 original "pepito" + 5 test + 1 test de prueba)
  - Todos sin categoría válida
  - Todos con precio = 0
- catalog.ts: 46 productos (bien estructurados)

**Inconsistencia:**

- Admin ve GHL (7 productos)
- Público ve catalog.ts (46 productos)
- NO hay sincronización entre ambos

### 5. Supabase product_metadata Vacío

**Estado:**

- Tabla creada pero sin registros
- No hay sincronización automática
- Metadata no se persiste entre ediciones

## RECOMENDACIONES

### A Corto Plazo (Pragmático)

1. **Usa catalog.ts como fuente de verdad** para catálogo público
   - Ya tiene 46 productos bien estructurados
   - Funciona correctamente
   - Evita cambios de comportamiento

2. **Para admin:**
   - Mostrar productos de GHL (si existen)
   - Permitir crear nuevos que van a GHL
   - Permitir crear en catálogo estático que se sincroniza a GHL

3. **Sincronización:**
   - Cuando se crea en admin, guardar en AMBOS (GHL + catalog.ts + metadata)
   - Cuando se edita en admin, sincronizar a GHL
   - Supabase como fuente de metadata enriquecida

### B Medio Plazo (Ideal)

1. Contactar a HighLevel para:
   - Aumentar permisos del token
   - Confirmar si la API v3 soporta categoría/precio en POST
   - Obtener endpoint correcto para editar

2. Migrar 46 productos de catalog.ts a GHL:
   - Crear todos con categorías correctas
   - Asignar a Product Collections adecuadas
   - Guardar IDs de mapeo en Supabase

3. Implementar sincronización bidireccional real

### C Largo Plazo

1. GHL como verdadera fuente de verdad
2. catalog.ts solo como fallback local
3. Metadata sincronizada en tiempo real

## ACCIÓN ACTUAL

- ✓ 5 productos de prueba creados en GHL
- ✓ Build sin errores
- ✓ Documentados bloqueadores
- ⏳ Implementar solución pragmática (consistent catalog + fallback)
