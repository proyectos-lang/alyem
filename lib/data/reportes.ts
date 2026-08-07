import { getSupabase } from "../supabase/server"
import { estadosActuales, type GestionConEstado } from "./gestiones"
import { empresasVisibles } from "./asignaciones"
import { fecha, fechaHora } from "../format"
import type { Usuario } from "../types"

export interface FiltrosReporte {
  empresaId?: string
  desde?: string
  hasta?: string
  base?: "eta" | "solicitud" // campo sobre el que se filtra el rango
  regimen?: string // regimen_id
  tipo?: string // tipo_operacion
  documento?: string // texto a buscar en campos de documento
  producto?: string // texto a buscar en campos de producto
}

export interface FilaReporte extends GestionConEstado {
  doc_transporte?: string | null
  regimen_nombre?: string | null
}

const SEL =
  "*, empresa:empresas(id, nombre), aduana:aduanas(id, nombre, codigo)"

// Filas para el reporte, respetando el alcance por empresa (cliente / operador).
export async function filasReporte(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
  f: FiltrosReporte,
): Promise<FilaReporte[]> {
  const sb = getSupabase()
  let q = sb.from("gestiones").select(SEL).order("created_at", { ascending: false })

  // Alcance por empresa (cliente = su empresa, operador = sus clientes asignados).
  const vis = await empresasVisibles(usuario)
  if (vis) {
    if (vis.length === 0) return []
    q = q.in("empresa_id", vis)
  }
  // Filtro opcional por empresa (agencia), respetando el alcance.
  if (f.empresaId && (!vis || vis.includes(f.empresaId))) q = q.eq("empresa_id", f.empresaId)

  const campo = f.base === "solicitud" ? "fecha_solicitud" : "eta"
  if (f.desde) q = q.gte(campo, f.desde)
  if (f.hasta) q = q.lte(campo, f.hasta)

  // Filtros adicionales.
  if (f.tipo) q = q.eq("tipo_operacion", f.tipo)
  if (f.regimen) q = q.eq("regimen_id", f.regimen)
  if (f.documento?.trim()) {
    const t = `%${f.documento.trim()}%`
    q = q.or(
      [`numero_factura.ilike.${t}`, `numeros_factura.ilike.${t}`, `carta_porte.ilike.${t}`, `numero_np.ilike.${t}`, `correlativo_liquidacion.ilike.${t}`, `contenedores.ilike.${t}`].join(","),
    )
  }
  if (f.producto?.trim()) {
    const t = `%${f.producto.trim()}%`
    q = q.or([`descripcion_carga.ilike.${t}`, `marca.ilike.${t}`, `modelo.ilike.${t}`].join(","))
  }

  const { data } = await q
  const filas = (data as FilaReporte[]) ?? []
  if (filas.length === 0) return []

  // Estado actual derivado.
  const estados = await estadosActuales(filas.map((g) => g.id))
  for (const g of filas) g.estado = estados.get(g.id)

  // Nombre del régimen aduanero (resuelto aparte, resiliente si no existe el catálogo).
  const regIds = [...new Set(filas.map((g) => g.regimen_id).filter(Boolean))] as string[]
  if (regIds.length) {
    const { data: regs } = await sb.from("regimenes").select("id, nombre").in("id", regIds)
    const rmap = new Map((regs as { id: string; nombre: string }[] ?? []).map((r) => [r.id, r.nombre]))
    for (const g of filas) g.regimen_nombre = g.regimen_id ? rmap.get(g.regimen_id) ?? null : null
  }

  // Documento de transporte por gestión.
  const ids = filas.map((g) => g.id)
  const { data: docs } = await sb
    .from("documentos")
    .select("gestion_id, nombre_archivo, tipo:tipos_documento(nombre)")
    .in("gestion_id", ids)
  const docMap = new Map<string, string>()
  for (const d of (docs as any[]) ?? []) {
    if (d.tipo?.nombre === "Documento de transporte" && !docMap.has(d.gestion_id)) {
      docMap.set(d.gestion_id, d.nombre_archivo)
    }
  }
  for (const g of filas) g.doc_transporte = docMap.get(g.id) ?? null

  return filas
}

const CANAL: Record<string, string> = { verde: "Verde", amarillo: "Amarillo", rojo: "Rojo" }
const TIPO_OP: Record<string, string> = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" }
const tri = (v: boolean | null | undefined) => (v === true ? "Sí" : v === false ? "No" : "")

// Valor de una columna para una fila (mapeo al modelo).
export function valorColumna(g: FilaReporte, key: string): string {
  switch (key) {
    case "referencia": return g.referencia
    case "empresa": return g.empresa?.nombre ?? ""
    case "doc_transporte": return g.doc_transporte ?? ""
    case "factura": return g.numero_factura ?? ""
    case "proveedor": return g.proveedor ?? ""
    case "productos": return g.descripcion_carga ?? ""
    case "naviera": return g.naviera ?? ""
    case "eta": return g.eta ? fecha(g.eta) : ""
    case "fin_dias_libres": return g.fecha_fin_dias_libres ? fecha(g.fecha_fin_dias_libres) : ""
    case "pto_ingreso": return g.aduana?.nombre ?? ""
    case "observaciones": return g.naviera_observaciones ?? ""
    case "estatus": return g.estado?.nombre ?? ""
    case "despachado": return g.fecha_hora_despacho ? fechaHora(g.fecha_hora_despacho) : ""
    case "selectividad": return g.canal_selectivo ? (CANAL[g.canal_selectivo] ?? g.canal_selectivo) : ""
    case "correlativo": return g.correlativo_liquidacion ?? ""
    case "contenedor": return g.contenedores ?? ""
    case "manifiesto": return tri(g.manifiesto_presentado)
    case "prefijo": return g.aduana?.codigo ?? ""
    case "tipo_operacion": return TIPO_OP[g.tipo_operacion] ?? g.tipo_operacion
    case "regimen": return g.regimen_nombre ?? ""
    default: return ""
  }
}
