import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { SetupNotice } from "@/components/setup-notice"
import { SubclientesLista, NuevoClienteBoton } from "@/components/aduanero/subclientes-lista"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"
import type { Empresa, Usuario } from "@/lib/types"

export const dynamic = "force-dynamic"

type UsuarioMin = Pick<Usuario, "id" | "nombre" | "usuario" | "email" | "activo">

// Panel del cliente aduanero para dar de alta sus clientes finales y los usuarios
// de acceso de cada uno. Todo queda dentro de su subárbol (cliente_aduanero_id).
export default async function MisClientesPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para gestionar tus clientes." />

  const sb = getSupabase()
  let empresas: Empresa[] = []
  const usuariosPorEmpresa: Record<string, UsuarioMin[]> = {}

  if (usuario.empresa_id) {
    const { data: emp } = await sb
      .from("empresas")
      .select("*")
      .eq("cliente_aduanero_id", usuario.empresa_id)
      .order("nombre")
    empresas = (emp as Empresa[]) ?? []

    const ids = empresas.map((e) => e.id)
    if (ids.length > 0) {
      const { data: us } = await sb
        .from("usuarios")
        .select("id, nombre, usuario, email, activo, empresa_id, rol")
        .in("empresa_id", ids)
        .eq("rol", "cliente")
        .order("nombre")
      for (const u of (us as (UsuarioMin & { empresa_id: string })[]) ?? []) {
        ;(usuariosPorEmpresa[u.empresa_id] ??= []).push(u)
      }
    }
  }

  return (
    <PortalShell roles={["cliente_aduanero"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Mis clientes"
          descripcion="Da de alta tus clientes finales y los usuarios que podrán ingresar a montar operaciones."
          acciones={<NuevoClienteBoton />}
        />
        <SubclientesLista empresas={empresas} usuariosPorEmpresa={usuariosPorEmpresa} />
      </div>
    </PortalShell>
  )
}
