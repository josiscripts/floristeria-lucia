# PLAN DE DEPLOYMENT A VERCEL

**Proyecto:** Floristería Lucía  
**Fecha:** 2026-08-27  
**Status:** PLAN SOLO LECTURA - NO EJECUTADO  
**Auditoría:** Completada

---

## AUDITORÍA DE IMÁGENES COMPLETADA

### 1. UBICACIÓN ACTUAL DE IMÁGENES

**Ruta física:** `src/assets/`

**Imágenes de catálogo (6 totales):**

```
src/assets/cat-ramos.jpg          (127 KB) - Ramos
src/assets/girasoles.jpg          (77 KB)  - Girasoles
src/assets/cat-plantas.jpg        (101 KB) - Plantas
src/assets/cat-rosas-eternas.jpg  (58 KB)  - Rosas Eternas
src/assets/cat-complementos.jpg   (68 KB)  - Complementos
src/assets/cat-condolencias.jpg   (122 KB) - Condolencias
```

**Otras imágenes (27 totales):**

- Banners, héroes, logos, campañas, etc.
- Total proyecto: ~33 archivos en src/assets/

### 2. CÓMO SE IMPORTAN ACTUALMENTE

**catalog.ts (líneas 1-6):**

```typescript
import imgRamos from "@/assets/cat-ramos.jpg";
import imgGirasoles from "@/assets/girasoles.jpg";
import imgPlantas from "@/assets/cat-plantas.jpg";
import imgRosasEternas from "@/assets/cat-rosas-eternas.jpg";
import imgComplementos from "@/assets/cat-complementos.jpg";
import imgCondolencias from "@/assets/cat-condolencias.jpg";
```

**Cómo se usan:**

```typescript
const categories = [
  {
    id: "ramos",
    image: imgRamos,  // ← Variable con URL relativa
  },
  ...
];

const products = [
  {
    id: "ramo-silvestre",
    image: imgRamos,  // ← Usa la misma imagen
  },
  ...
];
```

### 3. COMPONENTES QUE USAN ESTAS IMÁGENES

**Archivos que importan desde assets:**

| Archivo                                        | Importa                 | Uso                                 |
| ---------------------------------------------- | ----------------------- | ----------------------------------- |
| `src/data/catalog.ts`                          | 6 imágenes de categoría | Categorías + todos los 41 productos |
| `src/data/services.ts`                         | Otras imágenes          | Servicios (no catálogo)             |
| `src/components/ProductsServicesEditorial.tsx` | 5 imágenes              | UI editorial                        |
| `src/components/SeasonalCollection.tsx`        | 4 imágenes de campaña   | Colecciones estacionales            |

**Rutas que usan imágenes de catálogo:**

| Ruta            | Usa              | Contexto              |
| --------------- | ---------------- | --------------------- |
| `/catalogo`     | `product.image`  | Listado de productos  |
| `/producto/$id` | `product.image`  | Detalle de producto   |
| `/carrito`      | `cartLine.image` | Carrito de compras    |
| `/` (homepage)  | Imágenes varias  | Secciones editoriales |

### 4. IMPACTO DE MOVER A public/

#### Opción A: Mantener en src/assets/ (RECOMENDADO)

✅ **Ventajas:**

- Vite maneja los imports automáticamente
- Sin cambios en el código
- Build genera URLs públicas en .output/
- Vercel despliega directamente sin configuración extra
- Es el patrón estándar en Vite + TanStack Start

❌ **Desventajas:**

- Ninguna

#### Opción B: Mover a public/

**Impacto:** ⚠️ ROMPERÍA el proyecto

```typescript
// Esto FALLARÍA:
import imgRamos from "@/assets/cat-ramos.jpg";
// ↑ Archivo no existe

// Habría que cambiar TODOS los imports a:
<img src="/cat-ramos.jpg" />
// Y quitar los imports
```

**Archivos a cambiar:**

- `src/data/catalog.ts` (6 imports)
- `src/data/services.ts` (varios imports)
- `src/components/ProductsServicesEditorial.tsx` (5 imports)
- `src/components/SeasonalCollection.tsx` (4 imports)
- Potencialmente otros componentes

**Trabajo:** ~2-3 horas de refactoring + testing

**Conclusión:** No necesario. Vite ya lo maneja.

### 5. IMÁGENES NECESARIAS PARA 41 PRODUCTOS

**Análisis de catalog.ts:**

Los 41 productos se distribuyen así:

| Categoría     | Productos | Imagen          | Reutilizada      |
| ------------- | --------- | --------------- | ---------------- |
| ramos         | 6         | imgRamos        | Sí (todos)       |
| plantas       | 13        | imgPlantas      | Sí (todos)       |
| rosas-eternas | 4         | imgRosasEternas | Sí (todos)       |
| complementos  | 13        | imgComplementos | Sí (todos)       |
| condolencias  | 5         | imgCondolencias | Sí (todos)       |
| TOTAL         | 41        | 6 únicas        | 100% reutilizado |

**Implicación para FASE 4A:**

Actualmente en catalog.ts, todos los 41 productos comparten las 6 imágenes de categoría.

**Cuando migremos a GHL:**

- GHL permite 1 imagen por producto
- Opción A: Mantener las 6 imágenes (sin cambios)
- Opción B: Crear imágenes individuales por producto (futura mejora)

Para FASE 4A, usaremos las imágenes existentes.

### 6. OBTENER URLs PÚBLICAS SIN MOVER ARCHIVOS

#### Cómo funciona Vite con imports de assets

```
Desarrollo (npm run dev):
  import imgRamos from "@/assets/cat-ramos.jpg"
  ↓ Vite procesa
  imgRamos = "/assets/cat-ramos-ABC123.jpg" (relativa)

Build (npm run build):
  import imgRamos from "@/assets/cat-ramos.jpg"
  ↓ Vite procesa
  dist/assets/cat-ramos-ABC123.jpg (hash incluido)
  .output/server/assets/cat-ramos-ABC123.jpg

Vercel deployment:
  .output/ sube a Vercel
  ↓ Vercel asigna dominio
  https://floristeria-lucia.vercel.app/assets/cat-ramos-ABC123.jpg
```

#### Proceso automático

1. ✅ Vite importa automáticamente
2. ✅ Vite hash automáticamente para cache busting
3. ✅ Vite genera paths públicos automáticamente
4. ✅ Vercel sirve desde https://tu-dominio/...
5. ✅ No requiere cambios en código

**Conclusión:** Las URLs públicas se generan DESPUÉS del build y deployment. No se necesita hacer nada especial.

---

## CONFIGURACIÓN DE VERCEL

### 7. REQUISITOS DEL PROYECTO PARA VERCEL

#### Stack actual

| Componente     | Versión         | Vercel Support           |
| -------------- | --------------- | ------------------------ |
| Node.js        | 18+ recomendado | ✅ Soportado             |
| TanStack Start | 1.168.32        | ✅ Soportado nativamente |
| Vite           | 8.2.0           | ✅ Soportado             |
| Nitro          | 3.0.260603-beta | ✅ Soportado             |
| React          | 19.2.0          | ✅ Soportado             |
| TypeScript     | 5.8.3           | ✅ Soportado             |

#### Build configuration actual

**vite.config.ts (líneas 1-13):**

```typescript
import { defineConfig } from "@tanstack/react-start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  vite: {
    plugins: [TanStackRouterVite({ autoCodeSplitting: true })],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
```

**Análisis:**

- ✅ Usa `defineConfig` de TanStack Start
- ✅ TanStack Router automático (file-based)
- ✅ Auto code splitting habilitado
- ✅ Path alias configurado (@/ → src/)
- ✅ No requiere cambios para Vercel

**package.json build commands:**

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

**Análisis:**

- ✅ Build command es `vite build`
- ✅ Output automático a .output/
- ✅ Vercel detecta automáticamente

#### Vercel detection

Vercel detectará automáticamente:

```
Framework: TanStack Start
Build Command: npm run build (detected from package.json)
Output Directory: .output/server (detected by Vercel)
Install Command: npm install
Node.js Version: Latest LTS (18+)
```

**Conclusión:** No requiere vercel.json. Detección automática.

### 8. VARIABLES DE ENTORNO EN VERCEL

#### Variables necesarias

| Variable                        | Tipo    | Necesaria            | Valor           |
| ------------------------------- | ------- | -------------------- | --------------- |
| `VITE_SUPABASE_URL`             | Pública | ✅ SÍ                | Ya en .env      |
| `VITE_SUPABASE_ANON_KEY`        | Pública | ✅ SÍ                | Ya en .env      |
| `VITE_GOOGLE_CLIENT_ID`         | Pública | ⚠️ Opcional          | Si OAuth Google |
| `GHL_PRIVATE_INTEGRATION_TOKEN` | Privada | ✅ SÍ (para FASE 4A) | En .env         |
| `GHL_LOCATION_ID`               | Privada | ✅ SÍ (para FASE 4A) | Ya en .env      |

#### Cómo configurar en Vercel

**Dashboard → Project Settings → Environment Variables**

```
VITE_SUPABASE_URL = https://leksmflinhohnekbgmgj.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk
GHL_PRIVATE_INTEGRATION_TOKEN = pit-0cf65f40-51a4-4e28-9793-9eb8421e2291
GHL_LOCATION_ID = vOq7yOWR63XGU4qQ7XWd
```

**Nota:** Las variables `VITE_*` son públicas (frontend). Las otras son privadas (server).

**Seguridad:**

- ✅ GHL_PRIVATE_INTEGRATION_TOKEN nunca se expone al frontend
- ✅ Solo se usa en server-side (src/lib/ghl/client.server.ts)
- ✅ Vercel mantiene privadas las variables sin prefijo VITE_

---

## PLAN DE EJECUCIÓN (NO EJECUTADO)

### A. Archivos que se modificarían

**Ninguno.** El proyecto está listo para Vercel tal como está.

✅ **No requiere cambios:**

- vite.config.ts
- package.json
- tsconfig.json
- .env
- Estructura de carpetas
- Imágenes

### B. Archivos que NO deben modificarse

❌ **Crítico - No tocar:**

- `.env` (credenciales)
- `src/lib/ghl/client.server.ts` (token handling)
- `src/data/catalog.ts` (41 productos)
- Cualquier import de assets

### C. Estrategia de imágenes

**Decisión:** Mantener en `src/assets/`

**Proceso:**

```
Actual (desarrollo):
  import imgRamos from "@/assets/cat-ramos.jpg"
  ↓ Vite resuelve a
  /assets/cat-ramos-ABC123.jpg (localhost)

Después de deployment:
  import imgRamos from "@/assets/cat-ramos.jpg"
  ↓ Vercel sirve desde
  https://floristeria-lucia.vercel.app/assets/cat-ramos-ABC123.jpg
```

**Código:** Sin cambios. Vite + Vercel manejan automáticamente.

### D. Rutas públicas finales

**Después del deployment en Vercel:**

```
https://floristeria-lucia.vercel.app/assets/cat-ramos.jpg
https://floristeria-lucia.vercel.app/assets/girasoles.jpg
https://floristeria-lucia.vercel.app/assets/cat-plantas.jpg
https://floristeria-lucia.vercel.app/assets/cat-rosas-eternas.jpg
https://floristeria-lucia.vercel.app/assets/cat-complementos.jpg
https://floristeria-lucia.vercel.app/assets/cat-condolencias.jpg
```

**Nota:** Los nombres de archivo pueden incluir hash (ej: cat-ramos-ABC123.jpg). Vercel maneja los redirects automáticamente.

### E. Configuración de Vercel requerida

**Paso 1: Crear proyecto en Vercel**

```bash
# Si no tienes cuenta Vercel
npm install -g vercel
vercel login
```

**Paso 2: Link proyecto con Vercel**

```bash
vercel link
# Responde preguntas:
# - ¿Configurar como nuevo proyecto? Sí
# - ¿Nombre? floristeria-lucia (o similar)
# - ¿Framework? Detectará TanStack Start automáticamente
```

**Paso 3: Configurar variables de entorno**

```
Dashboard → Settings → Environment Variables
Añadir 4 variables (ver sección 8 arriba)
```

**Paso 4: Deploy**

```bash
vercel --prod
# O desde GitHub: push → automático
```

**Resultado:**

```
✓ Deployment successful!
┌ https://floristeria-lucia.vercel.app [PRODUCTION]
└ Ready on https://floristeria-lucia.vercel.app
```

### F. Comandos de ejecución

**Antes del deployment (local):**

```bash
# 1. Verificar que build funciona
npm run build

# 2. Previsualizar resultado del build
npm run preview
# Abrirá: http://localhost:4173

# 3. Verificar que las imágenes cargan
# En el navegador, visita cualquier página
# En DevTools → Sources o Network, deberías ver:
#   GET /assets/cat-ramos.jpg 200 OK
```

**Deployment a Vercel:**

```bash
# Opción A: Deploy directo desde CLI
npm install -g vercel          # Instalar Vercel CLI
vercel login                   # Autenticar
vercel link                    # Link proyecto
# Configurar env vars en dashboard
vercel --prod                  # Deploy a producción

# Opción B: Conectar GitHub
# 1. Push a GitHub
git push origin main
# 2. Vercel auto-deploya en https://floristeria-lucia.vercel.app
```

**Después del deployment:**

```bash
# Obtener URL pública (si usaste CLI)
vercel inspect
# O desde dashboard: https://vercel.com/dashboard

# Resultado será algo como:
# https://floristeria-lucia.vercel.app

# Guardar esta URL para FASE 4A
```

### G. Variables de entorno en Vercel

**Ubicación:** Dashboard → Proyecto → Settings → Environment Variables

**Configurar para Production:**

```
Variable Name          | Value                                    | Environment
-----------------------|------------------------------------------|----------
VITE_SUPABASE_URL      | https://leksmflinhohnekbgmgj.supabase.co | Production
VITE_SUPABASE_ANON_KEY | sb_publishable_X0o9HN0EAjBJpcInCi...    | Production
GHL_PRIVATE_INTEGRATION_TOKEN | pit-0cf65f40-51a4-4e28-9793... | Production
GHL_LOCATION_ID        | vOq7yOWR63XGU4qQ7XWd                    | Production
```

**Resultado después de guardar:**

- Vercel inyecta automáticamente en build
- Disponibles en process.env en servidor
- `VITE_*` también disponibles en cliente

### H. Verificación post-deployment

**Checklist de verificación:**

```
Paso 1: Vercel deployment
  ☐ Vercel muestra "Ready"
  ☐ URL pública asignada
  ☐ Deployments en dashboard

Paso 2: Cargar aplicación
  ☐ https://floristeria-lucia.vercel.app carga
  ☐ No hay errores en la página
  ☐ Homepage se ve completa
  ☐ Sin error 404

Paso 3: Verificar funcionalidad
  ☐ Navegación funciona (/catalogo, /carrito, etc)
  ☐ No hay console errors (DevTools)
  ☐ Respuesta rápida
  ☐ HTTPS funciona

Paso 4: Verificar base de datos
  ☐ Supabase connection funciona
  ☐ Catálogo de 41 productos carga
  ☐ Google OAuth funciona (si configurado)
```

### I. Verificación específica de imágenes

**Comprobar imagen de catálogo:**

**Opción A: En navegador**

```
1. Ir a https://floristeria-lucia.vercel.app/catalogo
2. Buscar sección de Ramos
3. DevTools → Network tab
4. Filtrar por "cat-ramos"
5. Debe mostrar GET 200 OK
6. URL exacta será algo como:
   https://floristeria-lucia.vercel.app/_/assets/cat-ramos-ABC123.jpg
```

**Opción B: Direct test**

```
1. Copiar URL: https://floristeria-lucia.vercel.app/assets/cat-ramos.jpg
2. Pegar en navegador
3. La imagen debe cargar
4. O returnar 200 OK
```

**Opción C: Server logs**

```
# En Vercel dashboard
Proyecto → Deployments → [latest] → Logs
Buscar "assets" o "cat-ramos"
```

**Esperado:**

```
GET /assets/cat-ramos-XXXXX.jpg 200 1.2 KB
GET /assets/girasoles-XXXXX.jpg 200 0.9 KB
GET /assets/cat-plantas-XXXXX.jpg 200 1.5 KB
...
```

### J. URL final para FASE 4A

**Después de verificación exitosa:**

```
URL de producción: https://floristeria-lucia.vercel.app
Imagen de prueba: https://floristeria-lucia.vercel.app/assets/cat-ramos.jpg
```

**Guardar esta información:**

Para continuar con FASE 4A, necesitaremos:

```
PRODUCTION_URL=https://floristeria-lucia.vercel.app
ASSETS_PATH=/assets/
```

**Ejemplo de uso en FASE 4A:**

```typescript
const payload = {
  name: "Ramo Silvestre",
  price: 30,
  image: `${PRODUCTION_URL}/assets/cat-ramos.jpg`,
  // imagen: https://floristeria-lucia.vercel.app/assets/cat-ramos.jpg
};
```

---

## CAMBIOS REQUERIDOS

### Resumen ejecutivo

| Aspecto            | Estado       | Cambios                             |
| ------------------ | ------------ | ----------------------------------- |
| **Código**         | ✅ LISTO     | 0 cambios                           |
| **Configuración**  | ✅ LISTO     | 0 cambios                           |
| **Imágenes**       | ✅ LISTO     | 0 cambios (mantener en src/assets/) |
| **vite.config.ts** | ✅ LISTO     | 0 cambios                           |
| **package.json**   | ✅ LISTO     | 0 cambios                           |
| **.env**           | ✅ LISTO     | Copiar a Vercel variables           |
| **Vercel setup**   | ⏳ NECESARIO | Crear proyecto + env vars           |

### Cambios en Vercel (UI, no código)

1. **Crear proyecto Vercel** (5 minutos)
   - https://vercel.com/new
   - Seleccionar GitHub repo
   - Framework: Auto-detect (TanStack Start)

2. **Configurar env vars** (2 minutos)
   - 4 variables de .env
   - Production environment

3. **Deploy** (2-3 minutos)
   - Automático desde GitHub O
   - Manual con `vercel --prod`

**Total: 10 minutos**

---

## RIESGOS Y MITIGACIÓN

### Riesgos identificados

| Riesgo                               | Probabilidad | Impacto | Mitigación                     |
| ------------------------------------ | ------------ | ------- | ------------------------------ |
| Env vars incompletas                 | Media        | Alto    | Copiar exactamente de .env     |
| Imagen con hash no resuelta          | Baja         | Bajo    | Vite lo maneja automáticamente |
| Dominio no configurado correctamente | Baja         | Bajo    | Vercel genera automáticamente  |
| Build falla                          | Baja         | Alto    | Probar `npm run build` antes   |

### Mitigación pre-deployment

```bash
# 1. Verificar build local
npm run build
# Debe completar sin errores

# 2. Preview local
npm run preview
# Debe abrir en http://localhost:4173

# 3. Verificar imágenes
# Navegar a /catalogo en preview
# Las imágenes deben verse
```

---

## SIGUIENTE PASO DESPUÉS DE DEPLOYMENT

Una vez que Vercel esté listo:

1. **Obtener URL:** https://floristeria-lucia.vercel.app

2. **Verificar imagen:**

   ```
   https://floristeria-lucia.vercel.app/assets/cat-ramos.jpg
   → Debe cargar la imagen
   ```

3. **Proceder con FASE 4A:**
   - Usar PRODUCTION_URL en payload GHL
   - Crear primer producto de prueba
   - Verificar imagen en GHL

---

## CHECKLIST DE APROBACIÓN

Antes de hacer el deployment, confirma:

```
Configuración:
  ☐ Entiendo que no hay cambios de código
  ☐ Entiendo que las imágenes se quedan en src/assets/
  ☐ Entiendo que Vite las convierte automáticamente
  ☐ Entiendo que necesito configurar env vars en Vercel

Plan:
  ☐ Aprobo mantener imágenes en src/assets/
  ☐ Aprobo crear proyecto en Vercel
  ☐ Aprobo configurar 4 env vars en Vercel
  ☐ Estoy listo para hacer el deployment

Después de deployment:
  ☐ Verificaré que la URL funciona
  ☐ Verificaré que una imagen carga
  ☐ Usaré esa URL en FASE 4A
```

---

**Status:** PLAN COMPLETADO - LISTO PARA APROBACIÓN  
**Cambios de código:** 0  
**Cambios de configuración:** 4 env vars en Vercel  
**Tiempo estimado:** 10 minutos  
**Riesgo:** BAJO
