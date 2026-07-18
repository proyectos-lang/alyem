import { cookies } from "next/headers"
import { getSupabase } from "./supabase/server"
import type { Usuario } from "./types"

export const COOKIE_USUARIO = "demo_user_id"

const SELECT_USUARIO = "*, empresa:empresas(id, nombre)"

// Lista de usuarios para el selector de la barra superior (impersonación).
export async function listarUsuarios(): Promise<Usuario[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("usuarios")
    .select(SELECT_USUARIO)
    .eq("activo", true)
    .order("rol", { ascending: true })
    .order("nombre", { ascending: true })
  return (data as Usuario[]) ?? []
}

// Usuario activo: cookie demo_user_id → usuario; si no hay, cae al admin/primero.
export async function getUsuarioActivo(): Promise<Usuario | null> {
  const sb = getSupabase()
  const id = (await cookies()).get(COOKIE_USUARIO)?.value

  if (id) {
    const { data } = await sb.from("usuarios").select(SELECT_USUARIO).eq("id", id).maybeSingle()
    if (data) return data as Usuario
  }

  const { data } = await sb
    .from("usuarios")
    .select(SELECT_USUARIO)
    .eq("activo", true)
    .order("rol", { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as Usuario) ?? null
}
