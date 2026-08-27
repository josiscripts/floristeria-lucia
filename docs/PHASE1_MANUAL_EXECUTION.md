# FASE 1: Ejecución Manual en Supabase Dashboard

**Proyecto:** leksmflinhohnekbgmgj  
**URL:** https://leksmflinhohnekbgmgj.supabase.co  
**Fecha:** 2026-08-26  

---

## 📋 INSTRUCCIONES GENERALES

1. Ve a: https://leksmflinhohnekbgmgj.supabase.co
2. Loguéate en tu cuenta de Supabase
3. Abre: **SQL Editor** (en el menú izquierdo)
4. Para cada query/migración:
   - **Copiar** el SQL exacto de este documento
   - **Pegar** en el SQL Editor
   - Ejecutar (botón "RUN" o Ctrl+Enter)
   - **Esperar confirmación** de éxito
5. Después de todas las queries, ejecutar **Verificación READ-ONLY**

---

## ⚠️ IMPORTANTE

- ✅ **Copiar/pegar exacto** - Sin modificar nada
- ✅ **Ejecutar en orden** - No saltar pasos
- ✅ **Leer cada resultado** - Ver si hay errores
- ❌ **NO modificar el SQL** - Tal como está
- ❌ **NO ejecutar si no entiendes** - Preguntar primero

---

## PASO 1: Migration - Crear tabla profiles

**Descripción:** Crea tabla `public.profiles` con funciones, triggers y RLS

**Copiar y ejecutar este SQL en el SQL Editor:**

```sql
-- ============================================================================
-- MIGRATION 1: 20260822021251_6d2b278a-9cbd-46b8-b007-d38a54d0df2f.sql
-- Propósito: Crear tabla profiles, funciones, triggers y RLS
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**¿Qué crea?**
- ✅ Tabla: `public.profiles` (5 columnas)
- ✅ Función: `update_updated_at_column()`
- ✅ Trigger: `update_profiles_updated_at`
- ✅ Función: `handle_new_user()`
- ✅ Trigger: `on_auth_user_created`
- ✅ RLS: HABILITADO con 3 policies

**Resultado esperado:**
```
Query executed successfully (took XXms)
```

Si ves error, **DETENTE y reporta** sin continuar.

---

## PASO 2: Migration - Revoke permisos

**Descripción:** Revoca acceso EXECUTE a `handle_new_user()` (seguridad)

**Copiar y ejecutar este SQL en el SQL Editor:**

```sql
-- ============================================================================
-- MIGRATION 2: 20260822021259_91a717e7-d94a-4ace-b0be-9f207bec227a.sql
-- Propósito: Revocar permisos EXECUTE en handle_new_user()
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
```

**¿Qué hace?**
- ✅ Revoca permiso EXECUTE para usuarios anónimos y autenticados
- ✅ Función solo se ejecuta vía trigger (automático)
- ✅ Mejora seguridad

**Resultado esperado:**
```
Query executed successfully (took XXms)
```

Si ves error, **DETENTE y reporta** sin continuar.

---

## PASO 3: Crear Storage Bucket

**Descripción:** Crea el bucket `hero-animation` para almacenar 205 frames

**EN EL DASHBOARD (NO en SQL Editor):**

1. Abre: **Storage** (en el menú izquierdo)
2. Click: **Create Bucket** (o "New Bucket")
3. Rellena:
   - **Name:** `hero-animation`
   - **Public bucket:** ✅ MARCAR (hace que sea público)
4. Click: **Create Bucket**

**Resultado esperado:**
```
Bucket created successfully
```

---

## PASO 4: Crear Policy para Storage

**Descripción:** Permite lectura pública al bucket `hero-animation`

**Copiar y ejecutar este SQL en el SQL Editor:**

```sql
-- ============================================================================
-- STORAGE POLICY: Permite lectura pública a hero-animation
-- ============================================================================

CREATE POLICY "Anyone can read hero animation frames"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'hero-animation');
```

**¿Qué hace?**
- ✅ Permite a usuarios anónimos y autenticados **LEER** archivos
- ✅ Solo lectura (SELECT)
- ✅ Solo en bucket `hero-animation`
- ❌ No pueden escribir/borrar

**Resultado esperado:**
```
Query executed successfully (took XXms)
```

Si ves error, **DETENTE y reporta** sin continuar.

---

## ✅ VERIFICACIÓN READ-ONLY

Después de ejecutar todos los pasos anteriores, ejecuta estas queries para verificar que todo está correcto.

### Verificación 1: Tabla profiles existe

```sql
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'profiles'
AND table_schema = 'public';
```

**Resultado esperado:**
```
table_name  | table_schema
profiles    | public
```

Si NO aparece nada, la tabla NO se creó. Reporta.

---

### Verificación 2: Estructura de profiles

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name  | data_type                    | is_nullable | column_default
id           | uuid                         | NO          | 
full_name    | text                         | YES         | 
phone        | text                         | YES         | 
created_at   | timestamp with time zone     | NO          | now()
updated_at   | timestamp with time zone     | NO          | now()
```

---

### Verificación 3: RLS habilitado

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```

**Resultado esperado:**
```
schemaname | tablename | rowsecurity
public     | profiles  | true
```

Si `rowsecurity = false`, RLS no está habilitado. Reporta.

---

### Verificación 4: RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Resultado esperado:** 3 policies
```
schemaname | tablename | policyname                          | roles         | ...
public     | profiles  | Users can insert their own profile  | {authenticated}
public     | profiles  | Users can update their own profile  | {authenticated}
public     | profiles  | Users can view their own profile    | {authenticated}
```

Si menos de 3, falta alguna. Reporta.

---

### Verificación 5: Funciones creadas

```sql
SELECT 
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_updated_at_column', 'handle_new_user')
AND routine_schema = 'public'
ORDER BY routine_name;
```

**Resultado esperado:** 2 funciones
```
routine_schema | routine_name                | routine_type
public         | handle_new_user             | FUNCTION
public         | update_updated_at_column    | FUNCTION
```

Si faltan, reporta.

---

### Verificación 6: Triggers creados

```sql
SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'profiles'
ORDER BY trigger_name;
```

**Resultado esperado:** 2 triggers
```
trigger_schema | trigger_name                      | event_manipulation | event_object_table
public         | on_auth_user_created              | INSERT             | users
public         | update_profiles_updated_at        | UPDATE             | profiles
```

Si faltan, reporta.

---

### Verificación 7: Permisos en handle_new_user

```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles'
UNION
SELECT 
  grantee,
  privilege_type
FROM aclexplode((
  SELECT proacl FROM pg_proc 
  WHERE proname = 'handle_new_user' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)) x(grantor, grantee, privileges)
WHERE privileges & 4 != 0; -- EXECUTE
```

**Resultado esperado:**
```
Sin resultados (o solo service_role con EXECUTE)
```

Si aparecen permisos EXECUTE para authenticated o anon, reporta.

---

### Verificación 8: Storage bucket existe

```sql
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'hero-animation';
```

**Resultado esperado:**
```
id               | name             | public
[uuid]           | hero-animation   | true
```

Si no aparece, el bucket NO existe. Reporta.

---

### Verificación 9: Storage policy existe

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%hero%';
```

**Resultado esperado:**
```
schemaname | tablename | policyname                              | permissive | ...
storage    | objects   | Anyone can read hero animation frames   | true       | ...
```

Si no aparece, la policy NO existe. Reporta.

---

## 📋 RESUMEN DE PASOS

| Paso | Acción | Dónde | SQL |
|------|--------|-------|-----|
| 1 | Crear profiles | SQL Editor | Migration 1 |
| 2 | Revoke permisos | SQL Editor | Migration 2 |
| 3 | Crear bucket | Dashboard Storage | Manual |
| 4 | Crear policy storage | SQL Editor | Storage Policy |
| 5+ | Verificar (9 queries) | SQL Editor | READ-ONLY |

---

## 🚀 ORDEN EXACTO DE EJECUCIÓN

1. ✅ Copiar SQL Migration 1 → Pegar en SQL Editor → Ejecutar
2. ✅ Copiar SQL Migration 2 → Pegar en SQL Editor → Ejecutar
3. ✅ Crear bucket via Dashboard (Storage)
4. ✅ Copiar SQL Storage Policy → Pegar en SQL Editor → Ejecutar
5. ✅ Ejecutar 9 queries de verificación (una por una)
6. ✅ **DETENTE y reporta resultados**

---

## ⚠️ SI APARECE ERROR

**NO hagas rollback automático.** En su lugar:

1. Lee el mensaje de error
2. Verifica si es realmente un error o un warning
3. Reporta el error exacto con screenshot si es posible
4. Espera instrucciones

---

## 🎯 RESULTADO ESPERADO FINAL

Después de ejecutar FASE 1, el nuevo Supabase debe tener:

```
leksmflinhohnekbgmgj
├── public/
│   ├── TABLE: profiles ..................... ✅ EXISTE
│   │   ├── Columnas: id, full_name, phone, created_at, updated_at
│   │   ├── PK: id (UUID)
│   │   ├── FK: id → auth.users (DELETE CASCADE)
│   │   ├── RLS: ✅ HABILITADO
│   │   └── Policies: 3 (SELECT, INSERT, UPDATE)
│   │
│   ├── FUNCTION: update_updated_at_column ✅ EXISTE
│   ├── FUNCTION: handle_new_user ........... ✅ EXISTE
│   ├── TRIGGER: update_profiles_updated_at ✅ EXISTE
│   └── TRIGGER: on_auth_user_created ...... ✅ EXISTE
│
├── storage/
│   ├── BUCKET: hero-animation ............. ✅ EXISTE
│   │   ├── Public: true
│   │   └── Policy: "Anyone can read hero animation frames"
│   └── storage.objects POLICY: ✅ EXISTE
│
└── auth/
    └── users ........................... ✅ EXISTE (Supabase managed)
```

---

**FASE 1 - LISTA PARA EJECUCIÓN MANUAL**

Cuando hayas completado todos los pasos y verificaciones, reporta los resultados.

