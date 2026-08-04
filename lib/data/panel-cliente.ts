import { getSupabase } from "../supabase/server"
import { diasLibresRestantes } from "./metricas"
import type { GestionConEstado } from "./gestiones"
import type { EstadoCatalogo } from "../types"

export type Salud = "verde" | "amarillo" | "rojo"

export interface OpSalud {
  g: GestionConEstado
  salud: Salud
  razones: { texto: string; tono: "warning" | "danger" }[]
  docsPorEnviar: number
  docsRechazados: number
  libres: number | null
  paso: number
  totalPasos: number
}

// Estados donde la acción siguiente es del cliente.
function accionDelCliente(nombre?: string): string | null {
  if (!nombre) return null
  if (nombre.startsWith("Pago del bolet")) return "Pago del boletín pendiente"
  if (nombre.startsWith("Cierre") || nombre === "Facturación del servicio") return "Confirma la recepción"
  return null
}

// Enriquece las operaciones activas del cliente con su semáforo de salud,
// motivos de atención, documentos por enviar y progreso del proceso.
export async function saludOperaciones(
  empresaId: string,
  activas: GestionConEstado[],
  estados: EstadoCatalogo[],
): Promise<OpSalud[]> {
  const ids = activas.map((g) => g.id)
  const reqPend = new Map<string, number>()
  const docsRech = new Map<string, number>()

  if (ids.length) {
    const sb = getSupabase()
    const [{ data: req }, { data: docs }] = await Promise.all([
      sb.from("documentos_requeridos").select("gestion_id, cumplido").in("gestion_id", ids).eq("cumplido", false),
      sb.from("documentos").select("gestion_id, estado").in("gestion_id", ids).eq("estado", "rechazado"),
    ])
    for (const r of (req as { gestion_id: string }[]) ?? []) reqPend.set(r.gestion_id, (reqPend.get(r.gestion_id) ?? 0) + 1)
    for (const d of (docs as { gestion_id: string }[]) ?? []) docsRech.set(d.gestion_id, (docsRech.get(d.gestion_id) ?? 0) + 1)
  }

  const flujo = estados.filter((e) => e.tipo === "normal" || e.tipo === "final").sort((a, b) => a.orden - b.orden)
  const ordenPorNombre = new Map(flujo.map((e, i) => [e.nombre, i + 1]))

  return activas.map((g) => {
    const docsPorEnviar = reqPend.get(g.id) ?? 0
    const rech = docsRech.get(g.id) ?? 0
    const libres = diasLibresRestantes(g)
    const razones: OpSalud["razones"] = []

    if (rech > 0) razones.push({ texto: rech === 1 ? "Documento rechazado" : `${rech} documentos rechazados`, tono: "danger" })
    if (libres != null && libres < 0) razones.push({ texto: "Días libres vencidos", tono: "danger" })
    if (docsPorEnviar > 0)
      razones.push({ texto: docsPorEnviar === 1 ? "1 documento por enviar" : `${docsPorEnviar} documentos por enviar`, tono: "warning" })
    if (libres != null && libres >= 0 && libres <= 3) razones.push({ texto: `Quedan ${libres}d libres`, tono: "warning" })
    const accion = accionDelCliente(g.estado?.nombre)
    if (accion) razones.push({ texto: accion, tono: "warning" })

    const salud: Salud = razones.some((r) => r.tono === "danger") ? "rojo" : razones.length > 0 ? "amarillo" : "verde"

    return {
      g,
      salud,
      razones,
      docsPorEnviar,
      docsRechazados: rech,
      libres,
      paso: g.estado?.nombre ? ordenPorNombre.get(g.estado.nombre) ?? 0 : 0,
      totalPasos: flujo.length,
    }
  })
}
