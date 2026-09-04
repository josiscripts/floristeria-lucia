# AUDITORÍA DE AUTENTICACIÓN - Floristería Lucía

**Fecha:** 2026-09-04  
**Estado:** ✅ AUDITORÍA COMPLETA (SIN MODIFICACIONES)

---

## RESUMEN EJECUTIVO

El sistema de autenticación está **parcialmente implementado**. Existen 3 flujos iniciados pero **incompletos**:

✅ **Email/Contraseña** — Estructura completa, pero **sin verificación de email**  
⚠️ **Google OAuth** — Código implementado, pero **configuración incompleta** (error: "Provider undefined")  
❌ **Recuperación de contraseña** — NO implementada  
❌ **Show/Hide contraseña** — NO implementado  
❌ **Selector de código de país** — NO implementado

---

## A) CÓMO FUNCIONA ACTUALMENTE

### A.1 Arquitectura de autenticación

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (React + TanStack)            │
├─────────────────────────────────────────────────┤
│  src/routes/auth.tsx                            │
│  ├─ LoginForm         (email/contraseña)        │
│  ├─ SignupForm        (email/contraseña)        │
│  └─ GoogleButton      (OAuth)                   │
│                                                  │
│  src/hooks/useAuth.ts                           │
│  └─ Maneja session y user state                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        SUPABASE CLIENT (JS SDK)                 │
├─────────────────────────────────────────────────┤
│  src/integrations/supabase/client.ts            │
│  └─ Credenciales públicas (VITE_* vars)        │
│                                                  │
│  Auth methods:                                   │
│  • signUp()             - Registro              │
│  • signInWithPassword() - Login                 │
│  • signInWithOAuth()    - Google (ROTO)         │
│  • getUser()            - Obtener usuario       │
│  • signOut()            - Logout                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           SUPABASE CLOUD                        │
├─────────────────────────────────────────────────┤
│  auth.users           (usuarios Supabase Auth)  │
│  ├─ id (UUID)                                   │
│  ├─ email                                       │
│  ├─ encrypted_password                          │
│  ├─ email_confirmed_at (verification)           │
│  ├─ raw_user_meta_data (full_name, phone)       │
│  └─ ...                                         │
│                                                  │
│  public.profiles      (perfil de usuario)       │
│  ├─ id (FK → auth.users)                        │
│  ├─ full_name                                   │
│  ├─ phone                                       │
│  ├─ role (customer | admin) [default: customer] │
│  ├─ created_at                                  │
│  └─ updated_at                                  │
│                                                  │
│  auth.identities      (para OAuth)              │
│  ├─ id                                          │
│  ├─ user_id (FK)                                │
│  ├─ provider (google, email, etc.)              │
│  ├─ provider_id (OAuth ID externo)              │
│  └─ identity_data (JSON con datos OAuth)        │
└─────────────────────────────────────────────────┘
```

### A.2 Flujo de registro (Email/Contraseña)

**Paso a paso:**

1. Usuario rellena: `fullName`, `phone`, `email`, `password` en `SignupForm`
2. Frontend llama `supabase.auth.signUp()` con:
   ```javascript
   {
     email: "usuario@example.com",
     password: "secreto123",
     options: {
       emailRedirectTo: window.location.origin,  // Redirect después verificación
       data: {
         full_name: "Juan García",
         phone: "+34 666 555 444"
       }
     }
   }
   ```
3. Supabase crea `auth.users` con:
   - `email` verificado = `false` (por defecto)
   - `raw_user_meta_data` = `{ full_name, phone }`
   - Genera UUID `id`

4. **Trigger `on_auth_user_created`** se ejecuta (en `auth.users` AFTER INSERT):

   ```sql
   -- Crea entrada en public.profiles automáticamente
   INSERT INTO public.profiles (id, full_name, phone, role)
   VALUES (new_id, 'Juan García', '+34 666 555 444', 'customer')
   ```

5. Supabase envía email de confirmación con enlace:
   - URL: `https://floristeria-lucia.vercel.app#access_token=...&type=email_confirmation`
   - Usuario debe hacer clic para confirmar email
   - **PROBLEMA:** No hay página de callback que maneje este enlace

6. **Resultado en BD:**

   ```
   auth.users:
   ├─ id: "uuid-123"
   ├─ email: "usuario@example.com"
   ├─ email_confirmed_at: null (sin verificar)
   └─ raw_user_meta_data: { full_name, phone }

   public.profiles:
   ├─ id: "uuid-123"
   ├─ full_name: "Juan García"
   ├─ phone: "+34 666 555 444"
   ├─ role: "customer"
   └─ created_at: now()
   ```

7. Frontend recibe respuesta:
   - Si `data.session` es nulo → email sin verificar → muestra "Revisa tu email"
   - Si `data.session` existe → email verificado → redirige a `/mi-cuenta`

### A.3 Flujo de login (Email/Contraseña)

**Paso a paso:**

1. Usuario rellena `email` y `password` en `LoginForm`
2. Frontend llama `supabase.auth.signInWithPassword()` con credenciales
3. Supabase valida:
   - Email existe
   - Contraseña correcta
   - ✅ **NO valida si email está verificado** (bug potencial)
4. Si válido, devuelve:
   ```json
   {
     session: {
       access_token: "eyJ...",
       refresh_token: "...",
       user: { id, email, user_metadata: {...} }
     }
   }
   ```
5. Frontend:
   - Guarda session en localStorage/sessionStorage
   - Hook `useAuth()` actualiza estado global
   - Consulta tabla `profiles` para obtener rol
   - Redirige a `/admin/dashboard` si `role === 'admin'`, sino a `/mi-cuenta`

### A.4 Flujo de Google OAuth (ROTO)

**Código en `src/routes/auth.tsx` - GoogleButton:**

```typescript
const signIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth("google", {
    redirectTo: window.location.origin,
  });
  if (error) {
    toast.error(t("auth.google.error"));
    return;
  }
};
```

**Paso a paso esperado (en teoría):**

1. Frontend llama `supabase.auth.signInWithOAuth("google", {...})`
2. Supabase SDK abre popup/redirect a Google OAuth consent screen
3. Usuario autoriza en Google
4. Google devuelve `code` de autorización
5. Supabase intercambia `code` por tokens Google
6. Supabase crea/obtiene usuario basado en email de Google
7. Trigger `on_auth_user_created` crea profile si es nuevo usuario
8. Redirige a `window.location.origin` con session

**Paso a paso real (CON ERROR):**

1. Frontend intenta llamar `signInWithOAuth("google", {...})`
2. ❌ **Supabase SDK error:** `"Unsupported provider: Provider undefined could not be found"`
3. Toast muestra error
4. **No redirige ni autentica**

**¿Por qué?**

El error indica que Supabase Cloud NO tiene Google OAuth configurado como proveedor. En dashboard de Supabase:

- `Authentication → Providers` debe tener Google habilitado
- Requiere `Client ID` y `Client Secret` de Google Cloud Console
- Requiere redirect URL: `https://floristeria-lucia.vercel.app/auth/callback`

**Estado actual:** ❌ NO configurado en Supabase

### A.5 Rutas y protección

```
✅ /auth                          - Login/Signup (público)
✅ /mi-cuenta                     - Mi cuenta (protegida)
❌ /auth/callback                 - Callback OAuth (NO EXISTE - NECESARIA)
❌ /auth/confirm                  - Callback email verification (NO EXISTE)
❌ /auth/reset-password           - Reset password flow (NO EXISTE)

✅ /admin/dashboard               - Admin (protegida por guard.server.ts)
```

**Guard en `src/lib/admin/guard.server.ts`:**

Verifica que usuario esté autenticado Y tenga `role === 'admin'` antes de permitir acceso.

---

## B) TABLAS Y CONFIGURACIÓN QUE INTERVIENE

### B.1 Tablas en Supabase

#### 🔑 `auth.users` (Tabla de sistema - Supabase Auth)

**Ubicación:** Schema `auth` (solo lectura desde cliente)

**Estructura:**

```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE
encrypted_password TEXT
email_confirmed_at TIMESTAMP  -- NULL si no verificado
created_at      TIMESTAMP
updated_at      TIMESTAMP
raw_user_meta_data JSONB
-- ... más columnas del sistema
```

**Quién puede acceder:**

- ❌ Cliente (JavaScript) - Solo indirectamente vía Auth SDK
- ✅ `supabaseAdmin` (server-side con service_role key)

#### 📊 `public.profiles` (Tabla de negocio - Creada manualmente)

**Ubicación:** Schema `public` (visible, con RLS)

**Estructura:**

```sql
id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
full_name       TEXT
phone           TEXT
role            TEXT CHECK (role IN ('customer', 'admin'))
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

**RLS Policies:**

| Acción | Rol           | Condición                                     |
| ------ | ------------- | --------------------------------------------- |
| SELECT | authenticated | `auth.uid() = id` (Solo ver su propio perfil) |
| INSERT | authenticated | `auth.uid() = id` (Solo insertar el suyo)     |
| UPDATE | authenticated | `auth.uid() = id` (Solo actualizar el suyo)   |
| DELETE | Ninguno       | ❌ NO PERMITIDO                               |

**Triggers:**

1. `update_profiles_updated_at` - Actualiza `updated_at` automáticamente
2. `prevent_role_self_escalation` - Bloquea cambios de rol a menos que sea `service_role` (impide que usuarios se auto-promocionen a admin)

#### 🔗 `auth.identities` (Tabla de sistema - para OAuth)

**Ubicación:** Schema `auth` (solo lectura desde cliente)

**Estructura:**

```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
provider        TEXT  -- 'google', 'email', 'microsoft', etc.
provider_id     TEXT  -- ID externo (Google sub, etc.)
identity_data   JSONB -- { email, name, picture, ... }
email           TEXT
last_sign_in_at TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Uso:** Almacena vínculos entre usuarios Supabase y proveedores externos (Google, Microsoft, etc.)

### B.2 Funciones en Supabase

#### 📝 `handle_new_user()` - Trigger function

**Ubicación:** `public.handle_new_user()`

**Código (de migración 20260822021251):**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

**Se dispara:** AFTER INSERT en `auth.users`

**Propósito:** Crear automáticamente un perfil cuando Supabase crea un usuario (sea email o OAuth)

**Datos usados:**

- `NEW.raw_user_meta_data` → datos que pasaste en `signUp()` options
- Para Google OAuth: NO hay `full_name` ni `phone` en `raw_user_meta_data` automáticamente

#### 🚫 `prevent_role_self_escalation()` - Trigger function

**Ubicación:** `public.prevent_role_self_escalation()`

**Código (de migración 20260831024811):**

```sql
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    NEW.role := OLD.role;  -- Revierte cambio silenciosamente
  END IF;
  RETURN NEW;
END;
$$;
```

**Se dispara:** BEFORE UPDATE en `public.profiles`

**Propósito:** Impedir que usuarios normales cambien su rol a admin (defensa en profundidad)

**Resultado:** Si un usuario intenta UPDATE su perfil cambiando `role`, el cambio se revierte sin error

### B.3 Migraciones relevantes

| Archivo                 | Propósito                                                      | Estado      |
| ----------------------- | -------------------------------------------------------------- | ----------- |
| `20260822021251_...sql` | Crear tabla `profiles` + trigger `handle_new_user`             | ✅ Aplicada |
| `20260831024811_...sql` | Añadir columna `role` + trigger `prevent_role_self_escalation` | ✅ Aplicada |

### B.4 Variables de entorno

**En `.env.local` (actual):**

```env
# ✅ Configurado
SUPABASE_URL="https://leksmflinhohnekbgmgj.supabase.co"
VITE_SUPABASE_URL="https://leksmflinhohnekbgmgj.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ❌ FALTA - Necesario para Google OAuth
VITE_GOOGLE_CLIENT_ID=???
```

**En `.env.example` (template):**

```env
# Mencionado pero vacío
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### B.5 Clientes Supabase

#### 🌐 `src/integrations/supabase/client.ts` - Cliente público (Frontend)

**Propósito:** Acceso desde navegador con credenciales públicas

**Inicialización:**

```typescript
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(), // localStorage en browser
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

**Métodos disponibles:**

- `auth.signUp()`
- `auth.signInWithPassword()`
- `auth.signInWithOAuth()`
- `auth.getSession()`
- `auth.getUser()`
- `auth.signOut()`
- `from("profiles").select()` -- Con RLS

**Seguridad:** RLS policies garantizan que usuarios solo accedan sus datos

#### 🔐 `src/integrations/supabase/client.server.ts` - Cliente admin (Backend)

**Propósito:** Operaciones server-side sin RLS (bypassa todas las policies)

**Inicialización:**

```typescript
const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // ← Clave privada de admin
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
```

**Métodos:** Todos los mismos que cliente público, pero sin RLS

**Seguridad:** Usar SOLO en archivos `.server.ts` (nunca exponer al cliente)

#### 🛡️ `src/integrations/supabase/auth-middleware.ts` - Middleware para autenticación server

**Propósito:** Validar tokens JWT en server functions

**Uso:** Extraer user ID desde Authorization header en request

### B.6 Supabase Auth Providers (Dashboard)

**Estado en Supabase Cloud (inspeccionado):**

El proveedor Google NO está habilitado/configurado.

**Requiere en dashboard:**

1. Ir a `Authentication → Providers → Google`
2. Habilitar
3. Añadir:
   - **Client ID** (de Google Cloud Console)
   - **Client Secret** (de Google Cloud Console)
4. Configurar redirect URL: `https://floristeria-lucia.vercel.app/auth/callback`

**Configuración de Google Cloud Console:**

- OAuth 2.0 credentials (tipo: Web application)
- Authorized redirect URIs:
  - `https://floristeria-lucia.vercel.app/auth/callback`
  - `https://leksmflinhohnekbgmgj.supabase.co/auth/v1/callback` (para Supabase)

---

## C) PROBLEMAS ENCONTRADOS

### 🔴 CRÍTICO 1: Google OAuth no configurado

**Problema:** El botón "Continuar con Google" genera error:

```
"Unsupported provider: Provider undefined could not be found"
```

**Causa raíz:**

- Google OAuth NO está activado en dashboard Supabase
- Falta `Client ID` y `Client Secret` en Supabase

**Impacto:**

- ❌ Usuarios NO pueden registrarse con Google
- ❌ Usuarios NO pueden loguearse con Google

**Ubicaciones afectadas:**

- `src/routes/auth.tsx:82` - GoogleButton

**Severidad:** 🔴 ALTA (bloquea funcionalidad anunciada)

---

### 🔴 CRÍTICO 2: Email verification no funciona

**Problema:** Después de `signUp()`, usuario recibe email con link de confirmación, pero:

- NO hay ruta que maneje el callback (`/auth/callback` o similar)
- El link redirige a `https://floristeria-lucia.vercel.app#access_token=...&type=email_confirmation`
- El frontend NO procesa este fragmento

**Causa raíz:**

- No hay página que maneje el hash `#access_token=...&type=...`
- Supabase SDK necesita `supabase.auth.exchangeCodeForSession()` pero nunca se llama

**Impacto:**

- ✅ Usuario recibe email
- ✅ Hace clic en link
- ❌ Email se verifica en BD (`email_confirmed_at` se actualiza)
- ⚠️ Usuario queda en limbo (no sabe si funcionó)
- ❌ No hay confirmación visual

**Flujo que falta:**

```typescript
// En una nueva ruta: src/routes/auth/callback.tsx
export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        // Parse URL params/hash
      );
      if (error) {
        toast.error("Fallo la verificación");
        return;
      }
      navigate({ to: "/mi-cuenta" });
    };
    handleCallback();
  }, []);
  return <div>Verificando email...</div>;
}
```

**Severidad:** 🔴 ALTA (bloquea verificación de email)

---

### 🟡 IMPORTANTE 3: Recuperación de contraseña NO existe

**Problema:** No hay botón "¿Olvidaste tu contraseña?" en login

**Causa raíz:** No implementado

**Flujo que falta:**

1. Botón en `LoginForm` → llama `supabase.auth.resetPasswordForEmail(email)`
2. Usuario recibe email con reset link
3. Ruta `/auth/reset-password` procesa token y permite cambiar contraseña
4. Usuario establece nueva contraseña

**Impacto:** Usuarios que olvidan contraseña están bloqueados (sin recuperación)

**Severidad:** 🟡 MEDIA (funcionalidad esperada pero sin alternativa)

---

### 🟡 IMPORTANTE 4: Show/Hide contraseña NO implementado

**Problema:** Campo `password` en login/signup es `type="password"`, no hay toggle

**Ubicaciones:**

- `src/routes/auth.tsx:165` - LoginForm
- `src/routes/auth.tsx:259` - SignupForm

**Causa raíz:** No hay estado ni botón para toggle

**Flujo que falta:**

```typescript
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? "text" : "password"}
  // ...
/>
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

**Severidad:** 🟡 BAJA (usabilidad, pero no funcional)

---

### 🟡 IMPORTANTE 5: Selector de código de país NO existe

**Problema:** Campo teléfono es `<Input type="tel">`, sin selector de código de país

**Ubicación:**

- `src/routes/auth.tsx:237` - SignupForm

**Datos almacenados:** Solo string de teléfono (p.ej. "+34 666 555 444")

**Flujo que falta:**

```typescript
const [countryCode, setCountryCode] = useState("ES");
const [phone, setPhone] = useState("");

// Componente tipo:
<select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
  <option value="ES">🇪🇸 España (+34)</option>
  <option value="FR">🇫🇷 Francia (+33)</option>
  // ...
</select>
<Input type="tel" value={phone} ... />

// Almacenar como: "+34" + phone
```

**Severidad:** 🟡 BAJA (no bloquea funcionalidad, pero útil para UX)

---

### ⚠️ IMPORTANTE 6: Login sin email verificado

**Problema:** Un usuario puede loguearse aunque su email NO esté verificado

```typescript
// En LoginForm:
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
// ✅ Si email/password válidos → login OK
// ❌ NO verifica email_confirmed_at
```

**Causa raíz:** Supabase por defecto permite login sin verificación. Hay que validar manualmente.

**Impacto:** Usuarios con email falso/no verificado pueden loguearse

**Severidad:** ⚠️ MEDIA (depende de requisito de negocio)

---

### ⚠️ IMPORTANTE 7: Variables de entorno faltantes

**Problema:** `.env.local` NO tiene `VITE_GOOGLE_CLIENT_ID`

```env
# ✅ Presente
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# ❌ FALTA
VITE_GOOGLE_CLIENT_ID=???
```

**Impacto:** Google OAuth no puede inicializarse (aunque estuviera configurado en Supabase)

**Severidad:** ⚠️ MEDIA (bloquea Google OAuth cuando se active)

---

## D) ARCHIVOS QUE HABRÍA QUE MODIFICAR

| Archivo                                         | Cambio                                         | Motivo                              |
| ----------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| `src/routes/auth.tsx`                           | Añadir validación de email verificado en login | Verificar email_confirmed_at        |
| `src/routes/auth.tsx`                           | Añadir campo show/hide password                | Usabilidad                          |
| `src/routes/auth.tsx`                           | Añadir botón "¿Olvidaste contraseña?"          | Recuperación de contraseña          |
| `src/routes/auth.tsx`                           | Añadir selector de código de país              | Usabilidad teléfono                 |
| **Crear:** `src/routes/auth.callback.tsx`       | Manejar callback de email/OAuth                | Verificación email + OAuth callback |
| **Crear:** `src/routes/auth.reset-password.tsx` | Reset password flow                            | Recuperación de contraseña          |
| `.env.local`                                    | Añadir `VITE_GOOGLE_CLIENT_ID`                 | Configuración Google OAuth          |
| `src/i18n/ns/auth.ts`                           | Añadir keys para nuevas funcionalidades        | Textos en 3 idiomas                 |
| `supabase/config.toml`                          | No modificar                                   | Configuración enlazada              |

---

## E) CAMBIOS NECESARIOS PARA SOLUCIONARLO

### E.1 Verificación de email ✅

**Requisito 1: Email verification**

**Pasos:**

1. **Crear ruta de callback:**
   - Nueva ruta: `src/routes/auth.callback.tsx`
   - Propósito: Procesar hash `#access_token=...&type=email_confirmation`
   - Lógica: Llamar `supabase.auth.exchangeCodeForSession()` y redirigir a `/mi-cuenta`

2. **Validar en login:**
   - En `LoginForm.onSubmit()`, después de `signInWithPassword()` OK:
   - Consultar `auth.users` → verificar `email_confirmed_at`
   - Si NULL → mostrar toast de advertencia, pero permitir login
   - O rechazar login si requisito es obligatorio

3. **i18n:** Añadir keys para mensajes de verificación

**Archivos a crear:**

- `src/routes/auth.callback.tsx`

**Archivos a modificar:**

- `src/routes/auth.tsx` (LoginForm)
- `src/i18n/ns/auth.ts`

---

### E.2 Google OAuth ✅

**Requisito 2: Google OAuth funcionando**

**Pasos:**

1. **Configurar en Supabase Dashboard:**
   - Acceder a `Authentication → Providers → Google`
   - Habilitar Google
   - Obtener Client ID y Secret de Google Cloud Console
   - Poner redirect URL: `https://leksmflinhohnekbgmgj.supabase.co/auth/v1/callback`

2. **Crear cuenta Google Cloud Console:**
   - Proyecto nuevo o existente
   - OAuth 2.0 credentials (Web application)
   - Authorized JavaScript origins:
     - `https://floristeria-lucia.vercel.app`
     - `https://leksmflinhohnekbgmgj.supabase.co` (Supabase)
   - Authorized redirect URIs:
     - `https://leksmflinhohnekbgmgj.supabase.co/auth/v1/callback`

3. **Copiar Client ID a env:**
   - `VITE_GOOGLE_CLIENT_ID=<ID_DE_GOOGLE_CLOUD>`

4. **Asegurar callback en frontend:**
   - El callback `src/routes/auth.callback.tsx` debe manejar tipo `oauth_callback` también
   - Después de OAuth, Supabase redirige a `window.location.origin` con session

5. **Mapeo de datos OAuth:**
   - Google proporciona: `email`, `name`, `picture` en identity_data
   - Trigger `handle_new_user()` NO rellena `full_name` ni `phone` (no vienen en raw_user_meta_data)
   - Opción A: El usuario completa datos manualmente en `/mi-cuenta` después
   - Opción B: Modificar trigger para extraer `name` de identity_data

**Archivos a modificar:**

- `.env.local` (añadir `VITE_GOOGLE_CLIENT_ID`)
- `src/routes/auth.callback.tsx` (manejar tipo "oauth_callback")
- `supabase/migrations/` (opcional: mejorar trigger handle_new_user)

---

### E.3 Recuperación de contraseña ✅

**Requisito 3: Recuperación de contraseña mediante email**

**Pasos:**

1. **En LoginForm:** Añadir link "¿Olvidaste tu contraseña?"
   - Redirige a nueva ruta `/auth/reset-password`

2. **Crear ruta reset-password:**
   - `src/routes/auth.reset-password.tsx`
   - Formulario con campo email
   - Botón: "Enviar enlace de reset"
   - Llama `supabase.auth.resetPasswordForEmail(email)`
   - Muestra "Revisa tu email"

3. **Crear ruta reset-password-confirm:**
   - `src/routes/auth.reset-password-confirm.tsx`
   - Procesa hash `#access_token=...&type=recovery`
   - Formulario: Nueva contraseña + confirmar
   - Llama `supabase.auth.updateUser({ password: newPassword })`
   - Redirige a `/auth` si éxito

4. **i18n:** Añadir keys para reset password flow

**Archivos a crear:**

- `src/routes/auth.reset-password.tsx`
- `src/routes/auth.reset-password-confirm.tsx`

**Archivos a modificar:**

- `src/routes/auth.tsx` (añadir link)
- `src/i18n/ns/auth.ts` (keys)

---

### E.4 Show/Hide password ✅

**Requisito 4: Toggle visibilidad contraseña**

**Pasos:**

1. **En LoginForm:**
   - Añadir estado `showPassword: boolean`
   - Cambiar `type="password"` → `type={showPassword ? "text" : "password"}`
   - Botón con icono Eye/EyeOff para toggle

2. **En SignupForm:**
   - Mismo cambio

3. **Importar iconos de lucide-react:**
   - `Eye`, `EyeOff`

**Archivos a modificar:**

- `src/routes/auth.tsx` (LoginForm y SignupForm)

---

### E.5 Selector código de país ✅

**Requisito 5: Selector de código de país en teléfono**

**Pasos:**

1. **En SignupForm:**
   - Crear estado `countryCode: string` (default "ES")
   - Crear estado `phone: string` (sin código)
   - Select dropdown con países (formato: "🇪🇸 España (+34)" → value: "34")
   - Input teléfono (solo número)
   - Al guardar: concatenar "+" + countryCode + phone

2. **Datos a guardar en BD:**
   - `profiles.phone` = "+34666555444" (formato E.164)
   - Alternativamente: crear columna separate `country_code` en profiles

3. **Crear helper para validar teléfono:**
   - Importar `libphonenumber-js` o `phonenumberjs`
   - Validar según país

4. **i18n:** Traducir lista de países

**Archivos a modificar:**

- `src/routes/auth.tsx` (SignupForm)
- `src/i18n/ns/auth.ts` (países)
- `package.json` (añadir librería validación teléfono)

---

### E.6 Gestión de usuarios email + OAuth

**Requisito 6: Usuarios creados por email y por Google correctamente gestionados**

**Problema actual:**

- Usuario registra con email: `user@gmail.com` + password
- Mismo usuario luego intenta login con Google (mismo email)
- Supabase crea TWO identidades pero MISMO usuario (porque email es igual)
- Funciona, pero:
  - Profile se crea 2 veces (2ª vez no hace nada por ON CONFLICT)
  - Usuario pueden loguearse con ambos métodos

**Recomendación:**

- Esto funciona BIEN en Supabase (maneja automáticamente)
- Solo hay que documentar en UX:
  - Después de registro con email, no necesitan Google (es la misma cuenta)
  - O al revés: si loguearon con Google, no necesitan crear cuenta con email

**Cambios opcionales:**

- Mostrar en `/mi-cuenta` qué métodos están vinculados
- Permitir "Unlink" de método de autenticación (no esencial)

---

## F) RIESGOS Y DEPENDENCIAS

### F.1 Dependencias críticas

| Dependencia               | Impacto                              | Mitigation                               |
| ------------------------- | ------------------------------------ | ---------------------------------------- |
| Supabase Cloud disponible | ❌ Auth no funciona si Supabase down | Configurar retry logic                   |
| Email delivery (Supabase) | Usuarios no reciben confirmación     | Verificar configuración SMTP en Supabase |
| Google Cloud OAuth        | Google OAuth falla si Google down    | Fallback a email/password                |
| Domain CORS en Supabase   | OAuth redirect falla                 | Configurar URL origin correctamente      |

### F.2 Riesgos de seguridad

| Riesgo                                     | Severidad  | Mitigación                                                   |
| ------------------------------------------ | ---------- | ------------------------------------------------------------ |
| VITE_GOOGLE_CLIENT_ID expuesto en frontend | 🟢 BAJO    | Es pública por diseño (VITE_* prefix)                        |
| Token JWT en localStorage                  | 🟡 MEDIA   | Usar httpOnly cookies si posible (requiere backend)          |
| RLS policies no efectivas si buggy         | 🔴 CRÍTICA | Revisar policies periódicamente, no confiar solo en frontend |
| Trigger prevent_role_self_escalation falla | 🔴 CRÍTICA | Probar trigger manualmente en SQL editor                     |
| Google Secret expuesto en Supabase         | 🟢 BAJO    | Secret NUNCA expuesto al cliente (server-only en Supabase)   |

### F.3 Impacto en otras funcionalidades

| Funcionalidad             | Dependencia de Auth            | Impacto                                                  |
| ------------------------- | ------------------------------ | -------------------------------------------------------- |
| Admin Panel (`/admin/`)   | ✅ Requiere login + role=admin | Si auth falla → admin no funciona                        |
| Mi Cuenta (`/mi-cuenta/`) | ✅ Requiere login              | Si auth falla → usuarios no pueden ver datos             |
| Checkout (órdenes)        | ❌ NO requiere login           | Funciona sin auth, pero órdenes no se vinculan a usuario |
| Favoritos                 | ❌ Usa localStorage (sin auth) | Funciona sin auth                                        |

### F.4 Impacto en GHL sync

| Operación              | Dependencia                        | Impacto       |
| ---------------------- | ---------------------------------- | ------------- |
| Crear orden (checkout) | ❌ NO requiere usuario autenticado | OK - Funciona |
| Sync a GHL (órdenes)   | ❌ NO requiere usuario             | OK - Funciona |
| Webhooks GHL           | ❌ NO requiere usuario             | OK - Funciona |

---

## G) RECOMENDACIONES DE IMPLEMENTACIÓN

### G.1 Orden de prioridad

```
FASE 1 (BLOQUEANTES):
├─ Email verification callback (auth.callback.tsx)
├─ Configurar Google OAuth en Supabase Dashboard
└─ Añadir VITE_GOOGLE_CLIENT_ID a .env

FASE 2 (IMPORTANTES):
├─ Password reset flow (auth.reset-password.tsx)
├─ Validar email_confirmed_at en login
└─ Show/hide password toggle

FASE 3 (NICE-TO-HAVE):
├─ Country code selector
├─ Libphonenumber validación
└─ Mostrar métodos de autenticación vinculados en /mi-cuenta
```

### G.2 Testing checklist

Antes de deploy a producción:

```
Email/Contraseña:
- [ ] Signup sin verificar email
- [ ] Click en email confirmation link
- [ ] Redirige a /mi-cuenta OK
- [ ] Login con email/contraseña
- [ ] Reset password flow
- [ ] Show/hide password funciona

Google OAuth:
- [ ] Click "Continuar con Google"
- [ ] Popup/redirect a Google consent
- [ ] Autoriza y vuelve
- [ ] Crea usuario nuevo OK
- [ ] Redirige a /mi-cuenta OK
- [ ] Login con Google de nuevo (usuario existente)

Admin Panel:
- [ ] Usuario normal NO puede acceder /admin
- [ ] Usuario admin SI puede acceder /admin

Seguridad:
- [ ] RLS policy: Usuario A NO puede ver perfil de Usuario B
- [ ] Admin NO puede cambiar su role a admin (trigger)
- [ ] Email verificado = NOT NULL después de confirmar
```

### G.3 Monitoreo

```
Sentry/ErrorTracking:
- [ ] Registrar errores de auth.signUp()
- [ ] Registrar errores de auth.signInWithOAuth()
- [ ] Registrar errores de trigger handle_new_user
- [ ] Alertas si rate limiting en auth

Logging:
- [ ] Log en server: quién login, cuándo
- [ ] Log: cambios de role (via Supabase audit_logs table)
- [ ] Log: intentos de reset password
```

---

## RESUMEN PARA IMPLEMENTACIÓN

### ✅ Funciona HOY:

- Email/contraseña signup (sin verificación)
- Email/contraseña login (sin validar verificación)
- Crear profile automáticamente
- Admin guard funciona
- Logout funciona

### ❌ NO funciona HOY:

- Google OAuth (error "Provider undefined")
- Email verification (callback no existe)
- Password reset (no implementado)
- Show/hide password
- Country code selector

### 🔧 Cambios necesarios:

1. Crear 2 rutas nuevas (callback, reset-password)
2. Mejorar componentes auth.tsx (validaciones, toggles)
3. Configurar Google OAuth en Supabase Cloud
4. Añadir env variable VITE_GOOGLE_CLIENT_ID
5. Actualizar i18n para nuevas funcionalidades

### 🚀 Impacto en producción:

- Cambios son aditivos (no rompen lo existente)
- Puedes deploybloques por bloques
- Requiere manual config en Supabase Dashboard para Google

---

**FIN DE AUDITORÍA**  
Generado: 2026-09-04  
Auditor: Sistema automático (sin modificaciones realizadas)
