import { getSupabase } from "../supabase/server"
import type { Usuario, Empresa } from "../types"

// Empresas asignadas a un operador.
export async function empresasDeOperador(usuarioId: string): Promise<string[]> {
  const sb = getSupabase()
  const { data, error } = await sb.from("operador_empresas").select("empresa_id").eq("usuario_id", usuarioId)
  if (error) return [] // tabla puede no existir aún (pre-migración)
  return (data as { empresa_id: string }[] ?? []).map((r) => r.empresa_id)
}

// Empresas cliente final de un cliente aduanero (subárbol). El id apunta a la
// empresa del cliente aduanero. Resiliente si la columna aún no está migrada.
export async function empresasDeClienteAduanero(empresaCaId: string | null): Promise<string[]> {
  if (!empresaCaId) return []
  const sb = getSupabase()
  const { data, error } = await sb.from("empresas").select("id").eq("cliente_aduanero_id", empresaCaId)
  if (error) return [] // columna puede no existir aún (pre-migración)
  return (data as { id: string }[] ?? []).map((r) => r.id)
}

// Empresas visibles para el usuario:
//   admin            → null (todas)
//   cliente          → [su empresa] (o [] si no tiene)
//   cliente_aduanero → sus clientes finales (subárbol); [] si aún no tiene ninguno
//   operador         → sus clientes asignados; si NO tiene ninguno → null (ve todas)
export async function empresasVisibles(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
): Promise<string[] | null> {
  if (usuario.rol === "admin") return null
  if (usuario.rol === "cliente") return usuario.empresa_id ? [usuario.empresa_id] : []
  if (usuario.rol === "cliente_aduanero") return empresasDeClienteAduanero(usuario.empresa_id)
  // operador
  const asignadas = await empresasDeOperador(usuario.id)
  return asignadas.length > 0 ? asignadas : null
}

// Marca diferencial: para un conjunto de empresas, cuáles son cliente final de un
// cliente aduanero y de cuál (id y nombre de la empresa del cliente aduanero).
// Resiliente si la columna aún no está migrada (devuelve mapa vacío).
export async function marcasClienteAduanero(
  empresaIds: string[],
): Promise<Map<string, { caId: string; caNombre: string }>> {
  const map = new Map<string, { caId: string; caNombre: string }>()
  const ids = [...new Set(empresaIds)].filter(Boolean)
  if (ids.length === 0) return map
  const sb = getSupabase()
  const { data, error } = await sb
    .from("empresas")
    .select("id, cliente_aduanero_id, ca:empresas!empresas_cliente_aduanero_id_fkey(nombre)")
    .in("id", ids)
    .not("cliente_aduanero_id", "is", null)
  if (error) return map // columna/FK puede no existir aún (pre-migración)
  for (const r of (data as any[]) ?? []) {
    const caId = r.cliente_aduanero_id as string | null
    if (!caId) continue
    const caNombre = (r.ca?.nombre as string) ?? "Cliente aduanero"
    map.set(r.id as string, { caId, caNombre })
  }
  return map
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
