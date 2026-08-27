import { getSupabase } from "../supabase/server"
import { estadosActuales } from "./gestiones"
import { listarCalificaciones, promediosDimensiones, type PromedioDimension } from "./satisfaccion"

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const TIPO_OP: Record<string, string> = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito", duca_f: "DUCA F", transito_rapido: "Tránsito Rápido" }
const CANAL: Record<string, { nombre: string; color: string }> = {
  verde: { nombre: "Verde", color: "#22c55e" },
  amarillo: { nombre: "Amarillo", color: "#eab308" },
  rojo: { nombre: "Rojo", color: "#ef4444" },
}

export interface AnaliticaGerencial {
  totales: { total: number; activas: number; cerradas: number; canceladas: number; cifTotal: number; kilosTotal: number; clientes: number }
  serieDiaria: { dia: string; label: string; creadas: number; cerradas: number }[]
  serieMensual: { mes: string; label: string; creadas: number; cerradas: number; cif: number }[]
  serieAnual: { ano: string; creadas: number; cerradas: number; cif: number }[]
  porTipo: { nombre: string; valor: number }[]
  porRegimen: { nombre: string; valor: number }[]
  porAduana: { nombre: string; valor: number }[]
  porCliente: { nombre: string; valor: number }[]
  porOperador: { nombre: string; valor: number }[]
  porCanal: { nombre: string; valor: number; color: string }[]
  radar: PromedioDimension[]
  rango: { desde: string | null; hasta: string | null }
}

const cif = (g: any) => (g.valor_fob ?? 0) + (g.valor_flete ?? 0) + (g.valor_seguro ?? 0) + (g.otros_gastos ?? 0)
function inc(map: Map<string, number>, key: string, n = 1) {
  map.set(key, (map.get(key) ?? 0) + n)
}
function topN(map: Map<string, number>, resolver: (k: string) => string, n = 8) {
  return [...map.entries()]
    .map(([k, valor]) => ({ nombre: resolver(k), valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n)
}
// Helpers de fechas (comparación por string ISO 'YYYY-MM-DD', que ordena cronológicamente).
const dia = (f: unknown) => String(f).slice(0, 10)
function restarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
function diasEntre(desde: string, hasta: string): string[] {
  const out: string[] = []
  const d = new Date(`${desde}T00:00:00Z`)
  const end = new Date(`${hasta}T00:00:00Z`)
  let guard = 0
  while (d <= end && guard++ < 400) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
function mesesEntre(m0: string, m1: string): string[] {
  const out: string[] = []
  let [y, m] = m0.split("-").map(Number)
  const [ey, em] = m1.split("-").map(Number)
  let guard = 0
  while ((y < ey || (y === ey && m <= em)) && guard++ < 120) {
    out.push(`${y}-${String(m).padStart(2, "0")}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}
const etiquetaMes = (mes: string) => `${MES_CORTO[Number(mes.slice(5, 7)) - 1]} ${mes.slice(2, 4)}`
const etiquetaDia = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

export async function analiticaGerencial(
  opts: { desde?: string; hasta?: string } = {},
): Promise<AnaliticaGerencial> {
  const sb = getSupabase()
  const desde = opts.desde || null
  const hasta = opts.hasta || null
  const hayRango = !!(desde || hasta)

  const [{ data: gs }, { data: cierres }, { data: emps }, { data: adus }, { data: regs }, { data: usrs }, califs] = await Promise.all([
    sb.from("gestiones").select("id, fecha_solicitud, tipo_operacion, regimen_id, aduana_id, empresa_id, operador_id, valor_fob, valor_flete, valor_seguro, otros_gastos, kilos, canal_selectivo"),
    sb.from("eventos").select("gestion_id, fecha_evento, estado:estados_catalogo!inner(tipo)").eq("estado.tipo", "final"),
    sb.from("empresas").select("id, nombre"),
    sb.from("aduanas").select("id, nombre"),
    sb.from("regimenes").select("id, nombre"),
    sb.from("usuarios").select("id, nombre"),
    listarCalificaciones().catch(() => [] as any[]),
  ])
  const empNombre = new Map((emps as any[] ?? []).map((e) => [e.id, e.nombre]))
  const aduNombre = new Map((adus as any[] ?? []).map((a) => [a.id, a.nombre]))
  const regNombre = new Map((regs as any[] ?? []).map((r) => [r.id, r.nombre]))
  const usrNombre = new Map((usrs as any[] ?? []).map((u) => [u.id, u.nombre]))

  // Filtro por rango (inclusive). Operaciones por fecha_solicitud; cierres por fecha_evento.
  const enRango = (f: unknown) => {
    const d = dia(f)
    return (!desde || d >= desde) && (!hasta || d <= hasta)
  }
  const gestiones = (hayRango ? ((gs as any[]) ?? []).filter((g) => enRango(g.fecha_solicitud)) : ((gs as any[]) ?? []))
  const cierresR = (hayRango ? ((cierres as any[]) ?? []).filter((e) => enRango(e.fecha_evento)) : ((cierres as any[]) ?? []))

  // Clasificación activa/cerrada/cancelada (estado actual de las del rango).
  const estados = await estadosActuales(gestiones.map((g) => g.id))
  let activas = 0, cerradas = 0, canceladas = 0
  for (const g of gestiones) {
    const t = estados.get(g.id)?.tipo
    if (t === "final") cerradas++
    else if (t === "cancelada") canceladas++
    else activas++
  }

  // Mapas por día/mes/año (sobre el conjunto ya filtrado por rango).
  const diaCreadas = new Map<string, number>()
  const diaCerradas = new Map<string, number>()
  const mesCreadas = new Map<string, number>()
  const mesCerradas = new Map<string, number>()
  const mesCif = new Map<string, number>()
  const anoCreadas = new Map<string, number>()
  const anoCerradas = new Map<string, number>()
  const anoCif = new Map<string, number>()
  let cifTotal = 0, kilosTotal = 0

  for (const g of gestiones) {
    const d = dia(g.fecha_solicitud)
    const c = cif(g)
    inc(diaCreadas, d)
    inc(mesCreadas, d.slice(0, 7))
    inc(anoCreadas, d.slice(0, 4))
    inc(mesCif, d.slice(0, 7), c)
    inc(anoCif, d.slice(0, 4), c)
    cifTotal += c
    kilosTotal += g.kilos ?? 0
  }
  for (const e of cierresR) {
    const d = dia(e.fecha_evento)
    inc(diaCerradas, d)
    inc(mesCerradas, d.slice(0, 7))
    inc(anoCerradas, d.slice(0, 4))
  }

  // Serie diaria: rango elegido, o últimos 30 días por defecto. Acotada a <= 366 días.
  const hoyStr = new Date().toISOString().slice(0, 10)
  const dwEnd = hasta || hoyStr
  let dwStart = desde || restarDias(dwEnd, 29)
  const limiteStart = restarDias(dwEnd, 365)
  if (dwStart < limiteStart) dwStart = limiteStart
  const serieDiaria = diasEntre(dwStart, dwEnd).map((d) => ({
    dia: d,
    label: etiquetaDia(d),
    creadas: diaCreadas.get(d) ?? 0,
    cerradas: diaCerradas.get(d) ?? 0,
  }))

  // Serie mensual: meses del rango, o últimos 24 meses por defecto.
  let serieMensual: AnaliticaGerencial["serieMensual"]
  if (hayRango) {
    const m0 = (desde ?? (hasta as string)).slice(0, 7)
    const m1 = (hasta ?? (desde as string)).slice(0, 7)
    serieMensual = mesesEntre(m0, m1).map((mes) => ({
      mes,
      label: etiquetaMes(mes),
      creadas: mesCreadas.get(mes) ?? 0,
      cerradas: mesCerradas.get(mes) ?? 0,
      cif: Math.round(mesCif.get(mes) ?? 0),
    }))
  } else {
    const hoy = new Date()
    serieMensual = []
    for (let i = 23; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      serieMensual.push({
        mes,
        label: `${MES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        creadas: mesCreadas.get(mes) ?? 0,
        cerradas: mesCerradas.get(mes) ?? 0,
        cif: Math.round(mesCif.get(mes) ?? 0),
      })
    }
  }

  const anos = [...new Set([...anoCreadas.keys(), ...anoCerradas.keys()])].sort()
  const serieAnual = anos.map((ano) => ({
    ano,
    creadas: anoCreadas.get(ano) ?? 0,
    cerradas: anoCerradas.get(ano) ?? 0,
    cif: Math.round(anoCif.get(ano) ?? 0),
  }))

  // Distribuciones (sobre el conjunto filtrado).
  const tipoMap = new Map<string, number>()
  const regMap = new Map<string, number>()
  const aduMap = new Map<string, number>()
  const cliMap = new Map<string, number>()
  const opMap = new Map<string, number>()
  const canalMap = new Map<string, number>()
  let sinOperador = 0
  for (const g of gestiones) {
    inc(tipoMap, g.tipo_operacion)
    if (g.regimen_id) inc(regMap, g.regimen_id)
    if (g.aduana_id) inc(aduMap, g.aduana_id)
    if (g.empresa_id) inc(cliMap, g.empresa_id)
    if (g.operador_id) inc(opMap, g.operador_id)
    else sinOperador++
    if (g.canal_selectivo) inc(canalMap, g.canal_selectivo)
  }
  // Órdenes generadas por operador (todos, ordenados desc; sin asignar al final).
  const porOperador = [...opMap.entries()]
    .map(([k, valor]) => ({ nombre: usrNombre.get(k) ?? "—", valor }))
    .sort((a, b) => b.valor - a.valor)
  if (sinOperador > 0) porOperador.push({ nombre: "Sin asignar", valor: sinOperador })

  return {
    totales: {
      total: gestiones.length,
      activas,
      cerradas,
      canceladas,
      cifTotal: Math.round(cifTotal),
      kilosTotal: Math.round(kilosTotal),
      clientes: new Set(gestiones.map((g) => g.empresa_id)).size,
    },
    serieDiaria,
    serieMensual,
    serieAnual,
    porTipo: [...tipoMap.entries()].map(([k, valor]) => ({ nombre: TIPO_OP[k] ?? k, valor })),
    porRegimen: topN(regMap, (k) => regNombre.get(k) ?? "—"),
    porAduana: topN(aduMap, (k) => aduNombre.get(k) ?? "—"),
    porCliente: topN(cliMap, (k) => empNombre.get(k) ?? "—"),
    porOperador,
    porCanal: [...canalMap.entries()].map(([k, valor]) => ({ nombre: CANAL[k]?.nombre ?? k, valor, color: CANAL[k]?.color ?? "#94a3b8" })),
    radar: promediosDimensiones(califs),
    rango: { desde, hasta },
  }
}
