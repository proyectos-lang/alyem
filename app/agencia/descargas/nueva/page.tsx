import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { NuevaDescargaForm } from "@/components/nueva-descarga-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { empresasParaAgencia } from "@/lib/data/asignaciones"
import { listarAduanas } from "@/lib/data/aduanas"
import { listarRegimenes } from "@/lib/data/regimenes"

export const dynamic = "force-dynamic"

export default async function NuevaDescargaPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para registrar descargas." />

  const [empresas, aduanas, regimenes] = await Promise.all([
    empresasParaAgencia(usuario),
    listarAduanas(true),
    listarRegimenes(),
  ])

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader
          titulo="Nueva descarga parcial"
          descripcion="Registra el ingreso inicial de la carga a almacén fiscal (régimen 7000)."
        />
        <div className="mt-6">
          <NuevaDescargaForm empresas={empresas} aduanas={aduanas} regimenes={regimenes} />
        </div>
      </div>
    </PortalShell>
  )
}
