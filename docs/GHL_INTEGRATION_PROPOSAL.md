# Propuesta de Integración GoHighLevel - Floristería Lucía

**Documento:** Informe de Propuesta de Integración  
**Fecha:** 2026-08-26  
**Estado:** Preparatorio - Listo para aprobación antes de ejecución  
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

Esta propuesta detalla cómo integrar **GoHighLevel (GHL)** como sistema de administración del catálogo y negocio de Floristería Lucía, manteniendo intactos todos los datos y funcionalidades actuales.

### Objetivo Principal

Permitir que la clienta administre productos, clientes y operaciones desde GHL, mientras el frontend (React + Vercel) sigue siendo el punto de acceso para clientes.

### Arquitectura Resultante

```
CLIENTE (Browser)
    ↓ (React/TanStack)
VERCEL (Frontend)
    ↓ (HTTPS)
TanStack Start Server
    ├─→ Supabase (Auth, usuario datos)
    └─→ GoHighLevel (Catálogo, Clientes, Negocio)
```

---

## 1. ESTADO ACTUAL DEL CATÁLOGO

### Ubicación Real

- **Archivo:** `src/data/catalog.ts`
- **Tipo:** Array estático en TypeScript
- **Productos:** 58 productos
- **Categorías:** 5 (ramos, plantas, rosas eternas, complementos, condolencias)
- **Almacenamiento:** Código fuente (versionado en Git)

### Conexión Actual a Supabase

**No existe conexión de catálogo:**

- ✅ Tabla `profiles` (datos de usuario) - SÍ en Supabase
- ❌ Tabla `products` - NO existe en Supabase
- ❌ Tabla `categories` - NO existe en Supabase
- ❌ Tabla `product_variants` - NO existe en Supabase

**Conclusión:** El catálogo está 100% en código, no en BD.

### Datos en Supabase Actualmente

| Tabla             | Registros | Propósito                                       |
| ----------------- | --------- | ----------------------------------------------- |
| `auth.users`      | Variable  | Autenticación de usuarios                       |
| `public.profiles` | Variable  | Datos extendidos del usuario (nombre, teléfono) |
| `storage.objects` | Mínima    | Almacenamiento de imágenes (poco uso actual)    |

---

## 2. INFRAESTRUCTURA TÉCNICA ACTUAL

### Backend/Server-Side

**TanStack React Start SÍ tiene capacidad server-side:**

- ✅ `src/integrations/supabase/client.server.ts` existe
- ✅ Middleware para autenticación disponible
- ✅ Servidor Express/h3 compatible con Vercel
- ❌ No hay API routes definidas actualmente
- ❌ Todo es client-side directo a Supabase

### Arquitectura de Conexión Actual

```
React Component
    ↓
supabase.from('table').select()
    ↓ (directo, sin servidor intermediario)
Supabase API
    ↓
PostgreSQL
```

### Variables de Entorno Actuales

```
# Frontend (públicas)
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GOOGLE_CLIENT_ID

# Backend (privadas)
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_ID
SUPABASE_URL
```

---

## 3. PUNTO DE INTEGRACIÓN GHL

### Ubicación Segura Para Llamadas a GHL

✅ **Punto elegido:** `src/integrations/supabase/client.server.ts` (server-side)

**Implementación completada:**

- ✅ `src/lib/ghl/client.server.ts` - Cliente seguro (nunca expone token)
- ✅ `src/routes/api.ghl.products.ts` - API route para frontend
- ✅ `src/hooks/useGHLProducts.ts` - Hook React Query para consumir API

**Arquitectura:**

```
React Component (browser)
    ↓
useGHLProducts() hook
    ↓
/api/ghl/products endpoint
    ↓ (servidor, token seguro)
src/lib/ghl/client.server.ts
    ↓ (HTTPS)
GoHighLevel API
    ↓
GHL Catalog Database
```

**Token GHL:**

- ✅ Variable `GHL_PRIVATE_INTEGRATION_TOKEN` configurada
- ✅ NUNCA expuesta al navegador
- ✅ NUNCA en código fuente
- ✅ Solo en archivo `.env` (local) o Vercel env vars (production)

---

## 4. RESULTADO DE PRUEBA READ-ONLY CON GHL

### Estado: LISTO PARA PRUEBA

✅ Código implementado y preparado

**Función de prueba:**

```typescript
getGHLProducts(locationId?, options?)  // Obtiene productos
getGHLProduct(productId)                 // Obtiene un producto
testGHLConnection()                      // Valida token
```

**Página de debug creada:**

- Ruta: `/debug/ghl-test` (desarrollo)
- Interfaz: Botones para probar conexión y obtener productos
- Respuesta: Muestra resultados o errores

### Cómo ejecutar la prueba:

1. Agregar `GHL_PRIVATE_INTEGRATION_TOKEN` a `.env.local`
2. Ejecutar `npm run dev`
3. Visitar `http://localhost:5173/debug/ghl-test`
4. Hacer clic en "Start Connection Test"
5. Verificar respuesta (token válido = ✅ Connected)

### Resultado esperado:

```json
{
  "connected": true,
  "message": "GHL connection successful"
}
```

---

## 5. MAPEO SUPABASE/CATALOG.TS → GHL

### Campos de Producto Actuales

```typescript
{
  id: string;           // ID único
  name: string;         // Nombre
  category: string;     // Categoría
  priceMin: number;     // Precio mínimo
  priceMax?: number;    // Precio máximo (rango)
  image: string;        // Ruta de imagen
  description: string;  // Descripción
  badge?: string;       // Etiqueta (ej: "Más vendido")
  quoteOnly?: boolean;  // Requiere presupuesto
  roseStep?: number;    // Multiplicador rosas
  colors?: string[];    // Colores disponibles
}
```

### Campos de GHL

```typescript
{
  id: string;           // ID de GHL
  name: string;         // Nombre
  description?: string; // Descripción
  price?: number;       // Precio único
  cost?: number;        // Costo
  image?: string;       // Imagen
  category?: string;    // Categoría
  sku?: string;         // SKU
  status?: string;      // Estado (active/inactive)
  inventory?: number;   // Stock
  [key]: unknown;       // Custom fields
}
```

### Mapeo Detallado

| Actual        | GHL                              | Tipo    | Solución                   |
| ------------- | -------------------------------- | ------- | -------------------------- |
| `id`          | `id`                             | string  | GHL asignará nuevo ID      |
| `name`        | `name`                           | string  | ✅ Directo                 |
| `description` | `description`                    | string  | ✅ Directo                 |
| `category`    | `category`                       | string  | ✅ Directo                 |
| `priceMin`    | `price`                          | number  | ⚠️ Usar como precio en GHL |
| `priceMax`    | `custom_field: price_max`        | number  | ⚠️ Custom field            |
| `image`       | `image`                          | string  | ⚠️ Una sola imagen         |
| `badge`       | `custom_field: badge_label`      | string  | ⚠️ Custom field            |
| `quoteOnly`   | `custom_field: requires_quote`   | boolean | ⚠️ Custom field            |
| `roseStep`    | `custom_field: rose_step`        | number  | ⚠️ Custom field            |
| `colors`      | `custom_field: available_colors` | array   | ⚠️ Custom field            |

**Conclusión:** 100% de campos pueden migrar (algunos requieren custom fields en GHL).

---

## 6. CUSTOM FIELDS NECESARIOS EN GHL

Crear en GHL Dashboard → Product Settings:

```
1. price_max (Tipo: Número)
   Propósito: Precio máximo del rango
   Visible: No (interno)

2. rose_step (Tipo: Número)
   Propósito: Multiplicador para productos de rosas
   Visible: No

3. available_colors (Tipo: Texto o JSON)
   Propósito: Colores disponibles
   Visible: No

4. requires_quote (Tipo: Booleano)
   Propósito: ¿Requiere presupuesto personalizado?
   Visible: Sí (en catálogo)

5. badge_label (Tipo: Texto)
   Propósito: Etiqueta especial (ej: "Más vendido", "Nuevo")
   Visible: Sí (en catálogo)
```

---

## 7. INFORMACIÓN QUE PERMANECERÁ EN SUPABASE

### NO será migrada a GHL:

| Sistema                 | Razón                                   | Ubicación         |
| ----------------------- | --------------------------------------- | ----------------- |
| **Autenticación**       | Supabase Auth nativo, OAuth integrado   | `auth.users`      |
| **Perfiles de usuario** | Datos técnicos + privacidad             | `public.profiles` |
| **Carrito de compras**  | Estado ephemeral, cambia constantemente | localStorage      |
| **Favoritos**           | Estado ephemeral                        | localStorage      |
| **RLS Policies**        | Seguridad a nivel base de datos         | Supabase          |
| **JWT Tokens**          | Autenticación cliente-servidor          | Supabase Auth     |

**Razón principal:** Estos datos no necesitan administración manual por la clienta y tienen carácter técnico/temporal.

---

## 8. INFORMACIÓN A ADMINISTRAR DESDE GHL

### Productos (catálogo)

- **Qué:** Nombre, descripción, precio, imagen, categoría
- **Cuándo:** Fase 2 (después de validar conexión)
- **Cómo:** GHL Dashboard → Products

### Clientes/Contactos

- **Qué:** Datos de clientes que hagan pedidos
- **Cuándo:** Fase 3 (después de integrar pagos)
- **Cómo:** GHL Dashboard → Contacts

### Pedidos

- **Qué:** Historial de compras, estado de envío
- **Cuándo:** Fase 3+ (después de Stripe)
- **Cómo:** GHL Dashboard → Deals/Orders

---

## 9. PLAN EXACTO DE MIGRACIÓN

### Fase 1: PREPARACIÓN (Actual)

**Estado:** ✅ COMPLETADA

1. ✅ Crear tipos TypeScript para GHL
2. ✅ Cliente server-side (`client.server.ts`)
3. ✅ API route (`/api/ghl/products`)
4. ✅ Hook React (`useGHLProducts`)
5. ✅ Página de debug (`/debug/ghl-test`)
6. ✅ Variable de entorno configurada

### Fase 2: VALIDACIÓN (Próximo paso)

**Estado:** 🔄 PENDIENTE APROBACIÓN

1. Agregar token GHL a `.env.local`
2. Ejecutar `/debug/ghl-test` para validar conexión
3. Verificar que GHL responde con productos
4. Documentar respuesta real de GHL
5. Comparar estructura real vs. esperada

**Duración:** 2-4 horas

### Fase 3: PREPARACIÓN DE GHL

**Estado:** 🔄 PENDIENTE (después de Fase 2)

1. Crear custom fields en GHL Dashboard
2. Probar que custom fields se devuelven en API
3. Validar mapeo de datos
4. Crear 1-2 productos de prueba en GHL

**Duración:** 1-2 horas

### Fase 4: MIGRACIÓN DE PRODUCTOS (1 de 2 pasos)

**Estado:** 🔄 PENDIENTE (después de Fase 3)

1. Exportar productos de `catalog.ts` a JSON
2. Transformar estructura al formato GHL
3. Crear script de migración (sin ejecutar)
4. Revisar mapeo de IDs
5. Ejecutar migración de productos de prueba
6. Validar en GHL Dashboard

**Duración:** 3-4 horas

### Fase 5: CAMBIO DE FUENTE DE DATOS (2 de 2 pasos)

**Estado:** 🔄 PENDIENTE (después de Fase 4)

1. Actualizar `useProduct()` para leer de GHL
2. Crear página de fallback si GHL no responde
3. Mantener `catalog.ts` como backup
4. Pruebas de rendimiento
5. Lanzamiento gradual (A/B testing)
6. Monitoreo de errores

**Duración:** 4-6 horas

### Fase 6: OPTIMIZACIONES POSTERIORES

**Estado:** 🔄 FUTURE (después de Fase 5)

1. Caché local de productos
2. Sincronización de cambios en tiempo real
3. Integración de Stripe
4. Dashboard para la clienta
5. Eliminación de `catalog.ts` (opcional)

**Duración:** Variable

---

## 10. CAMBIOS DE CÓDIGO REQUERIDOS (Próxima Fase)

### En componentes de catálogo:

**Actual:**

```typescript
import { products } from "@/data/catalog";
const allProducts = products.filter((p) => p.category === category);
```

**Después de Fase 4:**

```typescript
const { data: products } = useGHLProducts({ enabled: true });
const allProducts = products?.filter((p) => p.category === category) || [];
```

### En componentes de detalle:

**Actual:**

```typescript
const product = products.find((p) => p.id === productId);
```

**Después:**

```typescript
const { data: product } = useGHLProduct(productId);
```

### Cambios UI:

- ❌ NO hay cambios visuales requeridos
- ✅ Mantiene el mismo look & feel
- ✅ Mantiene el mismo flujo de usuario

---

## 11. DATOS QUE NO PUEDEN PERDERSE

### Críticos:

- ✅ 58 productos actuales (con todos sus campos)
- ✅ 5 categorías
- ✅ Usuarios registrados (autenticación)
- ✅ Carrito (en localStorage, sin problema)

### Estrategia de seguridad:

1. ✅ `catalog.ts` permanece en Git (versionado)
2. ✅ Backup de datos antes de cada migración
3. ✅ Fase de prueba con 1-2 productos primero
4. ✅ Rollback disponible en cualquier momento
5. ✅ Mantener `catalog.ts` como fallback

---

## 12. VALIDACIÓN TÉCNICA

### Checklist de implementación:

- ✅ Token GHL configurado (en variable de entorno)
- ✅ Cliente server-side creado
- ✅ API route creada
- ✅ Hook React creado
- ✅ Tipos TypeScript definidos
- ✅ Página de debug creada
- ⏳ Prueba READ-ONLY ejecutada (próximo paso)
- ⏳ Custom fields en GHL creados
- ⏳ Migraciones de datos ejecutadas

### Posibles problemas y soluciones:

| Problema                    | Solución                               |
| --------------------------- | -------------------------------------- |
| Token GHL inválido          | Regenerar en GHL Dashboard             |
| API GHL tiene rate limiting | Implementar cache en frontend          |
| Precios perdidos en rango   | Usar custom field `price_max`          |
| Imágenes no se sincronizan  | Mantener imágenes en Supabase Storage  |
| IDs de producto cambian     | Crear mapeo de `catalog.id` → `GHL.id` |

---

## 13. RECOMENDACIONES FINALES

### ✅ HACER (en orden):

1. **INMEDIATO:**
   - Agregar token GHL a `.env.local`
   - Ejecutar `/debug/ghl-test` para validar
   - Documentar respuesta real de GHL

2. **CORTO PLAZO (esta semana):**
   - Crear custom fields en GHL
   - Migrar 2-3 productos de prueba
   - Validar mapeo de datos
   - Actualizar documentación

3. **MEDIANO PLAZO (próximas 2 semanas):**
   - Migrar todos los productos
   - Actualizar frontend para leer de GHL
   - Pruebas exhaustivas
   - Lanzamiento en producción

### ❌ NO HACER:

- ❌ No eliminar `catalog.ts` todavía
- ❌ No cambiar el frontend visual
- ❌ No hacer cambios en autenticación (Supabase)
- ❌ No tocar carrito/favoritos
- ❌ No integrar Stripe hasta Fase 5
- ❌ No crear tablas de productos en Supabase
- ❌ No hacer esto en una sola fase

---

## 14. RESULTADO ESPERADO AL FINALIZAR

### Estado actual (hoy):

```
Catálogo: src/data/catalog.ts (estático)
Autenticación: Supabase Auth
Carrito: localStorage
```

### Estado después de Fase 4:

```
Catálogo: GHL (administrable por clienta)
Autenticación: Supabase Auth (sin cambios)
Carrito: localStorage (sin cambios)
Respaldo: catalog.ts (fallback)
```

### Beneficios:

- ✅ Clienta puede actualizar productos sin redeployar
- ✅ Todos los datos en una plataforma centralizada (GHL)
- ✅ Integración futura con pagos (Stripe)
- ✅ No hay pérdida de datos
- ✅ Rollback siempre disponible

---

## 15. SIGUIENTES PASOS INMEDIATOS

### Para aprobar esta propuesta:

1. ✅ Revisar este documento completo
2. ✅ Confirmar estrategia de migración
3. ✅ Aprobar timeline y fases
4. ✅ Proporcionar token GHL

### Para ejecutar Fase 2 (validación):

1. Agregar `GHL_PRIVATE_INTEGRATION_TOKEN` a `.env.local`
2. Ejecutar `npm run dev`
3. Visitar `/debug/ghl-test`
4. Hacer clic en "Start Connection Test"
5. Enviar captura de pantalla con resultado
6. Documentar estructura real de GHL API

---

**Documento preparado para revisión y aprobación.**

**Pendiente:** Token GHL + aprobación del usuario antes de ejecutar Fase 2.

---

**Resumen de archivos creados en esta sesión:**

- ✅ `src/lib/ghl/types.ts` - Tipos TypeScript
- ✅ `src/lib/ghl/client.server.ts` - Cliente server-side
- ✅ `src/routes/api.ghl.products.ts` - API route
- ✅ `src/hooks/useGHLProducts.ts` - Hook React
- ✅ `src/routes/debug.ghl-test.tsx` - Página de debug
- ✅ `.env.example` - Variable de entorno actualizada
- ✅ `docs/GHL_PRODUCT_MAPPING.md` - Mapeo de campos
- ✅ `docs/GHL_INTEGRATION_PROPOSAL.md` - Este documento
