import { getSupabase } from "../supabase/server"
import { estadosActuales, type GestionConEstado } from "./gestiones"
import { empresasVisibles } from "./asignaciones"
import { fecha, fechaHora } from "../format"
import { labelTipoOperacion } from "../tipos-operacion"
import type { Usuario } from "../types"

export interface FiltrosReporte {
  empresaId?: string
  operadorId?: string // operador_id (agencia)
  desde?: string
  hasta?: string
  base?: "eta" | "solicitud" // campo sobre el que se filtra el rango
  regimen?: string // regimen_id
  tipo?: string // tipo_operacion
  documento?: string // texto a buscar en campos de documento
  producto?: string // texto a buscar en campos de producto
}

export interface TrackingResumen {
  ubicacion: string | null
  puerto_carga: string | null
  puerto_descarga: string | null
  eta_destino: string | null
  atd_origen: string | null
  vessel: string | null
  ultimo_movimiento: string | null
  created_at: string
}

export interface FilaReporte extends GestionConEstado {
  doc_transporte?: string | null
  regimen_nombre?: string | null
  tracking?: TrackingResumen | null
  aduana_salida?: { id: string; nombre: string; codigo: string } | null
}

const SEL =
  "*, empresa:empresas(id, nombre), operador:usuarios!gestiones_operador_id_fkey(id, nombre), aduana:aduanas!gestiones_aduana_id_fkey(id, nombre, codigo)"

// Filas para el reporte, respetando el alcance por empresa (cliente / operador).
export async function filasReporte(
  usuario: Pick<Usuario, "id" | "rol" | "empresa_id">,
  f: FiltrosReporte,
): Promise<FilaReporte[]> {
  const sb = getSupabase()
  // Orden por proximidad de llegada (ETA ascendente; sin ETA al final).
  let q = sb
    .from("gestiones")
    .select(SEL)
    .order("eta", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  // Alcance por empresa (cliente = su empresa, operador = sus clientes asignados).
  const vis = await empresasVisibles(usuario)
  if (vis) {
    if (vis.length === 0) return []
    q = q.in("empresa_id", vis)
  }
  // Filtro opcional por empresa (agencia), respetando el alcance.
  if (f.empresaId && (!vis || vis.includes(f.empresaId))) q = q.eq("empresa_id", f.empresaId)
  // Filtro opcional por operador (agencia).
  if (f.operadorId) q = q.eq("operador_id", f.operadorId)

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

  // Aduana de salida (resuelta aparte, resiliente si la columna aún no existe).
  try {
    const salIds = [...new Set(filas.map((g) => (g as { aduana_salida_id?: string | null }).aduana_salida_id).filter(Boolean))] as string[]
    if (salIds.length) {
      const { data: ads } = await sb.from("aduanas").select("id, nombre, codigo").in("id", salIds)
      const amap = new Map((ads as { id: string; nombre: string; codigo: string }[] ?? []).map((a) => [a.id, a]))
      for (const g of filas) {
        const sid = (g as { aduana_salida_id?: string | null }).aduana_salida_id
        g.aduana_salida = sid ? amap.get(sid) ?? null : null
      }
    }
  } catch {
    /* columna aduana_salida_id inexistente (pre-migración): se ignora */
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

  // Tracking del contenedor: la última consulta EXITOSA por gestión (la tabla es
  // un histórico; se toma la más reciente con datos). Resiliente si la tabla aún
  // no existe (pre-migración de tracking).
  try {
    const { data: tks } = await sb
      .from("tracking_consultas")
      .select("gestion_id, ubicacion, puerto_carga, puerto_descarga, eta_destino, atd_origen, vessel, ultimo_movimiento, created_at")
      .in("gestion_id", ids)
      .eq("ok", true)
      .order("created_at", { ascending: false })
    const tkMap = new Map<string, TrackingResumen>()
    for (const t of (tks as (TrackingResumen & { gestion_id: string })[]) ?? []) {
      if (!tkMap.has(t.gestion_id)) tkMap.set(t.gestion_id, t) // la primera = la más reciente
    }
    for (const g of filas) g.tracking = tkMap.get(g.id) ?? null
  } catch {
    /* tabla tracking_consultas inexistente: se ignora */
  }

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
    case "tipo_operacion": return labelTipoOperacion(g.tipo_operacion)
    case "regimen": return g.regimen_nombre ?? ""
    // Campos de flujos por tipo.
    case "etd": return g.etd ? fecha(g.etd) : ""
    case "aduana_salida": return g.aduana_salida?.nombre ?? ""
    case "fecha_vencimiento": return g.fecha_vencimiento ? fecha(g.fecha_vencimiento) : ""
    case "numero_fyduca": return g.numero_fyduca ?? ""
    case "numero_mandamiento": return g.numero_mandamiento ?? ""
    case "permiso_sepa": return g.permiso_sepa ?? ""
    case "permiso_arsa": return g.permiso_arsa ?? ""
    case "permiso_banco_central": return g.permiso_banco_central ?? ""
    case "frontera": return g.frontera_despachado == null ? "" : g.frontera_despachado ? `Sí${g.frontera_fecha ? ` (${fecha(g.frontera_fecha)})` : ""}` : "No"
    // Tracking del contenedor (última consulta a la naviera).
    case "tk_ubicacion": return g.tracking?.ubicacion ?? ""
    case "tk_puerto_carga": return g.tracking?.puerto_carga ?? ""
    case "tk_puerto_descarga": return g.tracking?.puerto_descarga ?? ""
    case "tk_eta_destino": return g.tracking?.eta_destino ? fecha(g.tracking.eta_destino) : ""
    case "tk_atd": return g.tracking?.atd_origen ? fecha(g.tracking.atd_origen) : ""
    case "tk_vessel": return g.tracking?.vessel ?? ""
    case "tk_ultimo_mov": return g.tracking?.ultimo_movimiento ? fechaHora(g.tracking.ultimo_movimiento) : ""
    case "tk_fecha_consulta": return g.tracking?.created_at ? fechaHora(g.tracking.created_at) : ""
    default: return ""
  }
}
