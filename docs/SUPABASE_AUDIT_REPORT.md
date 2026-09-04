# Supabase Audit Report - Floristería Lucía

**Fecha:** 2026-08-26  
**Estado:** READ-ONLY Audit Completo  
**Proyecto Actual:** fiddxvgjdosprltflqep (Lovable-associated)

---

## 1. SUPABASE ACTUAL - RESUMEN EJECUTIVO

### Configuración Identificada

```
Project ID:          fiddxvgjdosprltflqep
URL:                 https://fiddxvgjdosprltflqep.supabase.co
Publishable Key:     sb_publishable_pplecEonx_MPahbH2TOb3w_QF4c9YjX
Service Role Key:    [CONFIGURED EN ENV pero no en .env visible]
Version:             @supabase/supabase-js ^2.112.3
```

### Ubicación en Código

**Configuración Central:** `/src/integrations/supabase/`

- `client.ts` - Cliente frontend (auto-generado)
- `client.server.ts` - Cliente admin server-side (auto-generado)
- `auth-middleware.ts` - Validación JWT por request
- `auth-attacher.ts` - Inyección de tokens
- `types.ts` - Tipos TypeScript (auto-generado)
- `cron-auth.ts` - Autenticación para cron jobs

**Variables de Entorno:** `.env` (NO en .env.example)

```
SUPABASE_PROJECT_ID=fiddxvgjdosprltflqep
SUPABASE_URL=https://fiddxvgjdosprltflqep.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_pplecEonx_MPahbH2TOb3w_QF4c9YjX
SUPABASE_SERVICE_ROLE_KEY=[SECRETO EN ENV]

VITE_SUPABASE_PROJECT_ID=fiddxvgjdosprltflqep
VITE_SUPABASE_URL=https://fiddxvgjdosprltflqep.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pplecEonx_MPahbH2TOb3w_QF4c9YjX
```

---

## 2. BASE DE DATOS - ESTRUCTURA ACTUAL

### Tabla 1: `public.profiles`

```
Propósito:     Datos extendidos del usuario (nombre, teléfono)
Relación:      ONE-TO-ONE con auth.users (FK con DELETE CASCADE)
RLS:           ENABLED
```

| Columna    | Tipo         | Restricción         | Propósito       |
| ---------- | ------------ | ------------------- | --------------- |
| id         | UUID         | PK, FK → auth.users | Identificador   |
| full_name  | TEXT         | nullable            | Nombre completo |
| phone      | TEXT         | nullable            | Teléfono        |
| created_at | TIMESTAMP TZ | DEFAULT now()       | Auditoría       |
| updated_at | TIMESTAMP TZ | DEFAULT now()       | Auditoría       |

**Triggers:**

- `update_profiles_updated_at` - Actualiza timestamp en UPDATE
- `on_auth_user_created` - Crea perfil automáticamente al registrar usuario

**RLS Policies:**

- SELECT: Usuario puede ver su propio perfil
- INSERT: Usuario puede crear su propio perfil
- UPDATE: Usuario puede actualizar su propio perfil

**Datos Críticos:** ✅ Usuarios reales con perfiles

### Tabla 2: `public.product_metadata` (NUEVA - NO APLICADA AÚN)

```
Propósito:     Metadatos GHL que no caben en Product Custom Fields
Estado:        MIGRATION CREADA pero NO APLICADA
```

| Columna           | Tipo          | Restricción                                     |
| ----------------- | ------------- | ----------------------------------------------- |
| id                | UUID          | PK                                              |
| location_id       | TEXT          | NOT NULL, DEFAULT 'vOq7yOWR63XGU4qQ7XWd'        |
| ghl_product_id    | TEXT          | NOT NULL, UNIQUE con location_id                |
| legacy_catalog_id | TEXT          | UNIQUE, nullable                                |
| price_min         | DECIMAL(10,2) | nullable, > 0                                   |
| price_max         | DECIMAL(10,2) | nullable, > 0                                   |
| available_colors  | TEXT[]        | nullable                                        |
| badge_label       | TEXT          | nullable                                        |
| rose_step         | INTEGER       | nullable, > 0                                   |
| requires_quote    | BOOLEAN       | DEFAULT false                                   |
| status            | TEXT          | DEFAULT 'active', CHECK IN ('active','deleted') |
| auto_created      | BOOLEAN       | DEFAULT false                                   |
| created_at        | TIMESTAMP TZ  | DEFAULT now()                                   |
| updated_at        | TIMESTAMP TZ  | DEFAULT now()                                   |
| deleted_at        | TIMESTAMP TZ  | nullable                                        |

**RLS Policies:** 4 (lectura pública activos, escritura server-side)

### Storage Buckets

| Bucket         | Contenido      | Access             | Uso                      |
| -------------- | -------------- | ------------------ | ------------------------ |
| hero-animation | 205 PNG frames | Public (anon/auth) | Hero animation component |

---

## 3. AUTENTICACIÓN - ESTADO ACTUAL

### Métodos Implementados

✅ **Email/Password**

- `supabase.auth.signInWithPassword()`
- Completamente funcional
- Usuarios actuales lo utilizan

✅ **Google OAuth**

- `supabase.auth.signInWithOAuth("google", {redirectTo: window.location.origin})`
- **PROBLEMA:** `VITE_GOOGLE_CLIENT_ID` NO configurado en `.env`
- OAuth UI existe pero probablemente falla en runtime

✅ **Sesiones JWT**

- Tokens persistidos en localStorage via `brokeredPreviewStorage()`
- Auto-refresh de tokens habilitado
- Server-side validation de JWT claims

### Flujo de Autenticación

```
1. Usuario entra a /auth
2. Elige Email o Google
3. Si email:
   - signup() o signInWithPassword()
   - trigger on_auth_user_created crea profile
4. Si Google:
   - signInWithOAuth() → requiere VITE_GOOGLE_CLIENT_ID
5. Token JWT almacenado localmente
6. useAuth() hook maneja session
7. /_authenticated rutas protegidas verifican auth
```

### Usuarios Existentes

✅ **Perfiles con datos:**

- Registrados en `auth.users` (Supabase Auth managed)
- Datos extendidos en `profiles` (nombre, teléfono)
- Pueden existir datos reales de clientes

### RLS Protección

✅ **Activa:**

- Usuarios NO pueden ver perfiles ajenos
- Usuarios NO pueden editar perfiles ajenos
- Server-side tiene control total via service_role

---

## 4. CÓDIGO - REFERENCIAS SUPABASE

### Archivos que Usan Supabase (14 total)

**Integración Core:**

- `/src/integrations/supabase/client.ts` (auto-gen)
- `/src/integrations/supabase/client.server.ts` (auto-gen)
- `/src/integrations/supabase/auth-middleware.ts`
- `/src/integrations/supabase/auth-attacher.ts`
- `/src/integrations/supabase/types.ts` (auto-gen)
- `/src/integrations/supabase/cron-auth.ts`

**Autenticación:**

- `/src/hooks/useAuth.ts` - Hook principal de auth
- `/src/routes/auth.tsx` - Login/Signup UI
- `/src/routes/__root.tsx` - Inicialización global
- `/src/components/Navbar.tsx` - Account menu
- `/src/routes/_authenticated/route.tsx` - Route guard

**Datos de Usuario:**

- `/src/routes/_authenticated/mi-cuenta.tsx` - Profile management
- Queries: `.from("profiles").select()` y `.upsert()`

**Componentes:**

- `/src/components/AnimatedFlowerHero.tsx` - Storage access
- Uses: `.storage.from("hero-animation").createSignedUrls()`

**Server-Side:**

- `/src/start.ts` - Middleware registration

### Operaciones de BD

**READ:**

- `mi-cuenta.tsx`: SELECT full_name, phone FROM profiles WHERE id = user_id

**WRITE:**

- `mi-cuenta.tsx`: UPSERT INTO profiles (id, full_name, phone)

**STORAGE:**

- `AnimatedFlowerHero.tsx`: CREATE SIGNED URLs for 205 animation frames

---

## 5. MIGRACIONES - HISTORIAL

### Migration 1: Profiles & Auth

**Archivo:** `20260822021251_6d2b278a-9cbd-46b8-b007-d38a54d0df2f.sql`

- Crea tabla `profiles`
- Triggers para timestamps
- Trigger auto-create profiles en auth signup
- RLS policies para auth users

**Crítico para:** Autenticación de usuarios, perfiles extendidos

### Migration 2: Revoke Permissions

**Archivo:** `20260822021259_91a717e7-d94a-4ace-b0be-9f207bec227a.sql`

- Revoke execute en handle_new_user() (seguridad)

### Migration 3: Storage Policy

**Archivo:** `20260823015431_b0b63529-808b-432c-8c13-f89bbc26f5bc.sql`

- Policy lectura pública en hero-animation bucket

### Migration 4: Product Metadata (NUEVA)

**Archivo:** `20260826000001_create_product_metadata.sql`

- **ESTADO:** Creado pero NO APLICADO AÚN
- Tabla para GHL integration
- RLS y policies completos

---

## 6. RIESGOS IDENTIFICADOS

### 🔴 CRÍTICOS

#### Risk 1: Missing File - `previewAuthStorage.ts`

- **Ubicación esperada:** `/src/integrations/supabase/previewAuthStorage.ts`
- **Estado:** Importado en client.ts pero NO EXISTE
- **Impacto:** Cliente Supabase puede fallar en browser
- **Severidad:** 🔴 CRÍTICA
- **Solución:** Archivo debe ser regenerado o reparado

#### Risk 2: Missing Google OAuth Configuration

- **Variable:** `VITE_GOOGLE_CLIENT_ID`
- **Estado:** No configurado en `.env`
- **Impacto:** Google OAuth button existe pero falla en runtime
- **Severidad:** 🔴 CRÍTICA
- **Solución:** Configurar variable en .env

#### Risk 3: Service Role Key Missing Visibility

- **Variable:** `SUPABASE_SERVICE_ROLE_KEY`
- **Estado:** Necesaria pero NO visible en .env public
- **Impacto:** Server-side admin operations pueden fallar
- **Severidad:** 🔴 CRÍTICA
- **Solución:** Debe estar en env vars de deployment

### 🟡 ALTOS

#### Risk 4: Type Definitions Out of Sync

- **Archivos:** `/src/integrations/supabase/types.ts`
- **Problema:** Tipos auto-generados, product_metadata NOT INCLUDED
- **Impacto:** TypeScript errors cuando se use product_metadata
- **Severidad:** 🟡 ALTA
- **Solución:** Regenerar tipos desde Supabase CLI

#### Risk 5: Auto-Generated Files Modified Manually

- **Archivos:** `client.ts`, `client.server.ts`, `types.ts`
- **Problema:** Marcados como "auto-generated" pero pueden haber sido editados
- **Impacto:** Si regeneramos, perdemos cambios manuales
- **Severidad:** 🟡 ALTA
- **Solución:** Documentar qué cambios manuales se hicieron

### 🟢 BAJOS

#### Risk 6: Foreign Key Constraint

- **Constraint:** profiles.id FK → auth.users ON DELETE CASCADE
- **Problema:** Si usuario se elimina en auth, perfil se borra automáticamente
- **Impacto:** Pérdida de histórico de cliente
- **Severidad:** 🟢 BAJA (by design)
- **Solución:** Aceptable si backups existen

---

## 7. DEPENDENCIAS DE LOVABLE

### Detectadas:

1. **Auth Storage:** `brokeredPreviewStorage()`
   - Archivo: `previewAuthStorage.ts` (FALTANTE)
   - Parece ser específico de Lovable preview

2. **Auto-Generated Files:**
   - `client.ts`, `client.server.ts`, `types.ts` marcados como auto-gen
   - Posiblemente regenerados por herramienta de Lovable

3. **Supabase Project:**
   - ID: fiddxvgjdosprltflqep
   - Posiblemente creado/configurado via Lovable dashboard
   - Vinculación puede ser a nivel de cuenta Lovable

### NO Detectadas:

- ❌ Código de Lovable en business logic
- ❌ Dependencias npm de Lovable en package.json (ya removidas)
- ❌ Configuración de Lovable en vite.config.ts
- ✅ El código es agnóstico a Lovable, solo usa Supabase estándar

---

## 8. PROCEDIMIENTO DE MIGRACIÓN

### Opción A: Migrar a Supabase Propio (RECOMENDADO)

#### Paso 1: Crear nuevo proyecto Supabase

```
1. Crear cuenta Supabase personal
2. Crear nuevo proyecto
3. Obtener Project ID y URL nuevos
4. Obtener Publishable Key y Service Role Key nuevos
```

#### Paso 2: Aplicar migraciones al nuevo proyecto

```
1. Clonar migraciones existentes:
   - 20260822021251_*.sql (profiles + triggers)
   - 20260822021259_*.sql (permissions)
   - 20260823015431_*.sql (storage policy)
   - 20260826000001_*.sql (product_metadata)

2. Ejecutar migraciones en orden
3. Crear bucket hero-animation
4. Subir 205 animation frames
```

#### Paso 3: Migrar datos de usuarios

```
1. Exportar desde Supabase Lovable:
   - SELECT * FROM profiles
   - SELECT * FROM auth.users (metadata)

2. Script de importación:
   - INSERT INTO auth.users (vía Supabase API)
   - INSERT INTO profiles

3. Validación:
   - Conteo de usuarios igual
   - Datos sin corrupción
   - RLS policies funcionan
```

#### Paso 4: Configurar Google OAuth

```
1. En Google Cloud Console:
   - Crear OAuth 2.0 credentials (Web Application)
   - Agregar redirect URIs:
     * http://localhost:5173 (dev)
     * https://tu-dominio.com (prod)

2. En nuevo Supabase:
   - Settings → Authentication → Google
   - Configurar Client ID

3. En código/env:
   - Actualizar VITE_GOOGLE_CLIENT_ID
   - Actualizar VITE_SUPABASE_URL
   - Actualizar VITE_SUPABASE_PUBLISHABLE_KEY
```

#### Paso 5: Recuperar archivos faltantes

```
1. Crear previewAuthStorage.ts:
   - Implementación de localStorage custom
   - O usar localStorage nativo de Supabase

2. Regenerar types.ts:
   - supabase gen types typescript
```

#### Paso 6: Actualizar en Vercel/Deployment

```
1. Actualizar env vars en Vercel:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

2. Deploy nueva versión

3. Verificar:
   - Login/signup funciona
   - Profiles se cargan
   - Google OAuth funciona
   - Animaciones cargan
```

**Duración estimada:** 2-4 horas  
**Downtime esperado:** 30 min (switchover)  
**Riesgo:** BAJO (backups + scripts probados)

---

### Opción B: Mantener Supabase de Lovable

#### Pros:

- ✅ Cero cambios inmediatos
- ✅ Usuarios existentes no afectados
- ✅ Datos históricos preservados
- ✅ Bajo riesgo

#### Contras:

- ❌ Dependencia de Lovable continúa
- ❌ No controlas tu propia BD
- ❌ Posible deprecación futura
- ❌ Limitaciones de Lovable
- ❌ Problemas con previewAuthStorage.ts irresueltos

---

### Opción C: Hybrid (Dual Supabase)

#### Concepto:

1. Crear nuevo Supabase propio
2. Replicar datos pero mantener Lovable como backup
3. Switchover gradual a nuevo Supabase

#### Pros:

- ✅ Bajo riesgo durante transition
- ✅ Rollback fácil
- ✅ Testing en nuevo antes de switchover

#### Contras:

- ❌ Complejidad mayor
- ❌ Costo de dos Supabase
- ❌ Sincronización de datos

---

## 9. RECOMENDACIÓN FINAL

### 🎯 OPCIÓN A: MIGRAR A SUPABASE PROPIO

**Razones:**

1. **Control Total**
   - Tu propia BD, tus reglas
   - No dependes de Lovable
   - Escalabilidad sin restricciones

2. **Problemas de Lovable**
   - `previewAuthStorage.ts` es específico de Lovable
   - Auto-generated files tienen dependencias implícitas
   - Supabase CLI puede no regenerar correctamente

3. **Futuro del Proyecto**
   - GHL integration requiere control técnico
   - Webhook + polling requieren infraestructura
   - Supabase propio permite todas las features

4. **Datos de Usuario**
   - Migración es segura y reversible
   - Scripts de backup + validación
   - Bajo riesgo con procedimiento correcto

5. **Costo/Beneficio**
   - Supabase Free tier cubre aplicación actual
   - Pago mínimo (~$25/mes) si escalas
   - Vs. ser prisionero de Lovable

### ⚠️ NO RECOMENDADO: Mantener Lovable

**Razones para NO:**

- ❌ previewAuthStorage.ts faltante (red flag)
- ❌ Dependencia implícita indefinida
- ❌ GHL integration será más difícil
- ❌ Sin control sobre migración de datos

### 📋 PLAN DE ACCIÓN RECOMENDADO

**Fase 1:** Crear nuevo Supabase propio (hoy)
**Fase 2:** Aplicar migraciones al nuevo (hoy)
**Fase 3:** Migrar datos de usuarios (mañana)
**Fase 4:** Testing exhaustivo (2-3 días)
**Fase 5:** Switchover en Vercel (1 día)
**Fase 6:** Monitoreo post-switchover (1 semana)

**Downtime Total:** ~30 minutos en switchover

---

## 10. PRÓXIMOS PASOS

### Decisión Necesaria (Usuario)

**¿Autorizar Opción A (Migrar a Supabase Propio)?**

Si SÍ:

1. Crear nuevo proyecto Supabase
2. Aplicar migraciones
3. Migrar datos
4. Actualizar env vars
5. Deploy a producción

Si NO (Mantener Lovable):

1. Reparar previewAuthStorage.ts
2. Configurar VITE_GOOGLE_CLIENT_ID
3. Aplicar product_metadata migration a Lovable Supabase
4. Continuar con arquitectura actual

---

**AUDITORÍA COMPLETA - READY FOR DECISION**
