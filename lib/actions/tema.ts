"use server"

import { cookies } from "next/headers"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Guarda la preferencia de tema a nivel de usuario (BD) + cookie para aplicarla
// sin parpadeo en el siguiente inicio de sesión (también en otro dispositivo).
export async function guardarTema(tema: "dark" | "light") {
  const store = await cookies()
  store.set("alyem_tema", tema, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })

  const usuario = await getUsuarioActivo()
  if (usuario) {
    try {
      await getSupabase().from("usuarios").update({ tema }).eq("id", usuario.id)
    } catch {
      /* la columna puede no existir aún si no se corrió tema.sql */
    }
  }
}
