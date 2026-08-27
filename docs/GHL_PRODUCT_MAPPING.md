# Mapeo de Productos: Catálogo Actual ↔ GoHighLevel

**Última actualización:** 2026-08-26  
**Estado:** Análisis preparatorio (NO APLICADO AÚN)

---

## 1. ESTADO ACTUAL DEL CATÁLOGO

### Ubicación: `src/data/catalog.ts`
- **Total de productos:** 58 productos
- **Almacenamiento:** Archivo TypeScript estático
- **Estructura:** Array de objetos `Product`
- **Categorías:** 5 categorías definidas

### Distribución actual:
| Categoría | Productos | Descripción |
|-----------|-----------|-------------|
| Ramos | 6 | Arreglos florales, ramos variados |
| Plantas | 12 | Plantas, orquídeas, composiciones |
| Rosas Eternas | 4 | Flores preservadas de larga duración |
| Complementos | 11 | Accesorios: bombones, vino, globos, etc. |
| Condolencias | 5 | Arreglos para despedidas |
| **TOTAL** | **58** | |

---

## 2. ESTRUCTURA ACTUAL DE PRODUCT (TypeScript)

```typescript
type Product = {
  id: string;                    // Identificador único (ej: "ramo-silvestre")
  name: string;                  // Nombre del producto
  category: CategoryId;          // Categoría: ramos|plantas|rosas-eternas|complementos|condolencias
  priceMin: number;              // Precio mínimo
  priceMax?: number;             // Precio máximo (opcional, si hay rango)
  image: string;                 // Ruta de imagen importada
  description: string;           // Descripción textual
  badge?: string;                // Badge/etiqueta (ej: "Más vendido")
  quoteOnly?: boolean;           // Si requiere presupuesto personalizado
  roseStep?: number;             // Multiplicador para rosas (ej: 6 = 1 unidad = 6 rosas)
  colors?: string[];             // Array de colores disponibles
};
```

### Ejemplo real:
```typescript
{
  id: "ramo-rosas",
  name: "Ramo de Rosas",
  category: "ramos",
  priceMin: 24,
  priceMax: 48,
  image: imgRamos,
  description: "Ramo de rosas frescas. La cantidad se monta en múltiplos de 6 rosas (1 = 6 rosas).",
  roseStep: 6,
  colors: ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"],
}
```

---

## 3. ESTRUCTURA DE GHL PRODUCT (GoHighLevel API)

```typescript
type GHLProduct = {
  id: string;                    // ID de GHL
  name: string;                  // Nombre del producto
  description?: string;          // Descripción
  price?: number;                // Precio (campo único, no rango)
  cost?: number;                 // Costo (para margen)
  image?: string;                // URL de imagen (una sola)
  images?: string[];             // Array de imágenes
  sku?: string;                  // Stock Keeping Unit
  category?: string;             // Categoría
  status?: "active" | "inactive"; // Estado del producto
  inventory?: number;            // Stock disponible
  [key: string]: unknown;        // Custom fields dinámicos
};
```

---

## 4. MAPEO CAMPO A CAMPO

### Campos que mapean directamente:

| Campo Actual | Campo GHL | Tipo | Notas |
|---|---|---|---|
| `id` | `id` | string | ID único; cambiaría si se migra a GHL |
| `name` | `name` | string | ✅ Mapeo directo |
| `description` | `description` | string | ✅ Mapeo directo |
| `category` | `category` | string | ⚠️ Necesita transformación (ver abajo) |
| `image` | `image` (primary) | string | ⚠️ Solo una imagen; catalog.ts usa importes |
| `priceMin` + `priceMax` | `price` | number | ❌ GHL usa campo único; necesita decisión |

### Campos especiales que REQUIEREN custom fields en GHL:

| Campo Actual | Campo GHL | Solución |
|---|---|---|
| `priceMax` | No existe | ✅ Custom field: `price_max` (number) |
| `roseStep` | No existe | ✅ Custom field: `rose_step` (number) |
| `colors` | No existe | ✅ Custom field: `available_colors` (JSON array) |
| `quoteOnly` | No existe | ✅ Custom field: `requires_quote` (boolean) |
| `badge` | No existe | ✅ Custom field: `badge_label` (string) |

### Campos que GHL tiene pero catalog.ts no:

| Campo GHL | Actual | Recomendación |
|---|---|---|
| `sku` | N/A | Generar automáticamente o mapear desde `id` |
| `images` (array) | Una imagen | Mantener una sola imagen primaria |
| `cost` | N/A | Requerir input manual en GHL (margen) |
| `status` | N/A | Usar `active` por defecto, `inactive` si `quoteOnly=true` |
| `inventory` | N/A | Usar `null` (sin control de stock actual) |

---

## 5. TRANSFORMACIÓN DE CATEGORÍAS

**Actual en catalog.ts:**
```typescript
type CategoryId = 
  | "ramos"
  | "plantas"
  | "rosas-eternas"
  | "complementos"
  | "condolencias";
```

**En GHL (string libre):**
Se usaría el mismo nombre pero normalizado:
- `"ramos"` → `"Ramos y arreglos florales"`
- `"plantas"` → `"Plantas y Composiciones"`
- `"rosas-eternas"` → `"Rosas Eternas"`
- `"complementos"` → `"Complementos"`
- `"condolencias"` → `"Condolencias"`

---

## 6. ESTRATEGIA DE PRECIOS

**Problema:** Catalog.ts usa rango (`priceMin` - `priceMax`), GHL usa precio único.

### Opción A: Usar `priceMin` como `price` en GHL
```
GHL product.price = Catalog.priceMin
GHL custom field: price_max = Catalog.priceMax
```
**Ventaja:** Conservador (no sobrepreciar)  
**Desventaja:** Pierde precisión del rango

### Opción B: Usar promedio
```
GHL product.price = (priceMin + priceMax) / 2
GHL custom field: price_min = Catalog.priceMin
GHL custom field: price_max = Catalog.priceMax
```
**Ventaja:** Representación equilibrada  
**Desventaja:** No refleja variación exacta

### **Recomendación:** Opción A
El `priceMin` es el precio mínimo que la clienta cobra. El rango se muestra en frontend.

---

## 7. GESTIÓN DE IMÁGENES

### Actual:
```typescript
import imgRamos from "@/assets/cat-ramos.jpg";
// Luego en producto:
image: imgRamos,  // Ruta procesada por Vite
```

### Estrategia para GHL:
1. **Corto plazo:** Mantener imágenes en `src/assets/` y en frontend
2. **Mediano plazo:** Usar Supabase Storage para imágenes (sin cambiar GHL)
3. **Largo plazo:** Opción de subir a GHL Storage si está disponible

**Por ahora:** Catalog.ts seguirá con rutas locales.

---

## 8. DATOS QUE PERMANECERÁN EN SUPABASE

Estos campos/sistemas NO migrarán a GHL:

| Datos | Ubicación | Razón |
|---|---|---|
| Autenticación | `auth.users` (Supabase) | Supabase Auth nativo |
| Perfiles de usuario | `public.profiles` (Supabase) | Datos técnicos del usuario |
| Carrito | localStorage + sesión | Estado ephemeral |
| Favoritos | localStorage + sesión | Estado ephemeral |
| RLS Policies | Supabase | Seguridad a nivel DB |
| Token JWT | Supabase | Autenticación cliente-servidor |

---

## 9. DATOS QUE MIGRARÁN PROGRESIVAMENTE A GHL

| Datos | Origen Actual | Destino GHL | Timeline |
|---|---|---|---|
| Catálogo de productos | `src/data/catalog.ts` | GHL Catalog | Fase 2 |
| Clientes/Contactos | No existe (signup simple) | GHL Contacts | Fase 2+ |
| Pedidos | No existe (contacto manual) | GHL Orders/Deals | Fase 3 |
| Información comercial | `src/data/company.ts` | GHL Settings | Fase 2 |

---

## 10. CAMPOS PERSONALIZADOS NECESARIOS EN GHL

Crear estos custom fields en GHL Dashboard:

### Para productos:

```
1. price_max (type: number)
   - Descripción: Precio máximo del producto
   - Público: No
   
2. rose_step (type: number)
   - Descripción: Multiplicador para rosas (ej: 6 = 1 unidad es 6 rosas)
   - Público: No
   
3. available_colors (type: text/json)
   - Descripción: Colores disponibles (JSON array o texto)
   - Públlico: No
   
4. requires_quote (type: boolean)
   - Descripción: ¿Requiere presupuesto?
   - Público: Sí
   
5. badge_label (type: text)
   - Descripción: Etiqueta/badge (ej: "Más vendido")
   - Público: Sí
```

---

## 11. IMPACTO EN CÓDIGO FRONTEND

### Cambios necesarios cuando se migre:

**Antes (actual):**
```typescript
import { products } from '@/data/catalog';
const product = products.find(p => p.id === productId);
```

**Después (con GHL):**
```typescript
const { data: product } = useGHLProduct(productId);
// O desde server:
const product = await getGHLProduct(productId);
```

### Cambios MÍNIMOS en componentes:
- Nombres de propiedades permanecen iguales (ej: `product.name`)
- Métodos de acceso cambian (función → API call)
- UI NO cambia (mismo flujo visual)

---

## 12. RIESGOS Y CONSIDERACIONES

### ⚠️ Alto riesgo:
- **Pérdida de precios:** El rango `priceMin-priceMax` puede perderse si se usa solo un campo
- **Imágenes:** URLs pueden cambiar si se migra storage
- **IDs de producto:** Si GHL asigna IDs diferentes, requiere mapeo

### ⚠️ Medio riesgo:
- **Custom fields:** No todos los CRM tienen custom fields robustos
- **Sincronización:** Mantener ambos sistemas en sync durante migración

### ✅ Bajo riesgo:
- **Carrito/favoritos:** No se ven afectados (siguen en localStorage)
- **Autenticación:** Supabase sigue siendo la fuente de verdad
- **Layout/UX:** Frontend puede permanecer igual

---

## 13. MATRIZ DE COMPLETITUD

Qué información puede migrar directamente sin pérdida:

```
✅ = Migración directa y segura
⚠️ = Requiere custom field o adaptación
❌ = No tiene equivalente, quedará en Supabase/catalog.ts
```

| Campo | Migración | Notas |
|---|---|---|
| id | ⚠️ | GHL asignará nuevo ID |
| name | ✅ | Mapeo 1:1 |
| description | ✅ | Mapeo 1:1 |
| category | ✅ | String directo |
| priceMin | ⚠️ | Usar como `price` en GHL |
| priceMax | ⚠️ | Custom field `price_max` |
| image | ⚠️ | Una sola imagen |
| badge | ⚠️ | Custom field `badge_label` |
| quoteOnly | ⚠️ | Custom field `requires_quote` |
| roseStep | ⚠️ | Custom field `rose_step` |
| colors | ⚠️ | Custom field `available_colors` |

---

## 14. PRÓXIMOS PASOS

1. ✅ **Fase 1 (ACTUAL):** Conectar backend a GHL, pruebas READ-ONLY
2. 🔄 **Fase 2:** Crear custom fields en GHL, migrar 1-2 productos de prueba
3. 🔄 **Fase 3:** Migrar todos los productos a GHL
4. 🔄 **Fase 4:** Actualizar frontend para leer desde GHL en lugar de catalog.ts
5. 🔄 **Fase 5:** Desvincular catalog.ts (mantener como fallback)

---

**Documento preparado para revisión. NO se han aplicado cambios aún.**
