import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { permisosEfectivos } from "@/lib/permisos"
import { grupoPorSlug } from "@/lib/nav"

export const dynamic = "force-dynamic"

export default async function PanelGrupo({ params }: { params: Promise<{ grupo: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para navegar." />
  const { grupo: slug } = await params

  const permisos = permisosEfectivos(usuario)
  const grupo = grupoPorSlug(usuario.rol, permisos, slug)

  if (!grupo || !grupo.titulo) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Grupo no encontrado.</div>
      </PortalShell>
    )
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <PageHeader titulo={grupo.titulo} descripcion="Elige un módulo para continuar." />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupo.items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                {/* halo de color al pasar el mouse */}
                <span
                  className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span
                  className="flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                >
                  <Icon className="size-6" />
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-1 font-semibold">
                    {item.label}
                    <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </p>
                  {item.descripcion && <p className="mt-1 text-sm text-muted-foreground">{item.descripcion}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </PortalShell>
  )
}
