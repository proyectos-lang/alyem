import { cookies } from "next/headers"
import { getSupabase } from "./supabase/server"
import type { Usuario } from "./types"

export const COOKIE_USUARIO = "demo_user_id"

const SELECT_USUARIO = "*, empresa:empresas(id, nombre)"

// Usuario autenticado: cookie demo_user_id → usuario válido y activo, o null.
// (Sin fallback: si no hay sesión válida, el usuario no está autenticado.)
export async function getUsuarioActivo(): Promise<Usuario | null> {
  const sb = getSupabase()
  const id = (await cookies()).get(COOKIE_USUARIO)?.value
  if (!id) return null

  const { data } = await sb.from("usuarios").select(SELECT_USUARIO).eq("id", id).eq("activo", true).maybeSingle()
  return (data as Usuario) ?? null
}
