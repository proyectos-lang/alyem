"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, esAgencia, PERMISOS } from "../permisos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"

export async function enviarMensaje(gestionId: string, texto: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.MENSAJE_ENVIAR)
  const t = texto.trim()
  if (!t) return
  const sb = getSupabase()

  await sb.from("mensajes").insert({ gestion_id: gestionId, usuario_id: usuario!.id, texto: t })

  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) {
    if (esAgencia(usuario!.rol)) {
      await notificarEmpresa(g.empresa_id, "mensaje", `Nuevo mensaje en ${g.referencia}.`, gestionId)
    } else {
      await notificarAgencia("mensaje", `${usuario!.nombre} escribió en ${g.referencia}.`, gestionId)
    }
  }
  revalidatePath(`/g/${gestionId}`)
}
