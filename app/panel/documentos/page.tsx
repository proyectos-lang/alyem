import { Package } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Buscador } from "@/components/buscador"
import { CarpetaCard } from "@/components/carpeta-card"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { importacionesDeEmpresa } from "@/lib/data/documentos"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function DocumentosPanel({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver tus documentos." />
  const { q } = await searchParams

  if (!usuario.empresa_id) {
    return (
      <PortalShell roles={["cliente"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          Tu usuario no está asociado a una empresa.
        </div>
      </PortalShell>
    )
  }

  let carpetas = await importacionesDeEmpresa(usuario.empresa_id)
  if (q?.trim()) {
    const t = q.trim().toLowerCase()
    carpetas = carpetas.filter((c) => c.referencia.toLowerCase().includes(t))
  }

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader titulo="Documentos" descripcion="Tus documentos organizados por importación." />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador placeholder="Buscar importación por referencia…" />
          {carpetas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no tienes importaciones con documentos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carpetas.map((c) => (
                <CarpetaCard
                  key={c.gestionId}
                  href={`/panel/documentos/${c.gestionId}`}
                  nombre={c.referencia}
                  icon={Package}
                  meta={`${c.documentos} documento(s) · ${fecha(c.createdAt)}`}
                >
                  {c.estado && (
                    <div className="mt-1.5">
                      <EstadoChip nombre={c.estado.nombre} color={c.estado.color} />
                    </div>
                  )}
                </CarpetaCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
