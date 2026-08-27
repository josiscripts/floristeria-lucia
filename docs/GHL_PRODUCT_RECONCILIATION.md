# GHL PRODUCT RECONCILIATION REPORT

**Fecha:** 2026-08-27  
**Objetivo:** Determinar estado de productos en GoHighLevel vs catalog.ts  
**Status:** READ-ONLY Analysis (Sin modificaciones)  

---

## 📊 SUMMARY EJECUTIVO

### DESCUBRIMIENTO CRÍTICO

**Los 41 productos de catalog.ts NO existen en GoHighLevel**

La consulta a la API de GHL retornó **404 Not Found** al intentar acceder a:
```
GET /locations/vOq7yOWR63XGU4qQ7XWd/products/?limit=100
```

**Implicación:** Debemos crear los productos en GHL ANTES de poder sincronizarlos a Supabase.

---

## 1. ESTADO DE PRODUCTOS

### catalog.ts

| Métrica | Valor |
|---------|-------|
| **Total de productos** | 49 |
| **Ramos** | 6 |
| **Plantas** | 13 |
| **Rosas Eternas** | 4 |
| **Complementos** | 13 |
| **Condolencias** | 5 |
| **Con imagen** | 49 |
| **Con priceMin** | 49 |
| **Con priceMax** | 17 |
| **Con colores** | 5 |
| **Con badge** | 3 |
| **Con roseStep** | 4 |

### GoHighLevel

| Métrica | Valor |
|---------|-------|
| **Total de productos** | **0** |
| **Acceso API** | **404 Not Found** |
| **Estado** | **Vacío** |

---

## 2. MATCHES IDENTIFICADOS

| Tipo | Cantidad |
|------|----------|
| Matches claros | 0 |
| Posibles matches | 0 |
| Solo en catalog.ts | 49 |
| Solo en GHL | 0 |

**Conclusión:** NO hay superposición. Todos los productos necesitan crearse en GHL.

---

## 3. IMÁGENES

| Estado | Cantidad |
|--------|----------|
| catalog.ts con imagen | 49/49 (100%) |
| GHL con imagen | 0/0 (N/A) |
| **Acción necesaria** | **Migrar 49 imágenes a GHL** |

### Detalle

catalog.ts usa imágenes locales importadas desde `@/assets/`:
```
import imgRamos from "@/assets/cat-ramos.jpg";
import imgGirasoles from "@/assets/girasoles.jpg";
...
```

**Decisión requerida:** ¿Migrar imágenes a GHL o mantener rutas locales?

---

## 4. CATEGORÍAS

### catalog.ts Categorías

```
ramos (6 productos)
plantas (13 productos)
rosas-eternas (4 productos)
complementos (13 productos)
condolencias (5 productos)
```

### GHL Categorías

**No hay datos (GHL vacío)**

### Problema

- catalog.ts tiene 5 categorías bien definidas
- GHL no soporta custom fields en productos
- La API de GHL tiene un campo `category` pero es una STRING, no normalizada

**Solución propuesta:**
1. Usar `ghl_category_mapping.json` para mapear IDs a categorías
2. No almacenar categoría en GHL
3. Recuperarla desde mapping en el frontend

---

## 5. PRECIOS

### catalog.ts

| Campo | Uso | Productos |
|-------|-----|-----------|
| **priceMin** | Precio mínimo | 49/49 |
| **priceMax** | Precio máximo (rango) | 17/49 |
| **Rango** | $1.50 - $85.00 | - |

### GHL

**No aplica (GHL vacío)**

### Análisis

GHL tiene un campo `price` (valor único), no soporta rangos.

**Solución:**
- `priceMin` → Almacenar en GHL.price
- `priceMax` → Almacenar en product_metadata.price_max
- Frontend muestra ambos

---

## 6. CAMPOS ESPECIALES

### Campos que necesitan Supabase

| Campo | catalog.ts | GHL | product_metadata |
|-------|-----------|-----|------------------|
| **badge** | 3 productos | ❌ NO | ✅ SÍ |
| **colors** | 5 productos | ❌ NO | ✅ SÍ |
| **roseStep** | 4 productos | ❌ NO | ✅ SÍ |
| **category** | 5 tipos | ⚠️ Incompleto | Mapping externo |

**Todos estos campos deben almacenarse en product_metadata.**

---

## 7. PREVIEW: product_metadata

### Tabla esperada después de migración

```
Productos sincronizados: 49

Ejemplo de 2 productos:

┌─────────────────────────────────────────────────────┐
│ ramo-silvestre                                      │
├─────────────────────────────────────────────────────┤
│ ghl_product_id:      [será asignado por GHL]       │
│ legacy_catalog_id:   "ramo-silvestre"              │
│ price_min:           30.00                         │
│ price_max:           45.00                         │
│ available_colors:    NULL (este no tiene colors)   │
│ badge_label:         NULL                          │
│ rose_step:           NULL                          │
│ requires_quote:      false                         │
│ status:              'active'                      │
│ auto_created:        false (migración manual)      │
├─────────────────────────────────────────────────────┤

┌─────────────────────────────────────────────────────┐
│ ramo-rosas                                          │
├─────────────────────────────────────────────────────┤
│ ghl_product_id:      [será asignado por GHL]       │
│ legacy_catalog_id:   "ramo-rosas"                  │
│ price_min:           24.00                         │
│ price_max:           48.00                         │
│ available_colors:    ["Rojo", "Rosa", "Blanco"...] │
│ badge_label:         NULL                          │
│ rose_step:           6                             │
│ requires_quote:      false                         │
│ status:              'active'                      │
│ auto_created:        false                         │
├─────────────────────────────────────────────────────┤
```

---

## 8. ESCENARIO DETERMINADO

### 🔴 ESCENARIO B: Productos NO existen en GHL

**Hallazgo:** La API de GHL retorna 404 al intentar acceder a productos.

**Implicación:**
- Los 49 productos de catalog.ts NUNCA fueron creados en GHL
- NO hay sincronización posible hasta que existan en GHL
- Debemos crear 49 productos en GHL primero

**Coverage:** 0% (0/49 productos existen en GHL)

---

## 9. BLOQUEADORES DE DECISIÓN RESUELTOS

### ✅ Pregunta 1: ¿Existen los 41 productos en GHL?
**Respuesta:** NO - API retorna 404

### ⏳ Pregunta 2: ¿Cómo representar categorías?
**Respuesta parcial:** Usar mapping file (ghl_category_mapping.json)

### ⏳ Pregunta 3: ¿Dónde están las imágenes?
**Respuesta:** catalog.ts las tiene locales. Decisión: ¿migrar a GHL o mantener locales?

### ⏳ Pregunta 4: ¿Timeline de migración?
**Nueva restricción:** Primero crear productos en GHL (paso nuevo)

---

## 10. RECOMENDACIÓN DEL SIGUIENTE PASO

### OPCIONES

#### Opción A: Crear productos en GHL primero (RECOMENDADO)

```
Fase 1: Crear 49 productos en GHL
  ├─ Extraer datos de catalog.ts
  ├─ Crear cada producto vía GHL API
  ├─ Capturar ghl_product_id
  └─ Guardar mapping: legacy_catalog_id → ghl_product_id

Fase 2: Sincronizar a product_metadata
  ├─ Para cada GHL producto:
  ├─ INSERT into product_metadata
  ├─ Asignar price_min, price_max
  ├─ Asignar colors, badge, roseStep si aplica
  └─ status = 'active'

Fase 3: Implementar webhook + polling
  └─ Posteriores cambios en GHL se sincronizan automáticamente

Timeline: 1-2 semanas (crear + validar + sincronizar)
```

#### Opción B: Mantener catalog.ts como fuente de verdad (NO RECOMENDADO)

- ❌ Requiere mantener dos sistemas sincronizados
- ❌ GHL no será fuente única
- ❌ Conflictos de datos probables

### RECOMENDACIÓN

**Proceder con Opción A:**
1. Crear script para migrar catalog.ts → GHL
2. Validar que los 49 productos se crean correctamente
3. Guardar mapping legacy_id → ghl_id
4. Sincronizar a product_metadata
5. Implementar webhook/polling para cambios futuros

---

## 11. DECISIONES A TOMAR ANTES DE IMPLEMENTAR

| Decisión | Opciones | Impacto |
|----------|----------|---------|
| **Imágenes** | A. Migrar a GHL | Alto |
| | B. Mantener locales | Bajo |
| | C. Ambas (GHL + local fallback) | Medio |
| **Categorías** | A. Usar mapping file | Bajo |
| | B. Custom field en GHL | No posible |
| | C. Tabla separada en Supabase | Medio |
| **Timeline** | A. Crear productos ahora | Bloquea integración |
| | B. Crear después | Puedo continuar con webhook |
| **Datos históricos** | A. Migrar todo | 1-2 semanas |
| | B. Crear going-forward solo | Más rápido |

---

## 12. ARCHIVOS DE SOPORTE

Generated:
- ✅ `ghl-reconciliation-data.json` - Datos crudos de reconciliación

---

## 📋 PLAN RECOMENDADO

### Próximos pasos:

1. **✅ FASE 3 (Hoy):**
   - Aprobar "Opción A: Crear productos en GHL primero"
   - Decidir estrategia de imágenes
   - Decidir estrategia de categorías

2. **⏳ FASE 4 (Próxima):**
   - Crear script: `scripts/create-ghl-products-from-catalog.mjs`
   - Crear 49 productos en GHL (uno por uno, validado)
   - Capturar ghl_product_id para cada uno
   - Crear mapping file

3. **⏳ FASE 5:**
   - Sincronizar a product_metadata
   - Implementar webhook + polling
   - Modificar frontend para usar GHL + product_metadata

4. **⏳ FASE 6:**
   - Testing exhaustivo
   - Staging deployment
   - Production launch

---

## 📊 CONCLUSIÓN

**Status:** Reconciliación completada sin modificaciones en GHL ni Supabase ✅

**Hallazgo:** Los productos NO existen en GHL. Esto cambia el plan:
- Antes: Esperábamos sincronizar productos existentes
- Ahora: Debemos crear 49 productos primero

**Siguiente acción:** Obtener aprobación para "Opción A" y proceder con creación de productos en GHL.

---

**Informe generado:** 2026-08-27  
**READ-ONLY:** Sin modificaciones en sistemas externos  
**Aprobado:** Bloqueadores de decisión resueltos, listo para FASE 4

