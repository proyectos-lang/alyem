import { getSupabase } from "../supabase/server"
import { DIMENSIONES } from "../satisfaccion"

const SEL =
  "*, gestion:gestiones(referencia, operador:usuarios!gestiones_operador_id_fkey(nombre)), empresa:empresas(nombre)"

export async function listarCalificaciones(): Promise<any[]> {
  const sb = getSupabase()
  const { data } = await sb.from("calificaciones").select(SEL).order("created_at", { ascending: false })
  return (data as any[]) ?? []
}

export interface PromedioDimension {
  key: string
  label: string
  corto: string
  promedio: number // 0 si no hay datos
  n: number
}

// Promedio de cada dimensión (ignora nulos) para el gráfico de radar.
export function promediosDimensiones(califs: any[]): PromedioDimension[] {
  return DIMENSIONES.map((d) => {
    const vals = califs.map((c) => c[d.key]).filter((v) => v != null) as number[]
    const promedio = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
    return { key: d.key, label: d.label, corto: d.corto, promedio, n: vals.length }
  })
}
