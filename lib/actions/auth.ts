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
}

// Login básico (demo): valida email + contraseña contra la tabla usuarios y
// restringe por audiencia (clientes vs. corporativo = operador/admin).
export async function iniciarSesion(
  tipo: TipoAcceso,
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  const sb = getSupabase()
  const correo = email.trim().toLowerCase()
  if (!correo || !password) return { ok: false, error: "Ingresa correo y contraseña." }

  const { data: u } = await sb
    .from("usuarios")
    .select("id, rol, activo, password")
    .eq("email", correo)
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

  return { ok: true, destino: rol === "cliente" ? "/panel" : esCorporativo && rol === "admin" ? "/admin" : "/agencia" }
}

export async function cerrarSesion() {
  const store = await cookies()
  store.delete(COOKIE_USUARIO)
}
