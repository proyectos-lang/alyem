import { getSupabase } from "../supabase/server"
import { estadosActuales } from "./gestiones"
import { listarCalificaciones, promediosDimensiones, type PromedioDimension } from "./satisfaccion"

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const TIPO_OP: Record<string, string> = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" }
const CANAL: Record<string, { nombre: string; color: string }> = {
  verde: { nombre: "Verde", color: "#22c55e" },
  amarillo: { nombre: "Amarillo", color: "#eab308" },
  rojo: { nombre: "Rojo", color: "#ef4444" },
}

export interface AnaliticaGerencial {
  totales: { total: number; activas: number; cerradas: number; canceladas: number; cifTotal: number; kilosTotal: number; clientes: number }
  serieMensual: { mes: string; label: string; creadas: number; cerradas: number; cif: number }[]
  serieAnual: { ano: string; creadas: number; cerradas: number; cif: number }[]
  porTipo: { nombre: string; valor: number }[]
  porRegimen: { nombre: string; valor: number }[]
  porAduana: { nombre: string; valor: number }[]
  porCliente: { nombre: string; valor: number }[]
  porCanal: { nombre: string; valor: number; color: string }[]
  radar: PromedioDimension[]
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

export async function analiticaGerencial(): Promise<AnaliticaGerencial> {
  const sb = getSupabase()
  const [{ data: gs }, { data: cierres }, { data: emps }, { data: adus }, { data: regs }, califs] = await Promise.all([
    sb.from("gestiones").select("id, fecha_solicitud, tipo_operacion, regimen_id, aduana_id, empresa_id, valor_fob, valor_flete, valor_seguro, otros_gastos, kilos, canal_selectivo"),
    sb.from("eventos").select("gestion_id, fecha_evento, estado:estados_catalogo!inner(tipo)").eq("estado.tipo", "final"),
    sb.from("empresas").select("id, nombre"),
    sb.from("aduanas").select("id, nombre"),
    sb.from("regimenes").select("id, nombre"),
    listarCalificaciones().catch(() => [] as any[]),
  ])
  const gestiones = (gs as any[]) ?? []
  const empNombre = new Map((emps as any[] ?? []).map((e) => [e.id, e.nombre]))
  const aduNombre = new Map((adus as any[] ?? []).map((a) => [a.id, a.nombre]))
  const regNombre = new Map((regs as any[] ?? []).map((r) => [r.id, r.nombre]))

  // Clasificación activa/cerrada/cancelada.
  const estados = await estadosActuales(gestiones.map((g) => g.id))
  let activas = 0, cerradas = 0, canceladas = 0
  for (const g of gestiones) {
    const t = estados.get(g.id)?.tipo
    if (t === "final") cerradas++
    else if (t === "cancelada") canceladas++
    else activas++
  }

  // Serie mensual (últimos 24 meses) y anual.
  const mesCreadas = new Map<string, number>()
  const mesCerradas = new Map<string, number>()
  const mesCif = new Map<string, number>()
  const anoCreadas = new Map<string, number>()
  const anoCerradas = new Map<string, number>()
  const anoCif = new Map<string, number>()
  let cifTotal = 0, kilosTotal = 0

  for (const g of gestiones) {
    const mes = String(g.fecha_solicitud).slice(0, 7)
    const ano = String(g.fecha_solicitud).slice(0, 4)
    const c = cif(g)
    inc(mesCreadas, mes)
    inc(anoCreadas, ano)
    inc(mesCif, mes, c)
    inc(anoCif, ano, c)
    cifTotal += c
    kilosTotal += g.kilos ?? 0
  }
  for (const e of (cierres as any[]) ?? []) {
    const mes = String(e.fecha_evento).slice(0, 7)
    inc(mesCerradas, mes)
    inc(anoCerradas, String(e.fecha_evento).slice(0, 4))
  }

  // Ventana de últimos 24 meses (aunque no tengan datos).
  const hoy = new Date()
  const serieMensual: AnaliticaGerencial["serieMensual"] = []
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

  const anos = [...new Set([...anoCreadas.keys(), ...anoCerradas.keys()])].sort()
  const serieAnual = anos.map((ano) => ({
    ano,
    creadas: anoCreadas.get(ano) ?? 0,
    cerradas: anoCerradas.get(ano) ?? 0,
    cif: Math.round(anoCif.get(ano) ?? 0),
  }))

  // Distribuciones.
  const tipoMap = new Map<string, number>()
  const regMap = new Map<string, number>()
  const aduMap = new Map<string, number>()
  const cliMap = new Map<string, number>()
  const canalMap = new Map<string, number>()
  for (const g of gestiones) {
    inc(tipoMap, g.tipo_operacion)
    if (g.regimen_id) inc(regMap, g.regimen_id)
    if (g.aduana_id) inc(aduMap, g.aduana_id)
    if (g.empresa_id) inc(cliMap, g.empresa_id)
    if (g.canal_selectivo) inc(canalMap, g.canal_selectivo)
  }

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
    serieMensual,
    serieAnual,
    porTipo: [...tipoMap.entries()].map(([k, valor]) => ({ nombre: TIPO_OP[k] ?? k, valor })),
    porRegimen: topN(regMap, (k) => regNombre.get(k) ?? "—"),
    porAduana: topN(aduMap, (k) => aduNombre.get(k) ?? "—"),
    porCliente: topN(cliMap, (k) => empNombre.get(k) ?? "—"),
    porCanal: [...canalMap.entries()].map(([k, valor]) => ({ nombre: CANAL[k]?.nombre ?? k, valor, color: CANAL[k]?.color ?? "#94a3b8" })),
    radar: promediosDimensiones(califs),
  }
}
