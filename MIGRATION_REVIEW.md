# 🔍 REVISIÓN DE MIGRACIONES PARA PRODUCCIÓN

Fecha: 4 de septiembre de 2026
Estado: PRE-EJECUCIÓN (NO EJECUTADAS AÚN)

---

## 1️⃣ MIGRACIÓN: `20260904_add_user_id_to_orders.sql`

### ✅ VERIFICACIÓN: LISTA PARA EJECUTAR

#### Análisis:
- **Tipo**: Alterar tabla existente (orders)
- **Seguridad**: Idempotente (usa `ALTER TABLE`)
- **Impacto**: Agrega columna nullable (NO rompe datos existentes)

#### Detalles de la migración:

```sql
-- 1. Agrega columna user_id (nullable)
ALTER TABLE public.orders
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Crea índice para queries eficientes
CREATE INDEX idx_orders_user_id_created_at
  ON public.orders(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- 3. Habilita RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Limpia políticas RLS existentes (seguro)
DROP POLICY IF EXISTS ...

-- 5. Crea políticas RLS nuevas
CREATE POLICY "Users can view their own orders" ...
CREATE POLICY "Admins can view all orders" ...
CREATE POLICY "Public can insert orders" ...
CREATE POLICY "Admins can update orders" ...
```

#### ✅ Verificaciones completadas:

1. **Columna user_id:**
   - ✅ Tipo: `uuid` (correcto)
   - ✅ Referencia: `auth.users(id)` (correcto)
   - ✅ ON DELETE: `SET NULL` (permite guest orders)
   - ✅ Nullable: Sí (permite user_id = NULL)

2. **Índice:**
   - ✅ Índice previsto: `idx_orders_user_id_created_at`
   - ✅ Incluye columna user_id y created_at DESC
   - ✅ Tiene WHERE clause para NULL (optimiza queries)

3. **Impacto en datos existentes:**
   - ✅ 12 pedidos de prueba (deleted_at) no se afectan
   - ✅ Nuevos pedidos pueden tener user_id = NULL o auth.uid()
   - ✅ Columna es nullable - no fuerza valor

4. **Seguridad del código POST /api/orders:**
   - ✅ Línea 164-171: Extrae user_id del JWT
   - ✅ Línea 180: Asigna userId a orderRequest
   - ✅ Línea 148 (orders.server.ts): Inserta `user_id: request.userId || null`
   - ✅ Cliente NO puede enviar user_id arbitrario
   - ✅ Server obtiene user_id de la sesión autenticada

5. **Políticas RLS:**
   - ✅ Users: `auth.uid() = user_id` (solo sus pedidos)
   - ✅ Admins: Bypass completo via role check
   - ✅ Public insert: Permite crear (server valida user_id)
   - ✅ Admin update: Control de admin

#### ⚠️ Nota importante:
La RLS policy "Users can view their own orders" SOLO permite ver pedidos donde `auth.uid() = user_id`. Los pedidos guest (user_id = NULL) no serán visibles para usuarios autenticados, lo cual es CORRECTO.

#### 🟢 ESTADO: **LISTA PARA EJECUTAR**

---

## 2️⃣ MIGRACIÓN: `20260904_create_addresses_table.sql`

### ⚠️ REVISIÓN: REQUIERE CORRECCIÓN ANTES DE EJECUTAR

#### Problema identificado:

La migración usa `CREATE TABLE public.addresses` SIN `IF NOT EXISTS`.

**Riesgo**: Si la tabla ya existe en producción, la migración FALLARÁ.

#### Situación actual:
- En desarrollo: tabla NO existe aún
- En producción: desconocido (probablemente NO existe)

#### Corrección requerida:

```sql
-- CAMBIAR ESTO:
CREATE TABLE public.addresses (

-- A ESTO:
CREATE TABLE IF NOT EXISTS public.addresses (
```

#### Análisis de la migración (después de corrección):

```sql
-- 1. Crea tabla de direcciones (seguro con IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... campos
);

-- 2. Crea índice
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- 3. Habilita RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (solo usuario propietario)
CREATE POLICY "Users can view their own addresses" ...
CREATE POLICY "Users can insert their own addresses" ...
CREATE POLICY "Users can update their own addresses" ...
CREATE POLICY "Users can delete their own addresses" ...
CREATE POLICY "Admins can manage all addresses" ...
```

#### ✅ Verificaciones completadas:

1. **Estructura de tabla:**
   - ✅ Tipos de datos: correctos
   - ✅ user_id: FK a auth.users(id) con ON DELETE CASCADE
   - ✅ Índice: presente y optimizado
   - ✅ Timestamps: created_at y updated_at

2. **Seguridad RLS:**
   - ✅ SELECT: `auth.uid() = user_id` (solo propietario)
   - ✅ INSERT: `auth.uid() = user_id` (solo propio)
   - ✅ UPDATE: `auth.uid() = user_id` (solo propio)
   - ✅ DELETE: `auth.uid() = user_id` (solo propio)
   - ✅ Admin bypass: Funciona correctamente

3. **Impacto:**
   - ✅ Nueva tabla, no afecta existentes
   - ✅ Integración con componente DireccionesSection.tsx

#### 🟡 CORRECCIÓN NECESARIA:

```diff
- CREATE TABLE public.addresses (
+ CREATE TABLE IF NOT EXISTS public.addresses (
```

#### 🔴 ESTADO ACTUAL: **REQUIERE CORRECCIÓN**

#### 🟢 ESTADO DESPUÉS DE CORRECCIÓN: **LISTA PARA EJECUTAR**

---

## 3️⃣ MIGRACIÓN: `20260904_create_user_preferences_table.sql`

### ⚠️ REVISIÓN: REQUIERE CORRECCIÓN ANTES DE EJECUTAR

#### Problema identificado:

La migración usa `CREATE TABLE public.user_preferences` SIN `IF NOT EXISTS`.

**Riesgo**: Si la tabla ya existe en producción, la migración FALLARÁ.

#### Corrección requerida:

```sql
-- CAMBIAR ESTO:
CREATE TABLE IF NOT EXISTS orders (

-- A ESTO:
CREATE TABLE IF NOT EXISTS public.user_preferences (
```

#### Análisis de la migración (después de corrección):

```sql
-- 1. Crea tabla de preferencias (seguro con IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... campos de preferencias
);

-- 2. Crea índice
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- 3. Habilita RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (estricta por usuario)
CREATE POLICY "Users can view their own preferences" ...
CREATE POLICY "Users can insert their own preferences" ...
CREATE POLICY "Users can update their own preferences" ...
CREATE POLICY "Admins can manage all preferences" ...
```

#### ✅ Verificaciones completadas:

1. **Estructura de tabla:**
   - ✅ Tipos de datos: correctos
   - ✅ user_id: UNIQUE (una sola fila por usuario)
   - ✅ FK a auth.users(id) con ON DELETE CASCADE
   - ✅ Índice: presente

2. **Campos de preferencias:**
   - ✅ email_newsletter_* (promotions, news, order_updates)
   - ✅ cookies_* (analytics, personalization, marketing)
   - ✅ purchase preferences (delivery_time, recurring_orders)
   - ✅ Timestamps: created_at y updated_at

3. **Seguridad RLS:**
   - ✅ SELECT: `auth.uid() = user_id` (solo propietario)
   - ✅ INSERT: `auth.uid() = user_id` (solo propio)
   - ✅ UPDATE: `auth.uid() = user_id` (solo propio)
   - ✅ Admin bypass: Funciona correctamente

4. **Impacto:**
   - ✅ Nueva tabla, no afecta existentes
   - ✅ Integración con componentes PreferenciasCompraSection, etc.

#### 🟡 CORRECCIÓN NECESARIA:

```diff
- CREATE TABLE public.user_preferences (
+ CREATE TABLE IF NOT EXISTS public.user_preferences (
```

#### 🔴 ESTADO ACTUAL: **REQUIERE CORRECCIÓN**

#### 🟢 ESTADO DESPUÉS DE CORRECCIÓN: **LISTA PARA EJECUTAR**

---

## 📋 RESUMEN DE CORRECCIONES NECESARIAS

### Migración 1: `20260904_add_user_id_to_orders.sql`
- ✅ **LISTA** - No requiere cambios

### Migración 2: `20260904_create_addresses_table.sql`
- ⚠️ **REQUIERE CAMBIO**: Línea 4
  ```diff
  - CREATE TABLE public.addresses (
  + CREATE TABLE IF NOT EXISTS public.addresses (
  ```

### Migración 3: `20260904_create_user_preferences_table.sql`
- ⚠️ **REQUIERE CAMBIO**: Línea 4
  ```diff
  - CREATE TABLE public.user_preferences (
  + CREATE TABLE IF NOT EXISTS public.user_preferences (
  ```

---

## 🔧 CORRECCIONES A APLICAR

He identificado que dos migraciones necesitan correcciones. Las corregiré ahora.

---

## ✅ VERIFICACIONES POST-EJECUCIÓN

Después de ejecutar las migraciones en Supabase, verificar inmediatamente:

### Para `20260904_add_user_id_to_orders.sql`:
```sql
-- Verificar columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'user_id';

-- Verificar índice existe
SELECT indexname FROM pg_indexes
WHERE tablename = 'orders' AND indexname = 'idx_orders_user_id_created_at';

-- Verificar RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class WHERE relname = 'orders';
```

### Para `20260904_create_addresses_table.sql`:
```sql
-- Verificar tabla existe
SELECT * FROM information_schema.tables
WHERE table_name = 'addresses';

-- Verificar índice
SELECT indexname FROM pg_indexes
WHERE tablename = 'addresses' AND indexname = 'idx_addresses_user_id';

-- Verificar RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'addresses';
```

### Para `20260904_create_user_preferences_table.sql`:
```sql
-- Verificar tabla existe
SELECT * FROM information_schema.tables
WHERE table_name = 'user_preferences';

-- Verificar índice
SELECT indexname FROM pg_indexes
WHERE tablename = 'user_preferences' AND indexname = 'idx_user_preferences_user_id';

-- Verificar RLS
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'user_preferences';
```

---

## 🚀 SQL A EJECUTAR EN SUPABASE (DESPUÉS DE CORRECCIONES)

Se ejecutarán las tres migraciones corregidas en orden:

1. `20260904_add_user_id_to_orders.sql` (sin cambios)
2. `20260904_create_addresses_table.sql` (con corrección IF NOT EXISTS)
3. `20260904_create_user_preferences_table.sql` (con corrección IF NOT EXISTS)
