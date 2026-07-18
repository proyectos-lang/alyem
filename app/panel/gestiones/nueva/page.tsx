import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { NuevaGestionForm } from "@/components/nueva-gestion-form"

export const dynamic = "force-dynamic"

export default function NuevaGestionPage() {
  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader titulo="Nueva gestión" descripcion="Crea una solicitud de trámite aduanero." />
        <div className="mt-6">
          <NuevaGestionForm />
        </div>
      </div>
    </PortalShell>
  )
}
