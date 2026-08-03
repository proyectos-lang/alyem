import { getSupabase } from "../supabase/server"
import type { Aduana } from "../types"

export async function listarAduanas(soloActivas = false): Promise<Aduana[]> {
  const sb = getSupabase()
  let q = sb.from("aduanas").select("*").order("nombre")
  if (soloActivas) q = q.eq("activo", true)
  const { data } = await q
  return (data as Aduana[]) ?? []
}
