# FASE 1: Checklist de Verificación READ-ONLY

**Proyecto:** leksmflinhohnekbgmgj  
**Fecha:** 2026-08-26  
**Status:** Verificación pendiente de resultados del usuario  

---

## 📋 10 VERIFICACIONES REQUERIDAS

Para cada query abajo:
1. **Copiar** el SQL exacto
2. **Pegar** en SQL Editor de Supabase
3. **Ejecutar** (RUN o Ctrl+Enter)
4. **Anotar resultado** (si aparece o cuántas filas)
5. **Marcar ✅** si es correcto

---

## ✅ VERIFICACIÓN 1: Tabla profiles EXISTE

**Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'profiles' AND table_schema = 'public';
```

**Resultado esperado:**
```
table_name
───────────
profiles
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila con "profiles"  
**¿Paso?** ❌ NO: Si no retorna nada, la tabla NO existe

---

## ✅ VERIFICACIÓN 2: Columnas correctas

**Query:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name
──────────────
id
full_name
phone
created_at
updated_at
```

**¿Paso?** ✅ SÍ: Exactamente 5 columnas en este orden  
**¿Paso?** ❌ NO: Si faltan o hay otras, la tabla tiene problemas

---

## ✅ VERIFICACIÓN 3: RLS HABILITADO

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

**¿Paso?** ✅ SÍ: rowsecurity = true  
**¿Paso?** ❌ NO: Si es false, RLS no está habilitado

---

## ✅ VERIFICACIÓN 4: 3 POLICIES CREADAS

**Query:**
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
```

**Resultado esperado:**
```
policyname
────────────────────────────────────
Users can insert their own profile
Users can update their own profile
Users can view their own profile
```

**¿Paso?** ✅ SÍ: Exactamente 3 policies  
**¿Paso?** ❌ NO: Si hay menos de 3, faltan policies

---

## ✅ VERIFICACIÓN 5: Función update_updated_at_column()

**Query:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column' 
AND routine_schema = 'public';
```

**Resultado esperado:**
```
routine_name
──────────────────────────
update_updated_at_column
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila  
**¿Paso?** ❌ NO: Si no retorna nada, función NO existe

---

## ✅ VERIFICACIÓN 6: Función handle_new_user()

**Query:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';
```

**Resultado esperado:**
```
routine_name
──────────────
handle_new_user
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila  
**¿Paso?** ❌ NO: Si no retorna nada, función NO existe

---

## ✅ VERIFICACIÓN 7: Trigger update_profiles_updated_at

**Query:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'update_profiles_updated_at' 
AND trigger_schema = 'public';
```

**Resultado esperado:**
```
trigger_name
──────────────────────────────
update_profiles_updated_at
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila  
**¿Paso?** ❌ NO: Si no retorna nada, trigger NO existe

---

## ✅ VERIFICACIÓN 8: Trigger on_auth_user_created

**Query:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created' 
AND trigger_schema = 'public';
```

**Resultado esperado:**
```
trigger_name
─────────────────────────
on_auth_user_created
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila  
**¿Paso?** ❌ NO: Si no retorna nada, trigger NO existe

---

## ✅ VERIFICACIÓN 9: Storage Bucket hero-animation

**Query:**
```sql
SELECT name, public FROM storage.buckets 
WHERE name = 'hero-animation';
```

**Resultado esperado:**
```
name                | public
────────────────────┼────────
hero-animation      | true
```

**¿Paso?** ✅ SÍ: name = "hero-animation" y public = true  
**¿Paso?** ❌ NO: Si no retorna nada, bucket NO existe

---

## ✅ VERIFICACIÓN 10: Storage Policy hero-animation

**Query:**
```sql
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%hero%';
```

**Resultado esperado:**
```
policyname
────────────────────────────────────────
Anyone can read hero animation frames
```

**¿Paso?** ✅ SÍ: Debe retornar 1 fila con la policy correcta  
**¿Paso?** ❌ NO: Si no retorna nada, policy NO existe

---

## 📋 RESUMEN

Después de ejecutar las 10 verificaciones, reporta:

- ✅ VERIFICACIÓN 1 (profiles existe): **[SÍ / NO]**
- ✅ VERIFICACIÓN 2 (columnas): **[SÍ / NO]**
- ✅ VERIFICACIÓN 3 (RLS): **[SÍ / NO]**
- ✅ VERIFICACIÓN 4 (3 policies): **[SÍ / NO]**
- ✅ VERIFICACIÓN 5 (update_updated_at_column): **[SÍ / NO]**
- ✅ VERIFICACIÓN 6 (handle_new_user): **[SÍ / NO]**
- ✅ VERIFICACIÓN 7 (trigger update_profiles_updated_at): **[SÍ / NO]**
- ✅ VERIFICACIÓN 8 (trigger on_auth_user_created): **[SÍ / NO]**
- ✅ VERIFICACIÓN 9 (bucket hero-animation): **[SÍ / NO]**
- ✅ VERIFICACIÓN 10 (policy hero-animation): **[SÍ / NO]**

---

**CUANDO TENGAS LOS 10 RESULTADOS, REPORTA TODO**

