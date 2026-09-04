# Website Audit — Floristería Lucía

**Fecha de auditoría:** 2026-09-03  
**Stack:** TanStack Start 1.168.32 + React 19.2.0 + Supabase + GHL + Vercel  
**Estado general:** Producción activa con FASE 3A/3B en progreso  
**Objetivo:** Documento de referencia técnica para futuras modificaciones

---

## Resumen Ejecutivo

**Floristería Lucía** es una aplicación e-commerce full-stack construida con **TanStack Start** (SSR) que sincroniza productos con **GoHighLevel (GHL)** para gestión CRM integrada. El proyecto está en **fase de consolidación** con trabajo activo en sincronización de órdenes y webhooks.

### Características principales:
- ✅ E-commerce: catálogo dinámico, carrito, checkout, órdenes
- ✅ Autenticación: Supabase Auth + admin panel
- ✅ Integración GHL: sincronización bidireccional de productos y oportunidades
- ✅ Multi-idioma: ES, EN, CA con i18n completo
- ✅ Tema oscuro/claro
- ✅ Hero estático con rotación de textos (7 segundos)
- ✅ Responsive: móvil, tablet, desktop
- 🔄 En desarrollo: webhooks de órdenes (FASE 4)

### Deployado en:
- **Frontend:** Vercel (https://floristeria-lucia.vercel.app)
- **Backend/DB:** Supabase cloud
- **Build:** Nitro 3.0 con preset Vercel

---

## 1. ESTRUCTURA DEL PROYECTO

### Árbol de carpetas principal

```
floristeria-lucia/
├── src/
│   ├── routes/              # 52 archivos (pages + API endpoints)
│   ├── components/          # UI + business components
│   ├── lib/                 # Server utils, GHL client, lógica de órdenes
│   ├── hooks/               # Custom React hooks
│   ├── context/             # Theme, Language, Shop (state global)
│   ├── data/                # Static data (catalog, services, coverage)
│   ├── i18n/                # Translations (ES, EN, CA)
│   ├── integrations/
│   │   └── supabase/        # Supabase client + types
│   ├── assets/              # ~80 imágenes de productos y banners
│   ├── router.tsx           # Router configuration
│   ├── start.ts             # Client entry point
│   ├── server.ts            # Server entry point
│   └── styles.css           # Global styles (Tailwind)
├── public/                  # Logos, favicon
├── supabase/
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
├── dist/                    # Build output
├── .vercel/                 # Vercel config
├── vite.config.ts           # Vite + TanStack Start config
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
└── .env.example             # Environment variables template
```

### Stack Técnico

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | TanStack Start | 1.168.32 |
| React | React + React DOM | 19.2.0 |
| Router | TanStack Router | 1.170.18 |
| State | TanStack Query | 5.101.1 |
| Styling | Tailwind CSS + Radix UI | 4.2.1 |
| Database | Supabase PostgreSQL | Cloud |
| Auth | Supabase Auth | Built-in |
| Server | Nitro | 3.0.260603-beta |
| Deployment | Vercel | Node.js preset |
| Build Tool | Vite | 8.2.0 |
| Language | TypeScript | 5.8.3 |
| Linting | ESLint + Prettier | Latest |

### Dependencias importantes

**Frontend UI:**
- `@radix-ui/*` (50+ componentes)
- `lucide-react` (iconografía)
- `react-hook-form` + `zod` (formularios tipados)
- `recharts` (gráficos)
- `embla-carousel-react` (carruseles)
- `sonner` (notificaciones toast)

**Backend/Data:**
- `@supabase/supabase-js` (SDK Supabase)
- `@tanstack/react-query` (data fetching)
- `date-fns` (fechas)

**Utilities:**
- `clsx` + `tailwind-merge` (className utilities)
- `class-variance-authority` (CVA para componentes)
- `vite-tsconfig-paths` (path aliases)

---

## 2. HOME PAGE - ANÁLISIS DETALLADO

### Estructura general (src/routes/index.tsx)

```typescript
Home
├── AnimatedFlowerHero       // Hero con animación
├── ProductsServicesEditorial
├── CollectionsCarousel
├── SeasonalCollection
├── StoreHighlights
└── AboutEditorial
```

### 2.1 HERO ESTÁTICO (AnimatedFlowerHero.tsx)

**Imagen de fondo:**

| Propiedad | Valor | Nota |
|-----------|-------|------|
| Imagen | `hero_1.png` | Ubicación: `src/assets/hero_1.png` |
| Tipo | Imagen estática | Sin animación, zoom ni desplazamiento |
| Formato | PNG | Optimizado para web |
| Presentación | Única imagen | Cubre todo el viewport |

**Escenas textuales (3 en total, rotación cada 7 segundos):**

1. **baseDorada** (primera escena al cargar)
   - Eyebrow: "home.hero.slides.baseDorada.eyebrow"
   - Title: "home.hero.slides.baseDorada.title"
   - Subtitle: "home.hero.slides.baseDorada.subtitle"
   - CTA: Catálogo / Orden personalizada

2. **ramoMano** (segunda escena, después de 7s)
   - Eyebrow: "home.hero.slides.ramoMano.eyebrow"
   - Title: "home.hero.slides.ramoMano.title"
   - Subtitle: "home.hero.slides.ramoMano.subtitle"

3. **cesta** (tercera escena, después de 14s)
   - Eyebrow: "home.hero.slides.cesta.eyebrow"
   - Title: "home.hero.slides.cesta.title"
   - Subtitle: "home.hero.slides.cesta.subtitle"

**Ciclo de rotación de textos:**

- Intervalo: 7000ms (7 segundos)
- Transición: 600ms (fade + desplazamiento)
- Loop: Infinito (baseDorada → ramoMano → cesta → baseDorada...)

**Animación de transición de texto:**

```
Estado "stable" ──[300ms]──> "exiting" ──[300ms]──> "entering" ──> "stable"
```

- **Delay por elemento:**
  - Eyebrow: 0ms
  - Divider: 40ms
  - Title: 80ms
  - Subtitle: 160ms
  - Buttons: 240ms

- **Animación de entrada:**
  - Opacity: 0 → 100%
  - Translate Y: +2px → 0px
  - Timing: cubic-bezier(0.22, 1, 0.36, 1)

**Responsive:**

| Breakpoint | Height | Image width | Layout |
|------------|--------|-------------|--------|
| Móvil | 50svh | 100% | Imagen arriba, texto abajo |
| Tablet | 54svh | 100% | Imagen arriba, texto abajo |
| Desktop (lg) | 100svh | Full screen | Imagen derecha, texto izquierda (superpuesto) |
| Desktop (xl) | 100svh | Full screen | Padding izquierda aumentado |

**Carga de imagen:**

```javascript
// Imagen local: src/assets/hero_1.png
// Importada directamente en componente
// Carga: eager (no lazy, es crítica para LCP)
```

**Accesibilidad:**

- `role="img"` en elemento imagen
- `aria-label` dinámico basado en escena actual
- ALT text con traducción i18n
- `prefers-reduced-motion`: Cuando activo, muestra primera escena y detiene rotación
- Imagen estática respeta preferencias de accesibilidad

**Performance:**

- ✅ Eliminado: problema de 205 frames (80-100 MB datos)
- ✅ Reducido: consumo de memoria
- ✅ Mejorado: LCP (Largest Contentful Paint) → solo 1 imagen a cargar
- ✅ Mejorado: Bandwidth en móvil
- Carga: Una sola imagen PNG optimizada

**Fuentes de datos:**

| Elemento | Origen | Tipo |
|----------|--------|------|
| Imagen hero | `src/assets/hero_1.png` | Estático local |
| Textos | i18n (LanguageContext) | Keys en `home.hero.slides.*` |
| Botones | Static routes | Links a `/catalogo`, `/contacto` |

---

### 2.2 Otras secciones del HOME

#### ProductsServicesEditorial
- **Ubicación:** src/components/ProductsServicesEditorial.tsx
- **Propósito:** Showcase de productos y servicios
- **Componentes:** Usa ProductCard para mostrar items destacados
- **Datos:** Del context de Shop

#### CollectionsCarousel
- **Ubicación:** src/components/CollectionsCarousel.tsx
- **Propósito:** Carrusel de colecciones
- **Animación:** Embla carousel

#### SeasonalCollection
- **Ubicación:** src/components/SeasonalCollection.tsx
- **Propósito:** Campañas estacionales
- **Datos:** `src/data/seasonalCampaigns.ts`

#### StoreHighlights
- **Ubicación:** src/components/StoreHighlights.tsx
- **Propósito:** Destacados de la tienda

#### AboutEditorial
- **Ubicación:** src/components/AboutEditorial.tsx
- **Propósito:** Sección "Sobre nosotros"
- **Imagen:** `src/assets/sobre_nosotros_hero.jpeg`

---

## 3. DISEÑO Y SISTEMA VISUAL

### Paleta de colores

**Confirmado por código (Tailwind):**

```css
--primary: HSL (variable - típicamente #D4A574 oro)
--primary-foreground: white/dark
--secondary: (variable)
--accent: (variable)
--background: #fafaf9 (light) / #0f0f0f (dark)
--foreground: #1a1a1a (light) / #fafaf9 (dark)
--muted-foreground: #737373
--gold: Variable (usado en eyebrows, dividers)
--border: rgba(border-color, 0.4)
--card: rgba(255, 255, 255, 0.05)
```

**Tema:**
- Light mode (default)
- Dark mode (togglable via ThemeContext)
- Transición suave entre temas

### Tipografía

```css
font-display    /* Headings grandes */
font-serif      /* Títulos elegantes */
font-sans       /* Body y UI (Tailwind default sans) */
```

**Tamaños observados:**

- h1: `text-[2.5rem]` a `text-[4.25rem]` responsive
- h2: `text-3xl` a `text-4xl`
- Body: `text-base` a `text-lg`
- Small: `text-xs` a `text-sm`

### Espaciados

**Sistema de padding/margin:**
- Usa Tailwind spacing scale (0.25rem increments)
- Desktop: padding 12 (48px) en containers
- Móvil: padding 5 (20px)
- Tablet: padding 8 (32px)

**Gaps:**
- Entre secciones: `gap-8` a `gap-12`
- Dentro de cards: `gap-3` a `gap-6`

### Bordes y sombras

```css
border-border/40       /* Subtle borders */
border-border/70       /* Medium borders */
border-white/20        /* Light overlay borders */

shadow-petal           /* Custom shadow (hover) */
shadow-soft            /* Soft shadow */
hover:shadow-petal     /* On hover */
```

### Botones

**Variantes:**
- Primary: `bg-primary text-primary-foreground`
- Outline: `border border-input`
- Ghost: Sin fondo

**Ejemplos:**
```jsx
<Button asChild size="lg" className="h-12">
  <Link to="/catalogo">Catálogo <ArrowRight /></Link>
</Button>
```

### Sistema responsive

**Breakpoints (Tailwind):**
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**Uso en componentes:**

```jsx
// Hero
className="lg:min-h-[560px] lg:grid-cols-[45fr_55fr] lg:gap-12"

// Navbar
className={cn(overlay ? "absolute" : "sticky")}

// Text sizing
className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] xl:text-[4.25rem]"
```

### Componentes reutilizables

**UI Base (shadcn/ui):**
- Button, Input, Card, Dialog, Dropdown, Popover, etc. (50+)
- Estilos consistentes
- Accesibilidad incluida (Radix primitives)

**Business Components:**
- ProductCard: Mostrar productos con imagen, nombre, precio
- CartDrawer: Carrito deslizable
- Navbar: Navegación principal
- Footer: Pie de página

---

## 4. FUNCIONALIDADES IDENTIFICADAS

### 4.1 Autenticación y Usuarios

**Ubicación:** `src/hooks/useAuth.ts`, Supabase Auth

- Google OAuth (env var: `VITE_GOOGLE_CLIENT_ID`)
- Email/password (Supabase)
- Admin panel protegido (guard en `src/lib/admin/guard.server.ts`)

**Rutas autenticadas:**
```
_authenticated/
├── mi-cuenta/
├── admin/
│   ├── dashboard
│   ├── orders (lista, detalle)
│   ├── products (CRUD)
│   ├── reports
│   ├── settings
│   └── webhooks
```

### 4.2 Productos y Catálogo

**Arquitectura:**

1. **Datos estáticos** (`src/data/catalog.ts`)
   - Fallback products para SSR
   - Categorías: ramos, plantas, rosas-eternas, complementos, condolencias
   - Datos del client-side (legado)

2. **Datos dinámicos** (Supabase)
   - Tabla: `products`
   - Relaciones: `product_options`, `color_variants`, `product_images`
   - Hook: `useSupabaseProducts` (obtiene catálogo dinámico)

3. **Sincronización GHL**
   - Cuando se crea producto: sincroniza a GHL
   - Cuando GHL actualiza: webhook dispara sincronización
   - Webhook: `src/routes/api.webhooks.ghl-product.ts`

**Flujo de datos:**

```
GHL Product ──[API sync]──> Supabase
                               ↓
                          useSupabaseProducts
                               ↓
                          ProductCard (UI)
```

**Categorías:**

| ID | Nombre | Imagen | Descripción |
|----|----|--------|-------------|
| ramos | Ramos y arreglos florales | imagen_ramo_3.png | Montados a mano cada mañana |
| plantas | Plantas y Composiciones | imagen_plantas_3.png | Interior, orquídeas, cestas |
| rosas-eternas | Rosas eternas | imagen_rosas_eternas_3.png | Duran 7-10 años |
| complementos | Complementos | complementos_imagen_3.png | Bombones, vino, globos, etc. |
| condolencias | Condolencias | imagen_condolencias_3.png | Cruces, ramos, aros |

### 4.3 Carrito y Favoritos

**ShopContext (`src/context/ShopContext.tsx`):**

- Estado: carrito (cartLines), favoritos (Set)
- Métodos: `addLine()`, `removeLine()`, `updateQty()`, `clear()`
- Métodos favoritos: `toggleFavorite()`, `isFavorite()`
- Persistencia: localStorage (carrito, favoritos)

**CartDrawer:**
- Componente: `src/components/CartDrawer.tsx`
- Muestra items, totales, CTA checkout
- Responsive: drawer en móvil, panel en desktop

**ProductCard:**
- Botón ❤️ para favoritos
- Se rellena si está en favoritos

### 4.4 Checkout y Órdenes

**Flujo completo:**

```
1. Carrito ──[checkout route]──> Checkout page
2. Checkout ──[form validation]──> Order creation API
3. Order API ──[insert Supabase]──> orders table
4. Order API ──[async GHL sync]──> Create Contact + Opportunity
5. Response ──[confirmation page]──> confirmation.$orderId
```

**Datos de orden (CreateOrderRequest):**

```typescript
{
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  city: string
  postalCode: string
  country?: string
  deliveryDate?: string
  dedicatory?: string
  notes?: string
  cartLines: CartLine[]
}
```

**Orden creada:**

```typescript
{
  id: UUID
  order_number: "ORD-YYYYMMDD-XXXXX"
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  city: string
  postal_code: string
  status: "pending" | "confirmed" | "sent" | "delivered" | "cancelled"
  total: number
  created_at: timestamp
  ghl_contact_id?: string      // Ref a contacto GHL
  ghl_opportunity_id?: string  // Ref a oportunidad GHL
}
```

**GHL Sync (FASE 3A - completada):**

- Cuando se crea orden: llama `syncGHLContact` + `syncGHLOpportunity`
- Non-blocking: no espera respuesta (async)
- Campos mapeados a GHL custom fields (9 campos)
- Tipo: "customer" (no "lead")

**API Endpoints:**

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/orders` | POST | Crear orden |
| `/api/orders` | GET | Listar órdenes |
| `/api/orders/$id` | GET | Detalle de orden |
| `/api/confirmation` | POST | Obtener confirmación |
| `/api/webhooks/ghl-opportunity` | POST | Webhook de cambio de stage |

### 4.5 Personalizador de ramos

**Ubicación:** `src/routes/personalizar-ramo.tsx`

**Componente:** `src/components/CustomOrderBuilder.tsx`

**Funcionalidad:**
- Construcción personalizada de ramos
- Selección de flores
- Colores disponibles
- Precio dinámico
- CTA: Ir a checkout o contacto

### 4.6 Búsqueda y filtrado

**Catálogo (`/catalogo`):**

- **Filtros por categoría:** Tabs
- **Búsqueda por nombre:** Input search
- **Favoritos:** Toggle "mostrar solo favoritos"
- **Ordenamiento:** (Pendiente de verificar)

**Backend:**
- `useSupabaseProducts()` hook
- Query en Supabase: filtra por categoría, busca en nombre

### 4.7 Información estática

- **Sobre nosotros:** `/sobre-nosotros`
- **Servicios:** `/servicios`, `/servicios/$slug`
- **Envíos:** `/envios`
- **Contacto:** `/contacto`
- **Legal:** `/legal/$slug`
- **Rosas eternas:** `/rosas-eternas`

**Datos:** Archivos en `src/data/`

### 4.8 Integraciones externas

**WhatsApp:** Links de contacto directo (probablemente en Footer)

**Google Maps:** (Posiblemente en contacto/ubicación)

**Stripe:** (Variables de env, pendiente verificación de integración)

**GHL:** Sincronización bidireccional de productos y órdenes

---

## 5. DATOS Y ARQUITECTURA

### 5.1 Origen de datos

| Datos | Origen | Tipo | Caching |
|-------|--------|------|---------|
| Catálogo de productos | Supabase + GHL | Dinámico | React Query |
| Órdenes | Supabase | Dinámico | Query backend |
| Usuarios | Supabase Auth | Dinámico | Session storage |
| Textos (i18n) | `src/i18n/` | Estático | Memory |
| Configuración tienda | `src/data/` | Estático | Memory |
| Imágenes hero frames | Supabase Storage | Dinámico | Browser cache |
| Imágenes productos | Supabase Storage | Dinámico | Browser cache |
| Campañas estacionales | `src/data/seasonalCampaigns.ts` | Estático | Memory |

### 5.2 Supabase

**Tablas principales:**

```sql
-- Productos
products
├── id (UUID)
├── name (text)
├── category (text: ramos, plantas, etc.)
├── ghl_product_id (text)
├── description
├── [...]

-- Opciones de producto
product_options
├── id (UUID)
├── product_id (FK)
├── name (text)
├── price (numeric)
├── discount (numeric %)
├── stock (integer)
├── sku (text)

-- Variantes de color
color_variants
├── id (UUID)
├── product_id (FK)
├── color (text)
├── sort_order (integer)

-- Imágenes de producto
product_images
├── id (UUID)
├── product_id (FK)
├── url (text)
├── alt (text)
├── sort_order (integer)

-- Órdenes
orders
├── id (UUID)
├── order_number (text: ORD-YYYYMMDD-XXXXX)
├── customer_name (text)
├── customer_email (text)
├── customer_phone (text)
├── address (text)
├── city (text)
├── postal_code (text)
├── country (text)
├── delivery_date (date)
├── dedicatory (text)
├── notes (text)
├── status (VARCHAR: pending, confirmed, sent, delivered, cancelled)
├── total (numeric)
├── ghl_contact_id (text)
├── ghl_opportunity_id (text)
├── created_at (timestamp)
├── updated_at (timestamp)

-- Items de orden
order_items
├── id (UUID)
├── order_id (FK)
├── product_id (FK)
├── quantity (integer)
├── price (numeric)
├── [...]

-- Eventos webhook
webhook_events
├── id (UUID)
├── delivery_id (text: UNIQUE)
├── event_type (text: opportunity.stage_change)
├── opportunity_id (text)
├── order_id (FK)
├── payload (jsonb)
├── processed (boolean)
├── created_at (timestamp)
```

**Buckets Storage:**

- `hero-animation/` — Frames para animación hero (205 JPEGs)
- `product-images/` — Imágenes de productos

### 5.3 Flujo Frontend → Backend

```
Browser (React)
    ↓
TanStack Router (routing)
    ↓
API Route Handler (src/routes/api.*)
    ↓
Server-side logic (src/lib/*.server.ts)
    ↓
Supabase Client (admin SDK)
    ↓
Database / Storage
```

**Ejemplo: Crear orden**

```typescript
// 1. Frontend: checkout.tsx
POST /api/orders
{
  customerName, customerEmail, ..., cartLines
}

// 2. Backend: api.orders.ts
→ validates data
→ calls createOrder() from src/lib/orders.server.ts

// 3. Server logic: orders.server.ts
→ inserts order to Supabase
→ inserts order_items
→ calls syncGHLContact() and syncGHLOpportunity() (async)
→ returns { success, orderId, orderNumber }

// 4. Frontend: redirect to /confirmation/$orderId
```

### 5.4 Integraciones externas

#### GoHighLevel (GHL)

**Variables de env:**
```
GHL_PRIVATE_INTEGRATION_TOKEN (secreto, backend only)
```

**Funciones:**

| Función | Ubicación | Propósito |
|---------|-----------|-----------|
| `syncGHLContact()` | `lib/ghl/client.server.ts` | Crea/obtiene contacto en GHL |
| `syncGHLOpportunity()` | `lib/ghl/client.server.ts` | Crea oportunidad + mapea 9 campos |
| Webhook handler | `routes/api.webhooks.ghl-product.ts` | Sincroniza productos GHL → Supabase |
| Webhook handler | `routes/api.webhooks.ghl-opportunity.ts` | Sincroniza stage changes → order status |

**Tipos:**

```typescript
type GHLProduct = {
  id: string
  name: string
  price?: number
  sku?: string
  [key: string]: unknown
}

type GHLContact = {
  id: string
  locationId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  type: "lead" | "customer"
}

type GHLOpportunity = {
  id: string
  contactId: string
  pipelineId: string
  stageId: string
  [key: string]: unknown
}
```

**Mapeo: GHL Stage → Order Status**

```javascript
{
  "stage_1": "pending",
  "stage_2": "confirmed",
  "stage_3": "sent",
  "stage_4": "delivered",
  "stage_5": "cancelled"
}
```

#### Stripe (pendiente)

**Status:** Variables de env definidas pero integración no confirmada en código

**Variables:**
```
STRIPE_PUBLIC_KEY (si existe)
STRIPE_SECRET_KEY (si existe)
```

#### Google OAuth

**Variables:**
```
VITE_GOOGLE_CLIENT_ID (frontend)
```

**Ubicación:** Supabase Auth → Providers

---

## 6. SEO Y ACCESIBILIDAD

### 6.1 SEO

**Implementado:**

```typescript
// Cada ruta tiene head() con meta tags
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "floristeria lucia · Flores, plantas y emociones" },
      { name: "description", content: "..." },
      { property: "og:title", content: "..." },
      { property: "og:description", content: "..." }
    ]
  })
})
```

**Títulos encontrados:**

| Página | Title | Meta description |
|--------|-------|------------------|
| Home | "floristeria lucia · Flores, plantas y emociones" | "ramos, plantas, cestas, flores preservadas..." |
| Catálogo | "Catálogo de flores y plantas · floristeria lucia" | "Ramos de temporada, plantas, rosas eternas..." |
| Servicios | (Requiere verificación) | (Requiere verificación) |

**Open Graph:**
- ✅ og:title presente
- ✅ og:description presente
- ⚠️ og:image (pendiente verificación)

**Headings:**

```html
<!-- Home: h1 → Hero title -->
<h1 className="font-display text-[3.5rem]">
  {t("home.hero.slides.${scene}.title")}
</h1>

<!-- Secciones: h2 para encabezados -->
```

**Imágenes:**

- ✅ ALT text en images
- ✅ Lazy loading (`loading="lazy"`)
- ✅ Responsive sizes (`width`, `height`)

**Robots.txt:**

- Ubicación: `/public/robots.txt`
- Permite indexación

### 6.2 Accesibilidad (WCAG)

**Implementado:**

- ✅ `role="img"` en canvas (AnimatedFlowerHero)
- ✅ `aria-label` dinámicos
- ✅ `aria-label` en botones de acciones (favoritos, carrito)
- ✅ `prefers-reduced-motion` respetado (hero muestra frame estático)
- ✅ Componentes Radix UI (ARIA primitives incluidos)
- ✅ Contraste de colores (verificar en oscuro/claro)

**Pendiente verificación:**

- Acceso por teclado (Tab navigation)
- Focus indicators
- Links vs buttons (semántica)
- Form labels asociadas

---

## 7. RENDIMIENTO

### 7.1 Carga de recursos

**Críticos:**

1. **Animación hero**
   - 205 imágenes JPEG
   - ~80-100 MB total (estimado)
   - Lazy-loaded desde Supabase Storage
   - Signed URLs (cacheadas por navegador)

2. **Catálogo**
   - Productos: Carga dinámica desde Supabase
   - React Query: cacheado 5 min (default)
   - Images: lazy-loaded, aspect-square

3. **Bundle:**
   - React 19 + TanStack Stack (~500KB gzip)
   - Tailwind CSS compiled (~60KB gzip)
   - Radix UI primitives (~200KB gzip)
   - Total: ~800KB-1MB gzip (estimado)

### 7.2 Posibles problemas de rendimiento

#### 🔴 CRÍTICO: Animación hero con 205 frames

**Problema:**
- 205 imágenes = potencialmente 80-100 MB de descarga
- Aunque estén lazy-loaded, cuando se cargan todas usan mucha memoria
- Canvas rendering: 40ms entre frames = sincrónico

**Impacto:**
- First paint: OK (imagen de portada carga rápido)
- Total page load: Puede ser lento si usuario ve todo
- Mobile: Puede causar memory pressure
- Bandwidth: Costoso en conexiones lentas

**Recomendaciones:**
- Considerar reducir a 100-150 frames
- Usar WebP en lugar de JPEG (mejor compresión)
- Implementar preload selectivo (solo siguientes frames)
- Monitorizar con Lighthouse/WebVitals

#### ⚠️ PERFORMANCE: Catálogo con muchos productos

**Problema:**
- Si hay 100+ productos: productCard renderiza imagen en cada one
- Lazy loading ayuda pero puede causar layout shift

**Impacto:**
- CLS (Cumulative Layout Shift) si imágenes cargan sin fixed height
- Images con `aspect-square` deberían mitigar

#### ⚠️ PERFORMANCE: Estado global (ShopContext)

**Problema:**
- Carrito en localStorage: actualización sincrónica
- Favoritos en estado: toda lista re-renderiza

**Recomendación:**
- Implementar React Query para cart state
- Memoizar ProductCard

### 7.3 Optimizaciones presentes

✅ Lazy loading de imágenes  
✅ Code splitting por rutas (TanStack Router)  
✅ React Query caching  
✅ Async/await para GHL sync (no bloquea UI)  
✅ requestAnimationFrame para animaciones  
✅ Signed URLs con TTL  

---

## 8. RESPONSIVE

### 8.1 Breakpoints utilizados

```
sm: 640px   (teléfono horizontal)
md: 768px   (tablet vertical)
lg: 1024px  (tablet horizontal, small desktop)
xl: 1280px  (desktop)
2xl: 1536px (large desktop)
```

### 8.2 Análisis por sección

#### Hero (AnimatedFlowerHero)

**Móvil (0-640px):**
- Height: 50svh (mitad de viewport)
- Canvas arriba
- Texto abajo
- Padding: 20px (px-5)
- Gradient degradado de legibilidad en parte inferior

**Tablet (640-1024px):**
- Height: 54svh
- Aumenta padding: 32px (sm:px-8)
- Canvas sigue arriba

**Desktop (lg: 1024px+):**
- Height: 100svh (full screen)
- Layout: Canvas derecha, texto izquierda
- Canvas: 100% altura, object-cover
- Texto: superpuesto con degradado

#### Navbar

**Móvil:**
- Menu hamburguesa (Sheet)
- Busca visible solo en banner
- Cart drawer

**Desktop:**
- Menu horizontal
- Todos los links visibles
- Dropdown para idioma

#### ProductCard

**Responsive:**
- Tamaño: Adapta a grid del container
- Grid típicamente: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Imagen: aspect-square, scale on hover

#### Catálogo

**Grid:**
```
sm: grid-cols-2   (2 productos por fila)
md: grid-cols-2   (2 productos)
lg: grid-cols-3   (3 productos)
xl: grid-cols-4   (4 productos)
```

**Padding:**
```
px-5 (móvil: 20px)
sm:px-8 (tablet: 32px)
lg:px-12 (desktop: 48px)
```

### 8.3 Posibles problemas responsive

⚠️ **Verificar en tablet (768-1024px):** Algunos componentes pueden no estar optimizados para este rango (usar `md` breakpoints)

⚠️ **Overflow horizontal:** Canvas en hero puede tener overflow si no está correctamente contenido

✅ **SafeArea:** SVG viewport y mobile meta tags correctamente configurados

---

## 9. RIESGOS Y DEPENDENCIAS

### 9.1 Cambios sin impacto directo (safe)

| Cambio | Razón |
|--------|-------|
| Modificar textos en i18n | Cambio aislado, no rompe lógica |
| Añadir nuevos idiomas | Sistema i18n está preparado |
| Cambiar colores Tailwind | Solo CSS, no lógica |
| Modificar contenido estático (aboutEditorial, etc.) | Contenido independiente |
| Añadir nuevas rutas de página | Router permite dinámicamente |

### 9.2 Cambios de ALTO RIESGO (revisar dependencias)

#### 1. Modificar AnimatedFlowerHero

**Riesgo:** Rompe toda la experiencia hero

**Dependencias a revisar:**
- ✅ i18n keys: `home.hero.slides.*`
- ✅ Supabase bucket: `hero-animation/` (205 imágenes)
- ✅ useT() hook
- ✅ CSS clases Tailwind

**Impacto potencial:**
- Si cambias número de frames: recargar todos los archivos
- Si cambias paradas: ajustar i18n keys
- Si cambias delays: puede afectar sincronización

#### 2. Cambiar estructura de Supabase

**Riesgo:** Rompe TODA la aplicación

**Tablas críticas:**
- `products` → Catálogo
- `orders` → Checkout/confirmación
- `product_options`, `color_variants` → Detalles de producto

**Antes de modificar DB:**
1. Verificar todas las queries en `src/lib/*.server.ts`
2. Verificar todos los hooks `useSupabase*`
3. Verificar RLS policies
4. Verificar migrations en `supabase/migrations/`

#### 3. Cambiar ShopContext

**Riesgo:** Rompe carrito y favoritos

**Dependencias:**
- CartDrawer
- ProductCard (favoritos)
- checkout.tsx
- todas las páginas que usan `useShop()`

#### 4. Modificar sistema GHL

**Riesgo:** Rompe sincronización de productos y órdenes

**Dependencias:**
- `src/lib/ghl/client.server.ts`
- Webhooks: `api.webhooks.ghl-*.ts`
- Tipos: `ghl/types.ts`

**Antes de modificar:**
1. Verificar todas las funciones de sync
2. Probar webhook signature validation
3. Verificar idempotencia (delivery_id deduplicación)

#### 5. Cambiar sistema de autenticación

**Riesgo:** Pierde acceso admin

**Dependencias:**
- `useAuth()` hook
- Guard: `admin/guard.server.ts`
- Rutas autenticadas: `_authenticated/**`

### 9.3 Componentes reutilizables (NO duplicar)

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| ProductCard | `src/components/ProductCard.tsx` | Catálogo, home, servicios |
| Button | `src/components/ui/button.tsx` | Todo el sitio |
| Card | `src/components/ui/card.tsx` | Contenedores |
| Input | `src/components/ui/input.tsx` | Formularios |
| Dialog | `src/components/ui/dialog.tsx` | Modales |
| Dropdown | `src/components/ui/dropdown-menu.tsx` | Menus |

**Regla:** Modificar componentes base puede tener impacto en toda la aplicación

---

## 10. MAPA DE DEPENDENCIAS

### Home Page

```
Home (routes/index.tsx)
├── AnimatedFlowerHero
│   ├── Supabase bucket: hero-animation/
│   ├── i18n: home.hero.slides.*
│   ├── LanguageContext
│   └── Button component
├── ProductsServicesEditorial
│   ├── ProductCard (x múltiples)
│   ├── ShopContext
│   └── useSupabaseProducts hook
├── CollectionsCarousel
│   ├── Embla carousel
│   └── Product data
├── SeasonalCollection
│   ├── src/data/seasonalCampaigns.ts
│   └── Images en assets/
├── StoreHighlights
│   └── Datos estáticos
└── AboutEditorial
    ├── About image
    └── I18n
```

### Catálogo Page

```
Catálogo (routes/catalogo.tsx)
├── useSupabaseProducts()
│   ├── Supabase: products table
│   ├── product_options
│   ├── color_variants
│   └── product_images
├── ProductCard (grid)
│   ├── Image lazy loading
│   ├── Price formatting
│   ├── Favoritos (ShopContext)
│   └── Add to cart (ShopContext)
├── Categorías (data/catalog.ts)
├── Búsqueda (input local)
└── Filtros (tabs)
```

### Checkout Flow

```
Carrito (routes/carrito.tsx)
├── CartDrawer
├── ShopContext
└── Link to checkout

Checkout (routes/checkout.tsx)
├── Form (react-hook-form + zod)
├── Customer data
├── ShopContext (cartLines)
└── POST /api/orders

API: /api/orders
├── validateCartLines()
├── Insert orders table
├── Insert order_items
├── syncGHLContact() (async)
├── syncGHLOpportunity() (async)
└── Return orderId

Confirmation (routes/confirmation.$orderId.tsx)
├── Fetch order data
├── Display order details
└── GHL status badge
```

### Admin Panel

```
Admin Dashboard (routes/_authenticated/admin/index.tsx)
├── Protected by guard.server.ts
├── Orders view
│   ├── OrdersTable
│   ├── OrderDetail modal
│   └── Webhook logs
├── Products view
│   ├── ProductsTable
│   ├── ProductForm (create/edit)
│   │   ├── product_options
│   │   ├── color_variants
│   │   └── product_images
│   └── Sync with GHL
├── Reports
│   ├── SalesChart
│   ├── StatusDistributionChart
│   └── CSV export
└── Webhooks
    └── WebhookEventsTable
```

---

## 11. REGLAS PARA FUTURAS MODIFICACIONES

### 11.1 Antes de modificar CUALQUIER SECCIÓN

**Checklist obligatorio:**

- [ ] **Identificar dependencias:** ¿Qué otros componentes/páginas la usan?
- [ ] **Verificar cambios de DB:** ¿Se modifica Supabase?
- [ ] **Verificar API:** ¿Se modifica algún endpoint?
- [ ] **Revisar tipos:** ¿Se modifican tipos TypeScript?
- [ ] **I18n impact:** ¿Se añaden/modifican keys de traducción?
- [ ] **Assets:** ¿Se modifican o añaden imágenes?

### 11.2 Modificar DISEÑO sin romper LÓGICA

**Regla de oro:** Modifica SOLO Tailwind classes, NO cambies estructura HTML

**Ejemplo correcto:**

```tsx
// ✅ BIEN: Cambiar estilos
className="text-blue-500 hover:text-blue-600"  // ← solo Tailwind

// ❌ MAL: Cambiar estructura
{/* Cambió <div> por <section> sin motivo */}
```

**Tipografía:**

- Cambiar tamaño: `text-lg` → `text-2xl` ✅
- Cambiar fuente: `font-sans` → `font-serif` ✅
- Cambiar peso: `font-normal` → `font-bold` ✅

**Colores:**

- Modificar primario: Cambiar `--primary` en Tailwind config ✅
- Cambiar fondo: `bg-background` → `bg-secondary` ✅
- Cambiar texto: `text-foreground` → `text-muted-foreground` ✅

**Espaciados:**

- Padding: `p-4` → `p-6` ✅
- Margin: `mb-4` → `mb-8` ✅
- Gap: `gap-4` → `gap-6` ✅

### 11.3 Modificar IMÁGENES sin romper referencias

**Regla:** Reemplaza archivos en lugar de renombrar

```bash
# ✅ CORRECTO
src/assets/hero-ramo-editorial.png  # Reemplaza contenido, mantén nombre

# ❌ INCORRECTO
src/assets/hero-ramo-editorial-v2.png  # Nuevo nombre
# → Tienes que actualizar import en AnimatedFlowerHero.tsx
```

**Imágenes de productos:**

- Supabase Storage: `product-images/` bucket
- Añade imágenes en admin panel (ProductForm)
- URLs se guardan en `product_images` table
- No hardcodear URLs en componentes

**Archivos estáticos (public/):**

```
public/assets/logo-header.svg    ← Cambiar mediante admin/theme
public/assets/logo-footer.svg    ← Cambiar mediante admin/theme
public/favicon.svg               ← Cambiar solo si es necesario
```

### 11.4 Modificar DATOS sin romper TIPOS

**Catálogo estático (`src/data/catalog.ts`):**

```typescript
// ✅ Seguro: Añadir producto
export const products: Product[] = [
  // ... existentes
  { id: "nuevo-producto", name: "Nuevo", ... }  // ✅ OK
]

// ⚠️ Riesgo: Cambiar estructura Product
export type Product = {
  // ... existentes
  newField: string  // → Revisar si usa todos lados
}
```

**Variables de entorno:**

```bash
# Cada variable nueva necesita:
# 1. Declarar en .env.example
# 2. Cargar en src/integrations/supabase/client.ts o .server
# 3. Usarla en el código
# 4. Actualizar en Vercel secrets
# 5. Actualizar en .env.local local
```

### 11.5 Modificar FUNCIONALIDADES

**Antes de cambiar cualquier feature:**

1. **Crear rama feature:** `git checkout -b feature/description`
2. **Escribir pruebas:** Si existe test suite
3. **Actualizar tipos:** Si la lógica cambia
4. **Verificar SSR:** Si usa `server.ts` logic
5. **Revisar webhooks:** Si conecta con GHL
6. **Actualizar docs:** Si cambia comportamiento

**Ejemplo: Cambiar modelo de órdenes**

```
1. Analizar: ¿Qué implicaciones tiene en:
   - Supabase schema? (migration)
   - API endpoints? (api.orders.ts)
   - Frontend forms? (checkout.tsx)
   - GHL sync? (orders.server.ts)
   - Admin panel? (admin/orders.tsx)
   - Confirmación? (confirmation.$orderId.tsx)

2. Hacer cambios:
   - Crear migration en supabase/migrations/
   - Actualizar tipos
   - Actualizar API
   - Actualizar frontend
   - Actualizar admin

3. Verificar:
   - Build: npm run build
   - Lint: npm run lint
   - Tests: npm run test (si existe)
   - Manual testing en dev

4. Desplegar:
   - Commit + push
   - Verificar CI en Vercel
   - Test en staging
   - Deploy a producción
```

### 11.6 Modificar COMPONENTES REUTILIZABLES

**Si modificas un componente `ui/*` o `components/ProductCard`:**

```
1. Revisar TODOS los usos:
   grep -r "ProductCard" src/
   grep -r "Button" src/

2. Verificar si cambio es compatible:
   - Props añadidas: Verificar que sean opcionales
   - Props removidas: NUNCA, duplica de forma compatible
   - CSS changes: Revisar en todas las páginas

3. Probar en múltiples contextos:
   - Home
   - Catálogo
   - Admin panel
   - Móvil, tablet, desktop

4. Considerar backward compatibility:
   - Si cambias Button, ¿sigue funcionando con props old?
   - Si cambias ProductCard, ¿es compatible con todas las props?
```

### 11.7 Verificar modificación ANTES de dar por terminada

**Checklist de validación:**

- [ ] **Build:** `npm run build` → ✅ 0 errors
- [ ] **Lint:** `npm run lint` → ✅ 0 errors
- [ ] **Dev server:** `npm run dev` → ✅ Inicia sin errores
- [ ] **Home page:** Se carga correctamente
- [ ] **Catálogo:** Se carga correctamente
- [ ] **Responsivo:** Móvil (375px), tablet (768px), desktop (1200px)
- [ ] **Tema:** Oscuro y claro funcionan
- [ ] **Idiomas:** ES, EN, CA cargan traducciones
- [ ] **Si modificaste:
  - Productos:** Verifica catálogo carga
  - Órdenes:** Crea orden de prueba
  - Auth:** Intenta login
  - Admin:** Verifica panel accessible
  - GHL:** Verifica sync en debug.ghl-test
  - Imágenes:** Verifica lazy loading

---

## 12. INVENTARIO DE PÁGINAS

| Ruta | Archivo | Autenticación | Propósito |
|------|---------|----------------|-----------|
| `/` | `routes/index.tsx` | No | Home |
| `/catalogo` | `routes/catalogo.tsx` | No | Listado productos |
| `/producto/:id` | `routes/producto.$id.tsx` | No | Detalle producto |
| `/carrito` | `routes/carrito.tsx` | No | Vista carrito |
| `/checkout` | `routes/checkout.tsx` | No | Formulario checkout |
| `/confirmation/:orderId` | `routes/confirmation.$orderId.tsx` | No | Confirmación orden |
| `/personalizar-ramo` | `routes/personalizar-ramo.tsx` | No | Personalizador |
| `/rosas-eternas` | `routes/rosas-eternas.tsx` | No | Rosas eternas |
| `/favoritos` | `routes/favoritos.tsx` | No | Lista favoritos |
| `/servicios` | `routes/servicios.tsx` | No | Listado servicios |
| `/servicios/:slug` | `routes/servicios.$slug.tsx` | No | Detalle servicio |
| `/sobre-nosotros` | `routes/sobre-nosotros.tsx` | No | Sobre nosotros |
| `/contacto` | `routes/contacto.tsx` | No | Formulario contacto |
| `/envios` | `routes/envios.tsx` | No | Info envíos |
| `/legal/:slug` | `routes/legal.$slug.tsx` | No | Páginas legales |
| `/auth` | `routes/auth.tsx` | No | Login/Register |
| `/mi-cuenta` | `routes/_authenticated/mi-cuenta.tsx` | ✅ Sí | Mi cuenta |
| `/admin` | `routes/_authenticated/admin/index.tsx` | ✅ Sí | Dashboard admin |
| `/admin/dashboard` | `routes/_authenticated/admin/dashboard.tsx` | ✅ Sí | Analytics |
| `/admin/orders` | `routes/_authenticated/admin/orders.tsx` | ✅ Sí | Gestión órdenes |
| `/admin/orders/:id` | `routes/_authenticated/admin/orders.$id.tsx` | ✅ Sí | Detalle orden |
| `/admin/products` | `routes/_authenticated/admin/products.tsx` | ✅ Sí | Gestión productos |
| `/admin/products/:id` | `routes/_authenticated/admin/products.$id.tsx` | ✅ Sí | Editar producto |
| `/admin/products/new` | `routes/_authenticated/admin/products.new.tsx` | ✅ Sí | Crear producto |
| `/admin/reports` | `routes/_authenticated/admin/reports.tsx` | ✅ Sí | Reportes |
| `/admin/settings` | `routes/_authenticated/admin/settings.tsx` | ✅ Sí | Configuración |
| `/admin/webhooks` | `routes/_authenticated/admin/webhooks.tsx` | ✅ Sí | Eventos webhook |
| `/debug/ghl-test` | `routes/debug.ghl-test.tsx` | No | Debug GHL |

---

## 13. INVENTARIO DE COMPONENTES

### Componentes de negocio

| Componente | Ubicación | Props | Propósito |
|-----------|-----------|-------|-----------|
| AnimatedFlowerHero | `components/AnimatedFlowerHero.tsx` | None | Hero con animación 205 frames |
| HeroSlider | `components/HeroSlider.tsx` | None | Hero alternativo (estático) |
| ProductCard | `components/ProductCard.tsx` | `product`, `hideTiers?` | Tarjeta de producto |
| CartDrawer | `components/CartDrawer.tsx` | None | Drawer carrito |
| Navbar | `components/Navbar.tsx` | None | Barra navegación |
| Footer | `components/Footer.tsx` | None | Pie página |
| CollectionsCarousel | `components/CollectionsCarousel.tsx` | None | Carrusel colecciones |
| StoreHighlights | `components/StoreHighlights.tsx` | None | Destacados tienda |
| SeasonalCollection | `components/SeasonalCollection.tsx` | None | Colección estacional |
| ProductsServicesEditorial | `components/ProductsServicesEditorial.tsx` | None | Editorial productos |
| CustomOrderBuilder | `components/CustomOrderBuilder.tsx` | None | Personalizador |
| AboutEditorial | `components/AboutEditorial.tsx` | None | Sección about |
| CookieNotice | `components/CookieNotice.tsx` | None | Aviso cookies |
| CookiePreferences | `components/CookiePreferences.tsx` | None | Preferencias cookies |
| CoverageSearch | `components/CoverageSearch.tsx` | None | Búsqueda cobertura |

### Componentes admin

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| AdminHeader | `components/admin/AdminHeader.tsx` | Header admin |
| AdminSidebar | `components/admin/AdminSidebar.tsx` | Sidebar menu |
| OrdersTable | `components/admin/OrdersTable.tsx` | Tabla órdenes |
| OrderDetail | `components/admin/OrderDetail.tsx` | Detalle orden |
| ProductsTable | `components/admin/ProductsTable.tsx` | Tabla productos |
| ProductForm | `components/admin/ProductForm.tsx` | Editar producto |
| ProductFormNew | `components/admin/ProductFormNew.tsx` | Crear producto |
| ProductOptionsSection | `components/admin/ProductOptionsSection.tsx` | Gestión opciones |
| ProductImagesSection | `components/admin/ProductImagesSection.tsx` | Gestión imágenes |
| ColorVariantsSection | `components/admin/ColorVariantsSection.tsx` | Gestión colores |
| SalesChart | `components/admin/SalesChart.tsx` | Gráfico ventas |
| StatusDistributionChart | `components/admin/StatusDistributionChart.tsx` | Distribución estado |
| SalesEvolutionChart | `components/admin/SalesEvolutionChart.tsx` | Evolución ventas |
| TopProductsTable | `components/admin/TopProductsTable.tsx` | Productos top |
| StatusBadge | `components/admin/StatusBadge.tsx` | Badge estado |
| GHLStatusBadge | `components/admin/GHLStatusBadge.tsx` | Badge GHL |
| WebhookPayloadDialog | `components/admin/WebhookPayloadDialog.tsx` | Payload viewer |
| WebhookEventsTable | `components/admin/WebhookEventsTable.tsx` | Tabla eventos |
| AuditLogTable | `components/admin/AuditLogTable.tsx` | Audit log |
| KpiCard | `components/admin/KpiCard.tsx` | Card KPI |
| LoadingState | `components/admin/LoadingState.tsx` | Loading state |
| EmptyState | `components/admin/EmptyState.tsx` | Empty state |
| ErrorState | `components/admin/ErrorState.tsx` | Error state |
| Pagination | `components/admin/Pagination.tsx` | Paginación |

### Componentes UI (shadcn/ui)

50+ componentes base reutilizables: accordion, alert, avatar, badge, button, card, checkbox, dialog, dropdown, form, input, label, menubar, pagination, popover, progress, radio-group, select, separator, skeleton, slider, switch, table, tabs, textarea, toggle, tooltip, etc.

---

## 14. INVENTARIO DE ASSETS

### Estructura

```
public/
├── favicon.svg
├── robots.txt
└── assets/
    ├── logo-header.svg
    ├── logo-footer.svg
    ├── hero-ramo-mano.jpeg
    ├── hero-cesta-flores.jpeg
    └── (+ logos de inicio)

src/assets/
├── Imágenes de categorías (6)
│   ├── imagen_ramo_3.png
│   ├── girasoles.jpg
│   ├── imagen_plantas_3.png
│   ├── imagen_rosas_eternas_3.png
│   ├── complementos_imagen_3.png
│   └── imagen_condolencias_3.png
├── Imágenes de productos (14)
│   ├── producto_1.png - producto_14.png
├── Imágenes de servicios (10+)
│   ├── bodas.jpg
│   ├── imagen_bodas.jpg
│   ├── imagen_eventos.webp
│   ├── decoracion_puerta.jpg
│   ├── etc.
├── Imágenes de temporada (5)
│   ├── campana-navidad.jpg
│   ├── campana-san-valentin.jpg
│   ├── campana-dia-madre.jpg
│   ├── campana-temporada.jpg
│   └── flores_temporada.png
├── Imágenes de complementos
│   ├── jarron_ramo.png
│   ├── automovil_boda.png
│   ├── ramo_boda.png
│   ├── pulsera_flores.png
│   ├── corona_flores.png
├── Imágenes de página (8)
│   ├── sobre_nosotros_hero.jpeg
│   ├── sobre_nosotros_1.jpeg
│   ├── sobre_nosotros_2.jpeg
│   ├── tienda-ramo-editorial.jpg
│   ├── tienda-ramo-editorial.png
│   ├── envios_destino.jpg
│   ├── contacto_img.jpg
│   └── hero_1.png
├── Imágenes de colecciones
│   ├── banner-base-dorada.jpg
│   ├── banner-cesta.jpg
│   ├── banner-ramo-mano.png
│   └── otros banners
├── Imágenes de rosas (3)
│   ├── hero-peonias.jpeg
│   ├── hero-bouquet.jpg
│   └── hero-base-dorada.jpeg
└── Logos (4)
    ├── logo-floristeria-lucia.png
    ├── logo-floristeria-lucia.svg
    ├── logo-lucia-sin-fondo.svg
    └── hero-ramo-editorial.png

Supabase Storage:
├── hero-animation/
│   ├── ezgif-frame-001.jpg
│   ├── ezgif-frame-002.jpg
│   ├── ... (205 total)
│   └── ezgif-frame-205.jpg
└── product-images/
    ├── (imágenes dinámicas de productos)
```

**Total:** ~80+ imágenes locales + 205 frames en Supabase

---

## 15. INTEGRACIONES EXTERNAS

### GoHighLevel (GHL)

**API:** `https://rest.gohighlevel.com/v3`

**Token:** `GHL_PRIVATE_INTEGRATION_TOKEN` (secreto, server-only)

**Funcionalidades:**

1. **Sincronización de productos** (FASE 1-2, completada)
   - Endpoint: `POST /v3/products` (crear), `PUT /v3/products/{id}` (editar)
   - Cada producto Supabase se sincroniza a GHL
   - Webhook: `api.webhooks.ghl-product.ts` (product update events)

2. **Sincronización de órdenes** (FASE 3A, completada)
   - Crear Contact: `POST /v3/contacts`
   - Crear Opportunity: `POST /v3/opportunities`
   - Mapear 9 custom fields con datos de orden

3. **Webhook de cambio de stage** (FASE 4.3-4.5, en desarrollo)
   - Endpoint: `api.webhooks.ghl-opportunity.ts`
   - Escucha: `opportunity.stage_change`
   - Actualiza: `orders.status` en Supabase

**Status:** ✅ FASE 3A completa, 🔄 FASE 4.3-4.5 en desarrollo

---

### Supabase

**Tipo:** BaaS (Backend-as-a-Service)

**Servicios:**
- PostgreSQL database
- Authentication (email/OAuth)
- Storage (buckets for images)
- Realtime (optional)
- Edge functions (optional)

**Endpoints:**
- Base URL: `https://leksmflinhohnekbgmgj.supabase.co`
- REST API: Auto-generated
- WebSocket: `wss://leksmflinhohnekbgmgj.supabase.co`

---

### Google OAuth

**Proveedor:** Google

**Variable:** `VITE_GOOGLE_CLIENT_ID`

**Ubicación:** Supabase Auth providers

**Uso:** Login alternativo

---

### Vercel

**Proveedor:** Hosting + CI/CD

**Preset:** Node.js (Nitro)

**Configuración:** `vercel.json`

**Deploy:** Automático en push a `main`

---

### Stripe (pendiente verificación)

**Status:** Variables de env definidas, integración no confirmada en código

---

## 16. PROBLEMAS DETECTADOS

### 🟢 RESUELTO (2026-09-04)

**Animación hero con 205 frames** ✅ RESUELTO
- **Cambio:** Reemplazado sistema de 205 frames por imagen estática `hero_1.png`
- **Beneficio:** Eliminado consumo de datos (80-100 MB), mejorado LCP
- **Ubicación:** `src/components/AnimatedFlowerHero.tsx`
- **Implementación:** Rotación de textos cada 7 segundos en lugar de animación de frames

### ⚠️ IMPORTANTE

**Verificar CORS en Supabase Storage signed URLs**
- **Problema:** Si hay restricción de CORS, imágenes pueden no cargar
- **Ubicación:** Supabase dashboard → Settings → CORS
- **Solución:** Configurar CORS para dominio Vercel

**RLS en webhook_events table**
- **Problema:** Si RLS no está correctamente configurado, webhooks pueden fallar
- **Ubicación:** Supabase → SQL editor → RLS on webhook_events
- **Solución:** Verificar que service_role pueda insertar/actualizar

**Falta de error logging en GHL sync**
- **Problema:** Si sync falla, no se sabe por qué
- **Ubicación:** `src/lib/ghl/client.server.ts` y `src/lib/orders.server.ts`
- **Solución:** Añadir try-catch y logging

### ⚠️ A REVISAR

- [ ] Verificar accesibilidad en dark mode (contraste)
- [ ] Verificar keyboard navigation (tab, enter, escape)
- [ ] Verificar focus indicators en botones
- [ ] Verificar lazy loading de imágenes en catálogo grande
- [ ] Verificar performance de Canvas rendering en Chrome DevTools
- [ ] Verificar que todos los CORS headers están bien en webhooks
- [ ] Verificar timeout de signed URLs (7 días puede ser corto)

---

## 17. RECOMENDACIONES

### Performance

1. **✅ Hero optimizado** (2026-09-04)
   - Reemplazado de 205 frames por imagen estática
   - Eliminado consumo de datos (80-100 MB)
   - Mejorado LCP (Largest Contentful Paint)

2. **Implementar lazy loading en catálogo**
   - Intersection Observer para ProductCard
   - Cargar solo productos visibles

3. **Monitorizar Web Vitals**
   - Implementar Sentry o similar
   - Monitorizar LCP, FID, CLS, TTFB

### Seguridad

1. **Verificar HMAC-SHA256 en webhooks**
   - Validar firma antes de procesar
   - Rechazar webhooks no firmadas

2. **Rate limiting en APIs**
   - Implementar en Vercel o Supabase
   - Prevenir abuso

3. **No exponer tokens en frontend**
   - Verificar que GHL_TOKEN está solo en server.ts
   - Verificar env variables correctamente prefijadas

### Escalabilidad

1. **Considerar caché en React Query**
   - Aumentar TTL para catálogo
   - Implementar stale-while-revalidate

2. **Considerar CDN para imágenes**
   - Supabase Storage puede ser lento
   - Alternativa: CloudFlare, Cloudinary

3. **Considerar indexación en Supabase**
   - Crear índices en `products.category`
   - Crear índices en `orders.status`

### Funcionalidades

1. **Completar FASE 4 (webhooks de órdenes)**
   - Implementar endpoint 4.3
   - Registrar webhook en GHL (4.4)
   - E2E testing (4.5)

2. **Implementar Sistema de carrito persistente**
   - Guardar en Supabase
   - Sincronizar entre dispositivos

3. **Implementar Sistema de notificaciones**
   - Email en cambios de estado
   - SMS vía Stripe/Twilio
   - WhatsApp vía GHL

---

## 18. HISTORIAL DE MODIFICACIONES

Este historial se actualiza cada vez que se hace una modificación significativa al proyecto.

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-09-04 | v1.1 | **Hero refactor:** Eliminado sistema de 205 frames, implementado imagen estática `hero_1.png` con rotación de textos cada 7 segundos. Mejora: eliminado 80-100 MB de datos, optimizado LCP. | Claude |
| 2026-09-03 | v1.0 | Documento de referencia inicial | Auditoría 2026-09-03 |

---

## APÉNDICE: Cómo usar este documento

### Para modificar una sección específica:

1. **Localiza la sección** en el índice
2. **Revisa "Riesgos" (§9)** para ver dependencias
3. **Revisa "Mapa de Dependencias" (§10)** para entender relaciones
4. **Revisa "Reglas" (§11)** para aplicar cambios de forma segura
5. **Haz el cambio**
6. **Verifica** usando checklist §11.7
7. **Documenta** el cambio en §18 (Historial)

### Para entender la arquitectura:

1. Lee §1 (Estructura)
2. Lee §2 (Home)
3. Lee §5 (Datos y Arquitectura)
4. Lee §10 (Mapa de Dependencias)

### Para encontrar un componente:

1. Usa §13 (Inventario de Componentes)
2. Localiza ubicación
3. Revisa §10 para ver dónde se usa

### Para entender flujo de datos:

1. Lee §5.3 (Flujo Frontend → Backend)
2. Lee §10 (Mapa de Dependencias)
3. Busca endpoint en §14 (Integraciones)

---

**Fin del documento**  
Creado: 2026-09-03  
Última actualización: 2026-09-04  
Estado: ✅ Completo (v1.1)
