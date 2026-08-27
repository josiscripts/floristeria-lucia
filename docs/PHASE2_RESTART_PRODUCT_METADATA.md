# FASE 2: Reiniciar product_metadata desde Cero

**Proyecto:** leksmflinhohnekbgmgj  
**Objetivo:** Eliminar y recrear product_metadata exactamente según la migración oficial  
**Fecha:** 2026-08-27  

---

## ⚠️ PRECAUCIÓN

Este procedimiento ELIMINA la tabla product_metadata completamente.

**Solo continúa si:**
- ✅ El proyecto es leksmflinhohnekbgmgj (nuevo)
- ✅ Contiene 0 registros (verificado primero)
- ❌ NO es el Supabase Lovable (fiddxvgjdosprltflqep)

---

## PASO 1: COMPROBACIÓN PREVIA READ-ONLY

**Verifica ANTES de eliminar:**

```sql
SELECT COUNT(*) AS total_records
FROM public.product_metadata;
```

**Resultado esperado:** 
```
total_records
─────────────
0
```

**¿Qué hacer si contiene registros?**
- ❌ DETENTE
- ❌ NO ejecutes DROP
- ✅ Reporta el número de registros
- ✅ Espera instrucciones

**Si contiene 0 registros:** Continúa al PASO 2

---

## PASO 2: ELIMINAR product_metadata

**Solo si PASO 1 confirmó 0 registros:**

```sql
DROP TABLE public.product_metadata;
```

**Resultado esperado:**
```
DROP TABLE

Query executed successfully (took XXms)
```

**Cosas que NO debes eliminar:**
- ❌ public.profiles
- ❌ auth.users
- ❌ storage buckets
- ❌ public.update_updated_at_column()
- ❌ ninguna otra tabla

---

## PASO 3: RECREAR DESDE LA MIGRACIÓN OFICIAL

Ejecuta EXACTAMENTE este SQL (sin modificaciones):

```sql
-- ============================================================================
-- MIGRATION: 20260826000001_create_product_metadata.sql
-- Propósito: Tabla de metadatos para productos GHL
-- Fecha: 2026-08-26
-- ============================================================================

CREATE TABLE public.product_metadata (
  -- Primary key
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

  -- Constraints
  CONSTRAINT unique_ghl_product_id UNIQUE(location_id, ghl_product_id),
  CONSTRAINT unique_legacy_catalog_id UNIQUE(legacy_catalog_id),
  CONSTRAINT check_price_max CHECK (price_max IS NULL OR price_max > 0),
  CONSTRAINT check_price_min CHECK (price_min IS NULL OR price_min > 0),
  CONSTRAINT check_rose_step CHECK (rose_step IS NULL OR rose_step > 0)
);

-- Create indexes for performance
CREATE INDEX idx_ghl_product_id ON public.product_metadata(ghl_product_id);
CREATE INDEX idx_legacy_catalog_id ON public.product_metadata(legacy_catalog_id);
CREATE INDEX idx_status ON public.product_metadata(status);
CREATE INDEX idx_location_id ON public.product_metadata(location_id);
CREATE INDEX idx_created_at ON public.product_metadata(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_product_metadata_updated_at
BEFORE UPDATE ON public.product_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.product_metadata ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.product_metadata TO anon, authenticated;
GRANT ALL ON public.product_metadata TO service_role;

-- RLS Policies

-- Policy 1: Anon and authenticated users can SELECT active products
CREATE POLICY "read_active_product_metadata"
  ON public.product_metadata
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Policy 2: Service role (backend server-side) can INSERT
CREATE POLICY "insert_product_metadata_service_role"
  ON public.product_metadata
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy 3: Service role can UPDATE
CREATE POLICY "update_product_metadata_service_role"
  ON public.product_metadata
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 4: Service role can DELETE (soft delete via status)
CREATE POLICY "delete_product_metadata_service_role"
  ON public.product_metadata
  FOR DELETE
  TO service_role
  USING (true);

-- Add comment to table
COMMENT ON TABLE public.product_metadata IS 'Technical metadata for GHL products. Stores fields that GHL Products API cannot handle as custom fields.';
COMMENT ON COLUMN public.product_metadata.ghl_product_id IS 'Foreign key to GoHighLevel product ID (_id)';
COMMENT ON COLUMN public.product_metadata.legacy_catalog_id IS 'Reference to original catalog.ts product ID for migration';
COMMENT ON COLUMN public.product_metadata.price_max IS 'Maximum price for range pricing (priceMax in catalog.ts)';
COMMENT ON COLUMN public.product_metadata.available_colors IS 'JSON array of available colors for customization';
COMMENT ON COLUMN public.product_metadata.badge_label IS 'Visual badge/label for the product (Más vendido, Premium, etc.)';
COMMENT ON COLUMN public.product_metadata.rose_step IS 'Multiplier for rose products (e.g., 6 = 1 unit = 6 roses)';
COMMENT ON COLUMN public.product_metadata.status IS 'Soft delete status: active or deleted';
```

**Resultado esperado:**
```
Query executed successfully (took XXms)
```

---

## PASO 4: VERIFICACIÓN READ-ONLY (11 checks)

### Verificación 1: Tabla existe

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'product_metadata' AND table_schema = 'public';
```

**Esperado:** `product_metadata` ✅

---

### Verificación 2: 15 columnas

```sql
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'product_metadata';
```

**Esperado:** `15` ✅

---

### Verificación 3: Columnas correctas

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_metadata'
ORDER BY ordinal_position;
```

**Esperado:**
```
id → uuid
location_id → text
ghl_product_id → text
legacy_catalog_id → text
price_min → numeric
price_max → numeric
available_colors → text[]
badge_label → text
rose_step → integer
requires_quote → boolean
status → text
auto_created → boolean
created_at → timestamp with time zone
updated_at → timestamp with time zone
deleted_at → timestamp with time zone
```

✅ Exactamente 15, en este orden

---

### Verificación 4: Primary Key

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'product_metadata'
AND constraint_type = 'PRIMARY KEY';
```

**Esperado:** `1 fila` ✅

---

### Verificación 5: Constraints UNIQUE

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'product_metadata'
AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;
```

**Esperado:**
```
unique_ghl_product_id
unique_legacy_catalog_id
```

✅ Exactamente 2

---

### Verificación 6: CHECK constraints

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'product_metadata'
AND constraint_type = 'CHECK'
ORDER BY constraint_name;
```

**Esperado:**
```
check_price_max
check_price_min
check_rose_step
product_metadata_status_check
```

✅ Exactamente 4

---

### Verificación 7: 5 Índices

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'product_metadata'
ORDER BY indexname;
```

**Esperado:**
```
idx_created_at
idx_ghl_product_id
idx_legacy_catalog_id
idx_location_id
idx_status
```

✅ Exactamente 5

---

### Verificación 8: Trigger

```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'product_metadata';
```

**Esperado:** `update_product_metadata_updated_at` ✅

---

### Verificación 9: RLS habilitado

```sql
SELECT rowsecurity
FROM pg_tables
WHERE tablename = 'product_metadata';
```

**Esperado:** `true` ✅

---

### Verificación 10: 4 Policies

```sql
SELECT policyname
FROM pg_policies
WHERE tablename = 'product_metadata'
ORDER BY policyname;
```

**Esperado:**
```
delete_product_metadata_service_role
insert_product_metadata_service_role
read_active_product_metadata
update_product_metadata_service_role
```

✅ Exactamente 4

---

### Verificación 11: Tabla vacía

```sql
SELECT COUNT(*) as row_count
FROM public.product_metadata;
```

**Esperado:** `0` ✅

---

## 📋 CHECKLIST DE EJECUCIÓN

- [ ] PASO 1: Verificación READ-ONLY (0 registros)
- [ ] PASO 2: DROP TABLE ejecutado
- [ ] PASO 3: Migración recreada (Query executed successfully)
- [ ] Verificación 1: Tabla existe ✅
- [ ] Verificación 2: 15 columnas ✅
- [ ] Verificación 3: Columnas correctas ✅
- [ ] Verificación 4: Primary Key ✅
- [ ] Verificación 5: UNIQUE constraints ✅
- [ ] Verificación 6: CHECK constraints ✅
- [ ] Verificación 7: 5 Índices ✅
- [ ] Verificación 8: Trigger ✅
- [ ] Verificación 9: RLS ✅
- [ ] Verificación 10: 4 Policies ✅
- [ ] Verificación 11: Tabla vacía ✅

---

## 🛑 IMPORTANTE

**NO hagas:**
- ❌ INSERT de datos
- ❌ UPDATE
- ❌ DELETE
- ❌ Modificar profiles
- ❌ Modificar auth.users
- ❌ Cambios en .env
- ❌ Deploy
- ❌ Modificar GHL

**Solo:**
- ✅ DROP TABLE product_metadata
- ✅ Ejecutar migración exactamente
- ✅ SELECT queries de verificación

