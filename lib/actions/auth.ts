"use server"

import { cookies } from "next/headers"
import { getSupabase } from "../supabase/server"
import { COOKIE_USUARIO } from "../session"
import { capturarGeo } from "../geo"
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

  // Aplica el tema guardado del usuario (para que se conserve entre sesiones y
  // dispositivos). Resiliente si la columna `tema` aún no existe.
  try {
    const { data: pref } = await sb.from("usuarios").select("tema").eq("id", u.id as string).maybeSingle()
    const tema = (pref as { tema?: string } | null)?.tema
    if (tema === "dark" || tema === "light") {
      store.set("alyem_tema", tema, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
    }
  } catch {
    /* columna tema inexistente: se ignora */
  }

  // Auditoría de inicio de sesión: guarda IP/ubicación en el usuario (para que
  // el trigger la asigne a cada cambio) y registra el login. Resiliente si las
  // columnas/tablas nuevas aún no existen.
  try {
    const geo = await capturarGeo()
    await sb
      .from("usuarios")
      .update({ ultima_ip: geo.ip, ultima_lat: geo.lat, ultima_lng: geo.lng, ultima_ciudad: geo.ciudad, ultima_pais: geo.pais })
      .eq("id", u.id as string)
    await sb.from("auditoria_sesiones").insert({
      usuario_id: u.id as string,
      ip: geo.ip,
      lat: geo.lat,
      lng: geo.lng,
      ciudad: geo.ciudad,
      pais: geo.pais,
      user_agent: geo.userAgent,
    })
  } catch {
    /* columnas/tabla de auditoría de sesión inexistentes: se ignora */
  }

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
