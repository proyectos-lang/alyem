import type { GestionConEstado } from "./data/gestiones"

export interface FiltrosOperacion {
  estado?: string // nombre del estado actual
  aduana?: string // aduana_id
  canal?: string // canal_selectivo
  tipo?: string // tipo_operacion (importacion/exportacion/…)
  etaDesde?: string // ETA >= (YYYY-MM-DD)
  etaHasta?: string // ETA <= (YYYY-MM-DD)
  creadaDesde?: string // fecha de creación >= (YYYY-MM-DD)
  creadaHasta?: string // fecha de creación <= (YYYY-MM-DD)
}

const dia = (f: unknown) => String(f).slice(0, 10)

// Filtra en memoria las operaciones ya listadas (estado, aduana, canal, tipo,
// rango de ETA y rango de fecha de creación).
export function filtrarGestiones(gestiones: GestionConEstado[], f: FiltrosOperacion): GestionConEstado[] {
  return gestiones.filter((g) => {
    if (f.estado && g.estado?.nombre !== f.estado) return false
    if (f.aduana && g.aduana_id !== f.aduana) return false
    if (f.canal && g.canal_selectivo !== f.canal) return false
    if (f.tipo && g.tipo_operacion !== f.tipo) return false
    if (f.etaDesde || f.etaHasta) {
      if (!g.eta) return false
      const d = dia(g.eta)
      if (f.etaDesde && d < f.etaDesde) return false
      if (f.etaHasta && d > f.etaHasta) return false
    }
    if (f.creadaDesde || f.creadaHasta) {
      const d = dia(g.created_at)
      if (f.creadaDesde && d < f.creadaDesde) return false
      if (f.creadaHasta && d > f.creadaHasta) return false
    }
    return true
  })
}
