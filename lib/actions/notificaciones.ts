"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Crea una notificación in-app para un usuario.
export async function notificar(usuarioId: string, tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  await sb.from("notificaciones").insert({
    usuario_id: usuarioId,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  })
}

// Notifica a todos los usuarios de una empresa (clientes).
export async function notificarEmpresa(empresaId: string, tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id").eq("empresa_id", empresaId).eq("activo", true)
  const filas = (data ?? []).map((u: { id: string }) => ({
    usuario_id: u.id,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  }))
  if (filas.length) await sb.from("notificaciones").insert(filas)
}

// Notifica a toda la agencia (operadores y admins).
export async function notificarAgencia(tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id").in("rol", ["operador", "admin"]).eq("activo", true)
  const filas = (data ?? []).map((u: { id: string }) => ({
    usuario_id: u.id,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  }))
  if (filas.length) await sb.from("notificaciones").insert(filas)
}

export async function marcarLeidas() {
  const usuario = await getUsuarioActivo()
  if (!usuario) return
  const sb = getSupabase()
  await sb.from("notificaciones").update({ leida: true }).eq("usuario_id", usuario.id).eq("leida", false)
  revalidatePath("/", "layout")
}
