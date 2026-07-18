import { getSupabase } from "./supabase/server"

// Lee un valor de la tabla configuracion.
export async function getConfig(clave: string): Promise<string | null> {
  const sb = getSupabase()
  const { data } = await sb.from("configuracion").select("valor").eq("clave", clave).maybeSingle()
  return (data?.valor as string) ?? null
}

// Lee toda la configuración como mapa clave→valor.
export async function getConfigMap(): Promise<Record<string, string>> {
  const sb = getSupabase()
  const { data } = await sb.from("configuracion").select("clave, valor")
  const map: Record<string, string> = {}
  for (const row of (data as { clave: string; valor: string }[]) ?? []) map[row.clave] = row.valor
  return map
}
