# PROJECT AUDIT REPORT
## Informe Completo de Auditoría Técnica del Proyecto

> Este documento es generado por Claude Code siguiendo las reglas definidas en `PROJECT_AUDIT_SPEC.md`.

**Estado:** Completado  
**Versión del informe:** 1.0  
**Fecha de auditoría:** 2026-08-26

---

# INFORMACIÓN GENERAL

| Campo | Valor |
|---------|------|
| Nombre del proyecto | floristeria lucia |
| Tipo de aplicación | Tienda online de flores y plantas (e-commerce) |
| Fecha de auditoría | 2026-08-26 |
| Auditor | Claude Code |
| Versión del proyecto | No determinado a partir del código analizado |
| Rama analizada | No determinado a partir del código analizado |
| Commit (si existe) | No determinado a partir del código analizado |

---

# ÍNDICE

1. Resumen ejecutivo
2. Stack tecnológico
3. Estructura del proyecto
4. Arquitectura actual
5. Páginas y rutas
6. Componentes
7. Estado de la aplicación
8. Base de datos
9. Relaciones entre entidades
10. ERD
11. UML
12. Autenticación
13. Cookies y privacidad
14. Productos y catálogo
15. Carrito
16. Pedidos
17. Direcciones
18. APIs
19. Servicios externos
20. Pagos
21. Variables de entorno
22. Seguridad
23. Rendimiento
24. SEO
25. Accesibilidad
26. Deployment y hosting
27. GitHub
28. Testing
29. Funcionalidades
30. Flujos de usuario
31. Dependencias
32. Código muerto
33. Deuda técnica
34. Mapa de datos
35. Arquitectura actual vs recomendada
36. Arquitectura recomendada
37. Diagrama final
38. Conclusiones
39. Prioridades para producción

---

# 1. RESUMEN EJECUTIVO

## Objetivo de la aplicación

Floristeria lucia es una plataforma de e-commerce especializada en venta de flores, plantas y composiciones florales personalizadas. La aplicación permite a los clientes:
- Navegar un catálogo de productos florales (ramos, plantas, rosas eternas, complementos, condolencias)
- Personalizar productos (seleccionar tamaños, colores)
- Gestionar un carrito de compras
- Realizar pedidos con dirección de entrega
- Acceder a su cuenta y perfil de usuario
- Contactar con la floristería para servicios especiales (bodas, eventos, composiciones personalizadas)

## Problema que resuelve

Proporciona una solución de venta en línea para una floristería física en San Fernando de Henares, Madrid, permitiendo:
- Expandir el alcance geográfico a clientes en Madrid y Guadalajara
- Gestionar ventas de productos con precio fijo vs servicios personalizados
- Mantener un registro de clientes y preferencias
- Ofrecer canales de contacto para servicios especializados (bodas, eventos)

## Usuarios objetivo

- Clientes particulares que desean enviar flores/plantas
- Novias y parejas planificando bodas
- Organizadores de eventos
- Clientes en Madrid y Guadalajara principalmente
- Clientes en San Fernando de Henares (cliente prioritario)

## Estado actual

- [x] MVP
- [x] Desarrollo
- [ ] Beta
- [ ] Producción

### Funcionalidades terminadas

<!-- Lista -->

### Funcionalidades incompletas

<!-- Lista -->

### Funcionalidades simuladas o hardcodeadas

<!-- Lista -->

---

# 2. STACK TECNOLÓGICO

| Tecnología | Versión | Uso | Ubicación |
|------------|----------|-----|-----------|
| TanStack Start | 1.168.32 | Framework full-stack con SSR | Frontend/Backend |
| React | 19.2.0 | Librería de UI | Frontend |
| TypeScript | 5.8.3 | Lenguaje de tipado | Frontend |
| Vite | 8.2.0 | Build tool | Herramientas |
| Tailwind CSS | 4.2.1 | Framework CSS | Frontend |
| Radix UI | Múltiples | Componentes accesibles | Frontend |
| TanStack Router | 1.170.18 | Ruteo | Frontend |
| TanStack React Query | 5.101.1 | State management de datos | Frontend |
| React Hook Form | 7.71.2 | Gestión de formularios | Frontend |
| Zod | 3.24.2 | Validación de esquemas | Frontend |
| Supabase | SDK 2.112.3 | Base de datos y autenticación | Backend |
| Lovable Auth | 1.0.0 | Autenticación OAuth | Backend |
| Recharts | 2.15.4 | Gráficos | Frontend |
| Sonner | 2.0.7 | Notificaciones toast | Frontend |
| Lucide React | 0.575.0 | Iconos | Frontend |
| ESLint | 9.32.0 | Linting | Herramientas |
| Prettier | 3.7.3 | Formateo de código | Herramientas |

## Framework principal

**TanStack Start 1.168.32** - Framework full-stack moderno que combina React en el frontend con un servidor SSR. Proporciona:
- Renderizado del lado del servidor (SSR)
- Enrutamiento basado en archivos (file-based routing)
- Gestión de datos con React Query
- API de desarrollo clara

## Librerías UI

- **Radix UI** - Conjunto completo de componentes accesibles y sin estilo:
  - Diálogos, tabs, dropdowns, tooltips, popovers, sliders, etc.
  - Más de 30 componentes diferentes
  - Control total sobre estilos via Tailwind CSS

- **Tailwind CSS v4** - Framework CSS utility-first:
  - Personalización completa de tema (colores, tipografía)
  - Responsive design integrado
  - Transiciones y animaciones

- **Lucide React** - Iconografía consistente y moderna

- **Sonner** - Sistema de notificaciones toast

## Base de datos

**Supabase** (PostgreSQL):
- Motor: PostgreSQL 14.15
- Autenticación: Supabase Auth integrado
- Row Level Security (RLS) habilitado
- Storage de objetos para imágenes (bucket: hero-animation)

## Hosting

No determinado a partir del código analizado. El proyecto está configurado con Vite/TanStack Start que sugiere:
- Posible despliegue en Vercel, Cloudflare, o similar (SSR-ready)
- Supabase como backend cloud

## Servicios Cloud

- **Supabase** - Base de datos, autenticación, almacenamiento
- **Lovable** - Plataforma de desarrollo y asistencia
- **Google OAuth** - Autenticación social (Google Sign-In)

---

# 3. ESTRUCTURA DEL PROYECTO

## Árbol de directorios

```
floristeria_lucia/
├── src/
│   ├── assets/                    # Imágenes y assets
│   ├── components/                # Componentes React reutilizables
│   │   ├── ui/                   # Componentes de Radix UI + Tailwind
│   │   ├── Navbar.tsx            # Barra de navegación
│   │   ├── Footer.tsx            # Pie de página
│   │   ├── CartDrawer.tsx        # Drawer del carrito
│   │   ├── ProductCard.tsx       # Tarjeta de producto
│   │   └── [otros componentes]
│   ├── context/                   # Context API providers
│   │   ├── ShopContext.tsx       # Estado del carrito y favoritos
│   │   ├── LanguageContext.tsx   # Idioma (es, en, ca)
│   │   └── ThemeContext.tsx      # Tema oscuro/claro
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.ts            # Estado de autenticación
│   │   └── use-mobile.tsx        # Detección de dispositivo
│   ├── routes/                    # Páginas y rutas (file-based)
│   │   ├── __root.tsx            # Layout raíz
│   │   ├── index.tsx             # Página de inicio
│   │   ├── catalogo.tsx          # Catálogo de productos
│   │   ├── carrito.tsx           # Página del carrito
│   │   ├── auth.tsx              # Login/signup
│   │   ├── contacto.tsx          # Contacto
│   │   ├── producto.$id.tsx      # Detalle de producto
│   │   ├── servicios.tsx         # Servicios (bodas, eventos)
│   │   ├── _authenticated/       # Rutas protegidas
│   │   │   └── mi-cuenta.tsx    # Perfil de usuario
│   │   └── [más rutas]
│   ├── integrations/              # Integraciones externas
│   │   ├── supabase/             # Cliente y configuración Supabase
│   │   └── lovable/              # Integración Lovable
│   ├── data/                      # Datos estáticos
│   │   ├── catalog.ts            # Productos y categorías
│   │   ├── services.ts           # Servicios personalizados
│   │   ├── company.ts            # Datos de la empresa
│   │   ├── coverage.ts           # Localidades de reparto
│   │   ├── shipping.ts           # Tarifas de envío
│   │   └── [más datos]
│   ├── i18n/                      # Internacionalización
│   │   ├── index.ts              # Configuración i18n
│   │   ├── common.ts             # Traducciones comunes
│   │   └── ns/                   # Namespaces de traducción
│   ├── lib/                       # Utilidades
│   │   ├── utils.ts              # Funciones auxiliares
│   │   └── error-*.ts            # Manejo de errores
│   ├── styles.css                # Estilos globales
│   ├── router.tsx                # Configuración de rutas
│   ├── server.ts                 # Entry point del servidor
│   └── start.ts                  # Entry point del cliente
├── supabase/
│   └── migrations/               # Migraciones de base de datos
├── public/                       # Assets públicos
├── .lovable/                     # Configuración de Lovable
├── package.json
├── tsconfig.json
├── vite.config.ts
└── [archivos de configuración]
```

## Carpetas principales

### `/src`
Código fuente principal de la aplicación. Incluye componentes, páginas, contextos, y lógica de negocio.

### `/src/components`
Componentes React reutilizables divididos en:
- `ui/` - Componentes base de Radix UI estilizados con Tailwind
- Componentes de negocio específicos (ProductCard, CartDrawer, Navbar, etc.)

### `/src/routes`
Sistema de file-based routing de TanStack Router:
- Cada archivo `.tsx` es una ruta
- `__root.tsx` es el layout principal
- `$id` para parámetros dinámicos
- `_authenticated/` para rutas protegidas

### `/src/context`
Global state management usando Context API:
- ShopContext: carrito y favoritos
- LanguageContext: idioma de la aplicación
- ThemeContext: tema visual

### `/src/data`
Datos estáticos en TypeScript:
- catalog.ts: productos, categorías, precios
- services.ts: servicios personalizados (bodas, eventos)
- company.ts: información de la empresa
- coverage.ts: localidades de reparto
- shipping.ts: tarifas de envío

### `/src/integrations`
Configuración de servicios externos:
- supabase/: cliente y middleware de autenticación
- lovable/: integración con plataforma Lovable

### `/src/i18n`
Internacionalización en tres idiomas: español (es), inglés (en), catalán (ca)

## Archivos importantes

| Archivo | Función |
|----------|----------|
| src/routes/__root.tsx | Layout raíz, configuración global, providers |
| src/context/ShopContext.tsx | Estado del carrito y favoritos (localStorage) |
| src/data/catalog.ts | Catálogo de productos (datos estáticos) |
| src/integrations/supabase/client.ts | Cliente Supabase para frontend |
| src/routes/auth.tsx | Autenticación (login/signup) |
| supabase/migrations/ | Migraciones de BD (profiles, RLS policies) |
| vite.config.ts | Configuración de build y desarrollo |
| package.json | Dependencias del proyecto |

## Código posiblemente obsoleto

No determinado a partir del código analizado. Se recomienda revisar:
- Rutas antiguas que redirigen a servicios (ej: bodas, eventos)
- Componentes sin uso en el bundle final

---

# 4. ARQUITECTURA ACTUAL

## Descripción

<!-- Completar -->

## Diagrama Mermaid

```mermaid
flowchart TD

```

## Flujo general

<!-- Completar -->

---

# 5. PÁGINAS Y RUTAS

| Ruta | Componente | Auth | Datos | Función |
|------|------------|------|-------|----------|
| `/` | src/routes/index.tsx | No | Estático | Página de inicio con hero, colecciones, highlights |
| `/catalogo` | src/routes/catalogo.tsx | No | Estático (catalog.ts) | Catálogo de productos filtrable |
| `/producto/:id` | src/routes/producto.$id.tsx | No | Estático | Detalle de producto único |
| `/carrito` | src/routes/carrito.tsx | No | localStorage | Visualización y gestión del carrito |
| `/auth` | src/routes/auth.tsx | No | Supabase | Login/signup de usuarios |
| `/mi-cuenta` | src/routes/_authenticated/mi-cuenta.tsx | Sí | Supabase profiles | Perfil y datos del usuario |
| `/servicios` | src/routes/servicios.tsx | No | Estático (services.ts) | Listado de servicios especiales |
| `/servicios/:slug` | src/routes/servicios.$slug.tsx | No | Estático | Detalle de servicio |
| `/personalizar-ramo` | src/routes/personalizar-ramo.tsx | No | Estático | Constructor de ramos personalizados |
| `/rosas-eternas` | src/routes/rosas-eternas.tsx | No | Estático | Landing de rosas eternas |
| `/contacto` | src/routes/contacto.tsx | No | Estático | Formulario de contacto |
| `/envios` | src/routes/envios.tsx | No | Estático (shipping.ts) | Información de envíos y cobertura |
| `/favoritos` | src/routes/favoritos.tsx | No | localStorage | Productos marcados como favoritos |
| `/sobre-nosotros` | src/routes/sobre-nosotros.tsx | No | Estático | Información de la empresa |
| `/legal/:slug` | src/routes/legal.$slug.tsx | No | Estático | Páginas legales (términos, condiciones, etc.) |

## Rutas dinámicas

**Rutas con parámetros dinámicos:**
- `/producto/:id` - Cada producto tiene un identificador único (ej: "ramo-silvestre")
- `/servicios/:slug` - Cada servicio tiene un slug (ej: "bodas", "eventos")
- `/legal/:slug` - Páginas legales variadas

**Redirecciones heredadas:**
- El catálogo redirige automáticamente categorías antiguas (bodas, eventos, composiciones) a `/servicios/:slug`

## Rutas protegidas

**Rutas autenticadas (requieren login):**
- `/_authenticated/mi-cuenta` - Perfil de usuario con datos personales

**Protección implementada:**
- Hook `useAuth()` valida sesión Supabase
- Redirección automática a `/auth` si no hay sesión
- Supabase RLS asegura acceso solo a datos propios

---

# 6. COMPONENTES

## Componentes principales

| Componente | Función | Reutilizable |
|------------|----------|--------------|
| Navbar | Navegación principal, carrito, usuario, idioma | Sí |
| Footer | Pie de página con links y contacto | Sí |
| ProductCard | Tarjeta de producto con imagen, precio, acciones | Sí |
| CartDrawer | Panel lateral del carrito | Sí |
| Button | Botón estándar con variantes | Sí |
| Input | Campo de entrada de texto | Sí |
| Form | Formulario con validación Zod | Sí |
| Dialog | Modal de diálogo | Sí |
| Tabs | Pestañas (usado en auth para login/signup) | Sí |
| Tooltip | Información al pasar el mouse | Sí |
| Select | Dropdown de selección | Sí |
| CookieNotice | Aviso de cookies GDPR | Sí |
| HeroSlider | Carrusel de imágenes hero | No |
| AnimatedFlowerHero | Hero animado con flores | No |
| CollectionsCarousel | Carrusel de colecciones | No |
| SeasonalCollection | Colección estacional | No |
| CustomOrderBuilder | Constructor de pedidos personalizados | No |

## Layouts

**Layout raíz (`__root.tsx`):**
- Proporciona Navbar y Footer en todas las páginas
- Configura proveedores globales: QueryClientProvider, ShopProvider, ThemeProvider, LanguageProvider
- Maneja errores 404 y excepciones globales
- Inyecta estilos CSS y configura meta tags globales

## Formularios

**Autenticación (`auth.tsx`):**
- LoginForm - Login con email/contraseña
- SignupForm - Registro con email/contraseña
- GoogleButton - OAuth con Google

**Perfil (`mi-cuenta.tsx`):**
- Formulario para actualizar nombre completo y teléfono
- Guardado en tabla `profiles` de Supabase

**Contacto (`contacto.tsx`):**
- Información de contacto directo (sin formulario funcional aparente)

## Componentes del catálogo

- **ProductCard** - Muestra imagen, nombre, precio, categoría, disponibilidad
- **CoverageSearch** - Búsqueda de localidades de reparto
- **ProductsServicesEditorial** - Layout editorial de productos y servicios
- **CollectionsCarousel** - Carrusel de colecciones dinámicas

## Componentes del checkout

No existe flujo de checkout implementado actualmente. El carrito:
- Usa CartDrawer para visualizar items
- Permite modificar cantidades
- Muestra total calculado
- **No tiene integración de pagos**
- El siguiente paso esperado es contacto directo o formulario de pedido

---

# 7. ESTADO DE LA APLICACIÓN

## Estado global

**Context API (React Context):**
- **ShopContext** - Carrito y favoritos
- **LanguageContext** - Idioma actual (es, en, ca)
- **ThemeContext** - Tema visual (claro/oscuro)

## Estado local

**Componentes con useState:**
- Navbar: estado de menú móvil abierto/cerrado
- CartDrawer: estado abierto/cerrado del drawer
- Formularios: estados de validación y error
- Páginas: estados de búsqueda, filtros, paginación

## Cache

**TanStack React Query:**
- Caching automático de datos fetched
- No hay configuración específica detectada en el código

**Browser Cache:**
- Imágenes y assets cacheados por el navegador
- Service workers no detectados

## LocalStorage

| Clave | Contenido | Uso |
|-------|----------|-----|
| `petalos-cart` | JSON del carrito | Persistencia del carrito entre sesiones |
| `petalos-favorites` | Array de IDs de productos | Favoritos del usuario |
| `lucia-language` | Código de idioma (es/en/ca) | Preferencia de idioma |

## SessionStorage

No determinado a partir del código analizado.

## Cookies

**Cookies de Supabase Auth:**
- `sb-{project-id}-auth-token` - Token de autenticación
- `sb-{project-id}-auth-token-code-verifier` - PKCE verifier
- Posiblemente otras cookies de sesión

**Consentimiento de cookies:**
- Componente CookieNotice presente
- Componente CookiePreferences para gestionar consentimiento
- No determinado si el consentimiento se valida actualmente

---

# 8. BASE DE DATOS

> La documentación completa irá también en `DATABASE.md`.

## Entidades detectadas

| Tabla | Descripción | Registros estimados |
|--------|-------------|-------------------|
| auth.users | Usuarios del sistema (Supabase Auth) | Variable |
| public.profiles | Perfil extendido de usuario (nombre, teléfono) | Variable |
| storage.objects | Objetos en buckets de almacenamiento | Variable |

**Nota:** El modelo de datos es muy básico. No hay tablas para productos, órdenes, direcciones, pagos, etc. Estos datos se manejan de forma estática (catálogo.ts) o no están implementados (órdenes, pagos).

## Resumen

La base de datos utiliza Supabase (PostgreSQL) con un modelo minimal:

**Tablas existentes:**
1. **auth.users** (Supabase managed) - Usuarios y autenticación
2. **public.profiles** - Extensión de usuario con datos personales
3. **storage.objects** - Almacenamiento de archivos/imágenes

**Características:**
- Row Level Security (RLS) habilitado en todas las tablas
- Triggers automáticos para actualizar `updated_at`
- Función trigger para crear perfil automáticamente al registrarse

**Limitaciones:**
- No hay persistencia de datos de carrito en BD
- No hay tabla de órdenes/pedidos
- No hay tabla de direcciones
- No hay tabla de pagos
- Catálogo de productos está hardcodeado en TypeScript

---

# 9. RELACIONES ENTRE ENTIDADES

## Relaciones 1:1

<!-- Completar -->

## Relaciones 1:N

<!-- Completar -->

## Relaciones N:N

<!-- Completar -->

---

# 10. ERD

```mermaid
erDiagram

```

---

# 11. UML

```mermaid
classDiagram

```

---

# 12. AUTENTICACIÓN

## Registro

**Endpoint:** `/auth` (tab "Crear cuenta")

**Proceso:**
1. Usuario ingresa email y contraseña
2. Envía a Supabase Auth (`supabase.auth.signUp()`)
3. Se crea automáticamente un perfil en tabla `profiles`
4. Trigger `on_auth_user_created` genera el registro en profiles

**Validación:**
- Realizada por Supabase (formato email, fortaleza contraseña)

## Login

**Endpoint:** `/auth` (tab "Acceder")

**Opciones de autenticación:**
1. Email/contraseña
2. Google OAuth (mediante Lovable Auth)
3. Apple OAuth (configurado, no probado)
4. Microsoft OAuth (configurado, no probado)

**Flujo OAuth:**
- Utiliza `lovable.auth.signInWithOAuth()`
- Configura sesión en Supabase
- Redirige a `/mi-cuenta` si está autenticado

## Recuperación de contraseña

**Estado:** No determinado a partir del código analizado. Supabase proporciona esto por defecto pero la UI no está implementada.

## Roles

**Roles detectados:**
- Usuario autenticado (puede acceder a `/mi-cuenta`)
- Usuario anónimo/invitado (acceso a catálogo y carrito)

**No hay roles de administrador o vendedor implementados.**

## Tokens

**Almacenamiento:**
- Supabase maneja tokens internamente
- Tokens almacenados en cookies o localStorage (según configuración Supabase)
- Hook `useAuth()` proporciona acceso a sesión y usuario

**Tipos de token:**
- Access token (JWT)
- Refresh token (para renovación automática)
- Gestión completa por Supabase SDK

---

# 13. COOKIES Y PRIVACIDAD

| Cookie | Uso | Duración |
|---------|-----|----------|
| sb-*-auth-token | Autenticación Supabase | Session |
| sb-*-auth-token-code-verifier | PKCE para OAuth | Session |
| lucia-language | Preferencia de idioma | 1 año (persistente) |

## Consentimiento

**Componentes implementados:**
- `CookieNotice.tsx` - Aviso de cookies GDPR
- `CookiePreferences.tsx` - Panel de preferencias

**Estado de implementación:** No determinado si está activamente validando consentimiento en el sitio actual.

## Datos personales almacenados

**En Supabase (tabla profiles):**
- Email (en auth.users)
- Nombre completo (opcional)
- Teléfono (opcional)
- Fecha de creación
- Fecha de actualización

**En localStorage (navegador del cliente):**
- Carrito de compras (JSON)
- Favoritos (array de IDs)
- Preferencia de idioma

**En cookies (navegador del cliente):**
- Token de autenticación Supabase
- PKCE code verifier para OAuth

---

# 14. PRODUCTOS Y CATÁLOGO

## Fuente de datos

- [ ] Base de datos
- [ ] JSON
- [x] API
- [x] Hardcodeado (TypeScript array)

Los productos se definen como un array estático en `src/data/catalog.ts`

## Modelo de producto

| Campo | Tipo | Descripción |
|--------|------|-------------|
| id | string | Identificador único del producto |
| name | string | Nombre del producto |
| category | CategoryId | Categoría (ramos, plantas, rosas-eternas, complementos, condolencias) |
| priceMin | number | Precio mínimo |
| priceMax | number \| undefined | Precio máximo (rango de precios) |
| image | string | URL de la imagen |
| description | string | Descripción del producto |
| badge | string \| undefined | Badge opcional (ej: "Nuevo", "Recomendado") |
| quoteOnly | boolean \| undefined | Si requiere presupuesto |
| roseStep | number \| undefined | Incremento de rosas (ej: 1 = 6 rosas) |
| colors | string[] \| undefined | Colores disponibles para personalización |

## Categorías

| ID | Nombre | Descripción |
|----|--------|-------------|
| ramos | Ramos y arreglos florales | Ramos de temporada montados a mano cada mañana |
| plantas | Plantas y Composiciones | Plantas de interior, orquídeas y cestas |
| rosas-eternas | Rosas eternas | Flor natural preservada que dura 7-10 años |
| complementos | Complementos | Bombones, vino, queso, frutas, globos, jarrones |
| condolencias | Condolencias | Cruces, ramos, murales y aros para despedidas |

---

# 15. CARRITO

## Flujo

```text
Usuario (autenticado o invitado)
↓
Selecciona producto + tamaño/color
↓
Añade al carrito (ShopContext)
↓
CartDrawer muestra el carrito
↓
Usuario ve /carrito para revisar
↓
NO HAY CHECKOUT - Se contacta a floristería
```

## Persistencia

**Almacenamiento:**
- localStorage con clave `petalos-cart`
- Estructura: Array de CartLine objects
- Sincronización automática en cada cambio

**CartLine estructura:**
```typescript
type CartLine = {
  key: string;              // `${productId}::${size}`
  productId: string;
  name: string;
  size: string;
  category?: string;
  price: number;
  image: string;
  qty: number;
};
```

**Comportamiento:**
- Carrito persiste entre sesiones
- Mismo producto con diferente tamaño = línea separada
- No se sincroniza con base de datos
- No se limpia automáticamente

## Usuario invitado

**Carrito para invitados:**
- Funciona completamente sin autenticación
- Datos persisten en localStorage
- Si inicia sesión, mantiene su carrito

**Limitaciones:**
- No se guarda en BD
- No se recupera si limpia localStorage
- No se sincroniza entre dispositivos

---

# 16. PEDIDOS

**Estado:** No implementado en la aplicación

El flujo de compra termina en el carrito. Los siguientes pasos esperados:
1. Usuario revisa carrito en `/carrito`
2. Contacta directamente a la floristería (WhatsApp, email, teléfono)
3. O utiliza formulario de contacto `/contacto`
4. La floristería gestiona manualmente el pedido

## Modelo

No existe tabla de órdenes en la base de datos. Los pedidos no se persisten digitalmente en el sistema actual.

## Estados del pedido

No aplicable - No hay sistema de órdenes implementado

---

# 17. DIRECCIONES

**Estado:** Parcialmente implementado

## Modelo

No existe tabla de direcciones en Supabase. Las direcciones se recopilan:
1. En el perfil del usuario: campo `phone` (teléfono)
2. En el formulario de contacto (`contacto.tsx`) - datos recopilados pero no persistidos
3. En el flujo de pedido manual - contacto directo

## Cobertura de envíos

**Localidades con entrega propia:**

| Localidad | Provincia |
|-----------|-----------|
| San Fernando de Henares | Madrid |
| Torrejón de Ardoz | Madrid |
| Coslada | Madrid |
| Vicálvaro | Madrid |
| Mejorada del Campo | Madrid |
| Paracuellos de Jarama | Madrid |
| Loeches | Madrid |
| Cobeña | Madrid |
| Villalbilla | Madrid |
| Rivas-Vaciamadrid | Madrid |
| Madrid (capital) | Madrid |
| Guadalajara | Guadalajara |

## Tarifas de envío

**San Fernando de Henares:**
- Hasta 25€: 6€ de portes
- Desde 35€: Envío incluido

**Pueblos limítrofes** (Vicálvaro, Torrejón de Ardoz, Coslada):
- Hasta 55€: 9€ de portes
- Desde 55€: Envío gratuito

**Otras localidades cercanas** (Paracuellos, Alcalá, Mejorada):
- Hasta 55€: 14,50€ de portes
- Desde 55€: Envío gratuito

**Madrid Capital:**
- Hasta 110€: 18€ de portes
- Desde 120€: Envío incluido

## Relación con usuarios

Las direcciones no están relacionadas con usuarios en BD. Se recopilan manualmente en contacto directo con la floristería.

---

# 18. APIS

| Método | Endpoint | Archivo | Función |
|---------|----------|----------|----------|
| GET | `/catalogo` | catalogo.tsx | Listar productos con filtros |
| GET | `/producto/:id` | producto.$id.tsx | Detalle de producto |
| POST | `/auth` | auth.tsx | Registro/Login de usuario |
| PUT | `/mi-cuenta` | mi-cuenta.tsx | Actualizar perfil |
| POST | `/contacto` | contacto.tsx | Enviar mensaje de contacto |

## APIs internas

**No hay APIs REST tradicionales implementadas.** La aplicación es principalmente frontend con integración directa a Supabase:

**Operaciones Supabase desde frontend:**
- `supabase.auth.signUp()` - Registro
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signInWithOAuth()` - OAuth
- `supabase.from("profiles").select()` - Leer perfil
- `supabase.from("profiles").upsert()` - Actualizar perfil
- `supabase.auth.signOut()` - Logout

**Server endpoint:**
- `src/server.ts` - Entry point SSR (no lógica de negocio específica)

## APIs externas

**Supabase Auth API:**
- Registro, login, OAuth
- Gestión de sesiones
- Reset de contraseña

**Google OAuth:**
- Autenticación social vía Google

**Lovable API:**
- Integración automática (generación de código)
- No requiere llamadas activas en runtime

---

# 19. SERVICIOS EXTERNOS

| Servicio | Uso | Autenticación |
|----------|-----|---------------|
| Supabase | BD, autenticación, storage | API Key (pública + privada en env) |
| Google OAuth | Login social | Client ID en env |
| Lovable | Desarrollo y generación de código | Automática |

---

# 20. PAGOS

**Estado:** NO IMPLEMENTADO

## Proveedor

No hay integración de pagos en línea implementada. La documentación menciona:
- "Aceptamos tarjeta de crédito y débito (Visa y Mastercard) a través de pasarela segura con cifrado SSL"
- "PayPal y transferencia o ingreso bancario"

**Pero estos métodos no están integrados en la aplicación web.**

## Flujo del checkout

```
Usuario añade productos al carrito
         ↓
Revisa carrito en /carrito
         ↓
Contacta a floristería:
  - WhatsApp: +34919953880
  - Teléfono: 919 95 38 80
  - Email: info@floristerialuciamotrico.com
  - Formulario /contacto
         ↓
Floristería confirma:
  - Disponibilidad
  - Localidad de entrega
  - Tarifa de envío
  - Método de pago
         ↓
Cliente realiza pago:
  - Transferencia bancaria
  - Tarjeta crédito/débito
  - PayPal (externo)
         ↓
Floristería prepara y entrega
```

## Validación del precio

No existe. Los precios se muestran pero no se validan en el server. El cliente es responsable de confirmar en el contacto directo.

---

# 21. VARIABLES DE ENTORNO

| Variable | Pública/Privada | Uso |
|----------|-----------------|-----|
| VITE_SUPABASE_URL | Pública (prefijo VITE_) | URL del proyecto Supabase |
| VITE_SUPABASE_ANON_KEY | Pública (prefijo VITE_) | API key anónima Supabase |
| VITE_GOOGLE_CLIENT_ID | Pública (prefijo VITE_) | Client ID de Google OAuth |

**Nota sobre seguridad:** Las variables VITE_* son públicas por diseño (accesibles en el navegador). Supabase proporciona dos claves:
- **anon**: acceso público (la que está en el cliente)
- **service_role**: acceso privilegiado (debe estar en servidor, NO en cliente)

**Ubicación de secretos:**
- Archivo `.env.local` (no versionado)
- Supabase dashboard para variables de servidor
- Plataforma de hosting (Vercel, etc.) para deployment

---

# 22. SEGURIDAD

La documentación detallada está en `SECURITY.md`

| Riesgo | Prioridad | Estado |
|---------|-----------|--------|
| No hay validación de precios en servidor | 🔴 Crítico | Requiere implementación |
| Carrito sin persistencia en BD | 🟠 Alto | Requiere implementación |
| No hay protección contra CSRF detectada | 🟡 Medio | Revisar configuración |
| LocalStorage expone datos de usuario | 🟡 Medio | Por diseño, aceptable |

## Vulnerabilidades encontradas

**🔴 Críticas:**
1. **Manipulación de precios** - El carrito calcula el total en frontend sin validación de servidor. Un atacante podría modificar el precio antes de hacer contacto.

**🟠 Altas:**
2. **Carrito sin persistencia en BD** - Si un usuario se registra, su carrito no se recupera. Pérdida de datos.
3. **No hay validación de email verificado** - Se permite login sin verificar email (si Supabase está configurado así).

**🟡 Medias:**
4. **CORS no validado** - Supabase anon key está expuesta, pero RLS debe proteger datos.
5. **Storage sin restricción clara** - Bucket 'hero-animation' permite lectura anónima.

**🟢 Bajas:**
6. **Código sensible en client** - Prefijo VITE_ indica variables públicas, correcto pero revisar siempre.
7. **No hay rate limiting en auth** - Supabase debería proporcionar por defecto.

---

# 23. RENDIMIENTO

## Problemas detectados

1. **Bundle size no optimizado** - 30+ componentes Radix UI, revisar qué se necesita
2. **Imágenes no optimizadas** - Assets JPG/PNG sin compresión aparente
3. **SSR overhead** - TanStack Start puede añadir overhead en servidor
4. **Sin lazy loading de rutas** - Todas las rutas se cargan en el bundle inicial
5. **Sin SuspenseList** - Componentes pueden bloquear renderizado

## Recomendaciones

- Implementar tree-shaking de Radix UI
- Usar image optimization (next-image o similar)
- Lazy load rutas dinámicas
- Analizar bundle con `npm run build` e identificar bloat
- Implementar virtualization para listas largas

---

# 24. SEO

| Elemento | Estado |
|----------|--------|
| Title | ✓ Implementado en cada ruta |
| Description | ✓ Implementado en cada ruta |
| Sitemap | ✗ No encontrado |
| Robots.txt | ✗ No encontrado |
| Open Graph | ✓ Implementado en rutas principales |
| Canonical URLs | ✗ No detectado |
| Structured data | ✗ No detectado |
| Mobile viewport | ✓ Configurado |

---

# 25. ACCESIBILIDAD

## Hallazgos

**Positivos:**
- Componentes Radix UI son accesibles por defecto
- Tailwind CSS usado correctamente (no solo visuales)
- Contraste de colores generalmente adecuado
- Estructura HTML semántica

**Áreas de mejora:**
- No hay pruebas de accesibilidad (WAVE, axe)
- Algunos componentes personalizados podrían carecer de ARIA
- Imágenes sin alt text en algunas secciones
- No hay skip to main content link
- Soporte para teclado no verificado completamente

**Recomendación:** Implementar testing de accesibilidad con axe o similar en CI/CD

---

# 26. DEPLOYMENT Y HOSTING

## Entorno local

**Requisitos:**
- Node.js (recomendado NVM)
- npm

**Instalación:**
```bash
npm i
npm run dev
```

**Build:**
```bash
npm run build
```

**Configuración requerida:**
- `.env.local` con variables Supabase y Google OAuth

## Producción

**Plataforma sugerida:** Vercel (compatible con TanStack Start)

**Pasos:**
1. Conectar repositorio GitHub
2. Configurar variables de entorno en Vercel
3. Deploy automático en cada push a main

**Supabase:**
- Usar proyecto Supabase production
- Habilitar RLS en todas las tablas
- Configurar backups

## Plataforma

No determinado a partir del código analizado. Probables opciones:
- Vercel (oficial, integración TanStack Start)
- Cloudflare Pages (soporte SSR)
- AWS Amplify
- Railway
- Render

---

# 27. GITHUB

## Estado del repositorio

No determinado a partir del código analizado. El proyecto fue generado por Lovable, probablemente sincronizado automáticamente.

## CI/CD

**No hay CI/CD detectado en el código analizado.**

Recomendaciones:
- GitHub Actions para testing
- Linting automático
- Build verification en PRs
- Deploy automático a Vercel

---

# 29. FUNCIONALIDADES

## Usuario

- [x] Registro con email/contraseña
- [x] Login con email/contraseña
- [x] Login con Google OAuth
- [x] Logout
- [x] Perfil de usuario (nombre, teléfono)
- [ ] Recuperación de contraseña (no en UI)
- [ ] Historial de pedidos
- [ ] Múltiples direcciones de envío

## Catálogo

- [x] Productos listados por categoría
- [x] Búsqueda y filtrado de productos
- [x] Detalle de producto con descripción e imagen
- [x] Selección de tamaño/color
- [x] Favoritos/wishlist
- [ ] Reseñas y calificaciones

## Carrito

- [x] Carrito persistente en localStorage
- [x] Añadir/quitar productos
- [x] Modificar cantidades
- [x] Cálculo de subtotal
- [x] Visualización en drawer y página dedicada
- [ ] Carrito en servidor/BD

## Servicios Personalizados

- [x] Listado de servicios (bodas, eventos, etc.)
- [x] Descripción de servicios
- [x] Constructor de ramos personalizados
- [ ] Presupuesto en línea

## Administración

- [ ] Panel de administración
- [ ] Gestión de productos
- [ ] Gestión de pedidos
- [ ] Estadísticas de ventas

---

# 30. FLUJOS DE USUARIO

## Flujo de compra estándar

```
Visitante llega a /
        ↓
    Navega catálogo (/catalogo)
        ↓
    Ve detalle de producto (/producto/:id)
        ↓
    Selecciona tamaño/color
        ↓
    Añade al carrito
        ↓
    CartDrawer muestra confirmación
        ↓
    Revisa carrito (/carrito)
        ↓
    Contacta a floristería:
        - WhatsApp
        - Teléfono
        - Email
        - Formulario /contacto
        ↓
    Floristería confirma pedido
        ↓
    Cliente realiza pago (externo)
        ↓
    Floristería prepara y entrega
```

## Flujo de registro y autenticación

```
Visitante llega a /auth
        ↓
    Elige pestaña "Crear cuenta"
        ↓
    Completa email y contraseña
        ↓
    Envía (SignupForm)
        ↓
    Supabase crea auth.user
        ↓
    Trigger crea perfil automático
        ↓
    Sesión establecida
        ↓
    Redirige a /mi-cuenta
        ↓
    Usuario ve su perfil
```

## Flujo de login

```
Visitante llega a /auth
        ↓
    Elige pestaña "Acceder"
        ↓
    Ingresa email y contraseña
        ↓
    O usa Google/Apple/Microsoft OAuth
        ↓
    Supabase autentica
        ↓
    Sesión establecida
        ↓
    Redirige a /mi-cuenta
        ↓
    Puede actualizar datos de perfil
```

## Flujo de servicios especiales

```
Visitante llega a /servicios
        ↓
    Ve listado de servicios
        ↓
    Selecciona uno (/servicios/:slug)
        ↓
    Lee descripción y detalles
        ↓
    Si tiene builder (personalizar):
        - Constructor interactivo
        - Crea composición personalizada
        ↓
    Contacta con floristería para:
        - Presupuesto
        - Disponibilidad
        - Detalles finales
```

---

# 31. DEPENDENCIAS

**Dependencias principales:**
- @tanstack/react-start: Framework full-stack
- react: Librería UI
- @supabase/supabase-js: Cliente BD
- tailwindcss: Estilos
- @radix-ui/*: Componentes accesibles (30+ paquetes)
- react-hook-form: Formularios
- zod: Validación de esquemas
- @hookform/resolvers: Integración RHF + Zod
- @tanstack/react-router: Enrutamiento
- @tanstack/react-query: State management
- recharts: Gráficos
- sonner: Toast notifications

**Todas las dependencias al 2026-08-26 están actualizadas a versiones modernas.**

---

# 32. CÓDIGO MUERTO

| Elemento | Motivo |
|----------|--------|
| Componentes no utilizados | No determinado sin análisis de bundled output |
| Rutas antiguas redirigidas | bodas, eventos, composiciones redirigen a /servicios |
| Páginas legales sin contenido | Algunos slugs pueden no tener contenido |

---

# 33. DEUDA TÉCNICA

| Prioridad | Problema | Impacto |
|-----------|----------|---------|
| 🔴 Crítico | No hay sistema de órdenes/pagos | Imposible vender en línea completo |
| 🔴 Crítico | No hay persistencia de datos de carrito | Carrito se pierde si limpia localStorage |
| 🟠 Alto | No hay tabla de direcciones en BD | Imposible guardar direcciones de usuario |
| 🟠 Alto | No hay validación de pagos en servidor | Riesgo de manipulación de precios |
| 🟡 Medio | Catálogo hardcodeado en TypeScript | Difícil mantener y actualizar productos |
| 🟡 Medio | No hay gestión de inventario/stock | No se puede controlar disponibilidad |
| 🟢 Bajo | Componentes sin tests | Calidad de código |
| 🟢 Bajo | Documentación limitada en código | Difícil onboarding |

---

# 34. MAPA DE DATOS

## Registro

```text
Usuario
↓
Frontend
↓
Backend
↓
Base de datos
```

## Pedido

```text
Usuario
↓
Carrito
↓
Checkout
↓
Pago
↓
Pedido
```

---

# 35. ARQUITECTURA ACTUAL VS RECOMENDADA

## Arquitectura actual

<!-- Completar -->

## Arquitectura recomendada

<!-- Completar -->

---

# 36. ARQUITECTURA RECOMENDADA

## Descripción

<!-- Completar -->

## Responsabilidades

| Servicio | Responsabilidad |
|----------|-----------------|
| Frontend | |
| Backend | |
| Base de datos | |
| CRM | |
| Pagos | |

---

# 37. DIAGRAMA FINAL

```mermaid
flowchart TD

```

---

# 28. TESTING

| Tipo | Disponible |
|------|------------|
| Unit | ✗ No encontrado |
| Integration | ✗ No encontrado |
| E2E | ✗ No encontrado |

## Cobertura

No hay tests implementados. Recomendación: implementar con Vitest + React Testing Library.

---

# 35. ARQUITECTURA ACTUAL VS RECOMENDADA

## Arquitectura actual

- Frontend-heavy (todo en React)
- Backend minimal (solo autenticación Supabase)
- Datos estáticos en TypeScript
- No hay API REST propia
- No hay persistencia de negocio (carrito, órdenes)

## Arquitectura recomendada

- Implementar backend con endpoints REST para:
  - Órdenes y pagos
  - Validación de precios
  - Direcciones de usuario
  - Inventario
- Persistencia completa en BD
- Sistema de pagos integrado
- Admin dashboard para gestión de productos

---

# 38. CONCLUSIONES

## Fortalezas

✓ **Stack moderno y bien estructurado** - TanStack Start, React 19, TypeScript, Tailwind
✓ **UI de calidad** - Radix UI + componentes personalizados bien diseñados
✓ **Autenticación segura** - Supabase Auth con RLS
✓ **Internacionalización** - Soporte para 3 idiomas (es, en, ca)
✓ **Responsive design** - Funciona correctamente en móvil
✓ **Base limpia para expandir** - Código bien organizado y tipado

## Debilidades

✗ **Sin sistema de pagos** - No se puede completar ventas en línea
✗ **Datos hardcodeados** - Catálogo en TypeScript, difícil de actualizar
✗ **Sin persistencia de carrito en BD** - Pérdida de datos entre sesiones
✗ **Sin panel de administración** - Necesario para gestionar negocio
✗ **Sin tests** - Bajo nivel de confianza en calidad
✗ **Sin CI/CD** - Riesgo en deployments

## Riesgos

🔴 **Venta online incompleta** - Actualmente es un catálogo con contacto manual
🔴 **Manipulación de precios** - Sin validación de servidor
🟠 **Escalabilidad limitada** - Supabase anon key puede ser target de abuso
🟡 **Mantenimiento difícil** - Datos hardcodeados requieren re-deploy
🟢 **Rendimiento** - Bundle puede crecer rápidamente

---

# 39. PRIORIDADES PARA PRODUCCIÓN

## 🔴 Crítico (Bloquea producción)

1. **Implementar sistema de pagos** - Stripe, PayPal, o similar
2. **Validación de precios en servidor** - Evitar manipulación
3. **Tabla de órdenes en BD** - Persistir pedidos
4. **Verificación de email** - Confirmar email válido
5. **Gestión de inventario** - Control de stock

## 🟠 Alto (Necesario antes de escalar)

1. **Panel de administración** - Gestionar productos, órdenes, usuarios
2. **Migrar catálogo a BD** - Cambiar de hardcoded a dinámico
3. **Persistencia de carrito en BD** - No perder datos de usuario
4. **Direcciones de usuario** - Tabla y CRUD en BD
5. **Rate limiting en APIs** - Proteger contra abuso

## 🟡 Medio (Mejora la experiencia)

1. **Tests automáticos** - Unit, integration, E2E
2. **CI/CD pipeline** - GitHub Actions o similar
3. **Optimización de imágenes** - Compresión y lazy loading
4. **Sitemap y Robots.txt** - Para SEO
5. **Sistema de reseñas** - Confianza del cliente

## 🟢 Bajo (Mejoras futuras)

1. **Analytics integrado** - Entender comportamiento de usuario
2. **Email marketing** - Newsletter, carrito abandonado
3. **Recomendaciones de productos** - Personalización
4. **Blog/contenido** - SEO y engagement
5. **Mobile app** - Expandir a otras plataformas

---

**Fin del informe.**