# Contexto de la aplicación

## Qué es

Plataforma de **seguimiento aduanero** que conecta a una **agencia** con sus **clientes**
importadores/exportadores alrededor de la **gestión** (el trámite aduanero de una carga/embarque).
Es un **demo**: prioriza claridad y rapidez sobre robustez de producción.

Principio rector: **una sola fuente de verdad**. Cliente y agencia ven la misma gestión, cada
uno con las acciones que le corresponden; nada se comunica por fuera que no quede registrado.

## Acceso e inicio de sesión

Login básico con **nombre de usuario** y contraseña en la tabla `usuarios` (contraseña en texto
plano — demo, no producción). La pantalla de login (`/login`) ofrece dos accesos:

- **Acceso clientes** — cuentas de rol `cliente`.
- **Acceso corporativo** — cuentas de la agencia (`operador` y `admin`).

Tras iniciar sesión, el usuario va a su portal y **solo ve lo que su rol y permisos permiten**.
Sesión por cookie `demo_user_id` (httpOnly). Rutas protegidas por `middleware.ts`; `/login` y el
enlace público `/track` son las únicas rutas abiertas.

### Cuentas del demo

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | admin | admin123 |
| Operador | carlos | carlos123 |
| Operador | diana | diana123 |
| Cliente (Valle) | luis | luis123 |
| Cliente (Valle) | maria | maria123 |
| Cliente (Pacífico) | jorge | jorge123 |

## Roles y permisos

- **Cliente**: crea solicitudes, ve la **trazabilidad de cada embarque como línea de tiempo**,
  sube documentos, ve cobros y reporta pagos, solicita cotizaciones, califica y descarga reportes.
  Solo ve las gestiones de **su empresa** (aislamiento aplicado en el servidor).
- **Operador** (agencia): acepta solicitudes, registra eventos, sube y revisa documentos, edita
  liquidaciones, verifica pagos, usa kanban y panel de excepciones.
- **Administrador**: todo lo del operador + **configuración**: crear usuarios y **gestionar sus
  permisos**, catálogos, cuentas bancarias y reglas.

Los permisos viven en `lib/permisos.ts` (claves con defaults por rol; se pueden personalizar por
usuario). **El menú se filtra por permiso**: si un usuario no tiene permiso para ver algo, ese
ítem simplemente no aparece en su navegación (`lib/nav.ts` → `navFiltrado`).

## Portales

- **Cliente** (`/panel`): dashboard, mis gestiones + búsqueda, nueva solicitud, detalle con
  **Timeline** (trazabilidad), documentos, pagos, mensajes y datos; cotizaciones; reportes.
- **Agencia** (`/agencia`): bandeja, tablero **kanban**, **panel de excepciones**, gestiones,
  cotizaciones. Detalle de gestión con registro de eventos, checklist de documentos, editor de
  liquidación y verificación de pagos.
- **Administración** (`/admin`): resumen, empresas, **usuarios y permisos**, catálogos,
  configuración, reportes y satisfacción.
- **Público** (`/track/[token]`): solo la línea de tiempo de una gestión, sin login ni montos.

## Módulos

Gestiones + timeline (estado derivado del último evento) · documentos con checklist y versionado ·
liquidación + pagos con verificación y saldos · notificaciones in-app · mensajería por gestión ·
cotizaciones que se convierten en gestión · satisfacción con alerta de calificación baja · días
libres · landed cost · pre-liquidación estimada · multimodal · reportes (Excel, PDF, tiempos/SLA).

## Arquitectura

- **Next.js 16** (App Router, React Server Components, server actions) + **Tailwind 4** + shadcn/ui.
- **Supabase** (Postgres + Storage). Datos en el esquema **`aylem`**; adjuntos en el bucket
  privado `aylem` con URLs firmadas temporales. Acceso solo desde el servidor con el service role.
- **Sin RLS**: el aislamiento por empresa y los permisos se aplican en el código del servidor
  (cada consulta filtra por empresa; cada mutación valida permisos).

Detalle del modelo de datos: [`supabase/ESQUEMA.md`](./supabase/ESQUEMA.md). Puesta en marcha y
despliegue: [`README.md`](./README.md).

## Puesta en marcha rápida

1. `supabase/schema.sql` y `supabase/seed.sql` en el SQL Editor de Supabase.
   *(Si el proyecto ya estaba sembrado sin login, corre `supabase/migracion-login.sql`.)*
2. Exponer el esquema `aylem` en Project Settings → API → Exposed schemas.
3. `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SCHEMA=aylem`,
   `SUPABASE_BUCKET=aylem`.
4. `pnpm install && pnpm dev`.
