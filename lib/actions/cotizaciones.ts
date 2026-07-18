"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"

async function siguienteReferencia(sb: ReturnType<typeof getSupabase>): Promise<string> {
  const anio = new Date().getFullYear()
  const { count } = await sb
    .from("gestiones")
    .select("id", { count: "exact", head: true })
    .ilike("referencia", `GES-${anio}-%`)
  return `GES-${anio}-${String((count ?? 0) + 1).padStart(4, "0")}`
}

// Cliente solicita una cotización.
export async function solicitarCotizacion(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.COTIZACION_CREAR)
  const sb = getSupabase()
  const { error } = await sb.from("cotizaciones").insert({
    empresa_id: usuario!.empresa_id,
    descripcion: (form.get("descripcion") as string) || null,
    estado: "solicitada",
  })
  if (error) throw new Error(error.message)
  await notificarAgencia("cotizacion", `${usuario!.empresa?.nombre ?? "Un cliente"} solicitó una cotización.`)
  revalidatePath("/panel/cotizaciones")
  revalidatePath("/agencia/cotizaciones")
}

// Operador responde con líneas de cobro estimadas.
export async function responderCotizacion(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.COTIZACION_RESPONDER)
  const sb = getSupabase()
  const cotizacionId = form.get("cotizacion_id") as string

  const conceptos = form.getAll("concepto").map(String)
  const montos = form.getAll("monto").map((m) => Number(m || 0))
  const monedas = form.getAll("moneda").map(String)
  const lineas = conceptos
    .map((concepto, i) => ({ cotizacion_id: cotizacionId, concepto, monto: montos[i] || 0, moneda: monedas[i] || "HNL" }))
    .filter((l) => l.concepto && l.monto > 0)
  if (lineas.length) await sb.from("cotizacion_lineas").insert(lineas)

  await sb.from("cotizaciones").update({ estado: "respondida" }).eq("id", cotizacionId)

  const { data: c } = await sb.from("cotizaciones").select("empresa_id").eq("id", cotizacionId).maybeSingle()
  if (c?.empresa_id) await notificarEmpresa(c.empresa_id, "cotizacion_respondida", "Tu cotización fue respondida.")
  revalidatePath("/agencia/cotizaciones")
  revalidatePath("/panel/cotizaciones")
}

// Aprobar la cotización crea una gestión a partir de ella.
export async function aprobarCotizacion(cotizacionId: string): Promise<string | null> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.COTIZACION_RESPONDER)
  const sb = getSupabase()

  const { data: c } = await sb.from("cotizaciones").select("*").eq("id", cotizacionId).single()
  if (!c) throw new Error("Cotización no encontrada.")
  if (!c.empresa_id) throw new Error("La cotización no tiene empresa asociada; créala primero como empresa cliente.")

  const referencia = await siguienteReferencia(sb)
  const { data: g, error } = await sb
    .from("gestiones")
    .insert({
      referencia,
      empresa_id: c.empresa_id,
      operador_id: usuario!.id,
      descripcion_mercancia: c.descripcion,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  const { data: est } = await sb
    .from("estados_catalogo")
    .select("id")
    .ilike("nombre", "Aceptada%")
    .order("orden")
    .limit(1)
    .maybeSingle()
  await sb.from("eventos").insert({
    gestion_id: g.id,
    tipo: "estado",
    estado_id: est?.id ?? null,
    observacion: "Gestión creada a partir de una cotización aprobada.",
    usuario_id: usuario!.id,
  })

  await sb.from("cotizaciones").update({ estado: "aprobada", gestion_id: g.id }).eq("id", cotizacionId)
  await notificarEmpresa(c.empresa_id, "cotizacion_aprobada", `Tu cotización se convirtió en la gestión ${referencia}.`, g.id)
  revalidatePath("/agencia/cotizaciones")
  revalidatePath("/panel/cotizaciones")
  return g.id as string
}

export async function rechazarCotizacion(cotizacionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.COTIZACION_RESPONDER)
  const sb = getSupabase()
  await sb.from("cotizaciones").update({ estado: "rechazada" }).eq("id", cotizacionId)
  revalidatePath("/agencia/cotizaciones")
}
