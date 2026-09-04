# FASE 4.1 — TIPOS Y MAPEO WEBHOOKS GHL OPPORTUNITY

**Fecha:** 2026-08-28  
**Estado:** ✅ COMPLETADO

---

## RESUMEN EJECUCIÓN

FASE 4.1 implementada exitosamente con tipos tipados y mapping para webhooks de Opportunity de GHL.

---

## 1. ARCHIVO MODIFICADO

**Único archivo modificado:**

- ✅ `src/lib/ghl/types.ts`

**Líneas agregadas:** 123 (líneas 79-201)  
**Modificaciones a código existente:** 0  
**Archivos nuevos:** 0

---

## 2. TIPOS AGREGADOS

### 1. **Mapping GHL Stage ID → Supabase Order Status**

````typescript
export const GHL_STAGE_TO_ORDER_STATUS = {
  "1de8d7dc-deac-45a6-a87e-e7198c3ef4a5": "pending",      // Recibido
    "a737a3b9-98fd-4446-8f15-eb26333cc6f3": "confirmed",    // Confirmado
      "72c6b0eb-a0ae-4cd5-b122-482add4dd6c7": "preparing",    // Preparando
        "ba7e6913-7173-43cd-9d94-bf66e2add4a1": "ready",        // Listo
          "910fc366-8299-49a0-aaf4-99e15558fd07": "delivered",    // Entregado
            "bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed": "cancelled",    // Cancelado
            } as const;
            ```

            **Características:**
            - ✅ Mapping tipado con `as const`
            - ✅ Todos los 6 Stage IDs de GHL incluidos
            - ✅ Values coinciden exactamente con lo que espera frontend

            ### 2. **Enum de Estados de Orden**

            ```typescript
            export type OrderStatus =
              | "pending"
                | "confirmed"
                  | "preparing"
                    | "ready"
                      | "delivered"
                        | "cancelled";
                        ```

                        **Características:**
                        - ✅ Discriminated union (más seguro que string)
                        - ✅ 6 valores válidos solamente
                        - ✅ Coincide con frontend (confirmation.$orderId.tsx)
                        - ⚠️ **NOTA:** Usa `ready` NO `ready_for_delivery`

                        ### 3. **Webhook Payload Types**

                        #### A. **GHLOpportunityStageChangeWebhook**
                        ```typescript
                        export type GHLOpportunityStageChangeWebhook = {
                          event: "opportunity.stage_change";
                            deliveryId?: string;
                              timestamp?: string;
                                locationId: string;
                                  data: {
                                      id: string;
                                          contactId: string;
                                              pipelineId: string;
                                                  oldStageId: string;
                                                      newStageId: string;
                                                          stageName?: string;
                                                              name: string;
                                                                  monetaryValue?: number;
                                                                      status?: string;
                                                                          customFields?: Array<...>;
                                                                            };
                                                                            };
                                                                            ```

                                                                            **Campos:**
                                                                            - ✅ `event`: "opportunity.stage_change" (literal)
                                                                            - ✅ `deliveryId`: Para deduplicación de webhooks (opcional, GHL puede incluir)
                                                                            - ✅ `timestamp`: Timestamp del evento (opcional)
                                                                            - ✅ `locationId`: Location ID de GHL
                                                                            - ✅ `oldStageId` / `newStageId`: Para tracking de cambio
                                                                            - ✅ `customFields`: Array con nuestros 9 campos personalizados

                                                                            #### B. **GHLOpportunityUpdatedWebhook**
                                                                            ```typescript
                                                                            export type GHLOpportunityUpdatedWebhook = {
                                                                              event: "opportunity.updated";
                                                                                deliveryId?: string;
                                                                                  timestamp?: string;
                                                                                    locationId: string;
                                                                                      data: GHLOpportunity;
                                                                                      };
                                                                                      ```

                                                                                      **Características:**
                                                                                      - ✅ Reutiliza tipo `GHLOpportunity` existente
                                                                                      - ✅ Para cambios genéricos de opportunity
                                                                                      - ✅ Puede cambiar múltiples campos

                                                                                      #### C. **GHLOpportunityStatusChangeWebhook**
                                                                                      ```typescript
                                                                                      export type GHLOpportunityStatusChangeWebhook = {
                                                                                        event: "opportunity.status_change";
                                                                                          deliveryId?: string;
                                                                                            timestamp?: string;
                                                                                              locationId: string;
                                                                                                data: {
                                                                                                    id: string;
                                                                                                        oldStatus?: string;
                                                                                                            newStatus?: string;
                                                                                                                // ... otros campos
                                                                                                                  };
                                                                                                                  };
                                                                                                                  ```

                                                                                                                  **Características:**
                                                                                                                  - ✅ Para cambios de status (open, won, lost, abandoned)
                                                                                                                  - ✅ Incluye antes/después del cambio

                                                                                                                  ### 4. **Union Type para Todos los Webhooks**

                                                                                                                  ```typescript
                                                                                                                  export type GHLOpportunityWebhookPayload =
                                                                                                                    | GHLOpportunityStageChangeWebhook
                                                                                                                      | GHLOpportunityUpdatedWebhook
                                                                                                                        | GHLOpportunityStatusChangeWebhook;
                                                                                                                        ```

                                                                                                                        **Uso:** Discriminated union para switch en webhook handler (futuro)

                                                                                                                        ### 5. **Utilidades de Conversión**

                                                                                                                        ```typescript
                                                                                                                        export function getOrderStatusFromGHLStage(stageId: string): OrderStatus | undefined
                                                                                                                        ```

                                                                                                                        **Características:**
                                                                                                                        - ✅ Toma Stage ID de GHL
                                                                                                                        - ✅ Retorna status de Supabase o undefined
                                                                                                                        - ✅ Type-safe (retorna `OrderStatus | undefined`)
                                                                                                                        - ✅ Listo para usar en webhook handler

                                                                                                                        ```typescript
                                                                                                                        export function isValidOrderStatus(status: unknown): status is OrderStatus
                                                                                                                        ```

                                                                                                                        **Características:**
                                                                                                                        - ✅ Type guard para validar status
                                                                                                                        - ✅ Acepta cualquier valor desconocido
                                                                                                                        - ✅ Retorna true si es uno de los 6 valores válidos
                                                                                                                        - ✅ Narrowing de tipos automático

                                                                                                                        ---

                                                                                                                        ## 3. MAPPING GHL → SUPABASE

                                                                                                                        | GHL Stage | Stage ID | Descripción | Supabase Status |
                                                                                                                        |-----------|----------|-------------|-----------------|
                                                                                                                        | Recibido | `1de8d7dc-deac-45a6-a87e-e7198c3ef4a5` | Pedido recibido | `pending` |
                                                                                                                        | Confirmado | `a737a3b9-98fd-4446-8f15-eb26333cc6f3` | Confirmado | `confirmed` |
                                                                                                                        | Preparando | `72c6b0eb-a0ae-4cd5-b122-482add4dd6c7` | En preparación | `preparing` |
                                                                                                                        | Listo | `ba7e6913-7173-43cd-9d94-bf66e2add4a1` | Listo para envío | `ready` |
                                                                                                                        | Entregado | `910fc366-8299-49a0-aaf4-99e15558fd07` | Entregado | `delivered` |
                                                                                                                        | Cancelado | `bedbab33-62f0-41fd-b51e-a6b2ad0aa8ed` | Cancelado | `cancelled` |

                                                                                                                        **✅ Verificación:**
                                                                                                                        - ✅ Mapping es 1:1
                                                                                                                        - ✅ Todos los 6 stages mapeados
                                                                                                                        - ✅ Values coinciden con frontend
                                                                                                                        - ✅ Field names es exacto de GHL

                                                                                                                        ---

                                                                                                                        ## 4. VALORES DE STATUS UTILIZADOS

                                                                                                                        ```
                                                                                                                        "pending"      ← Estado inicial (coincide con Supabase actual)
                                                                                                                        "confirmed"    ← Nueva
                                                                                                                        "preparing"    ← Nueva
                                                                                                                        "ready"        ← Nueva (frontend ya lo espera)
                                                                                                                        "delivered"    ← Nueva
                                                                                                                        "cancelled"    ← Nueva
                                                                                                                        ```

                                                                                                                        **Total:** 6 valores (todos documentados, ninguno inventado)

                                                                                                                        ---

                                                                                                                        ## 5. RESULTADO DEL BUILD

                                                                                                                        ```
                                                                                                                        ✓ built in 7.56s (Cliente)
                                                                                                                        ✓ built in 5.17s (SSR)
                                                                                                                        ✓ built in 2.58s (Nitro)

                                                                                                                        TypeScript Errors: 0 ✅
                                                                                                                        TypeScript Warnings: 0 ✅
                                                                                                                        Build Status: SUCCESS ✅
                                                                                                                        ```

                                                                                                                        **Verificación adicional:**
                                                                                                                        - ✅ No hay `as any` en archivo modificado
                                                                                                                        - ✅ No hay tipos `any` implicitos
                                                                                                                        - ✅ Todos los tipos son estrictos
                                                                                                                        - ✅ Union types discriminadas

                                                                                                                        ---

                                                                                                                        ## 6. ARCHIVOS QUE NO FUERON MODIFICADOS

                                                                                                                        | Archivo | Status | Razón |
                                                                                                                        |---------|--------|-------|
                                                                                                                        | `src/lib/orders.server.ts` | ✅ No modificado | Aún no necesario para FASE 4.1 |
                                                                                                                        | `src/routes/confirmation.$orderId.tsx` | ✅ No modificado | Frontend ya soporta estos estados |
                                                                                                                        | `src/integrations/supabase/types.ts` | ✅ No modificado | Tipos auto-generados, se actualizarán en FASE 4.2 si necesario |
                                                                                                                        | `src/routes/api.webhooks.ghl-product.ts` | ✅ No modificado | Patrón existente, no necesario para FASE 4.1 |
                                                                                                                        | Supabase (BD) | ✅ No modificado | VARCHAR mantenido, sin enum |
                                                                                                                        | Migraciones SQL | ✅ No creado | Estrategia sin enum decidida |

                                                                                                                        ---

                                                                                                                        ## 7. CAMPOS DEL WEBHOOK

                                                                                                                        ### Confirmados en Payload GHL (stage_change)

                                                                                                                        | Campo | Tipo | Requerido | Descripción |
                                                                                                                        |-------|------|-----------|-------------|
                                                                                                                        | `event` | string | ✅ | Literal: "opportunity.stage_change" |
                                                                                                                        | `locationId` | string | ✅ | ID de ubicación en GHL |
                                                                                                                        | `deliveryId` | string | ❌ | ID único de entrega (para deduplicación) |
                                                                                                                        | `timestamp` | string | ❌ | ISO timestamp del evento |
                                                                                                                        | `data.id` | string | ✅ | Opportunity ID |
                                                                                                                        | `data.contactId` | string | ✅ | Contact ID |
                                                                                                                        | `data.pipelineId` | string | ✅ | Pipeline ID |
                                                                                                                        | `data.oldStageId` | string | ✅ | Stage anterior |
                                                                                                                        | `data.newStageId` | string | ✅ | Stage nuevo |
                                                                                                                        | `data.stageName` | string | ❌ | Nombre del stage |
                                                                                                                        | `data.name` | string | ✅ | Nombre de la oportunidad |
                                                                                                                        | `data.monetaryValue` | number | ❌ | Valor monetario |
                                                                                                                        | `data.status` | string | ❌ | Status (open, won, lost, abandoned) |
                                                                                                                        | `data.customFields` | array | ❌ | Nuestros 9 campos personalizados |

                                                                                                                        **Nota sobre fields opcionales:**
                                                                                                                        - `deliveryId` y `timestamp` marcados como opcionales (GHL puede no incluir)
                                                                                                                        - Si GHL incluye, serán utilizados
                                                                                                                        - Si no, el webhook funciona sin ellos

                                                                                                                        ---

                                                                                                                        ## RESUMEN TÉCNICO

                                                                                                                        ### ✅ LO QUE SE LOGRÓ

                                                                                                                        1. **Tipos estrictos para webhooks**
                                                                                                                           - 3 tipos de webhook especializados
                                                                                                                              - 1 union type discriminada
                                                                                                                                 - Cobertura completa de eventos

                                                                                                                                 2. **Mapping tipado GHL ↔ Supabase**
                                                                                                                                    - 6 Stage IDs mapeados
                                                                                                                                       - 6 Status values definidos
                                                                                                                                          - Funciones auxiliares para conversión

                                                                                                                                          3. **Sin `as any`**
                                                                                                                                             - Tipado completo
                                                                                                                                                - Type guards incluidas
                                                                                                                                                   - Validación en nivel de tipos

                                                                                                                                                   4. **Frontend compatible**
                                                                                                                                                      - Valores coinciden exactamente
                                                                                                                                                         - `ready` (no `ready_for_delivery`)
                                                                                                                                                            - Sin cambios necesarios en UI

                                                                                                                                                            5. **Supabase compatible**
                                                                                                                                                               - VARCHAR mantenido
                                                                                                                                                                  - Sin enum (estrategia sin migración)
                                                                                                                                                                     - Validación en código

                                                                                                                                                                     ### 📋 PRÓXIMO PASO

                                                                                                                                                                     **Aguardando autorización para FASE 4.2**
                                                                                                                                                                     - Crear tabla `webhook_events` para deduplicación
                                                                                                                                                                     - Crear migraciones SQL

                                                                                                                                                                     **NO proceder sin autorización explícita**

                                                                                                                                                                     ---

                                                                                                                                                                     ## ARCHIVOS DISPONIBLES PARA REFERENCIA

                                                                                                                                                                     - ✅ `src/lib/ghl/types.ts` — Archivo modificado (FASE 4.1)
                                                                                                                                                                     - ✅ `AUDIT_FASE_4_WEBHOOKS.md` — Auditoría técnica completa
                                                                                                                                                                     - ✅ `AUDIT_ORDERS_STATUS.md` — Análisis de uso de status
                                                                                                                                                                     - ✅ `FASE_4_1_REPORTE.md` — Este documento

                                                                                                                                                                     ---

                                                                                                                                                                     ## CHECKLIST FASE 4.1

                                                                                                                                                                     - ✅ Solo `src/lib/ghl/types.ts` modificado
                                                                                                                                                                     - ✅ 0 archivos nuevos creados
                                                                                                                                                                     - ✅ 0 migraciones SQL creadas
                                                                                                                                                                     - ✅ 0 endpoints creados
                                                                                                                                                                     - ✅ 0 datos de prueba creados
                                                                                                                                                                     - ✅ No hay `as any` en código
                                                                                                                                                                     - ✅ Todos los tipos estrictamente tipados
                                                                                                                                                                     - ✅ Build exitoso sin errores
                                                                                                                                                                     - ✅ Mapping GHL → Supabase completo
                                                                                                                                                                     - ✅ Frontend compatible (sin cambios)
                                                                                                                                                                     - ✅ Supabase compatible (sin cambios)

                                                                                                                                                                     ---

                                                                                                                                                                     **FASE 4.1 COMPLETADA EXITOSAMENTE** ✅

                                                                                                                                                                     Aguardando autorización para FASE 4.2.


````
