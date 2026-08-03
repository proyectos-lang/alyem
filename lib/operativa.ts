// Cálculo de días libres (tiempo libre otorgado por la naviera, Paso 5).

export function fechaVencimientoLibres(g: {
  fecha_fin_dias_libres: string | null
}): Date | null {
  if (!g.fecha_fin_dias_libres) return null
  const d = new Date(g.fecha_fin_dias_libres)
  return Number.isNaN(d.getTime()) ? null : d
}

export function diasLibresRestantes(g: { fecha_fin_dias_libres: string | null }): number | null {
  const v = fechaVencimientoLibres(g)
  if (!v) return null
  return Math.ceil((v.getTime() - Date.now()) / 86_400_000)
}
