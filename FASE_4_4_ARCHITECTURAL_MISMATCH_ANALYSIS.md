# FASE 4.4 — ANÁLISIS DE INCOMPATIBILIDAD ARQUITECTÓNICA CRÍTICA

**Fecha:** 2026-08-28  
**Status:** 🔴 **ARQUITECTURA INCOMPATIBLE**  
**Severidad:** CRÍTICA  
**Análisis:** Basado en código real del endpoint, NO en suposiciones

---

## RESUMEN EJECUTIVO

**DESCUBRIMIENTO CRÍTICO:** El endpoint actual espera arquitectura **A (Private Integration)** pero el Workflow Webhook creado en HighLevel es arquitectura **B (Workflow HTTP personalizado)**.

**Veredicto:** 🔴 **INCOMPATIBLE - El webhook será RECHAZADO**

**Razón técnica:** El código validará X-GHL-Signature y retornará **401 Unauthorized** antes de procesarlo.

---

## 1. ARQUITECTURA A: PRIVATE INTEGRATION (Lo que el código ESPERA)

### 1.1 Validación Real en Código

**Línea 267:** Lee header específico

```typescript
const signatureHeader = request.headers.get("x-ghl-signature");
```

**Línea 268-272:** Valida firma Ed25519, RECHAZA si falta

```typescript
const isSignatureValid = verifyWebhookSignature(rawBody, signatureHeader);

if (!isSignatureValid) {
  console.warn("[Webhook] Invalid webhook signature from:", ...);
  return json({ error: "Invalid webhook signature" }, { status: 401 });
}
```

**RESULTADO:** Si falta X-GHL-Signature → Retorna **401 UNAUTHORIZED** inmediatamente

---

### 1.2 Estructura Esperada (Post-validación de firma)

**Línea 281:** Valida estructura JSON

```typescript
if (!payload.event || !payload.locationId || !payload.data?.id) {
  return json({ error: "Invalid webhook payload" }, { status: 400 });
}
```

**Línea 228:** Valida webhookId obligatorio

```typescript
if (!payload.webhookId) {
  console.error("[Webhook] Missing webhookId in payload - cannot record event safely");
  return;
}
```

**Línea 322-357:** Solo acepta eventos listados

```typescript
switch (payload.event) {
  case "opportunity.stage_change": { ... }  // ← SOLO ESTE
  case "opportunity.updated":              // Otros no se procesan
  case "opportunity.status_change":
  case "opportunity.created":
  case "opportunity.deleted": {
    console.log(`[Webhook] Event received but not processed: ${payload.event}`);
    ...
  }
  default: {
    console.warn(`[Webhook] Unknown event type: ${payload.event}`);
    ...
  }
}
```

**CAMPOS REQUERIDOS:**

- ✅ `event` = "opportunity.stage_change" (EXACTO)
- ✅ `webhookId` = string (OBLIGATORIO)
- ✅ `locationId` = string (OBLIGATORIO)
- ✅ `data.id` = opportunity ID
- ✅ `data.pipelineId` = pipeline ID
- ✅ `data.newStageId` = stage ID
- ✅ `X-GHL-Signature` header = Ed25519 signature

**Esto es Private Integration:** ✅ Confirmado

---

## 2. ARQUITECTURA B: WORKFLOW WEBHOOK (Lo que HighLevel Workflow envía)

### 2.1 Payload Real del Workflow

**Lo que el usuario reportó que envía:**

```json
{
  "opportunity_id": "...",
  "opportunity_name": "ORD-F3-925445",
  "pipeline_name": "Pedidos Floristería Lucía",
  "stage_name": "Listo",
  "status": "open",
  "lead_value": 99.99,
  "forecast_probability": 80,
  "expected_close_date": "...",
  "lost_reason": null,
  "source": null,
  "assigned_to": "..."
}
```

**Headers:**

```
Content-Type: application/json
Authorization: [token configurado en HighLevel]
```

---

### 2.2 Análisis de Incompatibilidad

**Punto 1: Header de Autenticación**

```
Workflow envía:     Authorization: Bearer token
Código espera:      X-GHL-Signature: Ed25519
```

**Resultado en código:**

```typescript
const signatureHeader = request.headers.get("x-ghl-signature"); // ← Retorna NULL
const isSignatureValid = verifyWebhookSignature(rawBody, null); // ← Retorna FALSE (línea 51)
```

**Línea 49-54:**

```typescript
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null | undefined): boolean {
  if (!signatureHeader) {
    console.warn("[Webhook] Missing X-GHL-Signature header");
    return false;  // ← RECHAZA INMEDIATAMENTE
  }
  ...
}
```

**RESULTADO:** 🔴 **Falla signature verification → Retorna 401**

---

**Punto 2: Estructura del Payload**

```
Workflow envía:     opportunity_id (camelCase, field name)
Código espera:      data.id (nested, structured)

Workflow envía:     sin campo "event"
Código espera:      event: "opportunity.stage_change" (OBLIGATORIO)

Workflow envía:     sin campo "webhookId"
Código espera:      webhookId: string (OBLIGATORIO)

Workflow envía:     sin campo "locationId"
Código espera:      locationId: string (OBLIGATORIO)
```

**Línea 281: Validación de estructura**

```typescript
if (!payload.event || !payload.locationId || !payload.data?.id) {
  return json({ error: "Invalid webhook payload" }, { status: 400 });
}
```

**RESULTADO:** 🔴 **Incluso si saltara el 401, fallaría aquí → Retorna 400**

---

**Punto 3: Campos Utilizados**

| Campo Workflow       | Campo Código               | Presente                         | Compatible |
| -------------------- | -------------------------- | -------------------------------- | ---------- |
| opportunity_id       | payload.data.id            | ❌ NO                            | ❌ NO      |
| opportunity_name     | payload.data.name          | ✅ SÍ (pero es opportunity_name) | ❓ PARCIAL |
| pipeline_name        | payload.data.pipelineId    | ❌ NO (envía nombre, no ID)      | ❌ NO      |
| stage_name           | payload.data.newStageId    | ❌ NO (envía nombre, no ID)      | ❌ NO      |
| status               | payload.data.status        | ✅ SÍ                            | ❓ PARCIAL |
| lead_value           | payload.data.monetaryValue | ❌ NO                            | ❌ NO      |
| forecast_probability | (no usado)                 | -                                | -          |
| expected_close_date  | (no usado)                 | -                                | -          |
| lost_reason          | (no usado)                 | -                                | -          |
| source               | (no usado)                 | -                                | -          |
| assigned_to          | (no usado)                 | -                                | -          |

**RESULTADO:** 🔴 **Campos fundamentales ausentes o incompatibles**

---

## 3. FLUJO REAL DE RECHAZO

Cuando HighLevel Workflow envía su payload al endpoint:

```
1. POST a /api/webhooks/ghl-opportunity
   ↓
2. Línea 264: request.text() → Lee body (OK)
   ↓
3. Línea 267: request.headers.get("x-ghl-signature") → NULL
   ↓
4. Línea 268: verifyWebhookSignature(rawBody, null)
   ↓
5. Línea 51: if (!signatureHeader) { return false; }
   ↓
6. Línea 270-272: if (!isSignatureValid) {
     return json({ error: "Invalid webhook signature" }, { status: 401 });
   }
   ↓
7. 🔴 **RETORNA 401 UNAUTHORIZED**
   ↓
8. HighLevel Workflow recibe 401 → Interpreta como error → Reintenta
   ↓
9. Ciclo infinito de reintentos fallidos
```

**El webhook NUNCA llega a la lógica de procesamiento.**

---

## 4. CAUSAS DE LA INCOMPATIBILIDAD

### 4.1 Decisión Arquitectónica Original

El código fue diseñado para **Private Integration** (FASE 4.3.2):

- Mecanismo de firma Ed25519 (official HighLevel)
- Estructura payload normalizada
- Clave pública hardcoded
- Deduplicación via webhookId UNIQUE

**Ventajas de Private Integration:**
✅ Seguridad criptográfica verificable  
✅ Payload consistente  
✅ Official HighLevel mechanism  
✅ Deduplicación garantizada  
✅ Auditoría con webhookId

---

### 4.2 Workflow Webhook (Alternativa creada)

El Workflow Webhook es un mecanismo diferente:

- Autenticación via Authorization header
- Payload personalizado según configuración
- Campo names como `opportunity_id` (no estándar)
- Sin mecanismo de deduplicación integrado
- Diseñado para automatización, no integración crítica

**Ventajas de Workflow Webhook:**
✅ Fácil de configurar en UI de HighLevel  
✅ No requiere validación criptográfica  
✅ Flexible (campos personalizables)

**Desventajas:**
❌ Menos seguro (solo Authorization header)  
❌ No es mecanismo official  
❌ Payload no estándar  
❌ Requiere parseo manual de nombres  
❌ Sin deduplicación nativa

---

## 5. OPCIONES DE RESOLUCIÓN

### OPCIÓN 1: Modificar HighLevel (Recomendado - TÉCNICAMENTE CORRECTO)

**Acción:** Eliminar Workflow Webhook, usar Private Integration webhook

**Cambios necesarios en HighLevel:**

1. Ir a Settings → Integrations → Webhooks
2. Register webhook (o usar Private Integration)
3. URL: https://floristeria-lucia.vercel.app/api/webhooks/ghl-opportunity
4. Event: opportunity.stage_change
5. HL automáticamente firma con Ed25519

**Cambios necesarios en código:** ✅ NINGUNO
**Ventajas:**

- Código está LISTO (ya implementado)
- Seguridad Ed25519 verificada
- Payload estándar
- Deduplicación operativa
- Auditoría correcta

**Desventajas:** Requiere eliminar Workflow actual

---

### OPCIÓN 2: Modificar Endpoint (NO recomendado - MENOS SEGURO)

**Acción:** Aceptar Authorization header y payload de Workflow

**Cambios necesarios en código:**

1. ❌ Remover validación obligatoria de X-GHL-Signature
2. ❌ Agregar validación de Authorization header
3. ❌ Cambiar parseo de `payload.data.id` a `payload.opportunity_id`
4. ❌ Cambiar parseo de `payload.data.newStageId` a `payload.stage_name`
5. ❌ Implementar mapeo manual: stage_name → stage_id → order_status
6. ❌ Agregar validación de token/API key
7. ❌ Remover deduplicación via webhookId (no disponible)
8. ❌ Cambiar structure de webhook_events table

**Cambios necesarios en código:** 8+ cambios significativos

**Ventajas:** No requiere cambios en HighLevel

**Desventajas:**

- Mayor complejidad de parseo
- Menos seguro (Authorization vs Ed25519)
- Sin deduplicación nativa
- Requiere mantener tabla webhook_events
- Diverge de standard HighLevel
- Más propenso a errores

---

## 6. EVALUACIÓN COMPARATIVA

| Criterio              | Opción 1: Private Int. | Opción 2: Workflow |
| --------------------- | ---------------------- | ------------------ |
| **Cambios en código** | 0                      | 8+                 |
| **Cambios en HL**     | 1 (registrar webhook)  | 0                  |
| **Seguridad**         | ✅ Ed25519             | ⚠️ Authorization   |
| **Estándar HL**       | ✅ Official            | ❌ Personalizado   |
| **Complejidad**       | ✅ Baja                | ❌ Alta            |
| **Deduplicación**     | ✅ Integrada           | ❌ Manual          |
| **Mantenibilidad**    | ✅ Alta                | ❌ Baja            |
| **Futuro-proofing**   | ✅ Sí                  | ❌ No              |
| **Risk**              | ✅ Bajo                | ❌ Alto            |

---

## 7. RECOMENDACIÓN TÉCNICA

### 🏆 **OPCIÓN 1: Modificar HighLevel (RECOMENDADA)**

**Razones:**

1. **Código ya está implementado** para Private Integration
2. **Seguridad superior** con Ed25519
3. **Estándar official de HighLevel**
4. **Menor mantenimiento** a largo plazo
5. **Cero cambios en código**
6. **Auditoría y deduplicación integradas**

**Cambios específicos necesarios:**

```
EN HIGHLEVEL:
1. Ir a: Settings → Integrations → Webhooks
2. Eliminar: Workflow Webhook (o lo que esté)
3. Crear: New Webhook Registration
   - URL: https://floristeria-lucia.vercel.app/api/webhooks/ghl-opportunity
   - Event: opportunity.stage_change
   - Method: POST
   - Auth: Automático (Ed25519)
4. Guardar y probar

EN CÓDIGO:
- ✅ No requiere cambios
- ✅ El endpoint ya está listo
```

---

## 8. SI SE ELIGIERA OPCIÓN 2 (NO RECOMENDADO)

**Cambios específicos necesarios en código:**

### Cambio 1: Remover validación de firma

```typescript
// REMOVE:
const signatureHeader = request.headers.get("x-ghl-signature");
const isSignatureValid = verifyWebhookSignature(rawBody, signatureHeader);
if (!isSignatureValid) {
  return json({ error: "Invalid webhook signature" }, { status: 401 });
}

// ADD:
const authHeader = request.headers.get("authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return json({ error: "Missing or invalid Authorization" }, { status: 401 });
}
const token = authHeader.substring(7);
// Validar token contra lista whitelist
```

### Cambio 2: Cambiar estructura de parseo

```typescript
// REMOVE:
const parsedPayload = JSON.parse(rawBody) as GHLOpportunityWebhookPayload;

// ADD:
const workflowPayload = JSON.parse(rawBody) as WorkflowWebhookPayload;
const parsedPayload = {
  event: "opportunity.stage_change",
  webhookId: crypto.randomUUID(), // Generar UUID (sin deduplicación real)
  locationId: workflowPayload.location_id || "vOq7yOWR63XGU4qQ7XWd",
  data: {
    id: workflowPayload.opportunity_id,
    contactId: workflowPayload.contact_id || "",
    pipelineId: "KHKXOKLuYXPLQlkjc0aq",
    oldStageId: "unknown",
    newStageId: mapStageName(workflowPayload.stage_name), // ← PARSEO MANUAL
    stageName: workflowPayload.stage_name,
    name: workflowPayload.opportunity_name,
    monetaryValue: workflowPayload.lead_value,
    customFields: [], // NO INCLUIDO EN WORKFLOW
  },
};
```

### Cambio 3: Agregar función de mapeo

```typescript
// NUEVA FUNCIÓN:
function mapStageName(stageName: string): string {
  const mapping: Record<string, string> = {
    Recibido: "1de8d7dc-deac-45a6-a87e-e7198c3ef4a5",
    Confirmado: "a737a3b9-98fd-4446-8f15-eb26333cc6f3",
    Preparando: "72c6b0eb-a0ae-4cd5-b122-482add4dd6c7",
    Listo: "ba7e6913-7173-43cd-9d94-bf66e2add4a1",
    Entregado: "910fc366-8299-49a0-aaf4-99e15558fd07",
    Cancelado: "bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed",
  };
  return mapping[stageName] || "";
}
```

### Cambio 4: Remover deduplicación (webhookId no disponible)

```typescript
// REMOVE o BYPASS:
if (webhookId) {
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id, processed")
    .eq("delivery_id", webhookId)
    .single();

  if (existingEvent) { ... }
}
```

**Total: 4+ cambios significativos + nuevas funciones + testing**

---

## VEREDICTO FINAL

```
🔴 ARQUITECTURA INCOMPATIBLE

El Workflow Webhook SERÁ RECHAZADO con 401 Unauthorized.

🏆 OPCIÓN RECOMENDADA: Opción 1 (Private Integration)
   - 0 cambios en código
   - 1 acción manual en HighLevel
   - Seguridad superior
   - Mantenibilidad a largo plazo
```

---

## PRÓXIMOS PASOS (A ESPERAR CONFIRMACIÓN)

**SI confirmas Opción 1 (recomendada):**

1. ✅ Código está listo (no requiere cambios)
2. ✅ Eliminar Workflow Webhook actual en HighLevel
3. ✅ Registrar Private Integration webhook en HighLevel Dashboard
4. ✅ Realizar prueba de cambio de stage

**SI confirmas Opción 2 (no recomendada):**

1. ❌ Requiere modificaciones extensas al endpoint
2. ❌ Requiere nuevas funciones de mapeo
3. ❌ Requiere changes a tabla webhook_events
4. ❌ Requiere testing completo

---

**Análisis completado:** 2026-08-28 22:30 UTC  
**Base:** Análisis de código real línea por línea  
**Recomendación:** Opción 1 (Private Integration via HighLevel)  
**Confianza:** 100% (basado en código fuente)
