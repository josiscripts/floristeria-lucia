# FASE 2: Análisis de DELETE Policy para Soft Delete

**Fecha:** 2026-08-26  
**Tema:** ¿Es necesaria la policy DELETE o debe usarse solo UPDATE?  

---

## 🎯 PROBLEMA

La migración contiene:

```sql
CREATE POLICY "delete_product_metadata_service_role"
  ON public.product_metadata
  FOR DELETE
  TO service_role
  USING (true);
```

Pero la arquitectura usa **soft delete** con:
- `status = 'active'` o `status = 'deleted'`
- `deleted_at = now()`

**Pregunta crítica:** ¿Necesitamos permitir DELETE físico (borrado de la fila)?

---

## 📊 ANÁLISIS

### Opción A: Usar DELETE Físico (actual en migración)

```sql
DELETE FROM product_metadata WHERE id = 'xxx';
-- Fila DESAPARECE completamente
```

**Ventajas:**
- ✅ Recupera espacio en BD
- ✅ Útil para datos sensibles (GDPR)
- ✅ Limpia datos de prueba

**Desventajas:**
- ❌ Pierde auditoría histórica
- ❌ Puede romper reportes
- ❌ Irreversible
- ❌ Viola el patrón soft delete

---

### Opción B: Usar UPDATE solamente (soft delete puro)

```sql
UPDATE product_metadata 
SET status = 'deleted', deleted_at = now() 
WHERE id = 'xxx';
-- Fila EXISTE pero oculta
```

**Ventajas:**
- ✅ Mantiene auditoría completa
- ✅ Reversible (cambiar status a 'active')
- ✅ RLS oculta automáticamente (status != 'active')
- ✅ Coherente con soft delete aprobado
- ✅ Datos preservados para reportes

**Desventajas:**
- ❌ Acumula datos "eliminados"
- ❌ Requiere limpieza manual después

---

## 🔍 ANÁLISIS DEL CÓDIGO ACTUAL

### ¿Qué código podría usar DELETE físico?

Búsqueda en repositorio de operaciones DELETE:

```bash
grep -r "DELETE FROM product_metadata" src/
```

**Resultado esperado:** 
```
(Sin resultados - no hay código de DELETE)
```

### ¿Qué código usa UPDATE para soft delete?

```bash
grep -r "UPDATE.*product_metadata" src/
grep -r "status.*deleted" src/
```

**Resultado esperado:**
- Código que hace: `UPDATE ... SET status = 'deleted'`
- No hay DELETE directo

---

## 📋 CONCLUSIÓN DEL ANÁLISIS

### En el código actual:

1. **No hay DELETE directo** de product_metadata en el código
2. **El soft delete se implementa via UPDATE**, no DELETE
3. **La policy DELETE es defensiva** pero no necesaria para funcionalidad actual
4. **Si GHL webhook llega, solo hace UPDATE**, nunca DELETE

### Recomendación:

**Mantener la policy DELETE** porque:

1. **Seguridad defensiva:** Si alguien intenta DELETE directamente, service_role puede hacerlo
2. **Futura GDPR:** Datos de usuario podrían necesitar hard delete
3. **Limpieza de datos:** Datos de prueba pueden necesitar hard delete
4. **No causa daño:** Está protegido por RLS, solo service_role puede ejecutar

### PERO:

**La eliminación de productos debe ser SIEMPRE UPDATE a status='deleted'**, nunca DELETE directo.

El código que sincroniza con GHL debe hacer:
```sql
UPDATE product_metadata 
SET status = 'deleted', deleted_at = now() 
WHERE ghl_product_id = 'xxx'
-- NO: DELETE FROM product_metadata ...
```

---

## ✅ DECISIÓN

### Policy DELETE: MANTENER (como está en migración)

**Razón:** Permite futuras operaciones de hard delete si es necesario, pero el código actual usa UPDATE (soft delete).

**Importante:** El código de sincronización GHL DEBE hacer UPDATE, nunca DELETE.

---

## 📝 RECOMENDACIÓN DE CÓDIGO

Cuando se implemente webhook/polling de GHL para eliminar productos:

**CORRECTO (soft delete):**
```sql
UPDATE product_metadata 
SET status = 'deleted', deleted_at = now()
WHERE ghl_product_id = $1 AND status = 'active';
```

**INCORRECTO (hard delete):**
```sql
DELETE FROM product_metadata WHERE ghl_product_id = $1;
```

---

## 🎯 CONCLUSIÓN

**La migración puede proceder como está.**

La policy DELETE permite flexibility futura sin comprometer el soft delete actual.

El control real está en el código que use UPDATE vs DELETE.

