import { Plus } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { UsuarioForm } from "@/components/admin/usuario-form"
import { UsuariosLista } from "@/components/admin/usuarios-lista"
import { getSupabase } from "@/lib/supabase/server"
import type { Empresa, Usuario } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const sb = getSupabase()
  const [{ data: us }, { data: emp }, { data: asig }] = await Promise.all([
    sb.from("usuarios").select("*, empresa:empresas!empresa_id(id, nombre)").order("rol").order("nombre"),
    sb.from("empresas").select("*").eq("activo", true).order("nombre"),
    sb.from("operador_empresas").select("usuario_id, empresa_id"),
  ])
  const usuarios = (us as Usuario[]) ?? []
  const empresas = (emp as Empresa[]) ?? []

  // Mapa usuario_id → [empresa_id] con los clientes asignados a cada operador.
  const asignados: Record<string, string[]> = {}
  for (const a of (asig as { usuario_id: string; empresa_id: string }[]) ?? []) {
    ;(asignados[a.usuario_id] ??= []).push(a.empresa_id)
  }

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Usuarios y permisos"
          descripcion="Gestiona las personas y qué puede hacer cada una (sin AUTH; los permisos gobiernan las acciones)."
          acciones={
            <Modal title="Nuevo usuario" className="max-w-2xl" trigger={<Button><Plus /> Nuevo usuario</Button>}>
              <UsuarioForm empresas={empresas} />
            </Modal>
          }
        />

        <UsuariosLista usuarios={usuarios} empresas={empresas} asignados={asignados} />
      </div>
    </PortalShell>
  )
}
