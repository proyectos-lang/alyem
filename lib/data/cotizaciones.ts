import { getSupabase } from "../supabase/server"
import type { Cotizacion, Usuario } from "../types"

export async function listarCotizaciones(usuario: Pick<Usuario, "rol" | "empresa_id">): Promise<Cotizacion[]> {
  const sb = getSupabase()
  let q = sb
    .from("cotizaciones")
    .select("*, empresa:empresas(id, nombre), lineas:cotizacion_lineas(*)")
    .order("created_at", { ascending: false })
  if (usuario.rol === "cliente") {
    if (!usuario.empresa_id) return []
    q = q.eq("empresa_id", usuario.empresa_id)
  }
  const { data } = await q
  return (data as Cotizacion[]) ?? []
}
