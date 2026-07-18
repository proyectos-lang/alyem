# Plataforma de seguimiento aduanero (demo)

Conecta a una agencia aduanera con sus clientes importadores/exportadores alrededor de la
**gestión** (trámite de una carga). Tres portales — **cliente**, **agencia** y **admin** — sobre
una sola fuente de verdad. Construido con **Next.js 16**, **React 19**, **Tailwind CSS 4** y
**Supabase** (Postgres + Storage).

> **Demo**: sin autenticación real. El usuario activo se elige con el selector de la barra
> superior (impersonación); los permisos gobiernan qué ve y hace cada rol. Sin RLS: el
> aislamiento por empresa se aplica en el servidor. Los datos viven en el esquema `aylem`.

## Módulos

Gestiones + timeline de eventos · documentos con checklist y versionado · liquidación y pagos
con verificación · notificaciones in-app · mensajería por gestión · cotizaciones que se
convierten en gestión · satisfacción con alerta de calificación baja · kanban · panel de
excepciones · días libres · landed cost · reportes (Excel, PDF, tiempos/SLA) · enlace público
de seguimiento (`/track/[token]`).

## Puesta en marcha

Requiere Node.js 18.18+ y [pnpm](https://pnpm.io), y un proyecto de Supabase.

1. **Base de datos** — en el SQL Editor de Supabase ejecuta, en orden:
   [`supabase/schema.sql`](./supabase/schema.sql) y luego [`supabase/seed.sql`](./supabase/seed.sql).
2. **Exponer el esquema** — Supabase → **Project Settings → API → Exposed schemas** →
   agrega `aylem` a la lista (sin quitar los demás) y guarda.
3. **Storage** — crea un bucket privado llamado `aylem` (o el que definas en `SUPABASE_BUCKET`).
4. **Entorno** — copia `.env.example` a `.env.local` y coloca la URL y el service role key.
5. **Correr**:

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Detalle completo del modelo de datos en [`supabase/ESQUEMA.md`](./supabase/ESQUEMA.md).

## Despliegue en Vercel

Vercel autodetecta Next.js. Define en el proyecto las variables de entorno:
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SCHEMA`, `SUPABASE_BUCKET`.
Luego **Add New → Project** → importa el repo → **Deploy**.

## Scripts

```bash
pnpm dev      # desarrollo
pnpm build    # build de producción
pnpm start    # sirve el build
```
