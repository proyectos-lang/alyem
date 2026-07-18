import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { CotizacionCard } from "@/components/cotizacion-card"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarCotizaciones } from "@/lib/data/cotizaciones"

export const dynamic = "force-dynamic"

export default async function CotizacionesAgencia() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver cotizaciones." />
  const cotizaciones = await listarCotizaciones(usuario)

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader titulo="Cotizaciones" descripcion="Responde y convierte prospectos en gestiones." />
        <div className="mt-6 flex flex-col gap-3">
          {cotizaciones.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay cotizaciones.</p>
          ) : (
            cotizaciones.map((c) => <CotizacionCard key={c.id} c={c} agencia />)
          )}
        </div>
      </div>
    </PortalShell>
  )
}
