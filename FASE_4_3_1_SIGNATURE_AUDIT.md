# FASE 4.3.1 — AUDITORÍA CRÍTICA: VERIFICACIÓN DE MECANISMO DE FIRMA

**Fecha:** 2026-08-28  
**Estado:** 🔴 BLOQUEANTE — REQUIERE VERIFICACIÓN OFICIAL

---

## RESUMEN EJECUTIVO

⚠️ **HALLAZGO CRÍTICO:** La implementación actual del mecanismo de firma de webhooks GHL en `src/routes/api.webhooks.ghl-opportunity.ts` **NO HA SIDO VERIFICADA** contra documentación oficial de GHL API v3.

**Evidencia:**
```typescript
/**
 * @see https://docs.gohighlevel.com/webhooks (assumed - verify with GHL docs)
 */
```

**Status:** La palabra "assumed" (asumido) confirma que el mecanismo NO fue verificado oficialmente.

**Impacto:** Si el mecanismo real de GHL difiere del implementado:
- Todos los webhooks serán rechazados (401 Unauthorized)
- Los webhooks NO se procesarán
- Las órdenes NO se actualizarán
- FASE 4.4 fallará completamente

---

## MECANISMO IMPLEMENTADO (ACTUAL)

### En `src/routes/api.webhooks.ghl-opportunity.ts`

```typescript
function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  // Expects header: X-GHL-Signature: sha256=<hash>
  
  const signatureParts = signatureHeader.split("=");
  // Expected format: ["sha256", "<hash>"]
  
  if (signatureParts[0] !== "sha256") {
    return false; // Rejects if not sha256
  }
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(bodyString)
    .digest("hex");
    
  // Timing-safe comparison
  return crypto.timingSafeEqual(headerBuffer, expectedBuffer);
}
```

### Supuestos Implementados

| Aspecto | Implementación Actual | Fuente |
|---------|----------------------|--------|
| Header Name | `X-GHL-Signature` | Código (no verificado) |
| Header Format | `sha256=<hex_hash>` | Código (no verificado) |
| Algoritmo | HMAC-SHA256 | Auditoría FASE 4 (no verificado) |
| Body | Raw (no JSON-parseado) | Código (no verificado) |
| Secret | `GHL_WEBHOOK_SECRET` env var | Diseño FASE 4 (no verificado) |
| Comparación | `crypto.timingSafeEqual()` | Security best practice |

---

## CONTRADICCIÓN: deliveryId

### Definiciones en el Código

#### FASE 4.1 — Types (`src/lib/ghl/types.ts`)
```typescript
export type GHLOpportunityStageChangeWebhook = {
  event: "opportunity.stage_change";
  deliveryId?: string;  // ← OPCIONAL (?)
  timestamp?: string;
  locationId: string;
  // ...
};
```

**Estado:** `deliveryId` es OPCIONAL en los tipos.

#### FASE 4.2 — Migración (`webhook_events` table)
```sql
delivery_id VARCHAR(255) UNIQUE NOT NULL
```

**Estado:** `delivery_id` es **REQUIRED** en BD (NOT NULL).

#### FASE 4.3 — Implementación
```typescript
// En recordWebhookEvent():
delivery_id: payload.deliveryId || crypto.randomUUID(),

// Si deliveryId falta → generar UUID aleatorio
```

**Estado:** Si `deliveryId` falta, se genera UUID como fallback.

### Problema: Dos Comportamientos Contradictorios

**Escenario 1:** GHL SIEMPRE envía `deliveryId` (es garantizado)
- ✅ Tipos deberían ser `deliveryId: string` (NO optional)
- ✅ Migración correcta: `delivery_id NOT NULL`
- ✅ Fallback UUID es innecesario (nunca se ejecutará)
- ⚠️ Pero si alguna vez falta, el UUID enmascarará el problema

**Escenario 2:** GHL AVECES NO envía `deliveryId` (es optional)
- ⚠️ Tipos correctos: `deliveryId?: string`
- ⚠️ Pero migración es incorrecta: `delivery_id NOT NULL` forzaría inserción de UUIDs generados
- ⚠️ Eso rompe la garantía de deduplicación (no es delivery_id real de GHL)
- 🔴 **SEGURIDAD COMPROMETIDA:** Dos webhooks diferentes podrían generar dos UUIDs diferentes pero ser considerados "duplicados" si llegan en cierto orden

**Escenario 3:** GHL PODRÍA NO enviar `deliveryId` en futuros tipos de eventos
- ⚠️ Estaría oculto por el UUID auto-generado
- 🔴 Riesgo de procesamiento duplicado silencioso

---

## INVESTIGACIÓN REQUERIDA

### Pregunta 1: ¿Cuál es el mecanismo REAL de autenticación de webhooks en GHL v3?

**Lo que necesito verificar:**

1. **Header Name:**
   - ¿Es realmente `X-GHL-Signature`?
   - ¿O es `X-Signature`, `Authorization`, `X-Webhook-Signature`, otro?
   - ¿Es case-sensitive?

2. **Formato del Value:**
   - ¿Es `sha256=<hash>`?
   - ¿O es solo `<hash>` (sin prefijo `sha256=`)?
   - ¿O es `Bearer <token>`?
   - ¿O otro formato?

3. **Algoritmo:**
   - ¿Es HMAC-SHA256?
   - ¿O HMAC-SHA1, SHA256, HMAC-SHA512, u otro?

4. **Body:**
   - ¿Se calcula sobre raw request body (bytes crudos)?
   - ¿O sobre JSON parseado?
   - ¿O sobre JSON serializado (puede diferir del raw body por whitespace)?

5. **Secret Source:**
   - ¿De dónde se obtiene el secret?
   - ¿GHL Dashboard → Webhooks → Create → Secret generado?
   - ¿O es derivado de otro token?
   - ¿Es único por webhook o por location?

6. **Documentación Oficial:**
   - URL oficial de documentación
   - Versión/fecha de última actualización
   - Ejemplos de código verificados

### Pregunta 2: ¿Qué es `deliveryId` y cuál es su garantía?

1. **Presencia:**
   - ¿GHL SIEMPRE incluye `deliveryId` en el payload?
   - ¿O es opcional en algunos eventos?

2. **Unicidad:**
   - ¿Es `deliveryId` único global (nunca se repite)?
   - ¿O es único por location/account?
   - ¿Qué sucede si GHL reintenta? ¿Reutiliza el mismo `deliveryId`?

3. **Comportamiento de Reintentos:**
   - Si GHL no recibe 200 OK, ¿reintenta?
   - ¿Reutiliza el mismo `deliveryId`?
   - ¿Cuántos reintentos?
   - ¿Cada cuánto tiempo?

---

## ANÁLISIS: CÓDIGO EXISTENTE (GHL Product Webhook)

En `src/routes/api.webhooks.ghl-product.ts`:

```typescript
function validateWebhook(
  _body: unknown,
  _headers: Headers
): boolean {
  // TODO: Implement GHL webhook signature verification
  // For now, basic validation that event has required structure
  return true;  // ← SIEMPRE retorna true (NO verifica firma)
}
```

**Hallazgo:** El endpoint de webhooks de productos de GHL **NO implementa verificación de firma**, solo tiene un TODO.

**Implicación:** 
- La implementación de firma en FASE 4.3 es la PRIMERA vez que se implementa esto
- No hay "patrón establecido" en el código
- Está basado ÚNICAMENTE en auditoría + asunción (assumed)

---

## ESTADO ACTUAL vs DOCUMENTACIÓN OFICIAL

| Componente | Implementado | Verificado Oficialmente | Risk |
|-----------|------------|----------------------|------|
| Header Name | X-GHL-Signature | ❌ NO | 🔴 CRÍTICO |
| Format | sha256=<hash> | ❌ NO | 🔴 CRÍTICO |
| Algoritmo | HMAC-SHA256 | ❌ NO | 🔴 CRÍTICO |
| Raw Body | Sí | ❌ NO | 🔴 CRÍTICO |
| Secret | GHL_WEBHOOK_SECRET | ❌ NO | 🔴 CRÍTICO |
| deliveryId Obligatorio | No (has fallback) | ❌ NO | 🟡 ALTO |
| deliveryId Único | Asumido | ❌ NO | 🟡 ALTO |

---

## PLAN DE VERIFICACIÓN

### Opción A: Verificación Oficial (RECOMENDADO)

**Acción:**

1. Acceder a documentación oficial de GoHighLevel API v3:
   - https://docs.gohighlevel.com/webhooks (o URL correcta)
   - O contactar soporte técnico de GHL

2. Buscar sección "Webhook Security" o "Signature Verification"

3. Verificar EXACTAMENTE:
   - Header name y format
   - Algoritmo de firma
   - Cómo calcular la firma (raw body, encoding, etc.)
   - Cómo obtener el secret
   - Comportamiento de reintentos
   - Presencia/unicidad de deliveryId

4. Tomar capturas/documentar evidencia oficial

5. Comparar LÍNEA POR LÍNEA con la implementación

6. Registrar discrepancias

### Opción B: Verificación Empírica (Fallback)

Si documentación oficial no está disponible:

1. Registrar webhook test en GHL (FASE 4.4)
2. Enviar webhook de prueba desde GHL Dashboard
3. Inspeccionar headers y payload reales
4. Comparar contra implementación
5. Ajustar si es necesario

**Riesgo:** Esto expone la implementación a una webhook real; si falla, GHL podría interpretar fallo como "permanently broken" después de reintentos

---

## RECOMENDACIONES PRELIMINARES

### Sobre la Firma

**Basado en el código actual + auditoría:**

La implementación PARECE correcta para el patrón estándar de webhooks (HMAC-SHA256 + X-Signature header), pero **NO ES VERIFICADO**.

**Recomendación:**
- ✅ Mantener la implementación actual COMO ESTÁ (es sound security design)
- ⚠️ Pero MARCAR CLARAMENTE en el código que necesita verificación oficial
- 🔴 NO proceder a FASE 4.4 sin verificación

### Sobre deliveryId

**Problema identificado:**
- Tipos dicen "optional" (?)
- Migración dice "NOT NULL"
- Código genera UUID de fallback

**Esto es INCONSISTENTE y POTENCIALMENTE INSEGURO.**

**Recomendación:**

Opción 1 (Recomendada si GHL garantiza deliveryId):
```typescript
// CAMBIO en FASE 4.1 types:
export type GHLOpportunityStageChangeWebhook = {
  deliveryId: string;  // ← REQUERIDO (no optional)
  // ...
};

// CAMBIO en FASE 4.3 endpoint:
// Eliminar fallback UUID
if (!payload.deliveryId) {
  return json({ error: "Missing deliveryId" }, { status: 400 });
}
```

Opción 2 (Si GHL NO garantiza deliveryId):
```typescript
// CAMBIO en FASE 4.2 migración:
-- Drop NOT NULL constraint, aceptar NULL
delivery_id VARCHAR(255) UNIQUE NULL,

-- O usar composite key:
delivery_id_and_timestamp_unique UNIQUE (delivery_id, received_at)
```

---

## VERIFICACIÓN REQUERIDA ANTES DE PROCEDER

**BLOQUEANTE para FASE 4.4:**

- [ ] Confirmar header name oficial de GHL
- [ ] Confirmar formato de firma (sha256=... o solo hash?)
- [ ] Confirmar algoritmo (HMAC-SHA256 u otro)
- [ ] Confirmar si body es raw o serializado
- [ ] Confirmar si deliveryId es SIEMPRE presente
- [ ] Confirmar si deliveryId es GLOBALMENTE único
- [ ] Documentar evidencia (links a docs GHL, versión, fecha)

**Si hay discrepancias:**

- [ ] Listar cambios necesarios
- [ ] Estimar impacto
- [ ] Solicitar autorización
- [ ] Implementar mínimos cambios
- [ ] Re-verificar con build

**Si NO hay discrepancias:**

- [ ] Proceder a FASE 4.4
- [ ] Registrar webhook en GHL
- [ ] Hacer test

---

## CHECKLIST ACTUAL vs OFICIAL

### Mecanismo Implementado
```
Header: X-GHL-Signature
Format: sha256=<hex_hash>
Algorithm: HMAC-SHA256(raw_body, secret)
Comparison: crypto.timingSafeEqual()
```

### Mecanismo Necesario
```
[PENDIENTE VERIFICACIÓN OFICIAL]
```

---

## SIGUIENTE PASO

**DETENERSE AQUÍ hasta que:**

1. ✅ Documentación oficial de GHL sea consultada
2. ✅ Mecanismo de firma sea CONFIRMADO
3. ✅ deliveryId garantía sea CONFIRMADA
4. ✅ Discrepancias sean IDENTIFICADAS
5. ✅ Cambios necesarios sean AUTORIZADOS

**NO ejecutar:**
- ❌ npm run build (hasta que cambios sean aprobados)
- ❌ Registrar webhook en GHL (FASE 4.4)
- ❌ Testing
- ❌ Migrar a producción

---

## CONCLUSIÓN

**Veredicto:** 🔴 **REQUIERE CORRECCIÓN ANTES DE FASE 4.4**

La implementación está basada en asunciones NO VERIFICADAS. Aunque el patrón implementado es sound (HMAC-SHA256 es estándar), no puede avanzarse sin confirmación oficial.

**Acción requerida:** Verificar documentación oficial de GHL y confirmar mecanismo de firma antes de proceder.

---

**Status:** BLOQUEANTE  
**Responsable:** Usuario debe verificar documentación GHL  
**Impacto si no se verifica:** FASE 4.4 fallará con 401 errors, webhooks no procesarán  

