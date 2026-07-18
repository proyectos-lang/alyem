"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, ADJUNTOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"
import type { EstadoLiquidacion } from "../types"

// --- Liquidación ------------------------------------------------------------
export async function crearLiquidacion(gestionId: string, estado: EstadoLiquidacion = "borrador") {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.LIQUIDACION_EDITAR)
  const sb = getSupabase()
  const { data, error } = await sb.from("liquidaciones").insert({ gestion_id: gestionId, estado }).select("id").single()
  if (error) throw new Error(error.message)
  revalidatePath(`/g/${gestionId}`)
  return data.id as string
}

export async function agregarLinea(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.LIQUIDACION_EDITAR)
  const sb = getSupabase()
  const liquidacionId = form.get("liquidacion_id") as string
  const gestionId = form.get("gestion_id") as string

  await sb.from("liquidacion_lineas").insert({
    liquidacion_id: liquidacionId,
    concepto_id: (form.get("concepto_id") as string) || null,
    descripcion: (form.get("descripcion") as string) || null,
    monto: Number(form.get("monto") || 0),
    moneda: (form.get("moneda") as string) || "HNL",
    destinatario: (form.get("destinatario") as string) === "institucion" ? "institucion" : "agencia",
  })

  // Si la liquidación ya estaba emitida, avisar de la línea agregada.
  const { data: liq } = await sb.from("liquidaciones").select("estado").eq("id", liquidacionId).maybeSingle()
  if (liq?.estado === "emitida") {
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    if (g) await notificarEmpresa(g.empresa_id, "liquidacion_linea", `Se agregó un cobro a ${g.referencia}.`, gestionId)
  }
  revalidatePath(`/g/${gestionId}`)
}

export async function anularLinea(id: string, gestionId: string, motivo: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.LIQUIDACION_EDITAR)
  const sb = getSupabase()
  await sb.from("liquidacion_lineas").update({ anulada: true, motivo_anulacion: motivo }).eq("id", id)
  revalidatePath(`/g/${gestionId}`)
}

export async function cambiarEstadoLiquidacion(id: string, gestionId: string, estado: EstadoLiquidacion, motivo?: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.LIQUIDACION_EDITAR)
  const sb = getSupabase()
  await sb
    .from("liquidaciones")
    .update({ estado, motivo_anulacion: estado === "anulada" ? (motivo ?? null) : null })
    .eq("id", id)

  if (estado === "emitida") {
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    if (g) await notificarEmpresa(g.empresa_id, "liquidacion_emitida", `Se emitió la liquidación de ${g.referencia}.`, gestionId)
  }
  revalidatePath(`/g/${gestionId}`)
}

// --- Pagos ------------------------------------------------------------------
// El cliente reporta un pago con comprobante y su aplicación a líneas.
export async function reportarPago(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.PAGO_REPORTAR)
  const sb = getSupabase()

  const gestionId = form.get("gestion_id") as string
  const liquidacionId = (form.get("liquidacion_id") as string) || null
  const moneda = (form.get("moneda") as string) || "HNL"

  // Aplicaciones: pares linea_id / monto (solo > 0).
  const lineaIds = form.getAll("linea_id").map(String)
  const montos = form.getAll("monto_linea").map((m) => Number(m || 0))
  const aplicaciones = lineaIds
    .map((linea_id, i) => ({ linea_id, monto_aplicado: montos[i] || 0 }))
    .filter((a) => a.monto_aplicado > 0)
  if (aplicaciones.length === 0) throw new Error("Indica el monto a pagar en al menos una línea.")
  const total = aplicaciones.reduce((a, b) => a + b.monto_aplicado, 0)

  // Comprobante obligatorio.
  const file = form.get("comprobante") as File | null
  if (!file || file.size === 0) throw new Error("El comprobante de pago es obligatorio.")
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
  const path = `${gestionId}/pago-${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await sb.storage
    .from(ADJUNTOS_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" })
  if (upErr) throw new Error(`No se pudo subir el comprobante: ${upErr.message}`)

  const { data: pago, error } = await sb
    .from("pagos")
    .insert({
      gestion_id: gestionId,
      liquidacion_id: liquidacionId,
      monto: total,
      moneda,
      fecha_pago: (form.get("fecha_pago") as string) || null,
      banco_medio: (form.get("banco_medio") as string) || null,
      referencia: (form.get("referencia") as string) || null,
      comprobante_path: path,
      estado: "reportado",
      reportado_por: usuario!.id,
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)

  await sb.from("pago_aplicaciones").insert(
    aplicaciones.map((a) => ({ pago_id: pago.id, linea_id: a.linea_id, monto_aplicado: a.monto_aplicado })),
  )

  const { data: g } = await sb.from("gestiones").select("referencia").eq("id", gestionId).single()
  await notificarAgencia("pago_reportado", `${usuario!.nombre} reportó un pago en ${g?.referencia}.`, gestionId)
  revalidatePath(`/g/${gestionId}`)
}

// El operador verifica o rechaza un pago reportado.
export async function verificarPago(id: string, estado: "verificado" | "rechazado", motivo?: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.PAGO_VERIFICAR)
  const sb = getSupabase()

  await sb
    .from("pagos")
    .update({
      estado,
      motivo_rechazo: estado === "rechazado" ? (motivo ?? null) : null,
      verificado_por: usuario!.id,
    })
    .eq("id", id)

  const { data: pago } = await sb.from("pagos").select("gestion_id, liquidacion_id").eq("id", id).single()
  if (!pago) return

  // Si con el pago verificado la liquidación queda saldada, marcarla pagada.
  if (estado === "verificado" && pago.liquidacion_id) {
    const { data: saldo } = await sb.from("v_saldos_liquidacion").select("*").eq("liquidacion_id", pago.liquidacion_id).maybeSingle()
    if (saldo) {
      const pendiente = Number((saldo as any).total) - Number((saldo as any).pagado_verificado)
      if (pendiente <= 0.001) await sb.from("liquidaciones").update({ estado: "pagada" }).eq("id", pago.liquidacion_id)
    }
  }

  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", pago.gestion_id).single()
  if (g) {
    const msg =
      estado === "verificado"
        ? `Tu pago en ${g.referencia} fue verificado.`
        : `Tu pago en ${g.referencia} fue rechazado: ${motivo ?? "revisar"}.`
    await notificarEmpresa(g.empresa_id, `pago_${estado}`, msg, pago.gestion_id)
  }
  revalidatePath(`/g/${pago.gestion_id}`)
}

export async function anularPago(id: string, gestionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.PAGO_VERIFICAR)
  const sb = getSupabase()
  await sb.from("pagos").update({ estado: "rechazado", motivo_rechazo: "Anulado por la agencia." }).eq("id", id)
  revalidatePath(`/g/${gestionId}`)
}
