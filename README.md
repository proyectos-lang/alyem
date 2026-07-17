# Aurora — Tienda en línea

Interfaz de usuario (solo capa visual/CSS/UI) de un marketplace: escaparate de
cliente y panel de administración. Construido con **Next.js 16**, **React 19**,
**Tailwind CSS 4** y componentes shadcn/ui. Los datos son de ejemplo (mock); no
hay backend ni base de datos.

## Rutas

- `/` — Escaparate de la tienda (hero, categorías, grilla de productos).
- `/admin` — Panel de administración (KPIs, gráfico de ventas, inventario).

## Desarrollo local

Requiere Node.js 18.18+ y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Otros scripts:

```bash
pnpm build    # build de producción
pnpm start    # sirve el build de producción
pnpm lint     # linting
```

## Despliegue en Vercel

Vercel detecta Next.js automáticamente, no requiere configuración adicional.

1. Sube este repositorio a GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. Framework Preset: **Next.js** (autodetectado). Deja el resto por defecto.
4. **Deploy**.

O desde la CLI:

```bash
pnpm dlx vercel        # despliegue de preview
pnpm dlx vercel --prod # despliegue a producción
```

## Notas

- `images.unoptimized` está activado, por lo que `sharp` no es necesario en el build.
- `@vercel/analytics` solo se activa en producción; es opcional y puede quitarse.
