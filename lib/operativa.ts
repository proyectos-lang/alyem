// Cálculos derivados para inteligencia operativa (días libres, gestión fría, landed cost).
import type { GestionConEstado } from "./data/gestiones"

export function fechaVencimientoLibres(g: { fecha_inicio_libres: string | null; dias_libres: number | null }): Date | null {
  if (!g.fecha_inicio_libres || !g.dias_libres) return null
  const d = new Date(g.fecha_inicio_libres)
  d.setDate(d.getDate() + g.dias_libres)
  return d
}

export function diasLibresRestantes(g: { fecha_inicio_libres: string | null; dias_libres: number | null }): number | null {
  const v = fechaVencimientoLibres(g)
  if (!v) return null
  return Math.ceil((v.getTime() - Date.now()) / 86_400_000)
}

export function diasSinActualizar(g: GestionConEstado): number | null {
  const ref = g.estado?.fecha ?? g.created_at
  if (!ref) return null
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000)
}

export function esFinal(g: GestionConEstado): boolean {
  return g.estado?.tipo === "final" || g.estado?.tipo === "cancelada"
}

export interface Excepcion {
  tipo: "fria" | "libres_por_vencer" | "libres_vencidos" | "canal_rojo" | "eta_proxima"
  etiqueta: string
  severidad: "warning" | "danger"
}

// Detecta las excepciones aplicables a una gestión (para el panel del operador).
export function excepcionesDe(
  g: GestionConEstado,
  opts: { diasFria: number; canalRojo?: boolean },
): Excepcion[] {
  const out: Excepcion[] = []
  if (esFinal(g)) return out

  const sinAct = diasSinActualizar(g)
  if (sinAct != null && sinAct >= opts.diasFria)
    out.push({ tipo: "fria", etiqueta: `Sin actualizar hace ${sinAct} días`, severidad: "warning" })

  const libres = diasLibresRestantes(g)
  if (libres != null) {
    if (libres < 0) out.push({ tipo: "libres_vencidos", etiqueta: "Días libres vencidos", severidad: "danger" })
    else if (libres <= 3) out.push({ tipo: "libres_por_vencer", etiqueta: `Quedan ${libres} días libres`, severidad: "warning" })
  }

  if (opts.canalRojo) out.push({ tipo: "canal_rojo", etiqueta: "Canal rojo (inspección física)", severidad: "danger" })

  if (g.eta) {
    const dETA = Math.ceil((new Date(g.eta).getTime() - Date.now()) / 86_400_000)
    if (dETA >= 0 && dETA <= 2) out.push({ tipo: "eta_proxima", etiqueta: `Arribo en ${dETA} día(s)`, severidad: "warning" })
  }
  return out
}
