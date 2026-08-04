"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"

// Guarda una definición de reporte (columnas + filtros + periodicidad).
export async function guardarDefinicion(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.REPORTES_VER)
  const sb = getSupabase()

  const nombre = String(form.get("nombre") ?? "").trim()
  if (!nombre) throw new Error("Ponle un nombre a la definición.")
  const cols = String(form.get("cols") ?? "").split(",").filter(Boolean)

  await sb.from("reportes_definiciones").insert({
    nombre,
    cols,
    empresa_id: (form.get("empresa") as string) || null,
    base: (form.get("base") as string) || "eta",
    desde: (form.get("desde") as string) || null,
    hasta: (form.get("hasta") as string) || null,
    periodicidad: (form.get("periodicidad") as string) || "manual",
    filtros: {
      regimen: (form.get("regimen") as string) || null,
      tipo: (form.get("tipo") as string) || null,
      documento: (form.get("documento") as string) || null,
      producto: (form.get("producto") as string) || null,
    },
    creado_por: usuario!.id,
  })
  revalidatePath("/agencia/reportes")
}

export async function eliminarDefinicion(id: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.REPORTES_VER)
  const sb = getSupabase()
  await sb.from("reportes_definiciones").delete().eq("id", id)
  revalidatePath("/agencia/reportes")
}
