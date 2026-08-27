# FASE 2: Verificaciones Previas

**Proyecto objetivo:** leksmflinhohnekbgmgj  
**Fecha:** 2026-08-26  

---

## 🔍 PRECONDICIONES A VERIFICAR

Antes de ejecutar la migración product_metadata, necesitamos confirmar:

### PRECONDICIÓN 1: product_metadata NO existe

**Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'product_metadata' AND table_schema = 'public';
```

**Resultado esperado:**
```
(Sin resultados - tabla no existe)
```

**¿Por qué?** Si ya existe, no podemos recrearla sin DROP.

---

### PRECONDICIÓN 2: Función update_updated_at_column() SÍ existe

**Query:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column' AND routine_schema = 'public';
```

**Resultado esperado:**
```
routine_name
──────────────────────────
update_updated_at_column
```

**¿Por qué?** El trigger de product_metadata la necesita.

---

### PRECONDICIÓN 3: Tabla profiles SÍ existe

**Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';
```

**Resultado esperado:**
```
table_name
──────────
profiles
```

**¿Por qué?** Debe existir para que FASE 1 fue exitosa.

---

### PRECONDICIÓN 4: RLS de profiles está habilitado

**Query:**
```sql
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'profiles';
```

**Resultado esperado:**
```
rowsecurity
───────────
true
```

**¿Por qué?** Verificar que FASE 1 fue correcta.

---

## ✅ INSTRUCCIONES

1. Ve a: https://leksmflinhohnekbgmgj.supabase.co
2. SQL Editor
3. Ejecuta las 4 queries arriba
4. Confirma que:
   - ✅ product_metadata NO EXISTE
   - ✅ update_updated_at_column() EXISTE
   - ✅ profiles EXISTE
   - ✅ RLS en profiles = true

5. Reporta resultados

Si todo es correcto, procederemos a ejecutar FASE 2.

Si algo falla, reporta el error y DETENEMOS.

