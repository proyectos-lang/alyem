import { getSupabase } from "../supabase/server"
import type {
  Calificacion,
  Documento,
  DocumentoRequerido,
  EstadoCatalogo,
  Evento,
  Gestion,
  Liquidacion,
  Mensaje,
  Pago,
  SaldoLiquidacion,
  Usuario,
} from "../types"

const SEL_GESTION =
  "*, empresa:empresas(id, nombre), operador:usuarios!gestiones_operador_id_fkey(id, nombre)"

// Estado actual (derivado) para un conjunto de gestiones.
export interface EstadoDerivado {
  nombre: string
  color: string
  tipo: string
  estado_id: string
  fecha: string
}

export async function estadosActuales(ids: string[]) {
  const map = new Map<string, EstadoDerivado>()
  if (ids.length === 0) return map
  const sb = getSupabase()
  const { data } = await sb.from("v_gestion_estado_actual").select("*").in("gestion_id", ids)
  for (const r of (data as any[]) ?? []) {
    map.set(r.gestion_id, {
      nombre: r.estado_nombre,
      color: r.estado_color,
      tipo: r.estado_tipo,
      estado_id: r.estado_id,
      fecha: r.fecha_evento,
    })
  }
  return map
}

export interface GestionConEstado extends Gestion {
  estado?: EstadoDerivado
}

// Lista de gestiones visibles para el usuario (aislamiento por empresa si es cliente).
export async function listarGestiones(
  usuario: Pick<Usuario, "rol" | "empresa_id">,
  opts: { texto?: string; operadorId?: string } = {},
): Promise<GestionConEstado[]> {
  const sb = getSupabase()
  let q = sb.from("gestiones").select(SEL_GESTION).order("created_at", { ascending: false })

  if (usuario.rol === "cliente") {
    if (!usuario.empresa_id) return []
    q = q.eq("empresa_id", usuario.empresa_id)
  }
  if (opts.operadorId) q = q.eq("operador_id", opts.operadorId)

  if (opts.texto && opts.texto.trim()) {
    const t = `%${opts.texto.trim()}%`
    // Búsqueda por cualquier referencia: interna, del cliente, BL, contenedor, consignatario.
    q = q.or(
      [
        `referencia.ilike.${t}`,
        `referencia_cliente.ilike.${t}`,
        `bl.ilike.${t}`,
        `contenedores.ilike.${t}`,
        `consignatario.ilike.${t}`,
        `descripcion_mercancia.ilike.${t}`,
      ].join(","),
    )
  }

  const { data } = await q
  const gestiones = (data as GestionConEstado[]) ?? []
  const estados = await estadosActuales(gestiones.map((g) => g.id))
  for (const g of gestiones) g.estado = estados.get(g.id)
  return gestiones
}

// Detalle completo de una gestión (con verificación de aislamiento).
export async function getGestion(
  id: string,
  usuario: Pick<Usuario, "rol" | "empresa_id">,
): Promise<GestionConEstado | null> {
  const sb = getSupabase()
  const { data } = await sb.from("gestiones").select(SEL_GESTION).eq("id", id).maybeSingle()
  const g = data as GestionConEstado | null
  if (!g) return null
  if (usuario.rol === "cliente" && g.empresa_id !== usuario.empresa_id) return null
  const estados = await estadosActuales([g.id])
  g.estado = estados.get(g.id)
  return g
}

export async function getEventos(
  gestionId: string,
  usuario: Pick<Usuario, "rol">,
): Promise<Evento[]> {
  const sb = getSupabase()
  let q = sb
    .from("eventos")
    .select("*, estado:estados_catalogo(*), usuario:usuarios!eventos_usuario_id_fkey(id, nombre)")
    .eq("gestion_id", gestionId)
    .order("fecha_evento", { ascending: false })

  // El cliente no ve eventos internos.
  if (usuario.rol === "cliente") q = q.eq("interno", false)
  const { data } = await q
  return (data as Evento[]) ?? []
}

export async function getEstadosCatalogo(): Promise<EstadoCatalogo[]> {
  const sb = getSupabase()
  const { data } = await sb.from("estados_catalogo").select("*").eq("activo", true).order("orden")
  return (data as EstadoCatalogo[]) ?? []
}

// Saldos de una liquidación a partir de la vista + total.
export async function getSaldos(liquidacionId: string): Promise<SaldoLiquidacion | null> {
  const sb = getSupabase()
  const { data } = await sb.from("v_saldos_liquidacion").select("*").eq("liquidacion_id", liquidacionId).maybeSingle()
  if (!data) return null
  const d = data as any
  return {
    liquidacion_id: d.liquidacion_id,
    gestion_id: d.gestion_id,
    total: Number(d.total),
    pagado_verificado: Number(d.pagado_verificado),
    reportado_pendiente: Number(d.reportado_pendiente),
    saldo: Number(d.total) - Number(d.pagado_verificado),
  }
}

// Documentos, requeridos, liquidaciones, pagos, mensajes y calificación de una gestión.
export async function getDocumentos(gestionId: string): Promise<Documento[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("documentos")
    .select("*, tipo:tipos_documento(*)")
    .eq("gestion_id", gestionId)
    .order("created_at", { ascending: false })
  return (data as Documento[]) ?? []
}

export async function getRequeridos(gestionId: string): Promise<DocumentoRequerido[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("documentos_requeridos")
    .select("*, tipo:tipos_documento(*)")
    .eq("gestion_id", gestionId)
    .order("created_at")
  return (data as DocumentoRequerido[]) ?? []
}

export async function getLiquidaciones(gestionId: string): Promise<Liquidacion[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("liquidaciones")
    .select("*, lineas:liquidacion_lineas(*, concepto:conceptos_cobro(*))")
    .eq("gestion_id", gestionId)
    .order("created_at")
  return (data as Liquidacion[]) ?? []
}

export async function getPagos(gestionId: string): Promise<Pago[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("pagos")
    .select("*, aplicaciones:pago_aplicaciones(*)")
    .eq("gestion_id", gestionId)
    .order("created_at", { ascending: false })
  return (data as Pago[]) ?? []
}

export async function getMensajes(gestionId: string): Promise<Mensaje[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from("mensajes")
    .select("*, usuario:usuarios!mensajes_usuario_id_fkey(id, nombre, rol)")
    .eq("gestion_id", gestionId)
    .order("created_at")
  return (data as Mensaje[]) ?? []
}

export async function getCalificacion(gestionId: string): Promise<Calificacion | null> {
  const sb = getSupabase()
  const { data } = await sb.from("calificaciones").select("*").eq("gestion_id", gestionId).maybeSingle()
  return (data as Calificacion) ?? null
}
