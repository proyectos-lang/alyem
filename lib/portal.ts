import { redirect } from "next/navigation"
import { getUsuarioActivo } from "./session"
import type { Usuario } from "./types"

// Resuelve el usuario autenticado. Si no hay sesión válida, redirige a /login.
// Devuelve null SOLO si falta configuración de Supabase (el caller muestra SetupNotice).
export async function usuarioActivoSeguro(): Promise<Usuario | null> {
  let usuario: Usuario | null = null
  try {
    usuario = await getUsuarioActivo()
  } catch {
    return null
  }
  if (!usuario) redirect("/login")
  return usuario
}
