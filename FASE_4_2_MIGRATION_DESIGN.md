# FASE 4.2 — DISEÑO DE MIGRACIÓN WEBHOOK_EVENTS

**Estado:** 🔍 DISEÑO PENDIENTE DE APROBACIÓN (NO EJECUTADO AÚN)

---

## VERIFICACIÓN PREVIA

✅ **Tabla `webhook_events` NO existe previamente**  
✅ **No hay migraciones webhook previas**  
✅ **Tabla `orders` NO será modificada**  
✅ **Datos existentes NO serán modificados**

---

## SQL A EJECUTAR

```sql
-- ============================================
-- FASE 4.2: Create webhook_events table
-- Date: 2026-08-28
-- Purpose: Store GHL webhook events for deduplication and audit
-- ============================================

-- Drop existing table if it exists (idempotent)
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- Create webhook_events table
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook identification (for deduplication)
  delivery_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- GHL resource identifiers
  opportunity_id VARCHAR(255) NOT NULL,
  location_id VARCHAR(255) NOT NULL,
  contact_id VARCHAR(255) NULL,

  -- Link to orders table (if available)
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Complete webhook payload (for audit trail)
  payload JSONB NOT NULL,

  -- Processing state
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP NULL,
  error_message TEXT NULL,

  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT webhook_events_event_type_check
    CHECK (event_type IN (
      'opportunity.stage_change',
      'opportunity.updated',
      'opportunity.status_change',
      'opportunity.created',
      'opportunity.deleted'
    ))
);

-- Create indexes for performance
CREATE INDEX idx_webhook_delivery_id ON public.webhook_events(delivery_id);
CREATE INDEX idx_webhook_processed ON public.webhook_events(processed);
CREATE INDEX idx_webhook_opportunity ON public.webhook_events(opportunity_id);
CREATE INDEX idx_webhook_order ON public.webhook_events(order_id);
CREATE INDEX idx_webhook_received_at ON public.webhook_events(received_at);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: service_role can do everything
CREATE POLICY webhook_events_service_role_all
  ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON public.webhook_events TO service_role;

-- Add comment for clarity
COMMENT ON TABLE public.webhook_events IS
  'Stores incoming GHL webhook events for deduplication, audit, and idempotent processing. '
  'Key: delivery_id UNIQUE constraint ensures webhook idempotence.';

COMMENT ON COLUMN public.webhook_events.delivery_id IS
  'Unique event ID from GHL (required for deduplication). '
  'GHL sends this field in event payload; UNIQUE constraint prevents duplicate processing.';

COMMENT ON COLUMN public.webhook_events.payload IS
  'Complete webhook payload as sent by GHL (JSONB for flexible querying and audit).';

COMMENT ON COLUMN public.webhook_events.processed IS
  'Flag indicating if webhook has been successfully processed.';
```

---

## TABLA RESULTANTE

### Estructura

| Columna          | Tipo         | Nulo | Clave  | Descripción                                    |
| ---------------- | ------------ | ---- | ------ | ---------------------------------------------- |
| `id`             | UUID         | No   | PK     | Identificador único del registro               |
| `delivery_id`    | VARCHAR(255) | No   | UNIQUE | ID único del evento GHL (deduplicación)        |
| `event_type`     | VARCHAR(100) | No   | CHECK  | Tipo de evento (stage_change, updated, etc.)   |
| `opportunity_id` | VARCHAR(255) | No   | -      | ID de la oportunidad en GHL                    |
| `location_id`    | VARCHAR(255) | No   | -      | ID de la ubicación en GHL                      |
| `contact_id`     | VARCHAR(255) | Sí   | -      | ID del contacto en GHL (si disponible)         |
| `order_id`       | UUID         | Sí   | FK     | Vinculo a orden en Supabase (rellenar después) |
| `payload`        | JSONB        | No   | -      | Payload completo del webhook (audit)           |
| `processed`      | BOOLEAN      | No   | -      | ¿Se procesó exitosamente?                      |
| `processed_at`   | TIMESTAMP    | Sí   | -      | Cuándo se procesó                              |
| `error_message`  | TEXT         | Sí   | -      | Mensaje de error si falló                      |
| `received_at`    | TIMESTAMP    | No   | -      | Cuándo se recibió el webhook                   |
| `created_at`     | TIMESTAMP    | No   | -      | Creado en                                      |
| `updated_at`     | TIMESTAMP    | No   | -      | Actualizado en                                 |

### Índices

| Índice                    | Columna(s)       | Propósito                          |
| ------------------------- | ---------------- | ---------------------------------- |
| `idx_webhook_delivery_id` | `delivery_id`    | Búsqueda rápida para deduplicación |
| `idx_webhook_processed`   | `processed`      | Filtrar webhooks no procesados     |
| `idx_webhook_opportunity` | `opportunity_id` | Buscar por oportunidad GHL         |
| `idx_webhook_order`       | `order_id`       | Buscar por orden Supabase          |
| `idx_webhook_received_at` | `received_at`    | Filtrar por fecha recepción        |

### RLS y Permisos

| Componente | Detalle                                                          |
| ---------- | ---------------------------------------------------------------- |
| RLS        | ✅ Habilitado                                                    |
| Política   | `service_role` puede hacer TODO (SELECT, INSERT, UPDATE, DELETE) |
| Permisos   | `GRANT ALL` a `service_role`                                     |
| Público    | ❌ NO permite acceso (RLS protege)                               |

---

## VERIFICACIONES PRE-EJECUCIÓN

### ✅ NO modifica tabla `orders`

- No hay ALTER TABLE orders
- No hay UPDATE orders
- Solo CREATE TABLE webhook_events

### ✅ NO modifica columna `orders.status`

- No hay modificación de tipo
- No hay conversión a enum
- VARCHAR mantenido

### ✅ NO modifica datos existentes

- Solo crea tabla nueva
- No hay INSERT/UPDATE/DELETE en otras tablas
- Datos existentes intactos

### ✅ Deduplicación segura

**Mecanismo:** `delivery_id` UNIQUE constraint

**Garantía:** GHL jamás puede insertar dos eventos con mismo `delivery_id`

- Si reintenta delivery_id duplicado → ERROR (no se procesa)
- Si es evento nuevo con delivery_id distinto → Se inserta normalmente

### ✅ Idempotencia confirmada

**Flujo:**

1. Webhook llega con `delivery_id = "abc123"`
2. Primer intento: INSERT → OK, webhook_events.id = uuid1
3. GHL reintenta con mismo `delivery_id`
4. Segundo intento: INSERT → UNIQUE violation (delivery_id existe)
5. Código en webhook handler:
   - Captura error
   - Busca registro existente
   - Si `processed = true` → devuelve 200 OK (ya procesado)
   - Si `processed = false` → reintenta procesamiento

---

## RELACIÓN CON TABLA `orders`

### Vinculación (DESPUÉS de procesar webhook)

**Flujo propuesto:**

1. Webhook recibido → INSERT webhook_event (delivery_id, opportunity_id)
2. Buscar en Supabase: `orders.ghl_opportunity_id = opportunity_id`
3. Si encontrada → UPDATE webhook_events SET order_id = found_order.id
4. Procesar: crear/actualizar orden en Supabase
5. Actualizar: webhook_events.processed = true

**Foreign Key:** `order_id` es NULLABLE porque:

- Webhook puede llegar antes de que la orden exista
- O la oportunidad puede no estar vinculada a orden
- RLS en orders protege acceso

---

## FÓRMULA DE DEDUPLICACIÓN

```
IF webhook con delivery_id X ya procesado:
  ├─ UNIQUE constraint previene duplicate INSERT
  └─ Código detecta y devuelve 200 OK (idempotente)

ELSE (webhook nuevo):
  ├─ INSERT webhook_event
  ├─ Procesar
  ├─ UPDATE processed = true
  └─ Devolver 200 OK
```

**Garantía:** No hay duplicados, no hay efectos secundarios de reintentos

---

## CÓMO EJECUTAR

### Paso 1: Copiar SQL

Copiar el bloque SQL completo anterior.

### Paso 2: En Supabase SQL Editor

1. Ir a Supabase Dashboard
2. SQL Editor → New Query
3. Pegar SQL completo
4. Ejecutar (Run)

### Paso 3: Verificar

```sql
-- Verificar tabla creada
SELECT * FROM information_schema.tables
WHERE table_name = 'webhook_events';

-- Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename = 'webhook_events';

-- Verificar RLS
SELECT * FROM pg_policies
WHERE tablename = 'webhook_events';
```

---

## ROLLBACK (si es necesario)

```sql
DROP TABLE IF EXISTS public.webhook_events CASCADE;
```

Esto eliminará:

- Tabla webhook_events
- Todos los índices
- Todas las políticas RLS
- Todos los datos almacenados

**Impacto:** SOLO webhook_events. Tabla orders intacta.

---

## RESUMEN EJECUTIVO

### ✅ LO QUE SE CREA

- 1 tabla nueva: `webhook_events`
- 5 índices para performance
- 1 política RLS para seguridad
- UNIQUE constraint en `delivery_id` para deduplicación

### ❌ LO QUE NO SE MODIFICA

- Tabla `orders` (intacta)
- Columna `orders.status` (intacta, VARCHAR)
- Datos existentes (sin cambios)
- Otros tables (sin cambios)

### 🔒 SEGURIDAD

- ✅ RLS habilitado
- ✅ service_role permisos completos
- ✅ Público NO puede acceder
- ✅ Foreign key cascading (orden eliminada → webhook_events limpio)

### 🚀 RENDIMIENTO

- ✅ Índices en campos críticos (delivery_id, processed, opportunity_id)
- ✅ JSONB para payload (queries flexibles)
- ✅ Sin N+1 queries gracias a índices

---

## SIGUIENTE PASO

**Aguardando tu confirmación explícita de:**

1. ✅ SQL es correcto
2. ✅ Tabla webhook_events se creará como se describe
3. ✅ Tabla orders NO se modificará
4. ✅ Datos existentes NO se modificarán

Una vez confirmado, ejecutaremos manualmente en Supabase SQL Editor.
