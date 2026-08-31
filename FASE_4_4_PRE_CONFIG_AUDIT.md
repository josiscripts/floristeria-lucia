# FASE 4.4 — AUDITORÍA PRE-CONFIGURACIÓN

**Fecha:** 2026-08-28  
**Status:** 🔴 DISCREPANCIA DETECTADA

---

## DIAGNÓSTICO

### 1. ENDPOINT ACTUAL

**Archivo:** `src/routes/api.webhooks.ghl-opportunity.ts`  
**Método:** POST  
**Ruta:** `/api/webhooks/ghl-opportunity`  
**URL Pública:** `https://floristeria-lucia.vercel.app/api/webhooks/ghl-opportunity`

**Status:** ✅ Existe y funciona

---

### 2. EVENTO ESPERADO POR CÓDIGO

**En tipos:** `src/lib/ghl/types.ts` línea 123
```typescript
export type GHLOpportunityStageChangeWebhook = {
  event: "opportunity.stage_change";  // ← EVENTO ESPERADO
  webhookId: string;
  locationId: string;
  data: { oldStageId, newStageId, ... };
};
```

**Evento esperado por endpoint:** `"opportunity.stage_change"` (dot-notation, con underscore)

**Status:** Definido en código

---

### 3. DISCREPANCIA: DOCUMENTACIÓN OFICIAL HL vs CÓDIGO

#### Según documentación oficial actual de HighLevel:
- Webhooks de Marketplace OAuth Apps se configuran en: `Marketplace App → Advanced Settings → Webhooks`
- Evento para cambio de stage: `OpportunityStageUpdate` (CamelCase, sin underscore)
- Payload incluye: `webhookId`, `X-GHL-Signature` (Ed25519), etc.

#### Según código actual (FASE 4.3.2):
- Espera evento: `opportunity.stage_change` (dot-notation, con underscore)
- Maneja: `webhookId`, `X-GHL-Signature` (Ed25519) ✅

**Discrepancia:** Nombre del evento NO coincide

---

### 4. TIPO DE INTEGRACIÓN

**Según auditoría FASE 4:**
```
Token actual: pit-0cf65f40-51a4-4e28-9793-9eb8421e2291 (Private Integration)
Location ID: vOq7yOWR63XGU4qQ7XWd
```

**Configuración actual:** Private Integration (NO Marketplace OAuth App)

**Implicación:** 
- Los webhooks se configuran en: GHL Dashboard → Settings → Integrations → Webhooks
- No en Marketplace App settings

**Status:** 🔴 DISCREPANCIA - La documentación que consultó el usuario es para Marketplace Apps, pero el código está usando Private Integration

---

### 5. ESTRUCTURA DE PAYLOAD ESPERADA

**En código:** `GHLOpportunityStageChangeWebhook` (tipo discriminado por evento)

```typescript
{
  event: "opportunity.stage_change",
  webhookId: string,
  timestamp?: string,
  locationId: string,
  data: {
    id: string,                    // opportunity ID
    contactId: string,
    pipelineId: string,
    oldStageId: string,
    newStageId: string,
    stageName?: string,
    name: string,
    monetaryValue?: number,
    status?: string,
    customFields?: Array<{fieldId, value}>,
  }
}
```

**Validación:** Estructura parece correcta para Private Integration

---

### 6. AUTENTICACIÓN/FIRMA

**Configuración actual:**
- Ed25519 ✅
- X-GHL-Signature header ✅
- Clave pública oficial hardcoded ✅
- NO usa GHL_WEBHOOK_SECRET ✅ (correcto para Public Key)

**Status:** ✅ Correcto

---

### 7. WORKFLOW ACTUALMENTE CONFIGURADO

**Búsqueda:** ¿Existe algún Workflow en HighLevel configurado?

**Status:** 🔍 Desconocido (usuario debe verificar en HL Dashboard)

**Necesidad:** Depende de la integración:
- Private Integration: NO requiere Workflow (webhooks se disparan automáticamente)
- Marketplace OAuth App: Podría requerir Workflow

---

### 8. MARKETPLACE APP vs PRIVATE INTEGRATION

**Conclusión:** El código está diseñado para **Private Integration**, NO para Marketplace OAuth App

**Evidencia:**
1. Token en auditoría es Private Integration (`pit-...`)
2. No hay referencias a OAuth
3. La estructura de payload corresponde a Private Integration
4. La documentación que consultó el usuario es para Marketplace Apps (diferente mecanismo)

**Status:** 🔴 CONFUSIÓN - Hay dos tipos de integración con diferentes eventos/configuraciones

---

## ANÁLISIS DE DISCREPANCIAS

### Discrepancia 1: Nombre del Evento
- **Documentación Marketplace App:** `OpportunityStageUpdate`
- **Código actual:** `opportunity.stage_change`
- **Integración actual:** Private Integration
- **Resolución:** Verificar qué evento usa Private Integration (probablemente `opportunity.stage_change`)

### Discrepancia 2: Lugar de Configuración
- **Documentación Marketplace App:** Marketplace App → Advanced Settings → Webhooks
- **Código actual:** Preparado para cualquier webhook que envíe HL
- **Integración actual:** Private Integration
- **Resolución:** Configurar en GHL Dashboard (Settings → Integrations), no en Marketplace App

### Discrepancia 3: Documentación Consultada
- **Usuario consultó:** Documentación de Marketplace OAuth Apps
- **Código usa:** Private Integration
- **Status:** Dos universos diferentes de documentación

---

## PREGUNTAS CRÍTICAS SIN RESPUESTA

1. ❓ ¿La Private Integration también se puede registrar en "GHL Dashboard Settings"?
2. ❓ ¿El evento para Private Integration es `opportunity.stage_change` o `OpportunityStageUpdate`?
3. ❓ ¿La Private Integration envía `webhookId` en el payload?
4. ❓ ¿La firma es Ed25519 en ambas integraciones?
5. ❓ ¿Existe un Workflow configurado actualmente en HighLevel?
6. ❓ ¿Se cambió recientemente de Private Integration a Marketplace OAuth App?

---

## RECOMENDACIÓN

**ALTO:** No proceder a registrar webhook hasta clarificar:

1. **¿Cuál es la integración oficial del proyecto?**
   - Private Integration: token `pit-...`
   - Marketplace OAuth App: diferentes credenciales
   
2. **¿Qué evento se debe registrar?**
   - `opportunity.stage_change` (Private Integration)
   - `OpportunityStageUpdate` (Marketplace App)

3. **¿Dónde se configura el webhook?**
   - GHL Dashboard → Settings (Private)
   - Marketplace App → Advanced Settings (OAuth)

---

## PRÓXIMO PASO

**Usuario debe responder:**

1. ¿Qué tipo de integración está usando Floristería Lucía?
   - [ ] Private Integration (token = `pit-...`)
   - [ ] Marketplace OAuth App
   - [ ] No sé

2. Si es Private Integration:
   - Verificar en GHL Dashboard qué eventos están disponibles
   - Confirmar nombre exacto del evento para stage changes
   - Confirmar si payload incluye `webhookId`

3. Si es Marketplace OAuth App:
   - El código necesitaría actualizar el tipo de evento
   - Ubicación de configuración es diferente

---

## CONCLUSIÓN

🔴 **NO PROCEDER A CONFIGURAR WEBHOOK**

Existe una confusión entre dos tipos de integración de HighLevel con diferentes:
- Ubicaciones de configuración
- Nombres de eventos
- Estructuras de payload

**Requiere clarificación antes de registrar.**

