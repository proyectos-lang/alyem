import { getSupabase } from "../supabase/server"

export interface DefinicionReporte {
  id: string
  nombre: string
  cols: string[]
  empresa_id: string | null
  base: string
  desde: string | null
  hasta: string | null
  periodicidad: string
  filtros?: { regimen?: string | null; tipo?: string | null; documento?: string | null; producto?: string | null } | null
  created_at: string
  empresa?: { nombre: string } | null
  ultimas?: { created_at: string; filas: number | null; usuario: string | null }[]
}

// Lista las definiciones guardadas con el historial reciente de generaciones.
export async function listarDefiniciones(): Promise<DefinicionReporte[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("reportes_definiciones")
    .select("*, empresa:empresas(nombre)")
    .order("created_at", { ascending: false })
  const defs = (data as DefinicionReporte[]) ?? []
  if (defs.length === 0) return defs

  // Historial (últimas 3 por definición).
  const { data: snaps } = await sb
    .from("reportes_instantaneas")
    .select("definicion_id, created_at, filas, generado_por")
    .in("definicion_id", defs.map((d) => d.id))
    .order("created_at", { ascending: false })

  const nombres = new Map<string, string>()
  const ids = [...new Set(((snaps as any[]) ?? []).map((s) => s.generado_por).filter(Boolean))] as string[]
  if (ids.length) {
    const { data: us } = await sb.from("usuarios").select("id, nombre").in("id", ids)
    for (const u of (us as { id: string; nombre: string }[]) ?? []) nombres.set(u.id, u.nombre)
  }

  const porDef = new Map<string, DefinicionReporte["ultimas"]>()
  for (const s of (snaps as any[]) ?? []) {
    const arr = porDef.get(s.definicion_id) ?? []
    if (arr!.length < 3) arr!.push({ created_at: s.created_at, filas: s.filas, usuario: s.generado_por ? nombres.get(s.generado_por) ?? null : null })
    porDef.set(s.definicion_id, arr)
  }
  for (const d of defs) d.ultimas = porDef.get(d.id) ?? []
  return defs
}

// Construye el querystring de exportación para una definición.
export function paramsDeDefinicion(d: DefinicionReporte): string {
  const p = new URLSearchParams()
  p.set("cols", d.cols.join(","))
  if (d.empresa_id) p.set("empresa", d.empresa_id)
  if (d.desde) p.set("desde", d.desde)
  if (d.hasta) p.set("hasta", d.hasta)
  p.set("base", d.base)
  if (d.filtros?.regimen) p.set("regimen", d.filtros.regimen)
  if (d.filtros?.tipo) p.set("tipo", d.filtros.tipo)
  if (d.filtros?.documento) p.set("documento", d.filtros.documento)
  if (d.filtros?.producto) p.set("producto", d.filtros.producto)
  p.set("def", d.id)
  return p.toString()
}
