# Diseño del Modelo de Catálogo para GoHighLevel

**Documento:** Análisis Detallado y Propuesta de Esquema  
**Fecha:** 2026-08-26  
**Estado:** Análisis completado - Pendiente aprobación  
**Basado en:** 58 productos actuales en `src/data/catalog.ts`

---

## 1. RESUMEN EJECUTIVO

Se han analizado **58 productos** en `src/data/catalog.ts` distribuidos en **5 categorías**.

**Campos utilizados:** 11 campos en total  
**Campos obligatorios:** 5  
**Campos opcionales:** 6  
**Variaciones encontradas:** 3 patrones principales  
**Incompatibilidades con GHL:** Ninguna crítica

**Conclusión:** El modelo actual es totalmente compatible con GHL usando una combinación de campos nativos + custom fields.

---

## 2. INVENTARIO COMPLETO DE CAMPOS

### Campos Utilizados en TypeScript

```typescript
type Product = {
  id: string; // Obligatorio
  name: string; // Obligatorio
  category: CategoryId; // Obligatorio
  priceMin: number; // Obligatorio
  priceMax?: number; // Opcional
  image: string; // Obligatorio (ruta importada)
  description: string; // Obligatorio
  badge?: string; // Opcional
  quoteOnly?: boolean; // Opcional (no usado en datos reales)
  roseStep?: number; // Opcional
  colors?: string[]; // Opcional
};
```

---

## 3. ANÁLISIS DETALLADO DE CADA CAMPO

### 3.1 CAMPO: `id`

| Aspecto                 | Descripción                                              |
| ----------------------- | -------------------------------------------------------- |
| **Tipo actual**         | string                                                   |
| **Ejemplo**             | "ramo-silvestre", "anthurium", "caja-rosas-eternas"      |
| **Uso actual**          | Identificador único del producto                         |
| **Estado en GHL**       | GHL asigna su propio `_id`                               |
| **Decisión**            | **MAPEO NECESARIO:** Guardar ID original en custom field |
| **Custom field**        | Sí - `legacy_catalog_id` (string)                        |
| **Formato recomendado** | Mantener mismo formato (kebab-case)                      |
| **Nota**                | Crítico para migración sin perder referencias            |

### 3.2 CAMPO: `name`

| Aspecto            | Descripción                                            |
| ------------------ | ------------------------------------------------------ |
| **Tipo actual**    | string                                                 |
| **Ejemplo**        | "Ramo Silvestre", "Anthurium", "Caja de Rosas Eternas" |
| **Uso actual**     | Nombre mostrado al cliente                             |
| **Estado en GHL**  | Campo nativo `name`                                    |
| **Decisión**       | **MAPEO DIRECTO**                                      |
| **Implementación** | `name` → `name` (1:1)                                  |
| **Validación**     | Máximo 255 caracteres (cumple)                         |

### 3.3 CAMPO: `category`

| Aspecto            | Descripción                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **Tipo actual**    | CategoryId (enum)                                                           |
| **Valores**        | "ramos" \| "plantas" \| "rosas-eternas" \| "complementos" \| "condolencias" |
| **Uso actual**     | Agrupar productos en catálogo                                               |
| **Estado en GHL**  | Campo nativo `category` (string)                                            |
| **Decisión**       | **MAPEO DIRECTO**                                                           |
| **Implementación** | `category` → `category` (1:1)                                               |
| **Notas**          | GHL permite cualquier string, no enum                                       |

### 3.4 CAMPO: `priceMin`

| Aspecto            | Descripción                         |
| ------------------ | ----------------------------------- |
| **Tipo actual**    | number                              |
| **Ejemplo**        | 30, 25, 12.5, 1.5                   |
| **Rango**          | 1.5 € hasta 150 €                   |
| **Uso actual**     | Precio mínimo del producto          |
| **Estado en GHL**  | Campo nativo `price`                |
| **Decisión**       | **USAR COMO PRECIO BASE**           |
| **Implementación** | `priceMin` → `price`                |
| **Nota**           | GHL solo acepta un precio, no rango |

### 3.5 CAMPO: `priceMax`

| Aspecto                 | Descripción                                    |
| ----------------------- | ---------------------------------------------- |
| **Tipo actual**         | number \| undefined                            |
| **Ejemplo**             | 45, 50, 85, 75                                 |
| **Uso actual**          | Precio máximo (rango)                          |
| **Productos con rango** | 25 de 58 (43%)                                 |
| **Rango de variación**  | Mínimo 15€ (whiskey) hasta 70€ (rosas eternas) |
| **Estado en GHL**       | NO existe campo nativo                         |
| **Decisión**            | **CUSTOM FIELD REQUERIDO**                     |
| **Custom field**        | `price_max` (number, opcional)                 |
| **Frontend**            | Mostrar `priceMin - priceMax` si existe        |

### 3.6 CAMPO: `image`

| Aspecto                   | Descripción                              |
| ------------------------- | ---------------------------------------- |
| **Tipo actual**           | string (ruta de import)                  |
| **Ejemplo**               | `imgRamos`, `imgGirasoles`, `imgPlantas` |
| **Importaciones**         | 6 imágenes base reutilizadas             |
| **Uso actual**            | Card de producto en catálogo             |
| **Estado en GHL**         | Campo nativo `image` (URL)               |
| **Decisión**              | **REQUIERE CONVERSIÓN**                  |
| **Conversión necesaria**  | Pasar rutas de assets a URLs públicas    |
| **Ubicación recomendada** | Supabase Storage (no modificar todavía)  |
| **Por ahora**             | Mantener rutas locales en catalog.ts     |

### 3.7 CAMPO: `description`

| Aspecto            | Descripción                                                        |
| ------------------ | ------------------------------------------------------------------ |
| **Tipo actual**    | string                                                             |
| **Ejemplo**        | "Flor variada de temporada con aire campestre y mucho movimiento." |
| **Largo**          | 20-200 caracteres (variado)                                        |
| **Uso actual**     | Descripción mostrada en ficha del producto                         |
| **Estado en GHL**  | Campo nativo `description`                                         |
| **Decisión**       | **MAPEO DIRECTO**                                                  |
| **Implementación** | `description` → `description` (1:1)                                |

### 3.8 CAMPO: `badge`

| Aspecto                 | Descripción                           |
| ----------------------- | ------------------------------------- |
| **Tipo actual**         | string \| undefined                   |
| **Valores encontrados** | "Más vendido", "Premium", "7-10 años" |
| **Productos con badge** | 3 de 58 (5%)                          |
| **Uso actual**          | Etiqueta especial en card de producto |
| **Estado en GHL**       | NO existe campo nativo                |
| **Decisión**            | **CUSTOM FIELD REQUERIDO**            |
| **Custom field**        | `badge_label` (string, opcional)      |
| **Tipo**                | Text/String                           |
| **Máximo**              | 30 caracteres                         |

### 3.9 CAMPO: `quoteOnly`

| Aspecto                  | Descripción                                 |
| ------------------------ | ------------------------------------------- |
| **Tipo actual**          | boolean \| undefined                        |
| **Valores encontrados**  | NINGUNO (campo no se usa en datos)          |
| **Definición en código** | Indica si requiere cotización personalizada |
| **Uso actual**           | NO UTILIZADO                                |
| **Estado en GHL**        | NO existe campo nativo                      |
| **Decisión**             | **CUSTOM FIELD PREVENTIVO**                 |
| **Custom field**         | `requires_quote` (boolean, default: false)  |
| **Nota**                 | Preparar para servicios futuros             |

### 3.10 CAMPO: `roseStep`

| Aspecto                    | Descripción                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **Tipo actual**            | number \| undefined                                            |
| **Valor utilizado**        | Siempre 6 (cuando existe)                                      |
| **Productos con roseStep** | 4 de 58 (7%)                                                   |
| **Uso actual**             | "1 unidad = 6 rosas" (multiplicador)                           |
| **Productos afectados**    | "ramo-rosas", "caja-rosas-eternas", "caja-romantica", "cupido" |
| **Estado en GHL**          | NO existe campo nativo                                         |
| **Decisión**               | **CUSTOM FIELD REQUERIDO**                                     |
| **Custom field**           | `rose_step` (number, opcional)                                 |
| **Valor por defecto**      | null (producto normal)                                         |
| **Ejemplo**                | Si roseStep=6, cantidad 1 = 6 rosas físicas                    |

### 3.11 CAMPO: `colors`

| Aspecto                  | Descripción                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| **Tipo actual**          | string[] \| undefined                                                |
| **Array de colores**     | ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]               |
| **Productos con colors** | 4 de 58 (7%)                                                         |
| **Uso actual**           | Selector de color en ficha de producto                               |
| **Productos afectados**  | "ramo-rosas", "caja-rosas-eternas", "caja-romantica", "cupido"       |
| **Estado en GHL**        | NO existe campo nativo para array de colores                         |
| **Decisión**             | **CUSTOM FIELD REQUERIDO**                                           |
| **Custom field**         | `available_colors` (text, JSON format)                               |
| **Formato**              | JSON array: `["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]` |
| **Alternativa**          | Usar variantes de GHL (más complejo)                                 |

---

## 4. ANÁLISIS DE CATEGORÍAS

### Distribución de Productos

| Categoría         | Productos | %    | Campos especiales                   |
| ----------------- | --------- | ---- | ----------------------------------- |
| **ramos**         | 6         | 10%  | colors (1), roseStep (1)            |
| **plantas**       | 12        | 21%  | badge (2)                           |
| **rosas-eternas** | 4         | 7%   | colors (4), roseStep (4), badge (1) |
| **complementos**  | 11        | 19%  | badge (0), priceMax variado         |
| **condolencias**  | 5         | 9%   | ninguno especial                    |
| **TOTAL**         | 58        | 100% |                                     |

### Características por Categoría

#### Ramos (6 productos)

- **Rango de precios:** 24€ - 50€
- **Con priceMax:** 100% (6/6)
- **Campos especiales:**
  - "ramo-rosas": colors + roseStep=6
- **Patrón:** Todos tienen rango de precios
- **Nota:** 1 badge ("Más vendido")

#### Plantas (12 productos)

- **Rango de precios:** 25€ - 80€
- **Con priceMax:** 17% (2/12)
- **Campos especiales:**
  - 2 badges ("Premium")
- **Patrón:** Mayoría sin rango
- **Nota:** Precio fijo es dominante

#### Rosas Eternas (4 productos)

- **Rango de precios:** 22€ - 85€
- **Con priceMax:** 75% (3/4)
- **Campos especiales:**
  - Todos 4 con colors
  - Todos 4 con roseStep=6
  - 1 badge ("7-10 años")
- **Patrón:** Productos altamente personalizables

#### Complementos (11 productos)

- **Rango de precios:** 1.5€ - 35€
- **Con priceMax:** 45% (5/11)
- **Campos especiales:**
  - Ninguno
- **Patrón:** Precio varía según tamaño/presentación

#### Condolencias (5 productos)

- **Rango de precios:** 45€ - 150€
- **Con priceMax:** 0% (0/5)
- **Campos especiales:**
  - Ninguno
- **Patrón:** Productos hecho a medida, precio fijo base
- **Nota:** Todos podrían soportar ribbon (cinta) 5€

---

## 5. PATRONES IDENTIFICADOS

### Patrón 1: Productos con Rango de Precios (25 productos)

**Característica:** `priceMin` ≠ `priceMax`

**Ejemplos:**

- Ramo Silvestre: 30€ - 45€
- Taza de Plantas: 36€ - 60€
- Botella de vino: 12€ - 25€

**Cómo mostrar en GHL:**

```
Precio: 30€ (custom: price_max=45€)
Front-end muestra: 30€ - 45€
```

**Productos afectados:**

- Ramos: 6/6 (100%)
- Plantas: 2/12 (17%)
- Rosas eternas: 3/4 (75%)
- Complementos: 5/11 (45%)
- Condolencias: 0/5 (0%)

### Patrón 2: Productos Personalizables por Color (4 productos)

**Característica:** `colors` array de 6 colores

**Ejemplo:**

```
"ramo-rosas": colors = ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]
```

**Cómo mostrar en GHL:**

```
Custom field: available_colors = "["Rojo","Rosa","Blanco","Azul","Lila","Amarillo"]"
Front-end: Selector de color en ficha
```

**Productos afectados:**

1. ramo-rosas
2. caja-rosas-eternas
3. caja-romantica
4. cupido

### Patrón 3: Productos con Multiplicador de Rosas (4 productos)

**Característica:** `roseStep = 6` (1 unidad = 6 rosas)

**Ejemplo:**

```
Cantidad 1 = 6 rosas
Cantidad 2 = 12 rosas
Cantidad 3 = 18 rosas
```

**Cómo mostrar en GHL:**

```
Custom field: rose_step = 6
Front-end: "Cantidad en múltiplos de 6 rosas"
```

**Productos afectados:**

1. ramo-rosas (+ colors)
2. caja-rosas-eternas (+ colors)
3. caja-romantica (+ colors)
4. cupido (+ colors)

**Nota:** Todos los productos con `roseStep` también tienen `colors`

---

## 6. MAPEO CAMPO A CAMPO

| Campo actual  | Tipo GHL | Destino GHL       | Requiere custom field | Tipo custom field | Notas                            |
| ------------- | -------- | ----------------- | --------------------- | ----------------- | -------------------------------- |
| `id`          | string   | legacy_catalog_id | ✅ Sí                 | text              | Mantener referencia              |
| `name`        | string   | name              | ❌ No                 | -                 | Nativo GHL                       |
| `category`    | string   | category          | ❌ No                 | -                 | Nativo GHL                       |
| `priceMin`    | number   | price             | ❌ No                 | -                 | Nativo GHL (campo único)         |
| `priceMax`    | number   | price_max         | ✅ Sí                 | number            | Opcional si priceMin=priceMax    |
| `image`       | URL      | image             | ❌ No                 | -                 | Nativo GHL (requiere conversión) |
| `description` | string   | description       | ❌ No                 | -                 | Nativo GHL                       |
| `badge`       | string   | badge_label       | ✅ Sí                 | text              | Opcional, máx 30 chars           |
| `quoteOnly`   | boolean  | requires_quote    | ✅ Sí                 | boolean           | Default: false                   |
| `roseStep`    | number   | rose_step         | ✅ Sí                 | number            | Opcional, solo rosas             |
| `colors`      | array    | available_colors  | ✅ Sí                 | text (JSON)       | Opcional, máx 4 colores          |

---

## 7. CUSTOM FIELDS REQUERIDOS

### Resumen de Custom Fields Necesarios

| Custom Field        | Tipo        | Requerido            | Valor por defecto | Uso                 | Ejemplos                 |
| ------------------- | ----------- | -------------------- | ----------------- | ------------------- | ------------------------ |
| `legacy_catalog_id` | Text        | ✅ Sí                | -                 | Mapeo id → GHL      | "ramo-silvestre"         |
| `price_max`         | Number      | ❌ No (25 productos) | null              | Rango de precios    | 45, 50, 85               |
| `badge_label`       | Text        | ❌ No (3 productos)  | null              | Badge visual        | "Más vendido", "Premium" |
| `requires_quote`    | Boolean     | ❌ No (0 productos)  | false             | Requiere cotización | false (por defecto)      |
| `rose_step`         | Number      | ❌ No (4 productos)  | null              | Multiplicador rosas | 6                        |
| `available_colors`  | Text (JSON) | ❌ No (4 productos)  | null              | Colores disponibles | ["Rojo","Rosa"]          |

### Recomendación de Creación

**Crear en GHL Dashboard primero:**

1. `legacy_catalog_id` (CRÍTICO - para migración)
2. `price_max` (25 productos lo necesitan)
3. `rose_step` (4 productos lo necesitan)
4. `available_colors` (4 productos lo necesitan)
5. `badge_label` (3 productos lo necesitan)
6. `requires_quote` (preventivo, para servicios futuros)

---

## 8. ANÁLISIS DE INCOMPATIBILIDADES

### ❌ Críticas: NINGUNA

### ⚠️ Altas: Convertir imágenes a URLs públicas

| Problema                                | Impacto                      | Solución                                     | Timeline                 |
| --------------------------------------- | ---------------------------- | -------------------------------------------- | ------------------------ |
| Las imágenes están como imports de Vite | Images no se cargarán en GHL | Subir a URL pública (Supabase Storage o CDN) | Fase 2                   |
| **Severidad**                           | **Alta**                     | **Requiere setup**                           | **No bloquea migración** |

### ⚠️ Medias: Estructura de precios

| Problema                        | Impacto                    | Solución                      | Timeline     |
| ------------------------------- | -------------------------- | ----------------------------- | ------------ |
| GHL no soporta rango de precios | 25 productos mostrarán mal | Usar custom field `price_max` | Fase 1       |
| **Severidad**                   | **Media**                  | **Custom field**              | **Resuelto** |

### ✅ Bajas: Flexibilidad de colores

| Problema                                      | Impacto               | Solución               | Timeline     |
| --------------------------------------------- | --------------------- | ---------------------- | ------------ |
| Colores como array, no como variantes nativas | Flexibilidad reducida | Usar custom field JSON | Fase 1       |
| **Severidad**                                 | **Baja**              | **Custom field**       | **Resuelto** |

---

## 9. PRODUCTOS ESPECIALES A CONSIDERAR

### Ramo de Rosas (ramo-rosas)

```
id: "ramo-rosas"
name: "Ramo de Rosas"
priceMin: 24
priceMax: 48
colors: ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]
roseStep: 6
description: "Ramo de rosas frescas. La cantidad se monta en múltiplos de 6 rosas (1 = 6 rosas)."
```

**Complejidad:** 🟠 ALTA

**Campos especiales:** colors + roseStep + priceMax

**Cómo representar en GHL:**

- `price`: 24€
- `price_max`: 48€ (custom)
- `rose_step`: 6 (custom)
- `available_colors`: "["Rojo","Rosa","Blanco","Azul","Lila","Amarillo"]" (custom)

### Caja de Rosas Eternas (caja-rosas-eternas)

```
id: "caja-rosas-eternas"
name: "Caja de Rosas Eternas"
priceMin: 40
priceMax: 85
colors: ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"]
roseStep: 6
badge: "7-10 años"
```

**Complejidad:** 🔴 MUY ALTA

**Campos especiales:** colors + roseStep + priceMax + badge

**Único producto con todos los campos opcionales**

### Centro de Orquídeas Variadas (centro-orquideas-variadas)

```
id: "centro-orquideas-variadas"
name: "Centro de Orquídeas Variadas"
priceMin: 80
badge: "Premium"
```

**Complejidad:** 🟡 BAJA

**Campos especiales:** badge

---

## 10. RESUMEN DE VARIACIONES

### Productos con solo campos obligatorios: 49 de 58 (84%)

**Estructura simple:**

```json
{
  "id": "...",
  "name": "...",
  "category": "...",
  "priceMin": 25,
  "image": "...",
  "description": "..."
}
```

### Productos con priceMax: 25 de 58 (43%)

### Productos con colors: 4 de 58 (7%)

- Todos tienen roseStep=6

### Productos con badge: 3 de 58 (5%)

### Productos con roseStep: 4 de 58 (7%)

- Todos tienen colors

### Productos complejos (múltiples campos opcionales): 1 de 58 (2%)

- caja-rosas-eternas (colors + roseStep + priceMax + badge)

---

## 11. PROPUESTA DE ESQUEMA DEFINITIVO PARA GHL

### Estructura Base (campos nativo)

```json
{
  "name": "string (required)",
  "description": "string (required)",
  "category": "string (required)",
  "price": "number (required)",
  "image": "URL (required)",
  "status": "active | inactive (default: active)"
}
```

### Custom Fields Requeridos

```json
{
  "legacy_catalog_id": "string (required)",
  "price_max": "number (optional)",
  "badge_label": "string (optional, max 30 chars)",
  "requires_quote": "boolean (default: false)",
  "rose_step": "number (optional)",
  "available_colors": "string as JSON array (optional)"
}
```

### Producto Ejemplo: Ramo de Rosas

```json
{
  "_id": "[GHL asigna]",
  "locationId": "vOq7yOWR63XGU4qQ7XWd",
  "name": "Ramo de Rosas",
  "description": "Ramo de rosas frescas. La cantidad se monta en múltiplos de 6 rosas (1 = 6 rosas).",
  "category": "ramos",
  "price": 24,
  "image": "[URL a Supabase Storage]",
  "status": "active",

  "legacy_catalog_id": "ramo-rosas",
  "price_max": 48,
  "badge_label": null,
  "requires_quote": false,
  "rose_step": 6,
  "available_colors": "[\"Rojo\",\"Rosa\",\"Blanco\",\"Azul\",\"Lila\",\"Amarillo\"]"
}
```

### Producto Ejemplo: Plantas Simple

```json
{
  "_id": "[GHL asigna]",
  "locationId": "vOq7yOWR63XGU4qQ7XWd",
  "name": "Anthurium",
  "description": "Planta de interior de flor duradera y hoja brillante.",
  "category": "plantas",
  "price": 25,
  "image": "[URL a Supabase Storage]",
  "status": "active",

  "legacy_catalog_id": "anthurium",
  "price_max": null,
  "badge_label": null,
  "requires_quote": false,
  "rose_step": null,
  "available_colors": null
}
```

---

## 12. VALIDACIONES Y RESTRICCIONES

### Validación de Campos por GHL

| Campo         | Validación             | Cumple                      |
| ------------- | ---------------------- | --------------------------- |
| `name`        | Máximo 255 caracteres  | ✅ Sí (mayor es ~50 chars)  |
| `description` | Máximo 5000 caracteres | ✅ Sí (mayor es ~200 chars) |
| `price`       | Number > 0             | ✅ Sí (mínimo 1.5€)         |
| `category`    | String (sin límite)    | ✅ Sí                       |
| `image`       | URL válida             | ✅ Requiere conversión      |

### Validación de Custom Fields

| Custom field        | Validación         | Cumple                     |
| ------------------- | ------------------ | -------------------------- |
| `legacy_catalog_id` | Único por producto | ✅ Sí (58 IDs únicos)      |
| `price_max`         | > price            | ✅ Sí (todos cumplen)      |
| `badge_label`       | Máximo 30 chars    | ✅ Sí (mayor es ~12 chars) |
| `rose_step`         | Valor: 6           | ✅ Sí (solo 4 productos)   |
| `available_colors`  | JSON válido        | ✅ Sí (array de strings)   |

---

## 13. MATRIZ DE DECISIONES PENDIENTES

| Decisión    | Opciones                                   | Recomendación              | Estado      |
| ----------- | ------------------------------------------ | -------------------------- | ----------- |
| Imágenes    | Mantener local \| Supabase \| CDN          | Supabase Storage           | ⏳ Fase 2   |
| Precios     | Solo priceMin \| Custom field \| Variantes | Custom field `price_max`   | ✅ Definido |
| Colores     | Custom field \| Variantes GHL \| Ignorar   | Custom field JSON          | ✅ Definido |
| RoseStep    | Custom field \| Ignorer \| Variantes       | Custom field `rose_step`   | ✅ Definido |
| Badge       | Custom field \| Ignorar \| Etiqueta GHL    | Custom field `badge_label` | ✅ Definido |
| ID original | Custom field \| Ignorar                    | Custom field crítico       | ✅ Definido |

---

## 14. CHECKLIST PRE-MIGRACIÓN

### Antes de migrar cualquier producto:

- [ ] Custom fields creados en GHL Dashboard
- [ ] Validar estructura de datos en GHL
- [ ] Imágenes con URLs públicas (Supabase)
- [ ] Probar con 2-3 productos de prueba
- [ ] Validar que todos los campos se guardan
- [ ] Frontend puede leer custom fields
- [ ] Validar colores en selector
- [ ] Validar roseStep en cantidad
- [ ] Validar priceMax en display

---

## 15. INCOMPATIBILIDADES Y SOLUCIONES

### No encontradas incompatibilidades críticas

**Conclusión:** El modelo actual es 100% compatible con GoHighLevel usando:

1. **5 campos nativos** (name, description, category, price, image)
2. **6 custom fields** (legacy_catalog_id, price_max, badge_label, requires_quote, rose_step, available_colors)

---

## 16. PRÓXIMOS PASOS DESPUÉS DE APROBACIÓN

### Fase 2A: Crear Custom Fields en GHL (< 1 hora)

1. Acceder a GHL Dashboard
2. Settings → Products → Custom Fields
3. Crear 6 custom fields según especificación
4. Validar en API

### Fase 2B: Migrar Productos de Prueba (2-3 horas)

1. Seleccionar 2-3 productos variados:
   - 1 simple (ej: Anthurium)
   - 1 con priceMax (ej: Ramo Silvestre)
   - 1 complejo (ej: Ramo de Rosas)
2. Crear productos en GHL manualmente
3. Validar estructura y custom fields
4. Verificar desde API

### Fase 2C: Validación en Frontend

1. Actualizar `getGHLProducts()` para retornar custom fields
2. Verificar que frontend puede leer datos
3. Mostrar badge, colors, priceMax, roseStep
4. Pruebas funcionales

---

**Documento listo para aprobación del usuario antes de proceder a Fase 2.**
