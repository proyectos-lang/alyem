import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Buscador } from "@/components/buscador"
import { CarpetaCard } from "@/components/carpeta-card"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { carpetasClientes } from "@/lib/data/documentos"

export const dynamic = "force-dynamic"

export default async function DocumentosAgencia({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los documentos." />
  const { q } = await searchParams

  let carpetas = await carpetasClientes(usuario)
  if (q?.trim()) {
    const t = q.trim().toLowerCase()
    carpetas = carpetas.filter((c) => c.nombre.toLowerCase().includes(t))
  }

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader titulo="Documentos" descripcion="Explora los documentos por cliente e importación." />
        <div className="mt-6 flex flex-col gap-4">
          <Buscador placeholder="Buscar cliente…" />
          {carpetas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay clientes que coincidan.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carpetas.map((c) => (
                <CarpetaCard
                  key={c.empresaId}
                  href={`/agencia/documentos/${c.empresaId}`}
                  nombre={c.nombre}
                  meta={`${c.importaciones} importación(es) · ${c.documentos} documento(s)`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
