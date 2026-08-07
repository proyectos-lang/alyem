import { getSupabase } from "../supabase/server"
import type { Usuario, Empresa } from "../types"

// Empresas asignadas a un operador.
export async function empresasDeOperador(usuarioId: string): Promise<string[]> {
  const sb = getSupabase()
  const { data, error } = await sb.from("operador_empresas").select("empresa_id").eq("usuario_id", usuarioId)
  if (error) return [] // tabla puede no existir aún (pre-migración)
  return (data as { empresa_id: string }[] ?? []).map((r) => r.empresa_id)
}

// Empresas visibles para el usuario:
//   admin    → null (todas)
//   cliente  → [su empresa] (o [] si no tiene)
//   operador → sus clientes asignados; si NO tiene ninguno → null (ve todas)
export async function empresasVisibles(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
): Promise<string[] | null> {
  if (usuario.rol === "admin") return null
  if (usuario.rol === "cliente") return usuario.empresa_id ? [usuario.empresa_id] : []
  // operador
  const asignadas = await empresasDeOperador(usuario.id)
  return asignadas.length > 0 ? asignadas : null
}

// Empresas que la agencia puede SELECCIONAR (alta de operación, reportes):
// admin = todas las activas; operador restringido = solo sus asignadas activas.
export async function empresasParaAgencia(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
): Promise<Pick<Empresa, "id" | "nombre">[]> {
  const sb = getSupabase()
  const vis = await empresasVisibles(usuario)
  let q = sb.from("empresas").select("id, nombre").eq("activo", true).order("nombre")
  if (vis) {
    if (vis.length === 0) return []
    q = q.in("id", vis)
  }
  const { data } = await q
  return (data as Pick<Empresa, "id" | "nombre">[]) ?? []
}
