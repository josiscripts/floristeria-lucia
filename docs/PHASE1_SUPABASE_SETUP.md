# FASE 1: SUPABASE - Creación de product_metadata

**Estado:** Listo para aplicar  
**Archivo de migración:** `supabase/migrations/20260826000001_create_product_metadata.sql`

---

## 🎯 OBJETIVO

Crear la tabla `product_metadata` con estructura, constraints, índices y RLS policies.

---

## ✅ ESTRUCTURA CREADA

### Tabla: `public.product_metadata`

```sql
CREATE TABLE public.product_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location & Foreign Keys
  location_id TEXT NOT NULL DEFAULT 'vOq7yOWR63XGU4qQ7XWd',
  ghl_product_id TEXT NOT NULL,
  legacy_catalog_id TEXT,

  -- Pricing metadata
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),

  -- Customization
  available_colors TEXT[],
  badge_label TEXT,

  -- Business logic
  rose_step INTEGER,
  requires_quote BOOLEAN DEFAULT false,

  -- Status & tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  auto_created BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints...
);
```

---

## 🔐 CONSTRAINTS

```sql
-- Unique constraints
UNIQUE(location_id, ghl_product_id)        -- Solo un producto por GHL ID
UNIQUE(legacy_catalog_id)                  -- Mapeo único a catalog.ts

-- Check constraints
CHECK (price_max IS NULL OR price_max > 0)
CHECK (price_min IS NULL OR price_min > 0)
CHECK (rose_step IS NULL OR rose_step > 0)
CHECK (status IN ('active', 'deleted'))
```

---

## 📊 ÍNDICES CREADOS

```sql
CREATE INDEX idx_ghl_product_id ON public.product_metadata(ghl_product_id);
CREATE INDEX idx_legacy_catalog_id ON public.product_metadata(legacy_catalog_id);
CREATE INDEX idx_status ON public.product_metadata(status);
CREATE INDEX idx_location_id ON public.product_metadata(location_id);
CREATE INDEX idx_created_at ON public.product_metadata(created_at);
```

**Propósito:** Optimizar queries frecuentes

---

## 🔑 RLS POLICIES

### Policy 1: Lectura pública (SELECT)

```sql
CREATE POLICY "read_active_product_metadata"
  ON public.product_metadata
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');
```

**Quién:** Anon + usuarios autenticados  
**Qué ven:** Solo metadatos de productos activos

### Policy 2: Escritura desde server (INSERT)

```sql
CREATE POLICY "insert_product_metadata_service_role"
  ON public.product_metadata
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

**Quién:** Solo Service Role Key (server-side)  
**Qué puede:** Insertar nuevas entradas

### Policy 3: Actualización desde server (UPDATE)

```sql
CREATE POLICY "update_product_metadata_service_role"
  ON public.product_metadata
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Quién:** Solo Service Role Key (server-side)  
**Qué puede:** Actualizar campos

### Policy 4: Eliminación desde server (DELETE)

```sql
CREATE POLICY "delete_product_metadata_service_role"
  ON public.product_metadata
  FOR DELETE
  TO service_role
  USING (true);
```

**Quién:** Solo Service Role Key (server-side)  
**Qué puede:** Marcar como eliminado (soft delete)

---

## 📝 TRIGGER

```sql
CREATE TRIGGER update_product_metadata_updated_at
BEFORE UPDATE ON public.product_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

**Propósito:** Actualizar automáticamente `updated_at` en cada cambio  
**Nota:** Usa función existente `update_updated_at_column()` de migration anterior

---

## 🔄 PERMISSIONS

```sql
GRANT SELECT ON public.product_metadata TO anon, authenticated;
GRANT ALL ON public.product_metadata TO service_role;
```

- Anon/Authenticated: Solo lectura de activos
- Service Role: Control total (server-side)

---

## 📋 CÓMO APLICAR LA MIGRACIÓN

### Opción 1: Supabase CLI (Recomendado)

```bash
# Instalar CLI (si no está instalado)
npm install -g supabase

# Ejecutar migración
supabase db push
```

### Opción 2: SQL directo en Supabase Dashboard

1. Ir a: https://supabase.com
2. Acceder al proyecto de Floristería Lucía
3. SQL Editor → New Query
4. Copiar contenido de: `supabase/migrations/20260826000001_create_product_metadata.sql`
5. Ejecutar

### Opción 3: Mediante API de Supabase

```bash
# Ejecutar el SQL directamente
curl -X POST https://[PROJECT_ID].supabase.co/rest/v1/sql \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d @supabase/migrations/20260826000001_create_product_metadata.sql
```

---

## ✅ VERIFICACIÓN DESPUÉS DE APLICAR

### 1. Verificar tabla existe

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'product_metadata';
```

**Esperado:** Una fila con `product_metadata`

### 2. Verificar estructura

```sql
\d public.product_metadata
```

**Esperado:** Columnas, índices, constraints listados

### 3. Verificar RLS está habilitado

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'product_metadata';
```

**Esperado:** `rowsecurity = true`

### 4. Verificar policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'product_metadata';
```

**Esperado:** 4 policies listadas

### 5. Verificar índices

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'product_metadata';
```

**Esperado:** 5 índices listados

### 6. Test de inserción (server-side)

```sql
-- Hacer esto SOLO como service_role en código backend
INSERT INTO public.product_metadata (
  ghl_product_id,
  legacy_catalog_id,
  price_max,
  available_colors,
  badge_label,
  rose_step,
  status
) VALUES (
  'test_product_123',
  'test-catalog-id',
  48,
  ARRAY['Rojo', 'Rosa', 'Blanco'],
  'Test Badge',
  6,
  'active'
);

-- Verificar inserción
SELECT * FROM public.product_metadata
WHERE ghl_product_id = 'test_product_123';
```

---

## ⚠️ IMPORTANTE

### Durante esta Fase 1:

✅ **COMPLETADO:**

- Migración SQL creada
- Estructura definida
- Constraints y índices especificados
- RLS policies definidas

❌ **NO HACER:**

- No migrar productos todavía
- No crear webhook/polling
- No crear /admin/products
- No modificar catalog.ts
- No modificar GHL
- No cambiar frontend

### Próxima Fase:

Esperar aprobación después de que la migración sea aplicada a Supabase.

---

## 📝 NOTAS TÉCNICAS

### Soft Delete Strategy

```
Cuando se elimina un producto en GHL:
  ├─ GHL envía webhook (status = inactive) O polling lo detecta
  ├─ Vercel actualiza: UPDATE product_metadata SET status = 'deleted'
  ├─ deleted_at se actualiza automáticamente (trigger)
  └─ Frontend filtra: WHERE status = 'active'

Beneficios:
  ✅ Datos permanecen para auditoría
  ✅ Reversible si es necesario
  ✅ Sin orfandades de datos
```

### Timezone handling

```
Todos los timestamps usan TIMESTAMP WITH TIME ZONE
  ├─ Garantiza consistencia independiente de zona horaria
  └─ Recomendado para aplicaciones globales
```

### Comments

Cada columna tiene comentario para documentación:

```sql
COMMENT ON COLUMN public.product_metadata.ghl_product_id
  IS 'Foreign key to GoHighLevel product ID (_id)';
```

---

**FASE 1 COMPLETA - LISTA PARA APLICACIÓN**
