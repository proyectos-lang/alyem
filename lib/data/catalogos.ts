import { getSupabase } from "../supabase/server"
import type { EstadoCatalogo, TipoDocumento } from "../types"

export async function getTiposDocumento(): Promise<TipoDocumento[]> {
  const sb = getSupabase()
  const { data } = await sb.from("tipos_documento").select("*").eq("activo", true).order("orden")
  return (data as TipoDocumento[]) ?? []
}

export async function getEstados(): Promise<EstadoCatalogo[]> {
  const sb = getSupabase()
  const { data } = await sb.from("estados_catalogo").select("*").order("orden")
  return (data as EstadoCatalogo[]) ?? []
}
