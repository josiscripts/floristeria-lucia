# PROJECT AUDIT SPECIFICATION

## Especificación Maestra de Auditoría Técnica de Proyectos

**Versión:** 1.0  
**Propósito:** Auditoría completa de cualquier proyecto de software sin modificar el código.

---

# OBJETIVO

Quiero que actúes como un equipo completo de ingeniería de software y realices una auditoría técnica exhaustiva del proyecto actual.

## Tu rol será simultáneamente:

- Software Architect
- Senior Full Stack Developer
- Frontend Engineer
- Backend Engineer
- Database Architect
- DevOps Engineer
- Cloud Engineer
- Cybersecurity Engineer
- QA Engineer
- Technical Writer

Tu misión consiste en **comprender completamente el proyecto**, documentarlo y generar un mapa técnico que permita a cualquier desarrollador entender la aplicación sin leer todo el código.

---

# REGLA PRINCIPAL

## NO MODIFICAR NADA

Durante esta auditoría queda absolutamente prohibido:

- Modificar archivos.
- Eliminar código.
- Refactorizar.
- Crear nuevas funcionalidades.
- Instalar dependencias.
- Actualizar librerías.
- Ejecutar migraciones.
- Alterar la base de datos.
- Cambiar variables de entorno.
- Hacer commits.
- Hacer deploy.
- Corregir errores automáticamente.

Tu trabajo es **analizar y documentar**, nunca modificar.

---

# PRINCIPIOS DE LA AUDITORÍA

Toda afirmación debe estar basada en el código real del proyecto.

## Nunca debes:

- Inventar funcionalidades.
- Inventar tablas.
- Inventar relaciones.
- Inventar APIs.
- Inventar servicios externos.
- Inventar flujos de usuario.

Si algo no puede determinarse con certeza escribe exactamente:

> No determinado a partir del código analizado.

---

# METODOLOGÍA

La auditoría debe realizarse en este orden:

## Fase 1 — Comprensión

Analizar completamente:

- estructura del proyecto
- tecnologías
- dependencias
- configuración
- arquitectura
- rutas
- componentes
- estado
- servicios

Sin generar todavía recomendaciones.

---

## Fase 2 — Descubrimiento

Identificar:

- funcionalidades
- modelos de datos
- entidades
- autenticación
- carrito
- pedidos
- pagos
- usuarios
- direcciones
- APIs
- integraciones

Todo debe obtenerse del código existente.

---

## Fase 3 — Documentación

Generar documentación técnica completa utilizando Markdown.

La documentación debe ser legible para desarrolladores, arquitectos y futuros mantenedores.

---

## Fase 4 — Recomendaciones

Solo al final podrás proponer mejoras.

Las recomendaciones deben estar claramente separadas de la implementación actual.

Nunca mezclar:

- Arquitectura actual
- Arquitectura recomendada

---

# ALCANCE

La auditoría debe cubrir todo el proyecto.

## Frontend

Analizar:

- páginas
- rutas
- layouts
- componentes
- hooks
- estados
- formularios
- navegación
- UI
- SEO
- accesibilidad

---

## Backend

Analizar:

- APIs
- endpoints
- lógica de negocio
- servicios
- controladores
- validaciones
- middlewares
- webhooks

---

## Base de datos

Reconstruir completamente:

- tablas
- columnas
- tipos
- PK
- FK
- índices
- constraints
- relaciones
- vistas
- funciones
- RLS
- políticas

Siempre a partir del código encontrado.

---

## Infraestructura

Analizar:

- hosting
- deployment
- CI/CD
- Docker
- Vercel
- GitHub
- variables de entorno
- dominios
- DNS (si existe configuración)

---

## Seguridad

Auditar:

- autenticación
- autorización
- cookies
- JWT
- OAuth
- secretos
- CORS
- CSRF
- XSS
- SQL Injection
- IDOR
- manipulación de precios

Clasificando cada riesgo por prioridad.

---

# SERVICIOS EXTERNOS

Debes detectar automáticamente cualquier integración existente, por ejemplo:

- Supabase
- Stripe
- GoHighLevel
- Shopify
- Firebase
- Cloudinary
- Google
- Resend
- SendGrid
- OpenAI
- Analytics
- Otros SDKs

Nunca asumir integraciones inexistentes.

---

# MODELOS VISUALES OBLIGATORIOS

Cuando la información exista en el proyecto debes generar:

## ERD

Diagrama entidad-relación utilizando Mermaid.

## UML

Modelo conceptual de entidades.

## Arquitectura

Diagrama completo del flujo de la aplicación.

## Flujo de datos

Representar el recorrido de:

- usuario
- carrito
- pedido
- pago
- autenticación

---

# CALIDAD DEL INFORME

Todo el informe debe escribirse en Markdown.

Debe utilizar:

- títulos jerárquicos
- tablas
- listas
- bloques de código
- diagramas Mermaid
- explicaciones técnicas

Debe ser apto para documentación profesional.

---

# DIFERENCIACIÓN OBLIGATORIA

Siempre separar claramente dos bloques:

## ACTUAL

Describe únicamente lo que existe.

## RECOMENDADO

Propón mejoras futuras.

Nunca mezclar ambos.

---

# MANEJO DE SECRETOS

Si encuentras:

- API Keys
- Passwords
- Tokens
- Secrets

Nunca los muestres.

Debes reemplazarlos por:

`[OCULTO]`

Pero sí indicar:

- nombre de la variable
- finalidad
- si debería ser pública o privada

---

# CRITERIOS DE EVIDENCIA

Cada conclusión debe venir del proyecto.

Si encuentras dos implementaciones distintas de una misma funcionalidad:

1. Documenta ambas.
2. Indica cuál parece estar activa.
3. Explica por qué.

---

# RESULTADO ESPERADO

Al finalizar la auditoría deben existir los siguientes documentos:

1. PROJECT_AUDIT_REPORT.md
2. ARCHITECTURE.md
3. DATABASE.md
4. SECURITY.md

Este documento (PROJECT_AUDIT_SPEC.md) define exclusivamente las reglas y metodología que deben seguirse para generar los demás.

---

# INSTRUCCIÓN FINAL

Analiza el proyecto completo siguiendo esta especificación.

No modifiques ningún archivo.

No hagas cambios automáticos.

Documenta primero.

Las decisiones de arquitectura y las modificaciones se realizarán únicamente después de completar toda la auditoría.
