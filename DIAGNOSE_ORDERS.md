# 🔍 Diagnóstico y Limpieza de Pedidos

## Problema Identificado
El panel de administración (frontend) aún muestra pedidos pendientes aunque se ejecutó la migración de limpieza anterior. Esto sugiere que:

1. Los pedidos de prueba NO fueron completamente eliminados
2. O se crearon nuevos pedidos de prueba después de la migración

## Solución: Investigar y Limpiar

### PASO 1: Ejecutar Diagnóstico

#### Opción A: Usar el endpoint de diagnóstico (RECOMENDADO)

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Accede al endpoint de diagnóstico desde tu navegador (como admin):
   ```
   http://localhost:5173/api/admin/diagnose-orders
   ```

   Este endpoint te mostrará:
   - Total de pedidos (incluyendo eliminados)
   - Pedidos activos (deleted_at IS NULL)
   - Distribución por estado
   - Cantidad de items por orden
   - Sincronización con GoHighLevel

3. Guarda la respuesta JSON para referencia

#### Opción B: Usar consola Supabase

1. Accede a [console.supabase.com](https://console.supabase.com)
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y ejecuta el contenido de: `supabase/migrations/20260904_diagnose_orders.sql`

### PASO 2: Analizar Resultados

Después de ejecutar el diagnóstico, verifica:

**Preguntas clave:**
- ¿Cuántos pedidos activos hay? (debe ser 0 después de la limpieza anterior)
- ¿Qué estados tienen? (pending, confirmed, etc.)
- ¿Tienen `user_id`? (NULL = pedidos de prueba del checkout, No NULL = pedidos de usuarios reales)
- ¿Están sincronizados con GoHighLevel? (ghl_contact_id)
- ¿Cuándo fueron creados? (fecha en created_at)

### PASO 3: Limpiar Pedidos de Prueba

**IMPORTANTE: Solo ejecuta esto si has confirmado que los pedidos no son legítimos**

#### Opción A: Usar SQL directamente (RECOMENDADO)

1. Ve a consola Supabase → SQL Editor
2. Copia el contenido de: `supabase/migrations/20260904_clean_test_orders.sql`
3. **ANTES de ejecutar**, descomenta las líneas de SELECT para ver qué se va a eliminar
4. Revisa los resultados - deben ser solo pedidos de prueba (sin user_id)
5. Si está correcto, comenta las líneas SELECT y descomenta el DELETE
6. Ejecuta la migración completa

#### Opción B: Ejecutar migración con Supabase CLI

```bash
# Primero verifica qué migraciones están pendientes
supabase migration list

# Ejecuta la migración de limpieza
supabase db push --dry-run  # Para ver qué cambios se harían
supabase db push  # Para ejecutar realmente
```

### PASO 4: Verificar que la Limpieza Funcionó

Después de ejecutar la migración:

1. **Endpoint de diagnóstico:**
   ```
   http://localhost:5173/api/admin/diagnose-orders
   ```
   Debe mostrar `active_orders: 0` si la limpieza fue exitosa

2. **Panel de administración:**
   - Accede a http://localhost:5173/admin/orders
   - Debe estar vacío (sin pedidos pendientes)
   - No debe mostrar error "Failed to fetch orders"

3. **Página de "Mis pedidos" del usuario:**
   - Accede a http://localhost:5173/mi-cuenta/pedidos (logueado)
   - Debe mostrar el estado vacío (empty state)
   - No debe mostrar error "Failed to fetch orders"

4. **API Endpoint:**
   ```bash
   # Desde terminal (necesitas token autenticado)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5173/api/account/orders
   ```
   Debe devolver un array vacío `[]`

### PASO 5: Investigar GoHighLevel (si aplica)

**Si el diagnóstico muestra pedidos sincronizados con GHL:**

1. Accede a tu cuenta GoHighLevel
2. Ve a Contactos/CRM
3. Busca los contactos con IDs que coincidan con `ghl_contact_id` de los pedidos
4. **NO BORRES NADA AÚN** - verifica si estos contactos tienen más información importante
5. Reporta al equipo cuántos registros de GHL están asociados

### Estructura de Eliminación

El script de limpieza funciona en este orden:

```sql
BEGIN TRANSACTION
  ├─ DELETE FROM order_items (respeta FK cascade)
  └─ UPDATE orders SET deleted_at = NOW() (soft delete)
COMMIT
```

Esto asegura:
- ✓ No se violan constraints de FK
- ✓ La auditoría se preserva en `deleted_at`
- ✓ El API de órdenes ya filtra `deleted_at IS NULL`
- ✓ Los pedidos desaparecen del panel sin perder historial

### Troubleshooting

**Problema: "Failed to fetch orders" en el panel**
- Verificar que no hay pedidos con `deleted_at = NULL`
- Verificar que la FK de order_items → orders es correcta
- Revisar logs del servidor

**Problema: El endpoint de diagnóstico devuelve error**
- Verificar que eres un admin (role = 'admin' en profiles)
- Verificar que tienes sesión activa
- Revisar console del navegador para más detalles

**Problema: Pedidos reaparecen después de limpiar**
- Alguien está creando nuevos pedidos de prueba
- Verificar logs de webhook de GoHighLevel
- Revisar si hay código de prueba ejecutándose

## Archivos Relacionados

- `supabase/migrations/20260904_diagnose_orders.sql` - SQL para diagnóstico manual
- `supabase/migrations/20260904_clean_test_orders.sql` - SQL para limpieza
- `src/routes/api.admin.diagnose-orders.ts` - Endpoint API de diagnóstico
- `src/routes/api.account.orders.ts` - API para órdenes del usuario
- `src/components/account/MyOrdersTab.tsx` - UI de "Mis pedidos"

## Próximos Pasos

Después de limpiar:

1. ✅ Verifica que `/admin/orders` está vacío
2. ✅ Verifica que `/mi-cuenta/pedidos` muestra empty state
3. ✅ Verifica que `/api/account/orders` devuelve `[]`
4. ✅ Verifica RLS - usuario no autenticado NO puede ver ordenes
5. ✅ Verifica RLS - usuario solo ve sus propias ordenes
6. ✅ Crear algunas órdenes legítimas para pruebas finales

## Contacto

Si encuentras problemas durante este proceso, guarda:
- La respuesta del endpoint `/api/admin/diagnose-orders`
- Los logs del servidor (si hay errores)
- El número de pedidos que se intentaron eliminar
