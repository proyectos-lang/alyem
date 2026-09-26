import { getSupabase } from "../supabase/server"
import { empresasVisibles } from "./asignaciones"
import type { DescargaCabecera, DescargaParcial, Usuario } from "../types"

const SEL_CAB =
  "*, empresa:empresas(id, nombre), aduana:aduanas!descargas_cabecera_aduana_id_fkey(id, nombre, codigo), operador:usuarios!descargas_cabecera_operador_id_fkey(id, nombre)"

// Suma de las cantidades retiradas por cabecera (Σ de sus parciales).
async function retiradoPorCabecera(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (ids.length === 0) return map
  const sb = getSupabase()
  const { data } = await sb.from("descargas_parciales").select("cabecera_id, cantidad").in("cabecera_id", ids)
  for (const r of (data as { cabecera_id: string; cantidad: number }[]) ?? []) {
    map.set(r.cabecera_id, (map.get(r.cabecera_id) ?? 0) + Number(r.cantidad || 0))
  }
  return map
}

// Cabeceras de descargas parciales, respetando el alcance por empresa del usuario.
export async function listarCabeceras(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
  opts: { texto?: string } = {},
): Promise<DescargaCabecera[]> {
  const sb = getSupabase()
  let q = sb.from("descargas_cabecera").select(SEL_CAB).order("created_at", { ascending: false })

  const vis = await empresasVisibles(usuario)
  if (vis) {
    if (vis.length === 0) return []
    q = q.in("empresa_id", vis)
  }
  const t = opts.texto?.trim()
  if (t) q = q.or([`referencia.ilike.%${t}%`, `bl.ilike.%${t}%`, `producto.ilike.%${t}%`].join(","))

  const { data } = await q
  const filas = (data as DescargaCabecera[]) ?? []
  if (filas.length === 0) return []

  const retirado = await retiradoPorCabecera(filas.map((f) => f.id))
  for (const f of filas) {
    f.retirado = retirado.get(f.id) ?? 0
    f.saldo = Number(f.cantidad_total) - f.retirado
  }
  return filas
}

// Una cabecera con su alcance (aislamiento por empresa) + sus parciales + saldo.
export async function getCabecera(
  id: string,
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
): Promise<{ cabecera: DescargaCabecera; parciales: DescargaParcial[] } | null> {
  const sb = getSupabase()
  const { data } = await sb.from("descargas_cabecera").select(SEL_CAB).eq("id", id).maybeSingle()
  if (!data) return null
  const cab = data as DescargaCabecera

  // Anti-bypass: debe estar en el alcance del usuario.
  const vis = await empresasVisibles(usuario)
  if (vis && !vis.includes(cab.empresa_id)) return null

  const parciales = await listarParciales(id)
  cab.retirado = parciales.reduce((s, p) => s + Number(p.cantidad || 0), 0)
  cab.saldo = Number(cab.cantidad_total) - cab.retirado
  return { cabecera: cab, parciales }
}

// Descargos parciales de una cabecera (más recientes primero).
export async function listarParciales(cabeceraId: string): Promise<DescargaParcial[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("descargas_parciales")
    .select("*")
    .eq("cabecera_id", cabeceraId)
    .order("created_at", { ascending: false })
  return (data as DescargaParcial[]) ?? []
}
