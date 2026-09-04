# AUDITORÍA DE BUILD - BLOQUEADOR CRÍTICO

**Fecha:** 2026-08-27  
**Estado:** BLOQUEADOR CRÍTICO IDENTIFICADO  
**Auditoría:** READ-ONLY completada

---

## HALLAZGO CRÍTICO

**El proyecto NO puede hacer build actualmente.** Hay un error de compatibilidad en la configuración.

---

## DETALLE DEL ERROR

### Error al ejecutar `npm run build`

```
Error: Build failed with 1 error:

[plugin externalize-deps]
Error: Missing "./config" specifier in "@tanstack/react-start" package
```

### Error al ejecutar `npm run dev`

```
Error: Build failed with 1 error:

[plugin externalize-deps]
Error: Missing "./config" specifier in "@tanstack/react-start" package
```

---

## CAUSA RAÍZ

**Archivo:** `vite.config.ts` (línea 4)

```typescript
import { defineConfig } from "@tanstack/react-start/config";
```

**Problema:**

El paquete `@tanstack/react-start` v1.168.49 (instalado actualmente) **NO tiene el export `./config`**.

**Verificación:**

```
Package.json de @tanstack/react-start:
  ✓ Tiene export: "."
  ✓ Tiene export: "./client"
  ✓ Tiene export: "./hydration"
  ✓ Tiene export: "./client-rpc"
  ✓ Tiene export: "./server"
  ✓ Tiene export: "./plugin"
  ✓ Tiene export: "./rsc"
  ✓ Tiene export: "./rsbuild"
  ✗ NO tiene export: "./config"
```

---

## IMPACTO

**Bloqueador para:**

- ❌ `npm run build` (no se puede compilar)
- ❌ `npm run dev` (no se puede desarrollar)
- ❌ `npm run preview` (depende del build)
- ❌ Deployment a Vercel (necesita build exitoso)

**No puede continuar FASE 4A sin resolver esto.**

---

## VERSIONES ACTUALES

| Paquete                 | Versión         | Estado                |
| ----------------------- | --------------- | --------------------- |
| Node.js                 | v22.21.1        | ✅ Soportado          |
| npm                     | 10.9.4          | ✅ Soportado          |
| @tanstack/react-start   | 1.168.49        | ⚠️ Config import roto |
| @tanstack/router-plugin | 1.168.35        | ✅ OK                 |
| vite                    | 8.2.2           | ✅ OK                 |
| nitro                   | 3.0.260603-beta | ✅ OK                 |

---

## ORIGEN DEL PROBLEMA

Este proyecto fue migrado desde **Lovable** (que probablemente tenía una versión diferente de @tanstack/react-start con soporte para "./config").

Durante la migración:

- El código de `vite.config.ts` no se actualizó
- Las dependencias se actualizaron automáticamente
- Ahora hay un mismatch entre el código y las dependencias

---

## SOLUCIÓN REQUERIDA

### Opción A: Actualizar vite.config.ts (RECOMENDADO)

Cambiar línea 4 de:

```typescript
import { defineConfig } from "@tanstack/react-start/config";
```

A (una de estas opciones):

**Opción A1:** (si TanStack Start tiene un export directo para defineConfig)

```typescript
import { defineConfig } from "vite";
```

**Opción A2:** (si existe en ./plugin)

```typescript
// Revisar docs oficiales de TanStack Start para importación correcta
```

**Opción A3:** (deprecated - usar el patrón nuevo)

```typescript
import { defineConfig } from "@tanstack/react-start";
```

### Opción B: Downgrade de @tanstack/react-start

Cambiar `package.json` línea 46 de:

```json
"@tanstack/react-start": "^1.168.32",
```

A una versión que tenga "./config" (desconocida sin investigación profunda).

---

## INVESTIGACIÓN NECESARIA

Antes de que yo hagas cualquier cambio:

1. **Consulta las docs oficiales:**
   - https://tanstack.com/start/docs
   - Busca "vite config" o "defineConfig"

2. **Revisa el cambio reciente:**
   - ¿Cuándo se removió el export "./config" de @tanstack/react-start?
   - ¿Cuál es la importación correcta ahora?

3. **Opción rápida:**
   - Verifica el proyecto original de TanStack Start en GitHub
   - Branch main: `/examples/react-router`
   - Copia el `vite.config.ts` correcto

---

## PASOS PARA RESOLVER

### PASO 1: Obtener vite.config.ts correcto

Opción A (recomendado):

```bash
# Ir a https://github.com/TanStack/router
# Carpeta: packages/react-start/examples/basic
# Copiar vite.config.ts
# Pegar en tu proyecto
```

Opción B:

```bash
# Consultar docs oficiales
# Determinar importación correcta
# Actualizar manualmente
```

### PASO 2: Reinstalar dependencias

```bash
cd /ruta/del/proyecto
npm install
```

### PASO 3: Verificar build

```bash
npm run build
# Debe completar SIN errores
```

### PASO 4: Verificar dev

```bash
npm run dev
# Debe abrir http://localhost:5173
# Sin errores en terminal
```

### PASO 5: Reportar resultado

Dime:

```
✅ npm run build exitoso
✅ npm run dev funciona
✅ Las imágenes cargan en http://localhost:5173/catalogo
```

---

## SIGUIENTE DESPUÉS DE RESOLVER

Una vez que el build funcione:

1. Ejecutar `npm run build` para confirmar
2. Ejecutar `npm run preview` para verificar
3. Verificar que las imágenes de catálogo cargan
4. Proceder con Vercel deployment
5. Obtener URL pública
6. Continuar con FASE 4A

---

## DECISIÓN CRÍTICA

**Este bloqueo DEBE resolverse antes de continuar con cualquier fase de migración.**

Sin un build exitoso, no es posible:

- Verificar que el código funciona
- Hacer deploy a Vercel
- Obtener URL pública para imágenes
- Crear productos en GHL

---

**Status:** ⛔ BLOQUEADOR - REQUIERE RESOLUCIÓN MANUAL
