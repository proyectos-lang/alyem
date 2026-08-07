import { getSupabase } from "../supabase/server"
import { listarGestiones, getEstadosCatalogo } from "./gestiones"
import { diasEnEtapa, alertasDe, tiemposEntreProcesos } from "./metricas"
import { predecirRetrasos } from "./prediccion"
import { getConfig } from "../config"

const ADMIN_VIRTUAL = { id: "", rol: "admin" as const, empresa_id: null }
const hoyISO = () => new Date().toISOString().slice(0, 10)

async function idsAdmins(): Promise<string[]> {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id").eq("rol", "admin").eq("activo", true)
  return (data as { id: string }[] ?? []).map((a) => a.id)
}

// ---- Escalamiento de SLA por etapa ------------------------------------------
export async function ejecutarEscalamientoSla(): Promise<{ escalados: number }> {
  const sb = getSupabase()
  const [gestiones, estados] = await Promise.all([listarGestiones(ADMIN_VIRTUAL), getEstadosCatalogo()])
  const slaPorEtapa = new Map(estados.map((e) => [e.nombre, e.sla_dias ?? null]))
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")

  const { data: previos } = await sb.from("sla_escalamientos").select("gestion_id, estado_id")
  const yaEscalado = new Set((previos as { gestion_id: string; estado_id: string }[] ?? []).map((r) => `${r.gestion_id}:${r.estado_id}`))
  const admins = await idsAdmins()

  let escalados = 0
  for (const g of activas) {
    const sla = g.estado?.nombre ? slaPorEtapa.get(g.estado.nombre) : null
    const dias = diasEnEtapa(g)
    const estadoId = g.estado?.estado_id
    if (!sla || sla <= 0 || dias == null || dias < sla || !estadoId) continue
    if (yaEscalado.has(`${g.id}:${estadoId}`)) continue

    const { error } = await sb.from("sla_escalamientos").insert({ gestion_id: g.id, estado_id: estadoId })
    if (error) continue // tabla ausente o conflicto único

    const msg = `⚠️ ${g.referencia} excede el SLA de la etapa “${g.estado?.nombre}” (${dias}d / ${sla}d objetivo).`
    const destinatarios = [...new Set([...(g.operador_id ? [g.operador_id] : []), ...admins])]
    const filas = destinatarios.map((uid) => ({ usuario_id: uid, tipo: "sla_escalado", gestion_id: g.id, mensaje: msg }))
    if (filas.length) await sb.from("notificaciones").insert(filas)
    escalados++
  }
  return { escalados }
}

// ---- Resumen diario ----------------------------------------------------------
export interface ResumenDia {
  fecha: string
  creadasHoy: number
  cerradasHoy: number
  activas: number
  conAlertas: number
  slaExcedidos: number
  canalRojo: number
  docsPendientes: number
  enRiesgo: number
}

export async function resumenDelDia(): Promise<ResumenDia> {
  const sb = getSupabase()
  const [gestiones, estados, diasFriaStr, slaStr, tiempos, { data: cierres }, { count: docsPend }] = await Promise.all([
    listarGestiones(ADMIN_VIRTUAL),
    getEstadosCatalogo(),
    getConfig("dias_gestion_fria"),
    getConfig("sla_dias_proceso"),
    tiemposEntreProcesos(),
    sb.from("eventos").select("fecha_evento, estado:estados_catalogo!inner(tipo)").eq("estado.tipo", "final"),
    sb.from("documentos_requeridos").select("id", { count: "exact", head: true }).eq("cumplido", false),
  ])
  const diasFria = Number(diasFriaStr ?? "4")
  const sla = Number(slaStr ?? "15")
  const hoy = hoyISO()

  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada")
  const slaPorEtapa = new Map(estados.map((e) => [e.nombre, e.sla_dias ?? null]))

  let conAlertas = 0
  let slaExcedidos = 0
  for (const g of activas) {
    const al = alertasDe(g, diasFria, g.estado?.nombre ? slaPorEtapa.get(g.estado.nombre) : null)
    if (al.length) conAlertas++
    if (al.some((a) => a.tipo === "sla_etapa")) slaExcedidos++
  }
  const enRiesgo = predecirRetrasos(gestiones, estados, tiempos, sla).filter((p) => p.riesgo !== "verde").length

  return {
    fecha: hoy,
    creadasHoy: gestiones.filter((g) => String(g.fecha_solicitud).slice(0, 10) === hoy).length,
    cerradasHoy: (cierres as { fecha_evento: string }[] ?? []).filter((e) => String(e.fecha_evento).slice(0, 10) === hoy).length,
    activas: activas.length,
    conAlertas,
    slaExcedidos,
    canalRojo: activas.filter((g) => g.canal_selectivo === "rojo").length,
    docsPendientes: docsPend ?? 0,
    enRiesgo,
  }
}

export async function generarResumenDiario(): Promise<ResumenDia> {
  const sb = getSupabase()
  const r = await resumenDelDia()

  // Guarda la instantánea del día (idempotente por fecha).
  try {
    await sb.from("resumenes_diarios").upsert({ fecha: r.fecha, datos: r }, { onConflict: "fecha" })
  } catch {
    /* tabla ausente */
  }

  // Notifica a gerencia (admins).
  const admins = await idsAdmins()
  const msg =
    `📊 Resumen del día: ${r.creadasHoy} creadas, ${r.cerradasHoy} cerradas · ${r.activas} activas · ` +
    `${r.conAlertas} con alertas (${r.slaExcedidos} exceden SLA) · ${r.enRiesgo} en riesgo de retraso · ${r.docsPendientes} docs pendientes.`
  const filas = admins.map((uid) => ({ usuario_id: uid, tipo: "resumen_diario", mensaje: msg, gestion_id: null }))
  if (filas.length) await sb.from("notificaciones").insert(filas)

  return r
}

// Historial de resúmenes (para la vista de gerencia).
export async function resumenesRecientes(limite = 7): Promise<ResumenDia[]> {
  const sb = getSupabase()
  const { data, error } = await sb.from("resumenes_diarios").select("datos").order("fecha", { ascending: false }).limit(limite)
  if (error) return []
  return (data as { datos: ResumenDia }[] ?? []).map((r) => r.datos)
}
