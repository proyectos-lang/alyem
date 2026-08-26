import type { GestionConEstado } from "./data/gestiones"

export interface FiltrosOperacion {
  estado?: string // nombre del estado actual
  aduana?: string // aduana_id
  canal?: string // canal_selectivo
  tipo?: string // tipo_operacion (importacion/exportacion/…)
}

// Filtra en memoria las operaciones ya listadas (estado derivado, aduana, canal, tipo).
export function filtrarGestiones(gestiones: GestionConEstado[], f: FiltrosOperacion): GestionConEstado[] {
  return gestiones.filter((g) => {
    if (f.estado && g.estado?.nombre !== f.estado) return false
    if (f.aduana && g.aduana_id !== f.aduana) return false
    if (f.canal && g.canal_selectivo !== f.canal) return false
    if (f.tipo && g.tipo_operacion !== f.tipo) return false
    return true
  })
}
