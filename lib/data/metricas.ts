import { getSupabase } from "../supabase/server"
import type { GestionConEstado } from "./gestiones"

const DIA = 86_400_000

export interface TiempoEtapa {
  etapa: string
  orden: number
  color: string
  dias: number
  n: number
}

// Tiempo promedio (en días) que transcurre en cada etapa antes de pasar a la
// siguiente, calculado sobre los eventos de estado de todas las operaciones.
export async function tiemposEntreProcesos(): Promise<TiempoEtapa[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("eventos")
    .select("gestion_id, fecha_evento, estado:estados_catalogo(nombre, orden, color)")
    .eq("tipo", "estado")
    .order("fecha_evento", { ascending: true })

  const porGestion = new Map<string, { nombre: string; orden: number; color: string; t: number }[]>()
  for (const e of (data as any[]) ?? []) {
    if (!e.estado?.nombre) continue
    const arr = porGestion.get(e.gestion_id) ?? []
    arr.push({ nombre: e.estado.nombre, orden: e.estado.orden, color: e.estado.color, t: new Date(e.fecha_evento).getTime() })
    porGestion.set(e.gestion_id, arr)
  }
  const acc = new Map<string, { orden: number; color: string; suma: number; n: number }>()
  for (const arr of porGestion.values()) {
    for (let i = 0; i < arr.length - 1; i++) {
      const dias = (arr[i + 1].t - arr[i].t) / DIA
      const c = acc.get(arr[i].nombre) ?? { orden: arr[i].orden, color: arr[i].color, suma: 0, n: 0 }
      c.suma += dias
      c.n++
      acc.set(arr[i].nombre, c)
    }
  }
  return [...acc.entries()]
    .map(([etapa, { orden, color, suma, n }]) => ({ etapa, orden, color, dias: Math.round((suma / n) * 10) / 10, n }))
    .sort((a, b) => a.orden - b.orden)
}

// Métricas por operación (para la torre de control).
export function diasEnEtapa(g: GestionConEstado): number | null {
  const ref = g.estado?.fecha
  if (!ref) return null
  return Math.floor((Date.now() - new Date(ref).getTime()) / DIA)
}
export function diasTotales(g: GestionConEstado): number {
  return Math.floor((Date.now() - new Date(g.fecha_solicitud).getTime()) / DIA)
}
export function diasLibresRestantes(g: { fecha_fin_dias_libres: string | null }): number | null {
  if (!g.fecha_fin_dias_libres) return null
  return Math.ceil((new Date(g.fecha_fin_dias_libres).getTime() - Date.now()) / DIA)
}

export interface Alerta {
  tipo: "fria" | "canal_rojo" | "libres" | "libres_vencidos" | "sla_etapa"
  etiqueta: string
  severidad: "warning" | "danger"
}

// `slaEtapa` = SLA en días de la etapa actual (de estados_catalogo.sla_dias), si aplica.
export function alertasDe(g: GestionConEstado, diasFria: number, slaEtapa?: number | null): Alerta[] {
  const out: Alerta[] = []
  const esFinal = g.estado?.tipo === "final" || g.estado?.tipo === "cancelada"
  if (esFinal) return out
  const sinAct = diasEnEtapa(g)
  if (sinAct != null && sinAct >= diasFria) out.push({ tipo: "fria", etiqueta: `Sin avanzar ${sinAct}d`, severidad: "warning" })
  if (slaEtapa != null && slaEtapa > 0 && sinAct != null && sinAct >= slaEtapa)
    out.push({ tipo: "sla_etapa", etiqueta: `Excede SLA de etapa (${slaEtapa}d)`, severidad: "danger" })
  if (g.canal_selectivo === "rojo") out.push({ tipo: "canal_rojo", etiqueta: "Canal rojo", severidad: "danger" })
  const libres = diasLibresRestantes(g)
  if (libres != null) {
    if (libres < 0) out.push({ tipo: "libres_vencidos", etiqueta: "Días libres vencidos", severidad: "danger" })
    else if (libres <= 5) out.push({ tipo: "libres", etiqueta: `Quedan ${libres}d libres`, severidad: "warning" })
  }
  return out
}

// Resumen global para el Balanced Scorecard.
export interface ResumenBSC {
  total: number
  activas: number
  cerradas: number
  canceladas: number
  diasPromedioCierre: number | null
  slaObjetivo: number
  cumplenSla: number
  totalConCierre: number
  canal: { verde: number; amarillo: number; rojo: number }
  docsTotal: number
  docsAceptados: number
  docsPendientes: number
  satisfaccionPromedio: number | null
  calificaciones: number
  calificacionesBajas: number
}

export async function resumenBSC(gestiones: GestionConEstado[], slaObjetivo: number): Promise<ResumenBSC> {
  const sb = getSupabase()
  const activas = gestiones.filter((g) => g.estado?.tipo !== "final" && g.estado?.tipo !== "cancelada").length
  const cerradas = gestiones.filter((g) => g.estado?.tipo === "final").length
  const canceladas = gestiones.filter((g) => g.estado?.tipo === "cancelada").length

  // Días de solicitud a cierre (para las cerradas) desde el evento final.
  const cerradasIds = gestiones.filter((g) => g.estado?.tipo === "final").map((g) => g.id)
  let diasPromedioCierre: number | null = null
  let cumplenSla = 0
  if (cerradasIds.length) {
    const tiempos = gestiones
      .filter((g) => g.estado?.tipo === "final" && g.estado?.fecha)
      .map((g) => (new Date(g.estado!.fecha).getTime() - new Date(g.fecha_solicitud).getTime()) / DIA)
    if (tiempos.length) {
      diasPromedioCierre = Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 10) / 10
      cumplenSla = tiempos.filter((d) => d <= slaObjetivo).length
    }
  }

  const canal = {
    verde: gestiones.filter((g) => g.canal_selectivo === "verde").length,
    amarillo: gestiones.filter((g) => g.canal_selectivo === "amarillo").length,
    rojo: gestiones.filter((g) => g.canal_selectivo === "rojo").length,
  }

  const [{ data: docs }, { data: califs }] = await Promise.all([
    sb.from("documentos").select("estado"),
    sb.from("calificaciones").select("estrellas"),
  ])
  const docsArr = (docs as { estado: string }[]) ?? []
  const califArr = (califs as { estrellas: number }[]) ?? []
  const satisfaccionPromedio = califArr.length
    ? Math.round((califArr.reduce((a, b) => a + b.estrellas, 0) / califArr.length) * 10) / 10
    : null

  return {
    total: gestiones.length,
    activas,
    cerradas,
    canceladas,
    diasPromedioCierre,
    slaObjetivo,
    cumplenSla,
    totalConCierre: cerradasIds.length,
    canal,
    docsTotal: docsArr.length,
    docsAceptados: docsArr.filter((d) => d.estado === "aceptado").length,
    docsPendientes: docsArr.filter((d) => d.estado === "pendiente").length,
    satisfaccionPromedio,
    calificaciones: califArr.length,
    calificacionesBajas: califArr.filter((c) => c.estrellas <= 3).length,
  }
}

// ---- Tendencias para la torre de control ----------------------------------
export interface Tendencias {
  meses: { mes: string; creadas: number; cerradas: number }[]
  etapas: { etapa: string; dias: number; color: string; sla: number | null }[]
}

function claveMes(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

export async function tendenciasTorre(): Promise<Tendencias> {
  const sb = getSupabase()
  const [{ data: creadasRaw }, { data: cerradasRaw }, { data: estadosRaw }, tiempos] = await Promise.all([
    sb.from("gestiones").select("fecha_solicitud"),
    sb.from("eventos").select("fecha_evento, estado:estados_catalogo!inner(tipo)").eq("estado.tipo", "final"),
    sb.from("estados_catalogo").select("nombre, sla_dias"),
    tiemposEntreProcesos(),
  ])

  // Últimos 6 meses (incluye el actual), etiquetados YYYY-MM.
  const hoy = new Date()
  const meses: { mes: string; creadas: number; cerradas: number }[] = []
  const idx = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    idx.set(key, meses.length)
    meses.push({ mes: key, creadas: 0, cerradas: 0 })
  }
  for (const g of (creadasRaw as { fecha_solicitud: string }[]) ?? []) {
    const i = idx.get(claveMes(g.fecha_solicitud))
    if (i != null) meses[i].creadas++
  }
  for (const e of (cerradasRaw as { fecha_evento: string }[]) ?? []) {
    const i = idx.get(claveMes(e.fecha_evento))
    if (i != null) meses[i].cerradas++
  }

  const slaPorEtapa = new Map<string, number | null>()
  for (const s of (estadosRaw as { nombre: string; sla_dias: number | null }[]) ?? []) slaPorEtapa.set(s.nombre, s.sla_dias)

  return {
    meses,
    etapas: tiempos.map((t) => ({ etapa: t.etapa, dias: t.dias, color: t.color, sla: slaPorEtapa.get(t.etapa) ?? null })),
  }
}
