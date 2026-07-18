import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { CotizacionCard } from "@/components/cotizacion-card"
import { SolicitarCotizacionForm } from "@/components/solicitar-cotizacion-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarCotizaciones } from "@/lib/data/cotizaciones"

export const dynamic = "force-dynamic"

export default async function CotizacionesCliente() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver cotizaciones." />
  const cotizaciones = await listarCotizaciones(usuario)

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader
          titulo="Cotizaciones"
          descripcion="Solicita un estimado antes del primer embarque."
          acciones={
            <Modal title="Solicitar cotización" trigger={<Button><Plus /> Solicitar</Button>}>
              <SolicitarCotizacionForm />
            </Modal>
          }
        />
        <div className="mt-6 flex flex-col gap-3">
          {cotizaciones.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no has solicitado cotizaciones.</p>
          ) : (
            cotizaciones.map((c) => <CotizacionCard key={c.id} c={c} agencia={false} />)
          )}
        </div>
      </div>
    </PortalShell>
  )
}
