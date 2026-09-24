import { getSupabase } from "../supabase/server"
import { listarGestiones, getEstadosCatalogo } from "./gestiones"
import { diasEnEtapa, alertasDe, tiemposEntreProcesos } from "./metricas"
import { predecirRetrasos } from "./prediccion"
import { estadoUtoh } from "../utoh"
import { getConfig } from "../config"
import { notificarEmpresa } from "../actions/notificaciones"

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

// ---- Alerta de vencimiento de exportación temporal --------------------------
// Notifica al operador y al cliente cuando faltan 14 días o menos para la fecha
// de vencimiento de una exportación temporal (una sola vez por operación).
const DIAS_ALERTA_VENCIMIENTO = 14
export async function alertarVencimientosExportacionTemporal(): Promise<{ alertados: number }> {
  const sb = getSupabase()
  const gestiones = await listarGestiones(ADMIN_VIRTUAL)
  const activas = gestiones.filter(
    (g) => g.tipo_operacion === "exportacion_temporal" && g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada",
  )
  if (activas.length === 0) return { alertados: 0 }

  const { data: previos } = await sb.from("alertas_vencimiento").select("gestion_id")
  const yaAlertado = new Set((previos as { gestion_id: string }[] ?? []).map((r) => r.gestion_id))

  const hoy = new Date(hoyISO()).getTime()
  let alertados = 0
  for (const g of activas) {
    const venc = (g as { fecha_vencimiento?: string | null }).fecha_vencimiento
    if (!venc) continue
    const dias = Math.ceil((new Date(venc).getTime() - hoy) / 86_400_000)
    if (dias > DIAS_ALERTA_VENCIMIENTO) continue // aún lejos
    if (yaAlertado.has(g.id)) continue

    const { error } = await sb.from("alertas_vencimiento").insert({ gestion_id: g.id })
    if (error) continue // tabla ausente o conflicto único

    const msg =
      dias < 0
        ? `⚠️ ${g.referencia}: la exportación temporal VENCIÓ hace ${Math.abs(dias)} día(s).`
        : `⏳ ${g.referencia}: la exportación temporal vence en ${dias} día(s) (${venc}).`
    // Cliente (empresa) + operador de la operación.
    await notificarEmpresa(g.empresa_id, "vencimiento_temporal", msg, g.id)
    if (g.operador_id) {
      await sb.from("notificaciones").insert({ usuario_id: g.operador_id, tipo: "vencimiento_temporal", gestion_id: g.id, mensaje: msg })
    }
    alertados++
  }
  return { alertados }
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
  utohVencidos: number
  utohPorVencer: number
}

export async function resumenDelDia(): Promise<ResumenDia> {
  const sb = getSupabase()
  const [gestiones, estados, diasFriaStr, slaStr, tiempos, { data: cierres }, { count: docsPend }, { data: empsUtoh }] = await Promise.all([
    listarGestiones(ADMIN_VIRTUAL),
    getEstadosCatalogo(),
    getConfig("dias_gestion_fria"),
    getConfig("sla_dias_proceso"),
    tiemposEntreProcesos(),
    sb.from("eventos").select("fecha_evento, estado:estados_catalogo!inner(tipo)").eq("estado.tipo", "final"),
    sb.from("documentos_requeridos").select("id", { count: "exact", head: true }).eq("cumplido", false),
    sb.from("empresas").select("utoh_vencimiento").eq("activo", true),
  ])
  const diasFria = Number(diasFriaStr ?? "4")
  const sla = Number(slaStr ?? "15")
  const hoy = hoyISO()

  // Alarma de permisos UTOH (vencidos / por vencer). Resiliente si aún no migrado.
  let utohVencidos = 0, utohPorVencer = 0
  for (const e of (empsUtoh as { utoh_vencimiento: string | null }[] ?? [])) {
    const s = estadoUtoh(e.utoh_vencimiento).estado
    if (s === "vencido") utohVencidos++
    else if (s === "por_vencer") utohPorVencer++
  }

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
    utohVencidos,
    utohPorVencer,
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
  const utohMsg = r.utohVencidos || r.utohPorVencer ? ` · ⚠️ UTOH: ${r.utohVencidos} vencido(s), ${r.utohPorVencer} por vencer` : ""
  const msg =
    `📊 Resumen del día: ${r.creadasHoy} creadas, ${r.cerradasHoy} cerradas · ${r.activas} activas · ` +
    `${r.conAlertas} con alertas (${r.slaExcedidos} exceden SLA) · ${r.enRiesgo} en riesgo de retraso · ${r.docsPendientes} docs pendientes${utohMsg}.`
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
