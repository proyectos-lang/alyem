"use server"

import { cookies } from "next/headers"
import { getSupabase } from "../supabase/server"
import { COOKIE_USUARIO } from "../session"
import type { Rol } from "../types"

export type TipoAcceso = "cliente" | "corporativo"

export interface ResultadoLogin {
  ok: boolean
  error?: string
  destino?: string
  nombre?: string
}

// Login básico (demo): valida usuario + contraseña contra la tabla usuarios y
// restringe por audiencia (clientes vs. corporativo = operador/admin).
export async function iniciarSesion(
  tipo: TipoAcceso,
  usuario: string,
  password: string,
): Promise<ResultadoLogin> {
  const sb = getSupabase()
  const nombreUsuario = usuario.trim().toLowerCase()
  if (!nombreUsuario || !password) return { ok: false, error: "Ingresa usuario y contraseña." }

  const { data: u } = await sb
    .from("usuarios")
    .select("id, nombre, rol, activo, password")
    .eq("usuario", nombreUsuario)
    .maybeSingle()

  if (!u || !u.activo || u.password !== password) {
    return { ok: false, error: "Credenciales incorrectas." }
  }

  const rol = u.rol as Rol
  const esCorporativo = rol === "operador" || rol === "admin"
  if (tipo === "cliente" && rol !== "cliente")
    return { ok: false, error: "Esta cuenta no es de cliente. Usa el acceso corporativo." }
  if (tipo === "corporativo" && !esCorporativo)
    return { ok: false, error: "Esta cuenta no es corporativa. Usa el acceso clientes." }

  const store = await cookies()
  store.set(COOKIE_USUARIO, u.id as string, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })

  return {
    ok: true,
    nombre: (u.nombre as string) ?? nombreUsuario,
    destino: rol === "cliente" ? "/panel" : rol === "admin" ? "/admin" : "/agencia",
  }
}

export async function cerrarSesion() {
  const store = await cookies()
  store.delete(COOKIE_USUARIO)
}
