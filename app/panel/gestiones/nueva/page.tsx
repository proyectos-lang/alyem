import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { NuevaGestionForm } from "@/components/nueva-gestion-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarAduanas } from "@/lib/data/aduanas"
import { getTiposDocumento } from "@/lib/data/catalogos"
import { listarRegimenes } from "@/lib/data/regimenes"

export const dynamic = "force-dynamic"

export default async function NuevaGestionPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para crear operaciones." />
  const [aduanas, tipos, regimenes] = await Promise.all([listarAduanas(true), getTiposDocumento(), listarRegimenes()])

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader titulo="Nueva operación" descripcion="Notifica tu embarque y adjunta la documentación (Paso 1)." />
        <div className="mt-6">
          <NuevaGestionForm aduanas={aduanas} tipos={tipos} regimenes={regimenes} />
        </div>
      </div>
    </PortalShell>
  )
}
