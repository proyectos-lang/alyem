"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { DIMENSIONES } from "../satisfaccion"

export async function calificar(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.CALIFICACION_CREAR)
  const sb = getSupabase()

  const gestionId = form.get("gestion_id") as string
  const estrellas = Number(form.get("estrellas") || 0)
  if (estrellas < 1 || estrellas > 5) throw new Error("Selecciona una calificación de 1 a 5.")

  // Solo gestiones de la propia empresa, entregadas o cerradas.
  const { data: g } = await sb.from("gestiones").select("empresa_id").eq("id", gestionId).single()
  if (!g || g.empresa_id !== usuario!.empresa_id) throw new Error("No puedes calificar esta gestión.")

  const dim = (k: string) => {
    const v = Number(form.get(k) || 0)
    return v >= 1 && v <= 5 ? v : null
  }

  const dimsPatch: Record<string, number | null> = {}
  for (const d of DIMENSIONES) dimsPatch[d.key] = dim(d.key)

  const { error } = await sb.from("calificaciones").insert({
    gestion_id: gestionId,
    empresa_id: g.empresa_id,
    usuario_id: usuario!.id,
    estrellas,
    ...dimsPatch,
    comentario: (form.get("comentario") as string) || null,
  })
  if (error) throw new Error(error.message)

  // Alerta al admin si la calificación es baja (≤3): función más valiosa del módulo.
  if (estrellas <= 3) {
    const { data: g2 } = await sb.from("gestiones").select("referencia").eq("id", gestionId).single()
    const { data: admins } = await sb.from("usuarios").select("id").eq("rol", "admin").eq("activo", true)
    const filas = (admins ?? []).map((a: { id: string }) => ({
      usuario_id: a.id,
      tipo: "calificacion_baja",
      gestion_id: gestionId,
      mensaje: `Calificación de ${estrellas}★ en ${g2?.referencia}. Requiere seguimiento.`,
    }))
    if (filas.length) await sb.from("notificaciones").insert(filas)
  }

  revalidatePath(`/g/${gestionId}`)
}
