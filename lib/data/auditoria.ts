import { getSupabase } from "../supabase/server"

export interface RegistroAuditoria {
  id: number
  tabla: string
  operacion: string
  registro_id: string | null
  usuario_id: string | null
  ip: string | null
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  cambios: Record<string, { antes: unknown; despues: unknown }> | null
  creado: string
  usuario?: { nombre: string } | null
}

export interface SesionAuditoria {
  id: number
  usuario_id: string | null
  ip: string | null
  lat: number | null
  lng: number | null
  ciudad: string | null
  pais: string | null
  user_agent: string | null
  precisa: boolean | null
  creado: string
  usuario?: { nombre: string } | null
}

export interface FiltrosAuditoria {
  tabla?: string
  operacion?: string
  usuarioId?: string
  desde?: string
  hasta?: string
  pagina?: number
}

const POR_PAGINA = 50

export async function listarAuditoria(f: FiltrosAuditoria = {}): Promise<{ filas: RegistroAuditoria[]; hayMas: boolean }> {
  const sb = getSupabase()
  const pagina = Math.max(0, f.pagina ?? 0)
  let q = sb
    .from("auditoria")
    .select("*")
    .order("creado", { ascending: false })
    .range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA) // +1 para saber si hay más

  if (f.tabla) q = q.eq("tabla", f.tabla)
  if (f.operacion) q = q.eq("operacion", f.operacion)
  if (f.usuarioId) q = q.eq("usuario_id", f.usuarioId)
  if (f.desde) q = q.gte("creado", f.desde)
  if (f.hasta) q = q.lte("creado", `${f.hasta}T23:59:59`)

  const { data, error } = await q
  if (error) return { filas: [], hayMas: false }
  const todas = (data as RegistroAuditoria[]) ?? []
  const hayMas = todas.length > POR_PAGINA
  const filas = todas.slice(0, POR_PAGINA)

  // Resuelve el nombre del actor con una sola consulta (sin depender de FK).
  const ids = [...new Set(filas.map((r) => r.usuario_id).filter(Boolean))] as string[]
  if (ids.length) {
    const { data: us } = await sb.from("usuarios").select("id, nombre").in("id", ids)
    const mapa = new Map((us as { id: string; nombre: string }[] ?? []).map((u) => [u.id, u.nombre]))
    for (const r of filas) if (r.usuario_id) r.usuario = { nombre: mapa.get(r.usuario_id) ?? "—" }
  }
  return { filas, hayMas }
}

// Inicios de sesión registrados (con ubicación).
export async function listarSesiones(limite = 200): Promise<SesionAuditoria[]> {
  const sb = getSupabase()
  const { data, error } = await sb.from("auditoria_sesiones").select("*").order("creado", { ascending: false }).limit(limite)
  if (error) return []
  const filas = (data as SesionAuditoria[]) ?? []
  const ids = [...new Set(filas.map((f) => f.usuario_id).filter(Boolean))] as string[]
  if (ids.length) {
    const { data: us } = await sb.from("usuarios").select("id, nombre").in("id", ids)
    const mapa = new Map((us as { id: string; nombre: string }[] ?? []).map((u) => [u.id, u.nombre]))
    for (const f of filas) if (f.usuario_id) f.usuario = { nombre: mapa.get(f.usuario_id) ?? "—" }
  }
  return filas
}

// Tablas distintas presentes en la bitácora (para el filtro).
export async function tablasAuditadas(): Promise<string[]> {
  const sb = getSupabase()
  const { data } = await sb.from("auditoria").select("tabla").order("tabla")
  const set = new Set<string>()
  for (const r of (data as { tabla: string }[]) ?? []) set.add(r.tabla)
  return [...set]
}
