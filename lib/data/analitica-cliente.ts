import { getSupabase } from "../supabase/server"
import { estadosActuales } from "./gestiones"

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const TIPO_OP: Record<string, string> = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito", duca_f: "DUCA F", transito_rapido: "Tránsito Rápido" }
const CANAL: Record<string, { nombre: string; color: string }> = {
  verde: { nombre: "Verde", color: "#22c55e" },
  amarillo: { nombre: "Amarillo", color: "#eab308" },
  rojo: { nombre: "Rojo", color: "#ef4444" },
}

export interface AnaliticaCliente {
  totales: { total: number; activas: number; cerradas: number; fobTotal: number; cifTotal: number; kilosTotal: number; diasPromedioCierre: number | null }
  serieMensual: { mes: string; label: string; operaciones: number; fob: number }[]
  porEstado: { nombre: string; valor: number; color: string }[]
  porTipo: { nombre: string; valor: number }[]
  porAduana: { nombre: string; valor: number }[]
  porRegimen: { nombre: string; valor: number }[]
  porCanal: { nombre: string; valor: number; color: string }[]
}

const cif = (g: any) => (g.valor_fob ?? 0) + (g.valor_flete ?? 0) + (g.valor_seguro ?? 0) + (g.otros_gastos ?? 0)
function inc(map: Map<string, number>, key: string, n = 1) {
  map.set(key, (map.get(key) ?? 0) + n)
}
function topN(map: Map<string, number>, resolver: (k: string) => string, n = 8) {
  return [...map.entries()].map(([k, valor]) => ({ nombre: resolver(k), valor })).sort((a, b) => b.valor - a.valor).slice(0, n)
}

const DIA = 86_400_000

export async function analiticaCliente(empresaId: string): Promise<AnaliticaCliente> {
  const sb = getSupabase()
  const { data: gs } = await sb
    .from("gestiones")
    .select("id, fecha_solicitud, tipo_operacion, regimen_id, aduana_id, valor_fob, valor_flete, valor_seguro, otros_gastos, kilos, canal_selectivo")
    .eq("empresa_id", empresaId)
  const gestiones = (gs as any[]) ?? []
  const ids = gestiones.map((g) => g.id)

  const [{ data: adus }, { data: regs }, estados] = await Promise.all([
    sb.from("aduanas").select("id, nombre"),
    sb.from("regimenes").select("id, nombre"),
    estadosActuales(ids),
  ])
  const aduNombre = new Map((adus as any[] ?? []).map((a) => [a.id, a.nombre]))
  const regNombre = new Map((regs as any[] ?? []).map((r) => [r.id, r.nombre]))

  // Clasificación + distribución por estado actual (activas).
  const estadoDist = new Map<string, { valor: number; color: string }>()
  let activas = 0, cerradas = 0
  const diasCierre: number[] = []
  for (const g of gestiones) {
    const e = estados.get(g.id)
    if (e?.tipo === "final") {
      cerradas++
      diasCierre.push((new Date(e.fecha).getTime() - new Date(g.fecha_solicitud).getTime()) / DIA)
    } else if (e?.tipo === "cancelada") {
      // no cuenta como activa
    } else {
      activas++
      const nom = e?.nombre ?? "Sin estado"
      const cur = estadoDist.get(nom) ?? { valor: 0, color: e?.color ?? "#94a3b8" }
      cur.valor++
      estadoDist.set(nom, cur)
    }
  }

  // Serie mensual (últimos 12 meses): operaciones y FOB.
  const mesOps = new Map<string, number>()
  const mesFob = new Map<string, number>()
  let fobTotal = 0, cifTotal = 0, kilosTotal = 0
  for (const g of gestiones) {
    const mes = String(g.fecha_solicitud).slice(0, 7)
    inc(mesOps, mes)
    inc(mesFob, mes, g.valor_fob ?? 0)
    fobTotal += g.valor_fob ?? 0
    cifTotal += cif(g)
    kilosTotal += g.kilos ?? 0
  }
  const hoy = new Date()
  const serieMensual: AnaliticaCliente["serieMensual"] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    serieMensual.push({
      mes,
      label: `${MES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      operaciones: mesOps.get(mes) ?? 0,
      fob: Math.round(mesFob.get(mes) ?? 0),
    })
  }

  // Distribuciones.
  const tipoMap = new Map<string, number>()
  const aduMap = new Map<string, number>()
  const regMap = new Map<string, number>()
  const canalMap = new Map<string, number>()
  for (const g of gestiones) {
    inc(tipoMap, g.tipo_operacion)
    if (g.aduana_id) inc(aduMap, g.aduana_id)
    if (g.regimen_id) inc(regMap, g.regimen_id)
    if (g.canal_selectivo) inc(canalMap, g.canal_selectivo)
  }

  return {
    totales: {
      total: gestiones.length,
      activas,
      cerradas,
      fobTotal: Math.round(fobTotal),
      cifTotal: Math.round(cifTotal),
      kilosTotal: Math.round(kilosTotal),
      diasPromedioCierre: diasCierre.length ? Math.round((diasCierre.reduce((a, b) => a + b, 0) / diasCierre.length) * 10) / 10 : null,
    },
    serieMensual,
    porEstado: [...estadoDist.entries()].map(([nombre, v]) => ({ nombre, valor: v.valor, color: v.color })),
    porTipo: [...tipoMap.entries()].map(([k, valor]) => ({ nombre: TIPO_OP[k] ?? k, valor })),
    porAduana: topN(aduMap, (k) => aduNombre.get(k) ?? "—"),
    porRegimen: topN(regMap, (k) => regNombre.get(k) ?? "—"),
    porCanal: [...canalMap.entries()].map(([k, valor]) => ({ nombre: CANAL[k]?.nombre ?? k, valor, color: CANAL[k]?.color ?? "#94a3b8" })),
  }
}
