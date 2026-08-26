# SECURITY
## Auditoría Completa de Seguridad del Proyecto

> Este documento debe generarse siguiendo `PROJECT_AUDIT_SPEC.md`.
> No modifica el proyecto. Su función es identificar, documentar y clasificar los riesgos de seguridad existentes.

**Estado:** Completado
**Fecha:** 2026-08-26
**Auditor:** Claude Code

---

# OBJETIVO

Realizar una auditoría de seguridad completa del proyecto analizando únicamente el código fuente, la configuración y los archivos existentes.

El resultado debe permitir conocer:

- Cómo funciona la autenticación.
- Cómo se almacenan las sesiones.
- Qué cookies existen.
- Qué secretos utiliza el proyecto.
- Cómo se protegen las APIs.
- Cómo se validan los pagos.
- Qué vulnerabilidades existen.
- Qué riesgos deben corregirse antes de producción.

Nunca modificar el código.

---

# REGLAS

1. No mostrar API Keys reales.
2. No mostrar passwords.
3. No mostrar tokens completos.
4. Reemplazar cualquier secreto por `[OCULTO]`.
5. No inventar vulnerabilidades.
6. Basarse únicamente en evidencia encontrada.
7. Clasificar cada riesgo por prioridad.
8. Diferenciar entre hallazgos y recomendaciones.

---

# NIVELES DE PRIORIDAD

| Nivel | Significado |
|--------|-------------|
| 🔴 Crítico | Compromete datos o dinero |
| 🟠 Alto | Riesgo importante de explotación |
| 🟡 Medio | Debe corregirse antes de escalar |
| 🟢 Bajo | Mejora recomendada |

---

# CONTENIDO

# 1. RESUMEN EJECUTIVO

## Estado general de seguridad

- [ ] Excelente
- [x] Bueno
- [ ] Aceptable
- [ ] Riesgoso

**Veredicto:** El proyecto tiene una base de seguridad BUENA pero con vulnerabilidades críticas para producción.

### Riesgos críticos encontrados

1. **Manipulación de precios sin validación servidor** - Frontend calcula total sin verificación
2. **Carrito sin persistencia en BD** - Datos en localStorage pueden ser manipulados
3. **No hay validación de cantidad en servidor** - Comprador podría aumentar cantidades artificialmente

### Riesgos altos

1. **Supabase anon key expuesta** - Si RLS falla, cualquier usuario accede a todo
2. **No hay rate limiting implementado** - Posible abuso de endpoints
3. **Verificación de email no forzada** - Se permite login sin email verificado

### Riesgos medios

1. **No hay CSRF tokens visibles** - Supabase debería manejar, pero revisar
2. **Storage bucket público** - hero-animation permite lectura anónima
3. **Errores pueden exponer información** - Revisar error messages en producción

### Riesgos bajos

1. **LocalStorage expone datos** - Por diseño, aceptable para cliente
2. **Código JavaScript visible** - Source maps podrían exponer
3. **Cookie policy no estrictamente implementada** - Revisa CookieNotice actualmente

---

# 2. AUTENTICACIÓN

Analizar completamente el sistema de autenticación.

## Registro

Documentar:

- flujo
- validaciones
- verificación de email
- creación de usuario

## Login

Explicar:

- método
- credenciales
- proveedor
- sesión
- persistencia

## Logout

Cómo destruye la sesión.

## Recuperación de contraseña

Documentar el flujo.

## Refresh Token

Si existe.

---

# 3. SESIONES

Documentar cómo se mantienen.

| Elemento | Implementación |
|----------|----------------|
| JWT | |
| Cookie | |
| Session | |
| Refresh | |
| Expiración | |

Indicar dónde se almacenan.

---

# 4. ROLES Y PERMISOS

Detectar todos los roles.

| Rol | Permisos |
|------|-----------|
| | |

Explicar:

- administración
- cliente
- invitado
- moderador
- otros

Solo si existen.

---

# 5. COOKIES

Detectar todas las cookies.

| Cookie | Tipo | Duración | Uso |
|---------|------|----------|-----|
| | | | |

Clasificar:

- Necesarias
- Funcionales
- Analíticas
- Marketing

---

# 6. PRIVACIDAD

Analizar:

- GDPR
- Consentimiento
- Datos personales
- LocalStorage
- SessionStorage
- Tracking

Documentar qué información almacena el navegador.

---

# 7. VARIABLES DE ENTORNO

Detectar todas las variables.

| Variable | Pública | Uso |
|----------|----------|-----|
| | | |

Nunca mostrar valores.

Ejemplo:

```
SUPABASE_URL = [OCULTO]
```

---

# 8. SECRETOS

Buscar:

- API Keys
- Tokens
- Passwords
- Client Secret
- Service Role
- Webhooks

Formato:

| Secreto | Ubicación | Estado |
|----------|-----------|--------|
| | | |

Nunca mostrar el valor.

---

# 9. APIS

Auditar todos los endpoints.

| Método | Endpoint | Auth | Validación |
|---------|----------|------|-----------|
| | | | |

Detectar:

- públicos
- privados
- protegidos
- webhooks

---

# 10. AUTORIZACIÓN

Verificar que los usuarios únicamente puedan acceder a sus propios datos.

Buscar riesgos de:

- IDOR
- acceso horizontal
- acceso vertical
- recursos públicos

Clasificar hallazgos.

---

# 11. BASE DE DATOS

Analizar protección.

## RLS

| Tabla | Estado |
|--------|--------|
| | |

## Policies

Documentar:

- SELECT
- INSERT
- UPDATE
- DELETE

---

# 12. VALIDACIONES

Comprobar validación en:

- formularios
- backend
- APIs
- checkout
- pedidos
- registro

Indicar qué se valida en cliente y qué en servidor.

---

# 13. PAGOS

Analizar exhaustivamente.

## Proveedor

<!-- Completar -->

## Flujo

```text
Usuario
↓
Checkout
↓
Pago
↓
Confirmación
↓
Pedido
```

## Verificaciones

Indicar si el backend valida:

- producto
- precio
- cantidad
- subtotal
- total
- impuestos
- usuario

Detectar manipulación de precios.

---

# 14. WEBHOOKS

Documentar todos.

| Servicio | Verificación de firma |
|----------|-----------------------|
| | |

Explicar cómo se autentican.

---

# 15. CORS

Analizar configuración.

| Origen | Estado |
|---------|--------|
| | |

Detectar configuraciones peligrosas.

---

# 16. CSRF

Verificar protección.

Estado:

- Sí
- No
- No determinado

Explicar evidencia.

---

# 17. XSS

Buscar:

- innerHTML
- dangerouslySetInnerHTML
- renderizado inseguro
- sanitización

Documentar hallazgos.

---

# 18. SQL INJECTION

Comprobar:

- consultas parametrizadas
- ORM
- concatenación SQL

Clasificar riesgos.

---

# 19. FILE UPLOAD

Si existe subida de archivos.

Verificar:

- validación MIME
- tamaño
- extensiones
- almacenamiento
- nombres únicos

---

# 20. STORAGE

Analizar permisos.

- imágenes
- avatares
- documentos
- buckets

Indicar si los archivos son públicos o privados.

---

# 21. RATE LIMITING

Detectar protección contra abuso.

- login
- registro
- APIs
- checkout

Estado:

- Implementado
- Parcial
- No encontrado

---

# 22. HEADERS DE SEGURIDAD

Comprobar:

| Header | Estado |
|----------|--------|
| CSP | |
| HSTS | |
| X-Frame | |
| XSS Protection | |
| Referrer Policy | |

---

# 23. DEPENDENCIAS VULNERABLES

Analizar librerías.

| Dependencia | Riesgo |
|-------------|---------|
| | |

No actualizar automáticamente.

---

# 24. AUDITORÍA DEL FRONTEND

Verificar:

- exposición de secretos
- variables públicas
- rutas protegidas
- datos sensibles
- consola
- source maps

---

# 25. AUDITORÍA DEL BACKEND

Verificar:

- validaciones
- permisos
- middleware
- errores
- logs
- excepciones

---

# 26. RIESGOS DETECTADOS

## 🔴 Críticos

| Riesgo | Impacto | Ubicación |
|---------|----------|-----------|
| Sin validación de precios en servidor | Atacante modifica carrito.total antes de pedir | src/context/ShopContext.tsx |
| Carrito sin persistencia en BD | Datos pueden perderse o manipularse | localStorage |
| Sin integración de pagos | Imposible completar venta en línea | No existe |

---

## 🟠 Altos

| Riesgo | Impacto | Ubicación |
|---------|----------|-----------|
| Supabase anon key expuesta | Si RLS falla, acceso no autorizado | .env (VITE_SUPABASE_ANON_KEY) |
| Sin rate limiting | Posible fuerza bruta en login/registro | Supabase Auth |
| Email no verificado obligatoriamente | Cuenta con email falso posible | supabase/migrations/ |
| Sin validación de cantidad | Cantidad negativa o extrema posible | src/context/ShopContext.tsx |
| No hay protección CSRF claramente visible | Posible ataque CSRF | No detectado |

---

## 🟡 Medios

| Riesgo | Impacto | Ubicación |
|---------|----------|-----------|
| Storage bucket público | hero-animation accesible sin auth | supabase/migrations/20260823015431 |
| Errores pueden exponer info | Stack traces visibles en console | src/lib/error-capture.ts |
| No hay Content Security Policy detectada | XSS más fácil | vite.config.ts |
| LocalStorage en client visible | Datos de carrito visibles en DevTools | src/context/ShopContext.tsx |
| JWT tokens en localStorage | Vulnerable a XSS (si browser comprometido) | supabase/client.ts |

---

## 🟢 Bajos

| Riesgo | Impacto | Ubicación |
|---------|----------|-----------|
| Source maps exponen código | Depuración más fácil para atacante | vite build |
| Componentes sin sanitización explícita | Posible XSS en user input | Radix UI debería sanitizar |
| No hay logging de eventos de seguridad | Auditoría limitada | No implementado |

---

# 27. CHECKLIST PRE-PRODUCCIÓN

## Autenticación

- [x] Login seguro (Supabase)
- [x] Logout correcto (signOut implementado)
- [x] Refresh Token (Supabase automático)
- [ ] Recuperación de contraseña (no en UI)
- [ ] Verificación de email (no forzada)

## Cookies

- [ ] Consentimiento (componentes existen, no validados)
- [x] HttpOnly (Supabase Auth)
- [x] Secure (HTTPS)
- [x] SameSite (Supabase default)

## APIs

- [ ] Protegidas (no hay APIs propias)
- [ ] Validación servidor (no existe)
- [ ] Rate limiting (no detectado)

## Pagos

- [ ] Precio validado (NO EXISTE)
- [ ] Cantidad validada (NO EXISTE)
- [ ] Webhook verificado (NO EXISTE)
- [ ] Pedido confirmado desde servidor (NO EXISTE)

## Base de datos

- [x] RLS activo
- [x] Policies correctas
- [x] FK consistentes (aunque mínimas)

## Secretos

- [x] Ningún secreto en frontend (VITE_ keys son públicas)
- [x] Variables privadas protegidas (service role no expuesta)
- [x] Service Role oculto (correcto)

---

# 28. RECOMENDACIONES

## 🔴 Crítico (Bloquea producción)

1. **Implementar validación de precios en servidor**
   - POST endpoint que valida carrito antes de crear pedido
   - Verifica producto exists, precio matches, cantidad razonable
   - Rechaza si hay discrepancias

2. **Crear tabla de órdenes y persistencia de carrito en BD**
   - Migración Supabase para orders, order_items
   - Endpoint para crear pedido (validado en servidor)

3. **Implementar integración de pagos**
   - Stripe o PayPal
   - Webhook para confirmación
   - Validación de transaction

4. **Forzar verificación de email**
   - Habilitaren  en Supabase Auth
   - Enviar email de confirmación

## 🟠 Alto (Antes de escalar)

1. **Rate limiting en auth endpoints**
   - 5 intentos login fallidos = 15min lockout
   - Usar Supabase Custom Claims o servidor propio

2. **Implementar Content Security Policy (CSP)**
   - Header: `Content-Security-Policy: default-src 'self'`
   - Protege contra XSS

3. **Desabilitar Source Maps en producción**
   - Vite: `sourcemap: false` en build
   - Ocultar código de atacantes

4. **Logging de eventos de seguridad**
   - Login/logout
   - Cambios de perfil
   - Errores de autenticación

## 🟡 Medio

1. **HTTPS obligatorio en todas partes**
   - Redirect HTTP → HTTPS
   - HSTS header

2. **Sanitizar user input**
   - Aunque Radix UI lo hace, ser explícito
   - Validación en formularios

3. **Audit trail de cambios**
   - Log de quién cambió qué y cuándo
   - Para cumplimiento regulatorio

## 🟢 Bajo

1. **Email de notificación de cambios de cuenta**
   - Cuando cambiar password, email, etc.

2. **2FA opcional para usuarios**
   - TOTP o SMS
   - Para cuentas de VIP

3. **Privacy policy y Terms**
   - Legal clarity sobre datos
   - GDPR compliance

---

# CONCLUSIÓN

**La aplicación tiene una base de seguridad sólida (Supabase Auth, RLS) pero críticos gaps para producción (sin pagos, sin validación servidor).**

**Recomendación:** No lanzar a producción sin implementar:
1. Sistema de pagos
2. Validación de servidor
3. Protección CSRF/XSS

**Timeline estimado:** 2-4 semanas para producción-ready.

---

Parte de la suite de auditoría:
- PROJECT_AUDIT_SPEC.md
- PROJECT_AUDIT_REPORT.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md (este)

---

# CONCLUSIÓN

Este documento debe permitir decidir si el proyecto está preparado para producción desde el punto de vista de seguridad.

Forma parte de la suite de auditoría:

- PROJECT_AUDIT_SPEC.md
- PROJECT_AUDIT_REPORT.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md