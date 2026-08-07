import { getSupabase } from "../supabase/server"
import { estadosActuales, type EstadoDerivado } from "./gestiones"
import { empresasVisibles } from "./asignaciones"
import type { Usuario } from "../types"

// Datos del módulo "Documentos" (explorador tipo carpetas):
// Cliente (carpeta) → Importación (subcarpeta) → Documentos.

export interface CarpetaCliente {
  empresaId: string
  nombre: string
  importaciones: number
  documentos: number
}

// Carpetas de primer nivel para la agencia: un cliente por carpeta, con conteos.
// Restringido a los clientes visibles del usuario (operador → sus asignados).
export async function carpetasClientes(usuario: Pick<Usuario, "id" | "rol" | "empresa_id">): Promise<CarpetaCliente[]> {
  const sb = getSupabase()
  const vis = await empresasVisibles(usuario)
  if (vis && vis.length === 0) return []

  let empQ = sb.from("empresas").select("id, nombre").order("nombre")
  if (vis) empQ = empQ.in("id", vis)
  let gesQ = sb.from("gestiones").select("id, empresa_id")
  if (vis) gesQ = gesQ.in("empresa_id", vis)

  const [{ data: empresas }, { data: gestiones }, { data: docs }] = await Promise.all([
    empQ,
    gesQ,
    sb.from("documentos").select("gestion_id"),
  ])

  const gPorEmpresa = new Map<string, number>()
  const empresaDeGestion = new Map<string, string>()
  for (const g of (gestiones as { id: string; empresa_id: string | null }[]) ?? []) {
    if (!g.empresa_id) continue
    gPorEmpresa.set(g.empresa_id, (gPorEmpresa.get(g.empresa_id) ?? 0) + 1)
    empresaDeGestion.set(g.id, g.empresa_id)
  }
  const dPorEmpresa = new Map<string, number>()
  for (const d of (docs as { gestion_id: string }[]) ?? []) {
    const emp = empresaDeGestion.get(d.gestion_id)
    if (emp) dPorEmpresa.set(emp, (dPorEmpresa.get(emp) ?? 0) + 1)
  }

  return ((empresas as { id: string; nombre: string }[]) ?? []).map((e) => ({
    empresaId: e.id,
    nombre: e.nombre,
    importaciones: gPorEmpresa.get(e.id) ?? 0,
    documentos: dPorEmpresa.get(e.id) ?? 0,
  }))
}

export interface CarpetaImportacion {
  gestionId: string
  referencia: string
  createdAt: string
  documentos: number
  estado?: EstadoDerivado
}

// Subcarpetas (importaciones) de un cliente, con conteo de documentos y estado.
export async function importacionesDeEmpresa(empresaId: string): Promise<CarpetaImportacion[]> {
  const sb = getSupabase()
  const { data: gestiones } = await sb
    .from("gestiones")
    .select("id, referencia, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
  const gs = (gestiones as { id: string; referencia: string; created_at: string }[]) ?? []
  const ids = gs.map((g) => g.id)

  const dPorGestion = new Map<string, number>()
  let estados = new Map<string, EstadoDerivado>()
  if (ids.length) {
    const [{ data: docs }, est] = await Promise.all([
      sb.from("documentos").select("gestion_id").in("gestion_id", ids),
      estadosActuales(ids),
    ])
    for (const d of (docs as { gestion_id: string }[]) ?? []) {
      dPorGestion.set(d.gestion_id, (dPorGestion.get(d.gestion_id) ?? 0) + 1)
    }
    estados = est
  }

  return gs.map((g) => ({
    gestionId: g.id,
    referencia: g.referencia,
    createdAt: g.created_at,
    documentos: dPorGestion.get(g.id) ?? 0,
    estado: estados.get(g.id),
  }))
}

export async function nombreEmpresa(empresaId: string): Promise<string | null> {
  const sb = getSupabase()
  const { data } = await sb.from("empresas").select("nombre").eq("id", empresaId).maybeSingle()
  return (data?.nombre as string) ?? null
}
