# Instrucciones de Prueba - Conexión GoHighLevel

## Fase 2: Validación de Conexión READ-ONLY

**Objetivo:** Verificar que la conexión server-side a GoHighLevel funciona correctamente.

---

## Opción 1: Script de Prueba Directo (RECOMENDADO)

Este método NO requiere iniciar el servidor de desarrollo.

### Pasos:

1. Abre terminal en la raíz del proyecto
2. Ejecuta:
```bash
node scripts/test-ghl-connection.mjs
```

3. El script hará:
   - ✅ Leer `.env.local`
   - ✅ Verificar que `GHL_PRIVATE_INTEGRATION_TOKEN` existe
   - ✅ Conectar a API de GHL
   - ✅ Obtener lista de productos
   - ✅ Mostrar estructura de respuesta

### Resultado esperado:

```
🧪 GoHighLevel Connection Test

══════════════════════════════════════════════════
📄 Loading .env.local...
✅ Token loaded from .env.local
   Token length: XXX characters
   Token preview: XXXXX...XXXXX

🔗 Testing GHL API connection...
✅ API responded with status: 200

📦 Fetching products from GoHighLevel...

✅ Products endpoint responded with status: 200

══════════════════════════════════════════════════
✅ CONNECTION SUCCESSFUL

📊 Response Summary:
   Total products: X
   Current page: 1
   Page size: 50

📝 Sample products (first 3):

   1. Product Name 1
      ID: ghl-product-id-1
      Price: X.XX
      Description: Sample description...

...

══════════════════════════════════════════════════
```

---

## Opción 2: Ruta Debug en Navegador

Si quieres ver la interfaz visual, sigue estos pasos:

### Pasos:

1. Terminal:
```bash
npm run dev
```

2. Abre navegador:
```
http://localhost:5173/debug/ghl-test
```

3. Haz clic en "Start Connection Test"

4. Espera respuesta

### Ventajas:
- Interface visual
- Puedes probar múltiples veces sin reiniciar
- Ver estructura completa de productos

### Desventajas:
- Requiere iniciar servidor
- Más lento que script directo

---

## Posibles Errores y Soluciones

### Error: `.env.local not found`
**Causa:** El archivo `.env.local` no existe  
**Solución:** 
```bash
# Crear .env.local con el token
echo "GHL_PRIVATE_INTEGRATION_TOKEN=tu-token-aqui" > .env.local
```

### Error: `GHL_PRIVATE_INTEGRATION_TOKEN not found in .env.local`
**Causa:** Variable no está configurada  
**Solución:** Verificar que `.env.local` contiene:
```
GHL_PRIVATE_INTEGRATION_TOKEN=tu-token-real
```

### Error: `API responded with status: 401`
**Causa:** Token inválido o expirado  
**Solución:**
1. Verificar token en GHL Dashboard
2. Regenerar si es necesario
3. Actualizar `.env.local`

### Error: `API responded with status: 403`
**Causa:** Token no tiene permisos  
**Solución:**
1. Verificar que es una Private Integration
2. Verificar que tiene scope de "Products"
3. En GHL Dashboard, revisar permisos de integración

### Error: `Cannot resolve api.gohighlevel.com`
**Causa:** Problema de red  
**Solución:**
1. Verificar conexión a internet
2. Verificar firewall/proxy
3. Revisar si GHL API está operativa

### Error: `API request timed out`
**Causa:** GHL API responde lentamente  
**Solución:**
1. Reintentar
2. Verificar que el endpoint es correcto
3. Revisar estado de GHL

---

## ¿Qué Pasa si la Prueba Funciona?

Si ves ✅ CONNECTION SUCCESSFUL:

1. **Anota el número de productos**
2. **Copia la estructura del primer producto** (JSON)
3. **Envía al usuario:**
   - Número total de productos en GHL
   - Estructura de respuesta
   - Cualquier custom field especial que veas

4. **Próximo paso:** Crear custom fields en GHL según el mapeo

---

## ¿Qué Pasa si Falla?

Si ves ❌ Error:

1. **NO intentes resolver por tu cuenta**
2. **Documenta:**
   - Código de error exacto
   - Mensaje de error completo
   - Endpoint que falla
3. **Analiza si es:**
   - Token (401/403)
   - Endpoint (404)
   - Permisos (403)
   - Red (timeout)
4. **Comparte información con usuario**

---

## Seguridad

**IMPORTANTE:** Este script:
- ✅ Lee token desde `.env.local` (NUNCA lo hardcodea)
- ✅ NO imprime el token completo (solo preview)
- ✅ NO lo guarda en logs
- ✅ NO lo sube a Git
- ✅ Es server-side only

---

## Próxima Fase (después de validar)

Cuando la conexión funcione:

1. ✅ Crear custom fields en GHL Dashboard
2. ✅ Probar con 2-3 productos de prueba
3. ✅ Validar mapeo de datos
4. ✅ Proceder a migración completa

---

**Documento de referencia para Fase 2: Validación**
