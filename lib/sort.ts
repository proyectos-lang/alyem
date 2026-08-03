import type { GestionConEstado } from "./data/gestiones"

type Dir = "asc" | "desc"

function cmp(a: unknown, b: unknown): number {
  const av = a == null ? "" : a
  const bv = b == null ? "" : b
  if (typeof av === "number" && typeof bv === "number") return av - bv
  return String(av).localeCompare(String(bv), "es", { numeric: true })
}

const CLAVES: Record<string, (g: GestionConEstado) => unknown> = {
  referencia: (g) => g.referencia,
  empresa: (g) => g.empresa?.nombre,
  aduana: (g) => g.aduana?.nombre,
  naviera: (g) => g.naviera,
  estado: (g) => g.estado?.nombre,
  eta: (g) => (g.eta ? new Date(g.eta).getTime() : 0),
  actualizada: (g) => new Date(g.estado?.fecha ?? g.created_at).getTime(),
}

// Ordena una copia de las operaciones por la clave/dirección indicadas.
export function ordenarGestiones(
  gestiones: GestionConEstado[],
  sort?: string,
  dir?: string,
): GestionConEstado[] {
  const getter = sort ? CLAVES[sort] : undefined
  if (!getter) return gestiones
  const factor = (dir as Dir) === "desc" ? -1 : 1
  return [...gestiones].sort((a, b) => cmp(getter(a), getter(b)) * factor)
}
