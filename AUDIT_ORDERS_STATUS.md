# AUDITORÍA: USO DE `orders.status` EN EL PROYECTO

**Fecha:** 2026-08-28  
**Alcance:** Búsqueda exhaustiva de todas las referencias a `orders.status` en el código

---

## 1. VALORES DE STATUS ACTUALMENTE EN USO

### En Supabase (datos reales)

**Valores encontrados:**

- `pending` ← ÚNICO valor actualmente en la base de datos

**Cantidad de órdenes:**

- Múltiples órdenes de prueba con status = "pending"
- Ninguna orden con otros valores

### En Código

**Valores que el código crea/espera:**

1. **Backend - `src/lib/orders.server.ts` línea 147**

   ```typescript
   status: "pending";
   ```
   - ÚNICA creación de órdenes
   - Todas las nuevas órdenes nacen con `pending`

2. **Frontend - `src/routes/confirmation.$orderId.tsx` líneas 116-121**
   ```typescript
   {
     order.status === "pending" && "Pendiente de procesar";
   }
   {
     order.status === "confirmed" && "Confirmado";
   }
   {
     order.status === "preparing" && "En preparación";
   }
   {
     order.status === "ready" && "Listo para envío";
   }
   {
     order.status === "delivered" && "Entregado";
   }
   {
     order.status === "cancelled" && "Cancelado";
   }
   ```

**Valores esperados por el frontend:**

- `pending`
- `confirmed`
- `preparing`
- `ready` ← ⚠️ IMPORTANTE: NO es "ready_for_delivery"
- `delivered`
- `cancelled`

---

## 2. TODOS LOS ARCHIVOS QUE USAN `orders.status`

| Archivo                                | Línea         | Uso                      | Tipo            |
| -------------------------------------- | ------------- | ------------------------ | --------------- |
| `src/lib/orders.server.ts`             | 147           | `status: "pending"`      | Creación        |
| `src/routes/confirmation.$orderId.tsx` | 116-121       | Comparaciones de status  | Lectura/Display |
| `src/integrations/supabase/types.ts`   | 112, 133, 154 | Tipado: `status: string` | Tipos           |

**Total de archivos:** 3

**Total de líneas afectadas:** 5+

---

## 3. INTERFACES Y TIPOS QUE DEPENDEN DE STATUS

### En `src/integrations/supabase/types.ts`

```typescript
// Row (lectura de BD)
Row: {
  status: string  // línea 112
}

// Insert (crear orden)
Insert: {
  status?: string  // línea 133
}

// Update (actualizar orden)
Update: {
  status?: string  // línea 154
}
```

**Características:**

- ✅ `status` es `string` (sin restricciones)
- ✅ Tipo es permisivo (acepta cualquier valor)
- ✅ No hay validación de enum
- ✅ No hay constraint en BD (VARCHAR sin check)

### En `src/lib/orders.server.ts`

```typescript
import type { TablesInsert } from "@/integrations/supabase/types";

// ...
const orderData: TablesInsert<"orders"> = {
  // ...
  status: "pending",
  // ...
};
```

**Características:**

- ✅ Usa `TablesInsert<"orders">`
- ✅ Permite cualquier string (sin validación)
- ✅ Hardcoded como "pending"

---

## 4. DEPENDENCIAS DEL FRONTEND

### Página: `src/routes/confirmation.$orderId.tsx`

**Qué muestra:**

- Extrae `order.status` y lo compara contra 6 valores específicos
- Muestra texto traducido al español para cada estado

**Valores esperados:**

```
pending → "Pendiente de procesar"
confirmed → "Confirmado"
preparing → "En preparación"
ready → "Listo para envío"
delivered → "Entregado"
cancelled → "Cancelado"
```

**Qué pasa si orden tiene status desconocido:**

- No entra en ninguna condición
- No muestra nada (espacio vacío)
- No hay error

**Impacto:** ⚠️ **Moderado**

- Usuario vería espacio en blanco para el estado
- No rompe la página
- Silenciamente ignora valores desconocidos

---

## 5. APIS DE CREACIÓN/ACTUALIZACIÓN DE ÓRDENES

### Creación: POST `/api/orders`

**En `src/lib/orders.server.ts`:**

- ✅ Crea TODAS las órdenes con `status: "pending"`
- ✅ NO valida input de status
- ✅ Ignora cualquier status enviado por cliente
- ✅ Siempre usa "pending" hardcoded

**Importancia:** No hay riesgo de status inesperado via API

### Actualización: Vía webhook (futuro)

**En `src/routes/api.webhooks.ghl-opportunity.ts`** (aún no existe)

- Necesitará validar status
- Necesitará verificar que es uno de los 6 valores

---

## 6. CONVERTIR VARCHAR → ENUM: ¿SEGURO O RIESGOSO?

### Riesgos de hacer `ALTER COLUMN status TYPE order_status`

#### ✅ SEGURO porque:

1. **Solo existe "pending" en BD**
   - Valor ya será válido en nuevo enum
   - No hay datos "rotos"

2. **Frontend ya espera 6 valores**
   - Los valores que webhook enviará son exactamente los que frontend espera
   - No hay gap

3. **No hay lógica dependiente de strings específicos**
   - No hay `LIKE` queries
   - No hay substring searches
   - No hay case-sensitive comparisons

4. **Impacto en aplicación = 0**
   - Backend siempre crea con "pending"
   - Frontend solo lee (enum es invisible a aplicación)

#### ⚠️ CONSIDERACIONES:

1. **Cambio en Supabase es irreversible sin droppping**
   - Pero rollback es trivial (reverse migration)

2. **Requiere migration**
   - No es problema, FASE 4.2 lo hace

3. **Requiere actualizar tipos de Supabase**
   - Auto-generados si usas Supabase CLI

---

## 7. DISCREPANCIA DETECTADA: "ready" vs "ready_for_delivery"

### En Auditoría FASE 4 (tipos propuestos):

```
Listo (GHL) → ready_for_delivery (propuesto)
```

### En Frontend (código actual):

```typescript
{
  order.status === "ready" && "Listo para envío";
}
```

### ¿Cuál usar?

**Frontend usa:** `ready` (línea 119)  
**Auditoría propuso:** `ready_for_delivery` (más explícito)

### Recomendación:

Usar **`ready`** (que es lo que el frontend ya espera)

**Por qué:**

- ✅ Ya está en código existente
- ✅ Más corto
- ✅ Menos riesgo de typos
- ✅ Frontend no necesita cambios

---

## MAPEO FINAL: GHL STAGES → SUPABASE STATUS

| GHL Stage  | Stage ID                             | Descripción      | Supabase Status |
| ---------- | ------------------------------------ | ---------------- | --------------- |
| Recibido   | 1de8d7dc-deac-45a6-a87e-e7198c3ef4a5 | Pedido recibido  | `pending`       |
| Confirmado | a737a3b9-98fd-4446-8f15-eb26333cc6f3 | Confirmado       | `confirmed`     |
| Preparando | 72c6b0eb-a0ae-4cd5-b122-482add4dd6c7 | En preparación   | `preparing`     |
| Listo      | ba7e6913-7173-43cd-9d94-bf66e2add4a1 | Listo para envío | `ready`         |
| Entregado  | 910fc366-8299-49a0-aaf4-99e15558fd07 | Entregado        | `delivered`     |
| Cancelado  | bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed | Cancelado        | `cancelled`     |

**✅ Verificación:**

- ✅ Frontend espera exactamente estos 6 valores
- ✅ Solo "pending" existe en BD (compatible)
- ✅ Mapping es 1:1
- ✅ No hay ambigüedad

---

## RECOMENDACIÓN: ESTRATEGIA MENOS DESTRUCTIVA

### Opción A: VARCHAR con valores documentados (RECOMENDADO)

**Qué hacer:**

1. Mantener campo como VARCHAR(255)
2. NO crear enum en FASE 4.2
3. Documentar 6 valores permitidos en comentario de tabla
4. Validar en webhook (código, no BD)

**Ventajas:**

- ✅ Cero riesgo de ruptura
- ✅ No requiere downtime
- ✅ No afecta datos existentes
- ✅ No requiere re-tipeo en TypeScript
- ✅ Más flexible para cambios futuros

**Desventajas:**

- ❌ Menos validación en BD (pero código valida)
- ❌ Typos no atrapados por Supabase

### Opción B: Convertir a ENUM (más formal)

**Qué hacer:**

1. Crear enum `order_status` en FASE 4.2
2. Migrar "pending" → incluir en enum
3. Alter column para usar enum
4. Regenerar tipos de Supabase

**Ventajas:**

- ✅ Validación en nivel BD
- ✅ Más "tipado"

**Desventajas:**

- ⚠️ Requiere migración
- ⚠️ Requiere recrear tipos
- ⚠️ Más trabajo, mismo resultado funcional

---

## CONCLUSIÓN

### ✅ SEGURO PARA FASE 4

**Recomendación:** Usar **Opción A (VARCHAR documentado)**

**Por qué:**

1. Solo 1 valor existe en BD ("pending") → compatible con los 6 nuevos
2. Frontend ya espera exactamente los 6 valores → sin cambios UI
3. Cero riesgo de ruptura → no necesita downtime
4. Validación en código (webhook) es suficiente
5. Menos complejidad = menos errores

### 🔴 NO hay incompatibilidades bloqueantes

**FASE 4.1 puede proceder seguramente con:**

- Mantener VARCHAR en Supabase (sin cambios en 4.2)
- Crear tipos en código para los 6 estados
- Mapear GHL stage IDs → estos 6 estados
- Frontend ya los soporta (0 cambios necesarios)

### 📋 Recomendación para FASE 4.2

**Si decides hacer FASE 4.2 (Migraciones):**

- Opción: Crear tabla `webhook_events` (ya planeado)
- NO necesario: Convertir `status` a enum
- Mantener simple: Solo agregar `webhook_events` para deduplicación

---

## ARCHIVOS A REVISAR

- ✅ `src/lib/orders.server.ts` (línea 147)
- ✅ `src/routes/confirmation.$orderId.tsx` (líneas 116-121)
- ✅ `src/integrations/supabase/types.ts` (líneas 112, 133, 154)

**Resultado:** 0 modificaciones necesarias para soportar 6 estados

---
