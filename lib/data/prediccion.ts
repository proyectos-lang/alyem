import { diasEnEtapa, diasTotales, type TiempoEtapa } from "./metricas"
import type { GestionConEstado } from "./gestiones"
import type { EstadoCatalogo } from "../types"

const DIA = 86_400_000

export type Riesgo = "verde" | "amarillo" | "rojo"

export interface PrediccionOp {
  gestionId: string
  referencia: string
  empresa: string | null
  estado: string | null
  color: string | null
  riesgo: Riesgo
  proyeccionDias: number // días restantes estimados hasta el cierre
  finEstimado: string | null // ISO date
}

// Predice el riesgo de retraso de cada operación activa comparando el tiempo
// proyectado (transcurrido + promedio de las etapas restantes) contra el SLA.
export function predecirRetrasos(
  gestiones: GestionConEstado[],
  estados: EstadoCatalogo[],
  tiempos: TiempoEtapa[],
  slaObjetivo: number,
): PrediccionOp[] {
  const flujo = estados.filter((e) => e.tipo === "normal" || e.tipo === "final").sort((a, b) => a.orden - b.orden)
  const promedioPorEtapa = new Map(tiempos.map((t) => [t.etapa, t.dias]))

  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  return activas.map((g) => {
    const nombre = g.estado?.nombre ?? null
    const idx = nombre ? flujo.findIndex((e) => e.nombre === nombre) : -1

    let restanteEtapas = 0
    if (idx >= 0) for (let i = idx + 1; i < flujo.length; i++) restanteEtapas += promedioPorEtapa.get(flujo[i].nombre) ?? 0

    const enEtapa = diasEnEtapa(g) ?? 0
    const promEtapaActual = nombre ? promedioPorEtapa.get(nombre) ?? 0 : 0
    const restanteEtapaActual = Math.max(0, promEtapaActual - enEtapa)

    const proyeccionDias = Math.round(restanteEtapaActual + restanteEtapas)
    const proyeccionTotal = diasTotales(g) + proyeccionDias

    let riesgo: Riesgo = "verde"
    if (slaObjetivo > 0) {
      const estancado = promEtapaActual > 0 && enEtapa > promEtapaActual * 1.5
      if (proyeccionTotal > slaObjetivo * 1.15 || estancado) riesgo = "rojo"
      else if (proyeccionTotal > slaObjetivo) riesgo = "amarillo"
    }

    return {
      gestionId: g.id,
      referencia: g.referencia,
      empresa: g.empresa?.nombre ?? null,
      estado: nombre,
      color: g.estado?.color ?? null,
      riesgo,
      proyeccionDias,
      finEstimado: new Date(Date.now() + proyeccionDias * DIA).toISOString().slice(0, 10),
    }
  })
}
