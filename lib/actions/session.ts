"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { COOKIE_USUARIO } from "../session"

// Impersonación (no hay AUTH): fija el usuario activo del demo.
export async function cambiarUsuario(usuarioId: string) {
  const store = await cookies()
  store.set(COOKIE_USUARIO, usuarioId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  revalidatePath("/", "layout")
}
