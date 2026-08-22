import { getSupabase } from "../supabase/server"

export interface Regimen {
  id: string
  nombre: string
  orden: number
  activo: boolean
}

export async function listarRegimenes(soloActivos = true): Promise<Regimen[]> {
  const sb = getSupabase()
  let q = sb.from("regimenes").select("*").order("orden").order("nombre")
  if (soloActivos) q = q.eq("activo", true)
  const { data, error } = await q
  if (error) return [] // la tabla puede no existir aún si no se corrió 09-analitica.sql
  return (data as Regimen[]) ?? []
}
