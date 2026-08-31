# AUDITORÍA FASE 4 — WEBHOOKS GHL PARA OPPORTUNITIES

**Fecha:** 2026-08-28  
**Estado:** AUDITORÍA (SIN CAMBIOS)  
**Proyecto:** Floristería Lucía - E-Commerce

---

## 1. WEBHOOKS GHL — SOPORTE Y CAPACIDADES

### ✅ Soporte de Webhooks

- GHL API v3 tiene soporte completo para webhooks
- Token actual (`pit-0cf65f40-51a4-4e28-9793-9eb8421e2291`) es Private Integration
- Location ID (`vOq7yOWR63XGU4qQ7XWd`) debe estar configurada para webhooks

### Eventos de Opportunities Disponibles

1. **opportunity.created** - Cuando se crea nueva oportunidad
2. **opportunity.updated** - Cuando cambian valores
3. **opportunity.deleted** - Cuando se elimina
4. **opportunity.status_change** - Cuando cambia status (open, won, lost, abandoned)
5. **opportunity.stage_change** - Cuando cambia de stage dentro del pipeline ← **MÁS IMPORTANTE**

### Cambios Recibibles

| Cambio | Recibible | Evento |
|--------|-----------|--------|
| Pipeline | ✅ Sí | opportunity.updated |
| Status | ✅ Sí | opportunity.status_change |
| Stage | ✅ Sí | opportunity.stage_change |
| Otros campos | ✅ Sí | opportunity.updated |

---

## 2. ARQUITECTURA ACTUAL DEL PROYECTO

### Estructura de Directorios

```
src/
├── lib/
│   ├── ghl/
│   │   ├── types.ts (tipos de GHL)
│   │   └── client.server.ts (funciones GHL)
│   └── orders.server.ts (funciones de órdenes)
├── routes/
│   ├── api.webhooks.ghl-product.ts ← PATRÓN EXISTING
│   ├── api.orders.ts
│   └── api.confirmation.ts
└── integrations/supabase/
```

### Tabla Orders en Supabase (ACTUAL)

```
id (UUID, PK)
order_number (VARCHAR(20))
customer_name, customer_email, customer_phone
ghl_contact_id (VARCHAR(255) NULL)
ghl_opportunity_id (VARCHAR(255) NULL) ← Recién agregado ✓
status (VARCHAR) ← Campo a actualizar desde webhook
address, city, postal_code, country
subtotal, total, delivery_date, dedicatory, notes
created_at, updated_at, deleted_at
```

### Variables de Entorno (ACTUAL)

```
SUPABASE_URL ✓
SUPABASE_SERVICE_ROLE_KEY ✓
GHL_PRIVATE_INTEGRATION_TOKEN ✓
GHL_LOCATION_ID ✓
GHL_WEBHOOK_SECRET ← FALTA (para verificar firma)
```

---

## 3. ENDPOINT WEBHOOK PARA OPPORTUNITIES

### Ubicación Recomendada

**Archivo:** `src/routes/api.webhooks.ghl-opportunity.ts`  
**Ruta:** `POST /api/webhooks/ghl-opportunity`

### Patrón a Seguir

Base: `src/routes/api.webhooks.ghl-product.ts` (ya existe)

### Autenticación/Verificación

GHL usa **firma HMAC-SHA256** en header:

```
X-GHL-Signature: sha256=<hash>
```

Algoritmo:
1. Tomar raw request body (no JSON parseado)
2. Calcular: HMAC-SHA256(body, GHL_WEBHOOK_SECRET)
3. Comparar con header X-GHL-Signature

### Protección contra Requests Falsos

```typescript
function validateWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Manejo de Errores

| Caso | Respuesta |
|------|-----------|
| Validación fallida | 401 Unauthorized |
| Payload inválido | 400 Bad Request |
| Opportunity no encontrada | 200 OK (con log) |
| Error de BD | 200 OK (con log) |
| Éxito | 200 OK |

**REGLA CRÍTICA:** Siempre devolver 200 OK a GHL (excepto 401/403 por validación)

### Respuesta HTTP

```json
{
  "success": true,
  "event": "opportunity.stage_change",
  "opportunityId": "gDfRAWhIp0dJ7TVO1G0D",
  "orderId": "80c4de72-f4d6-460f-9864-142b6aab559f",
  "previousStatus": "pending",
  "newStatus": "confirmed",
  "timestamp": "2026-08-28T14:35:00Z"
}
```

---

## 4. MAPEO GHL → SUPABASE (IDENTIFICADOR)

### Estrategia 3-Layer

**Capa 1 (Rápida):**
```sql
SELECT * FROM orders WHERE ghl_opportunity_id = 'gDfRAWhIp0dJ7TVO1G0D'
```

**Capa 2 (Fallback):**
```
Extraer WWKLWHR7EUDeGPi7zlOH del customFields del webhook
SELECT * FROM orders WHERE id = customField.value
```

**Capa 3:**
```
NO usar order_number (peligro de actualizar orden equivocada)
```

---

## 5. MAPEO DE ESTADOS GHL → SUPABASE

### Estados GHL (Stages actuales)

| Stage ID | Nombre | Descripción |
|----------|--------|-------------|
| 1de8d7dc-deac-45a6-a87e-e7198c3ef4a5 | Recibido | Pedido recibido |
| a737a3b9-98fd-4446-8f15-eb26333cc6f3 | Confirmado | Pedido confirmado |
| 72c6b0eb-a0ae-4cd5-b122-482add4dd6c7 | Preparando | En preparación |
| ba7e6913-7173-43cd-9d94-bf66e2add4a1 | Listo | Listo para envío |
| 910fc366-8299-49a0-aaf4-99e15558fd07 | Entregado | Entregado |
| bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed | Cancelado | Cancelado |

### Estados Supabase (PROPUESTA)

```
pending ← (actual)
confirmed (nuevo)
preparing (nuevo)
ready_for_delivery (nuevo)
delivered (nuevo)
cancelled (nuevo)
```

### Mapeo directo

```
Stage → Status en Supabase

1de8d7dc... → pending
a737a3b9... → confirmed
72c6b0eb... → preparing
ba7e6913... → ready_for_delivery
910fc366... → delivered
bedbab33... → cancelled
```

---

## 6. IDEMPOTENCIA — ESTRATEGIA

### Problema

GHL puede enviar el mismo webhook múltiples veces por retry, redeployment, etc.

### Solución: webhook_delivery_id

GHL envía en cada payload:
```json
{
  "deliveryId": "webhook_delivery_1234567890",
  "event": "opportunity.stage_change",
  ...
}
```

### Flujo de Deduplicación

```
1. Recibir webhook
   ↓
2. Buscar delivery_id en webhook_events
   ├─ Si EXISTE y processed=true → Devolver 200 (ya procesado)
   ├─ Si EXISTE y processed=false → Continuar (reintentos)
   └─ Si NO EXISTE → Insertar registro
       ↓
3. Actualizar order status
   ↓
4. Marcar webhook_events.processed=true
   ↓
5. Devolver 200 OK
```

---

## 7. SEGURIDAD — VERIFICACIÓN DE WEBHOOK

### Qué Verificar

1. **Firma HMAC-SHA256** (X-GHL-Signature header)
2. **Estructura del payload** (campos requeridos)
3. **Timestamp** (no mayor a 5 minutos de antigüedad - futuro)

### Dónde Guardar GHL_WEBHOOK_SECRET

- **.env.local** (desarrollo)
- **Vercel Secrets** (producción)
- **NUNCA en código**
- **NUNCA en git**

### Si Firma Inválida

1. Registrar intento
2. Devolver 401 Unauthorized
3. GHL reintentará después

---

## 8. LOGGING — ESTRATEGIA

### Qué Loguear

✅ Webhook recibido (event, deliveryId, opportunityId)  
✅ Orden encontrada (orderId)  
✅ Cambio de estado (previousStatus → newStatus)  
✅ Resultado de actualización (success/error)  

### Qué NO Loguear

✗ customer_email (sensible)  
✗ Webhook payload completo (demasiado grande)  
✗ Raw body (puede contener secrets)

---

## 9. MIGRACIÓN SUPABASE — NECESIDADES

### ❌ NO SE CREA TODAVÍA (auditoría solo)

### ✅ Necesaria — Migración 1: Expandir enum de status

```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready_for_delivery',
  'delivered',
  'cancelled'
);

ALTER TABLE orders
  ALTER COLUMN status TYPE order_status USING status::order_status;
```

### ✅ Necesaria — Migración 2: Tabla webhook_events

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  opportunity_id VARCHAR(255) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_delivery_id ON webhook_events(delivery_id);
```

### ✅ Necesaria — Migración 3: RLS en webhook_events

```sql
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_service_role_all 
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

GRANT ALL PRIVILEGES ON webhook_events TO service_role;
```

---

## 10. LIMITACIONES CONOCIDAS DE GHL

⚠️ **Reintento automático:** GHL reintentar si recibe 5xx (máx 5 reintentos)  
⚠️ **Payload incompleto:** opportunity.updated puede no incluir valores anteriores  
⚠️ **Latencia de delivery:** 1-5 segundos, no garantizado  
⚠️ **Orden de eventos:** Si A→B→C rápidamente, puede llegar C antes que B  
⚠️ **Sin GET /webhooks/{id}:** No hay histórico automático de entrega  
⚠️ **Custom fields limitados:** >50 campos no se incluyen en payload  

---

## 11. PLAN DE IMPLEMENTACIÓN FASE 4

### FASE 4.1 — EXTENSIÓN DE TIPOS Y MAPEO

**Qué se modifica:**
- `src/lib/ghl/types.ts` (agregar tipos de webhook)
- `src/lib/ghl/client.server.ts` (agregar utilidades de mapeo)

**Archivos nuevos:** Ninguno  
**Endpoint:** N/A (tipos solo)  
**Test:** Verificar tipos compilan

---

### FASE 4.2 — MIGRACIÓN DE BASE DE DATOS

**Qué se modifica:**
- `supabase/migrations/20260829_expand_order_status_enum.sql` (NEW)
- `supabase/migrations/20260829_create_webhook_events_table.sql` (NEW)

**Endpoint:** N/A (migraciones solo)  
**Test:** Ejecutar en Supabase, verificar tablas

---

### FASE 4.3 — ENDPOINT WEBHOOK

**Qué se modifica:**
- `src/routes/api.webhooks.ghl-opportunity.ts` (NEW)
- `.env.local` (agregar `GHL_WEBHOOK_SECRET` - manual del usuario)

**Endpoint:** `POST /api/webhooks/ghl-opportunity`  
**Test:** Curl test sin datos reales

---

### FASE 4.4 — REGISTRO DE WEBHOOK EN GHL

**Qué se modifica:** Configuración en GHL Dashboard (manual del usuario)

**Pasos manuales:**
1. GHL Dashboard → Settings → Integrations → Webhooks
2. Create Webhook
   - URL: `https://tu-dominio.com/api/webhooks/ghl-opportunity`
   - Events: `opportunity.stage_change` (+ otros si quiere)
   - Secret: Copiar y guardar en `.env.local` como `GHL_WEBHOOK_SECRET`
3. Test webhook desde GHL
4. Verificar en logs

---

### FASE 4.5 — INTEGRACIÓN CON ORDEN Y TESTING

**Qué se modifica:**
- `test_fase4_e2e.py` (NEW - test script)
- Potencial: `src/lib/orders.server.ts` (si hay efectos secundarios)

**Endpoint:** `POST /api/webhooks/ghl-opportunity`

**Test E2E:**
1. Crear orden de prueba
2. Cambiar stage en GHL Dashboard
3. Verificar orden actualizada en Supabase
4. Verificar logs
5. Simular reintento (webhook 2x)
6. Verificar idempotencia

---

## RESUMEN EJECUTIVO

### ✅ AUDITORÍA COMPLETADA

**Hallazgos principales:**
1. GHL tiene soporte completo para webhooks de opportunities
2. Arquitectura actual puede soportar webhooks sin cambios mayores
3. Necesarias 3 migraciones Supabase (enum status, webhook_events, RLS)
4. Endpoint se crea en nuevo archivo `api.webhooks.ghl-opportunity.ts`
5. Identificador seguro: `ghl_opportunity_id` + fallback a custom field
6. Estados mapeables directamente entre GHL stages y Supabase
7. Idempotencia vía `webhook_events.delivery_id` deduplication
8. Seguridad vía HMAC-SHA256 signature verification
9. **No hay limitaciones bloqueantes identificadas**

### ❌ NO EJECUTADO

- Ninguna modificación de código
- Ninguna migración
- Ningún webhook registrado
- Ningún dato creado/modificado

### ✅ SIGUIENTE PASO

Aguardando autorización para proceder con **FASE 4.1** (extensión de tipos)

---
