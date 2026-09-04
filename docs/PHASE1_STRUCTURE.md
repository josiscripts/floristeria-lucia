# FASE 1: Estructura Final de product_metadata

---

## 📋 TABLA: `public.product_metadata`

### Columnas

```
┌─────────────────────────────────────────────────────────────────┐
│ COLUMN NAME          │ TYPE                    │ CONSTRAINTS     │
├──────────────────────┼─────────────────────────┼─────────────────┤
│ id                   │ UUID                    │ PRIMARY KEY     │
│ location_id          │ TEXT                    │ NOT NULL,DEF... │
│ ghl_product_id       │ TEXT                    │ NOT NULL        │
│ legacy_catalog_id    │ TEXT                    │ NULLABLE        │
│ price_min            │ DECIMAL(10,2)           │ NULLABLE        │
│ price_max            │ DECIMAL(10,2)           │ NULLABLE        │
│ available_colors     │ TEXT[]                  │ NULLABLE        │
│ badge_label          │ TEXT                    │ NULLABLE        │
│ rose_step            │ INTEGER                 │ NULLABLE        │
│ requires_quote       │ BOOLEAN                 │ DEF false       │
│ status               │ TEXT                    │ DEF 'active'    │
│ auto_created         │ BOOLEAN                 │ DEF false       │
│ created_at           │ TIMESTAMP WITH TZ       │ DEF now()       │
│ updated_at           │ TIMESTAMP WITH TZ       │ DEF now()       │
│ deleted_at           │ TIMESTAMP WITH TZ       │ NULLABLE        │
└──────────────────────┴─────────────────────────┴─────────────────┘
```

### Columnas Clave Explicadas

| Columna             | Propósito              | Editable | Quién             |
| ------------------- | ---------------------- | -------- | ----------------- |
| `ghl_product_id`    | Link a producto de GHL | ❌ No    | Webhook/Polling   |
| `legacy_catalog_id` | Link a catalog.ts      | ❌ No    | Migración inicial |
| `price_max`         | Rango de precios       | ✅ Sí    | /admin/products   |
| `available_colors`  | Colores disponibles    | ✅ Sí    | /admin/products   |
| `badge_label`       | Etiqueta visual        | ✅ Sí    | /admin/products   |
| `rose_step`         | Multiplicador rosas    | ❌ No    | Migración inicial |
| `requires_quote`    | Requiere cotización    | ❌ No    | Futuro            |
| `status`            | Soft delete            | ❌ No    | Webhook/Polling   |

---

## 🔐 CONSTRAINTS

### UNIQUE Constraints

```sql
CONSTRAINT unique_ghl_product_id
  UNIQUE(location_id, ghl_product_id)

  └─ Garantiza un registro por cada producto GHL
```

```sql
CONSTRAINT unique_legacy_catalog_id
  UNIQUE(legacy_catalog_id)

  └─ Mapeo único a ID original de catalog.ts
```

### CHECK Constraints

```sql
CHECK (price_max IS NULL OR price_max > 0)
  └─ price_max debe ser positivo si existe

CHECK (price_min IS NULL OR price_min > 0)
  └─ price_min debe ser positivo si existe

CHECK (rose_step IS NULL OR rose_step > 0)
  └─ rose_step debe ser positivo si existe

CHECK (status IN ('active', 'deleted'))
  └─ Solo dos estados permitidos
```

---

## 📊 ÍNDICES (5 total)

```
┌─────────────────────────────────────────────────────────────────┐
│ ÍNDICE                          │ PROPÓSITO                     │
├─────────────────────────────────┼───────────────────────────────┤
│ idx_ghl_product_id              │ Queries por ghl_product_id    │
│ idx_legacy_catalog_id           │ Queries por legacy_id         │
│ idx_status                      │ Filtrar por status (active)   │
│ idx_location_id                 │ Queries por location          │
│ idx_created_at                  │ Filtrar por fecha creación    │
└─────────────────────────────────┴───────────────────────────────┘
```

**Impacto:** Mejora velocidad de búsquedas frecuentes

---

## 🔒 ROW LEVEL SECURITY (4 Policies)

### Policy 1: Lectura Pública

```
Nombre:     read_active_product_metadata
Operación:  SELECT
Usuarios:   anon + authenticated
Condición:  status = 'active'
Acceso:     ✅ Ven solo productos activos
            ❌ NO ven eliminados (soft delete)
```

### Policy 2: Inserción (Webhook/Polling)

```
Nombre:     insert_product_metadata_service_role
Operación:  INSERT
Usuarios:   service_role (SOLO server-side)
Condición:  true
Uso:        Webhook y polling crean metadatos
Seguridad:  ✅ Frontend NO puede acceder
```

### Policy 3: Actualización (Server-side)

```
Nombre:     update_product_metadata_service_role
Operación:  UPDATE
Usuarios:   service_role (SOLO server-side)
Condición:  true
Uso:        Server actualiza status, timestamps
Seguridad:  ✅ Frontend NO puede acceder
```

### Policy 4: Eliminación (Soft Delete)

```
Nombre:     delete_product_metadata_service_role
Operación:  DELETE
Usuarios:   service_role (SOLO server-side)
Condición:  true
Uso:        Marcar como deleted
Seguridad:  ✅ Frontend NO puede acceder
```

---

## ⏱️ TRIGGER

```
Nombre:      update_product_metadata_updated_at
Evento:      BEFORE UPDATE
Acción:      Ejecuta function update_updated_at_column()
Efecto:      Establece updated_at = NOW()
Reutiliza:   Function existente de migration anterior
```

---

## 📤 PERMISSIONS (Grants)

```
Anon + Authenticated:
  └─ SELECT  (solo lectura de activos)

Service Role (Backend):
  └─ SELECT, INSERT, UPDATE, DELETE (control total)
```

---

## 🔄 CICLO DE VIDA DE UN PRODUCTO

### Creación (Webhook/Polling)

```
GHL crea producto
    ↓
Webhook/Polling → INSERT INTO product_metadata
    ├─ ghl_product_id: [asignado por GHL]
    ├─ legacy_catalog_id: null (producto nuevo)
    ├─ price_max, colors, badge: null
    ├─ status: 'active'
    ├─ auto_created: true
    ├─ created_at: now()
    └─ updated_at: now()

Frontend obtiene:
    ├─ De GHL: name, price, description, image
    ├─ De Supabase: todos null (simple)
    └─ Muestra: producto básico
```

### Edición de GHL (Cliente en GHL Dashboard)

```
Cliente edita en GHL: name, price, description, image
    ↓
Webhook/Polling → Frontend refresca datos de GHL
    ├─ De GHL: [datos nuevos]
    ├─ De Supabase: [sin cambios]
    └─ Muestra: actualizado

Metadata NO cambia (edita en /admin si necesita)
```

### Edición de Metadatos (Admin Panel)

```
Cliente en /admin/products edita: price_max, colors, badge
    ↓
Frontend → UPDATE product_metadata
    ├─ price_max, available_colors, badge_label
    └─ updated_at: now() (trigger)

Resultado:
    ├─ Frontend refresca
    └─ Muestra cambios inmediatamente
```

### Eliminación (Soft Delete)

```
Cliente elimina en GHL O status pasa a inactive
    ↓
Webhook/Polling → UPDATE product_metadata SET status = 'deleted'
    ├─ deleted_at: now() (trigger)
    ├─ Datos permanecen en tabla (auditoría)
    └─ deleted_by: null (futuro)

Frontend:
    ├─ SELECT WHERE status = 'active'
    └─ Producto no aparece
```

---

## 📊 EJEMPLO: Producto en BD

### Para "Ramo de Rosas"

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "location_id": "vOq7yOWR63XGU4qQ7XWd",
  "ghl_product_id": "6a87b91004c302157108f01d",
  "legacy_catalog_id": "ramo-rosas",

  "price_min": 24,
  "price_max": 48,

  "available_colors": ["Rojo", "Rosa", "Blanco", "Azul", "Lila", "Amarillo"],
  "badge_label": null,

  "rose_step": 6,
  "requires_quote": false,

  "status": "active",
  "auto_created": false,

  "created_at": "2026-08-26T10:00:00Z",
  "updated_at": "2026-08-26T10:00:00Z",
  "deleted_at": null
}
```

---

## ✅ CHECKLIST PRE-APLICACIÓN

- ✅ Migración SQL creada (`20260826000001_create_product_metadata.sql`)
- ✅ 15 columnas definidas
- ✅ 4 constraints (2 UNIQUE + 2 CHECK)
- ✅ 5 índices optimizados
- ✅ 4 RLS policies configuradas
- ✅ 1 trigger para timestamps
- ✅ Permissions configurados correctamente
- ✅ Comments documentados
- ✅ Sin conflictos con tablas existentes

---

## 🚀 LISTO PARA APLICAR

Documentos creados:

1. ✅ Migration SQL: `supabase/migrations/20260826000001_create_product_metadata.sql`
2. ✅ Instrucciones: `docs/PHASE1_SUPABASE_SETUP.md`
3. ✅ Estructura: `docs/PHASE1_STRUCTURE.md` (este archivo)

**PRÓXIMO PASO:**
Esperar aprobación para aplicar la migración a Supabase.
