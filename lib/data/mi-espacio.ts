import { getSupabase } from "../supabase/server"
import type { Rol } from "../types"

export interface ColumnaMiEspacio {
  id: string
  clave: string
  label: string
  tipo: string // text | num | date | bool | select
  opciones: string[] | null
  orden: number
}

// Columnas personalizadas de un coordinador. Resiliente si la tabla aún no existe.
export async function columnasDe(usuarioId: string): Promise<ColumnaMiEspacio[]> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from("mi_espacio_columnas")
    .select("id, clave, label, tipo, opciones, orden, created_at")
    .eq("usuario_id", usuarioId)
    .order("orden")
    .order("created_at")
  if (error) return []
  return ((data as any[]) ?? []).map((c) => ({
    id: c.id,
    clave: c.clave,
    label: c.label,
    tipo: c.tipo,
    opciones: Array.isArray(c.opciones) ? (c.opciones as string[]) : null,
    orden: c.orden,
  }))
}

// Valores (bolsa jsonb) por operación, para un coordinador. Resiliente.
export async function valoresDe(
  usuarioId: string,
  gestionIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>()
  if (gestionIds.length === 0) return map
  const sb = getSupabase()
  const { data, error } = await sb
    .from("mi_espacio_valores")
    .select("gestion_id, valores")
    .eq("usuario_id", usuarioId)
    .in("gestion_id", gestionIds)
  if (error) return map
  for (const r of (data as any[]) ?? []) map.set(r.gestion_id, (r.valores ?? {}) as Record<string, unknown>)
  return map
}

// Coordinadores (operadores activos) para el selector del admin.
export async function operadoresActivos(): Promise<{ id: string; nombre: string }[]> {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id, nombre").eq("rol", "operador").eq("activo", true).order("nombre")
  return (data as { id: string; nombre: string }[]) ?? []
}

// Datos mínimos de un usuario para scopear listarGestiones a su alcance.
export async function usuarioBasico(
  id: string,
): Promise<{ id: string; rol: Rol; empresa_id: string | null; nombre: string } | null> {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id, rol, empresa_id, nombre").eq("id", id).maybeSingle()
  return (data as { id: string; rol: Rol; empresa_id: string | null; nombre: string } | null) ?? null
}
