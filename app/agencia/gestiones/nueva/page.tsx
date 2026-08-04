import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { NuevaGestionForm } from "@/components/nueva-gestion-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"
import { listarAduanas } from "@/lib/data/aduanas"
import { getTiposDocumento } from "@/lib/data/catalogos"
import { listarRegimenes } from "@/lib/data/regimenes"
import type { Empresa } from "@/lib/types"

export const dynamic = "force-dynamic"

// Alta de operación desde la agencia, a nombre de una empresa cliente.
export default async function NuevaGestionAgencia() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para crear operaciones." />

  const sb = getSupabase()
  const [{ data: emp }, aduanas, tipos, regimenes] = await Promise.all([
    sb.from("empresas").select("*").eq("activo", true).order("nombre"),
    listarAduanas(true),
    getTiposDocumento(),
    listarRegimenes(),
  ])
  const empresas = (emp as Empresa[]) ?? []

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader titulo="Nueva operación" descripcion="Registra una operación a nombre de un cliente." />
        <div className="mt-6">
          <NuevaGestionForm aduanas={aduanas} tipos={tipos} empresas={empresas} regimenes={regimenes} />
        </div>
      </div>
    </PortalShell>
  )
}
