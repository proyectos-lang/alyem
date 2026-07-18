import { getSupabase } from "../supabase/server"
import type { ConceptoCobro, CuentaBancaria, EstadoCatalogo, TipoDocumento } from "../types"

export async function getTiposDocumento(): Promise<TipoDocumento[]> {
  const sb = getSupabase()
  const { data } = await sb.from("tipos_documento").select("*").eq("activo", true).order("orden")
  return (data as TipoDocumento[]) ?? []
}

export async function getConceptos(): Promise<ConceptoCobro[]> {
  const sb = getSupabase()
  const { data } = await sb.from("conceptos_cobro").select("*").eq("activo", true).order("nombre")
  return (data as ConceptoCobro[]) ?? []
}

export async function getCuentas(): Promise<CuentaBancaria[]> {
  const sb = getSupabase()
  const { data } = await sb.from("cuentas_bancarias").select("*").eq("activo", true).order("banco")
  return (data as CuentaBancaria[]) ?? []
}

export async function getEstados(): Promise<EstadoCatalogo[]> {
  const sb = getSupabase()
  const { data } = await sb.from("estados_catalogo").select("*").order("orden")
  return (data as EstadoCatalogo[]) ?? []
}
