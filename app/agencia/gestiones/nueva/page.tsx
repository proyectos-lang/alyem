import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { NuevaGestionForm } from "@/components/nueva-gestion-form"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"
import type { Empresa } from "@/lib/types"

export const dynamic = "force-dynamic"

// Alta de gestión desde la agencia, a nombre de una empresa cliente
// (cuando el cliente no la crea desde su propio portal).
export default async function NuevaGestionAgencia() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para crear gestiones." />

  const sb = getSupabase()
  const { data } = await sb.from("empresas").select("*").eq("activo", true).order("nombre")
  const empresas = (data as Empresa[]) ?? []

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <PageHeader
          titulo="Nueva gestión"
          descripcion="Registra una operación a nombre de un cliente."
        />
        <div className="mt-6">
          <NuevaGestionForm empresas={empresas} />
        </div>
      </div>
    </PortalShell>
  )
}
