import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { EmpresaForm } from "@/components/admin/empresa-form"
import { EmpresasLista } from "@/components/admin/empresas-lista"
import { getSupabase } from "@/lib/supabase/server"
import type { Empresa } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function EmpresasPage() {
  const sb = getSupabase()
  const [{ data }, { data: us }, { data: operadores }, { data: asig }, { data: caUsers }] = await Promise.all([
    sb.from("empresas").select("*").order("nombre"),
    sb.from("usuarios").select("empresa_id"),
    sb.from("usuarios").select("id, nombre").eq("rol", "operador").eq("activo", true).order("nombre"),
    sb.from("operador_empresas").select("usuario_id, empresa_id"),
    // Empresas que actúan como cliente aduanero = las que tienen al menos un
    // usuario con rol cliente_aduanero.
    sb.from("usuarios").select("empresa_id").eq("rol", "cliente_aduanero").eq("activo", true),
  ])
  const empresas = (data as Empresa[]) ?? []
  const listaOperadores = (operadores as { id: string; nombre: string }[]) ?? []

  // IDs de empresas que son clientes aduaneros (para el selector y para excluirlas
  // de poder tener a su vez un cliente aduanero por encima — no se anida).
  const idsClienteAduanero = new Set(
    ((caUsers as { empresa_id: string | null }[]) ?? []).map((u) => u.empresa_id).filter(Boolean) as string[],
  )
  const clientesAduaneros = empresas
    .filter((e) => idsClienteAduanero.has(e.id))
    .map((e) => ({ id: e.id, nombre: e.nombre }))

  // Conteo de usuarios cliente por empresa.
  const conteo: Record<string, number> = {}
  for (const u of (us as { empresa_id: string | null }[]) ?? []) {
    if (u.empresa_id) conteo[u.empresa_id] = (conteo[u.empresa_id] ?? 0) + 1
  }

  // Operadores asignados por empresa (empresa_id → [usuario_id]).
  const asignados: Record<string, string[]> = {}
  for (const a of (asig as { usuario_id: string; empresa_id: string }[]) ?? []) {
    ;(asignados[a.empresa_id] ??= []).push(a.usuario_id)
  }

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Empresas cliente"
          descripcion="Alta y edición de empresas importadoras/exportadoras."
          acciones={
            <Modal title="Nueva empresa" trigger={<Button><Plus /> Nueva empresa</Button>}>
              <EmpresaForm operadores={listaOperadores} clientesAduaneros={clientesAduaneros} />
            </Modal>
          }
        />

        <EmpresasLista empresas={empresas} conteo={conteo} operadores={listaOperadores} asignados={asignados} clientesAduaneros={clientesAduaneros} />
      </div>
    </PortalShell>
  )
}
