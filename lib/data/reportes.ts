import { getSupabase } from "../supabase/server"
import { estadosActuales, type GestionConEstado } from "./gestiones"
import { fecha, fechaHora } from "../format"
import type { Usuario } from "../types"

export interface FiltrosReporte {
  empresaId?: string
  desde?: string
  hasta?: string
  base?: "eta" | "solicitud" // campo sobre el que se filtra el rango
}

export interface FilaReporte extends GestionConEstado {
  doc_transporte?: string | null
}

const SEL =
  "*, empresa:empresas(id, nombre), aduana:aduanas(id, nombre, codigo)"

// Filas para el reporte, respetando aislamiento por empresa (cliente).
export async function filasReporte(
  usuario: Pick<Usuario, "rol" | "empresa_id">,
  f: FiltrosReporte,
): Promise<FilaReporte[]> {
  const sb = getSupabase()
  let q = sb.from("gestiones").select(SEL).order("created_at", { ascending: false })

  // Aislamiento: el cliente siempre ve solo su empresa.
  if (usuario.rol === "cliente") {
    if (!usuario.empresa_id) return []
    q = q.eq("empresa_id", usuario.empresa_id)
  } else if (f.empresaId) {
    q = q.eq("empresa_id", f.empresaId)
  }

  const campo = f.base === "solicitud" ? "fecha_solicitud" : "eta"
  if (f.desde) q = q.gte(campo, f.desde)
  if (f.hasta) q = q.lte(campo, f.hasta)

  const { data } = await q
  const filas = (data as FilaReporte[]) ?? []
  if (filas.length === 0) return []

  // Estado actual derivado.
  const estados = await estadosActuales(filas.map((g) => g.id))
  for (const g of filas) g.estado = estados.get(g.id)

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
    default: return ""
  }
}
