import { Package } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { Buscador } from "@/components/buscador"
import { CarpetaCard } from "@/components/carpeta-card"
import { RutaCarpetas } from "@/components/ruta-carpetas"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { importacionesDeEmpresa, nombreEmpresa } from "@/lib/data/documentos"
import { empresasVisibles } from "@/lib/data/asignaciones"
import { fecha } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function DocumentosCliente({
  params,
  searchParams,
}: {
  params: Promise<{ empresaId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver los documentos." />
  const { empresaId } = await params
  const { q } = await searchParams

  // Un operador restringido no puede abrir carpetas de clientes que no tiene asignados.
  const vis = await empresasVisibles(usuario)
  const nombre = vis && !vis.includes(empresaId) ? null : await nombreEmpresa(empresaId)
  if (!nombre) {
    return (
      <PortalShell roles={["operador", "admin", "cliente_aduanero"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Cliente no encontrado.</div>
      </PortalShell>
    )
  }

  let carpetas = await importacionesDeEmpresa(empresaId)
  if (q?.trim()) {
    const t = q.trim().toLowerCase()
    carpetas = carpetas.filter((c) => c.referencia.toLowerCase().includes(t))
  }

  return (
    <PortalShell roles={["operador", "admin", "cliente_aduanero"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <RutaCarpetas items={[{ label: "Documentos", href: "/agencia/documentos" }, { label: nombre }]} />
        <h1 className="text-xl font-semibold tracking-tight">{nombre}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Importaciones del cliente. Abre una para ver sus documentos.</p>

        <div className="mt-6 flex flex-col gap-4">
          <Buscador placeholder="Buscar importación por referencia…" />
          {carpetas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay importaciones que coincidan.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carpetas.map((c) => (
                <CarpetaCard
                  key={c.gestionId}
                  href={`/agencia/documentos/${empresaId}/${c.gestionId}`}
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
