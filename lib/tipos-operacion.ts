// Fuente ÚNICA de los tipos de operación (valor del enum → etiqueta y color).
// Reemplaza los mapas duplicados que había en ~8 archivos. La UI (selects, tabs,
// badges, reportes, analítica) debe leer de aquí.

export interface TipoOperacionInfo {
  value: string
  label: string
  // Clase Tailwind del badge (usada en la tabla de operaciones).
  clase: string
}

// Orden = orden de aparición en selects/tabs.
export const TIPOS_OPERACION: TipoOperacionInfo[] = [
  { value: "importacion", label: "Importación", clase: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  { value: "exportacion", label: "Exportación", clase: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { value: "exportacion_temporal", label: "Exportación temporal", clase: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" },
  { value: "exportacion_definitiva", label: "Exportación definitiva", clase: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
  { value: "transito", label: "Tránsito", clase: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  { value: "transito_rapido", label: "Tránsito Rápido", clase: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  { value: "duca_f", label: "DUCA F", clase: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  { value: "duca_f_importacion", label: "DUCA F Importación", clase: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  { value: "duca_f_exportacion", label: "DUCA F Exportación", clase: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300" },
  { value: "fyduca", label: "FYDUCA", clase: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
]

const MAP = new Map(TIPOS_OPERACION.map((t) => [t.value, t]))

// Etiqueta legible de un tipo (fallback al valor crudo si es desconocido).
export function labelTipoOperacion(value: string | null | undefined): string {
  return (value && MAP.get(value)?.label) || value || "—"
}

// Info completa (label + clase) o null.
export function infoTipoOperacion(value: string | null | undefined): TipoOperacionInfo | null {
  return (value && MAP.get(value)) || null
}
