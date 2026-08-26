"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Solo coordinadores (operadores) y admins tienen "Mi espacio". Todas las
// acciones operan sobre el espacio del PROPIO usuario (ver el de otro es solo
// lectura, resuelto en la página).
async function actor() {
  const usuario = await getUsuarioActivo()
  if (!usuario || (usuario.rol !== "operador" && usuario.rol !== "admin")) {
    throw new Error("No tienes acceso a Mi espacio.")
  }
  return usuario
}

const TIPOS = new Set(["text", "num", "date", "bool", "select"])

export async function crearColumna(form: FormData) {
  const usuario = await actor()
  const sb = getSupabase()
  const label = String(form.get("label") ?? "").trim()
  const tipo = String(form.get("tipo") ?? "text")
  if (!label) throw new Error("El nombre de la columna es obligatorio.")
  const opcionesStr = String(form.get("opciones") ?? "").trim()
  const opciones =
    tipo === "select" && opcionesStr
      ? opcionesStr.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
      : null

  // Orden = al final.
  const { data: max } = await sb
    .from("mi_espacio_columnas")
    .select("orden")
    .eq("usuario_id", usuario.id)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle()
  const orden = ((max as { orden?: number } | null)?.orden ?? -1) + 1

  const { error } = await sb.from("mi_espacio_columnas").insert({
    usuario_id: usuario.id,
    clave: `c_${crypto.randomUUID().slice(0, 8)}`,
    label,
    tipo: TIPOS.has(tipo) ? tipo : "text",
    opciones,
    orden,
  })
  if (error) throw new Error(error.message)
  revalidatePath("/agencia/mi-espacio")
}

export async function editarColumna(form: FormData) {
  const usuario = await actor()
  const sb = getSupabase()
  const id = String(form.get("id") ?? "")
  const label = String(form.get("label") ?? "").trim()
  const tipo = String(form.get("tipo") ?? "text")
  if (!id || !label) throw new Error("Datos incompletos.")
  const opcionesStr = String(form.get("opciones") ?? "").trim()
  const opciones =
    tipo === "select" && opcionesStr
      ? opcionesStr.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
      : null
  const { error } = await sb
    .from("mi_espacio_columnas")
    .update({ label, tipo: TIPOS.has(tipo) ? tipo : "text", opciones })
    .eq("id", id)
    .eq("usuario_id", usuario.id)
  if (error) throw new Error(error.message)
  revalidatePath("/agencia/mi-espacio")
}

export async function eliminarColumna(id: string) {
  const usuario = await actor()
  const sb = getSupabase()
  await sb.from("mi_espacio_columnas").delete().eq("id", id).eq("usuario_id", usuario.id)
  revalidatePath("/agencia/mi-espacio")
}

// Guarda una celda: fusiona la clave en la bolsa jsonb de esa operación.
export async function guardarValor(gestionId: string, clave: string, valor: string) {
  const usuario = await actor()
  const sb = getSupabase()
  const { data } = await sb
    .from("mi_espacio_valores")
    .select("valores")
    .eq("usuario_id", usuario.id)
    .eq("gestion_id", gestionId)
    .maybeSingle()
  const actuales = ((data as { valores?: Record<string, unknown> } | null)?.valores ?? {}) as Record<string, unknown>
  const v = valor.trim()
  if (v === "") delete actuales[clave]
  else actuales[clave] = v
  const { error } = await sb
    .from("mi_espacio_valores")
    .upsert(
      { usuario_id: usuario.id, gestion_id: gestionId, valores: actuales, updated_at: new Date().toISOString() },
      { onConflict: "usuario_id,gestion_id" },
    )
  if (error) throw new Error(error.message)
}
