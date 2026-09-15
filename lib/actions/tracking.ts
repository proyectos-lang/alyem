"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { esAgencia } from "../permisos"
import { empresasVisibles } from "../data/asignaciones"
import {
  consultarBol, consultarContenedor, esLineaValida, deducirNaviera, consultarStats,
  type ContainerResponse, type LineaNaviera, TrackingError,
} from "../tracking/jsoncargo"

export interface ConsultaTracking {
  id: string
  bl: string
  shipping_line: string | null
  ok: boolean
  error: string | null
  llamadas: number
  payload: unknown
  contenedores: number | null
  estado: string | null
  ubicacion: string | null
  proximo_destino: string | null
  puerto_carga: string | null
  puerto_descarga: string | null
  origen: string | null
  destino: string | null
  vessel: string | null
  atd_origen: string | null
  eta_destino: string | null
  ultimo_movimiento: string | null
  api_last_updated: string | null
  created_at: string
}

// Contraseña operativa para autorizar el gasto de llamadas (además del rol).
// Se lee de entorno (TRACKING_PASSWORD); si no está definida, ninguna consulta
// se autoriza (nunca se hardcodea la contraseña en el código fuente).
function passwordOk(entrada: string): boolean {
  const esperada = process.env.TRACKING_PASSWORD
  if (!esperada) return false
  return entrada === esperada
}

// Fecha "YYYY-MM-DD HH:MM" de la API → ISO, o null.
function fechaApi(v?: string | null): string | null {
  if (!v) return null
  const d = new Date(v.replace(" ", "T") + "Z")
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// Devuelve el histórico de consultas de una operación (más reciente primero).
// Solo lectura: no gasta llamadas. Respeta el alcance del usuario.
export async function historialTracking(gestionId: string): Promise<ConsultaTracking[]> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return []
  const sb = getSupabase()
  // Anti-bypass: la operación debe estar en el alcance del usuario.
  const { data: g } = await sb.from("gestiones").select("empresa_id").eq("id", gestionId).maybeSingle()
  if (!g) return []
  const vis = await empresasVisibles(usuario)
  if (vis && !vis.includes((g as { empresa_id: string }).empresa_id)) return []
  const { data } = await sb
    .from("tracking_consultas")
    .select("*")
    .eq("gestion_id", gestionId)
    .order("created_at", { ascending: false })
  return (data as ConsultaTracking[]) ?? []
}

export type ResultadoConsulta =
  | { ok: true; consulta: ConsultaTracking }
  | { ok: false; error: string }

// Dispara una consulta NUEVA a la API (gasta llamadas) y la guarda en el histórico.
// Requiere rol de agencia + contraseña operativa. La naviera puede venir explícita
// (del selector) o deducirse del BL/naviera de la operación.
export async function consultarTracking(
  gestionId: string,
  password: string,
  lineaElegida?: string,
): Promise<ResultadoConsulta> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return { ok: false, error: "Sesión no válida." }
  if (!esAgencia(usuario.rol)) return { ok: false, error: "Solo la agencia puede consultar el tracking." }
  if (!process.env.TRACKING_PASSWORD) {
    return { ok: false, error: "El tracking no está configurado (falta TRACKING_PASSWORD en el servidor)." }
  }
  if (!passwordOk(password)) return { ok: false, error: "Contraseña de consulta incorrecta." }

  const sb = getSupabase()
  const { data: g } = await sb
    .from("gestiones")
    .select("empresa_id, carta_porte, naviera")
    .eq("id", gestionId)
    .maybeSingle()
  if (!g) return { ok: false, error: "Operación no encontrada." }

  // Anti-bypass: la operación debe estar en el alcance del usuario.
  const vis = await empresasVisibles(usuario)
  if (vis && !vis.includes((g as { empresa_id: string }).empresa_id)) {
    return { ok: false, error: "No tienes acceso a esta operación." }
  }

  const bl = ((g as { carta_porte?: string }).carta_porte ?? "").trim()
  if (!bl) return { ok: false, error: "La operación no tiene BL registrado para consultar." }

  // Línea naviera: la elegida (validada) o deducida del BL/naviera.
  let linea: LineaNaviera | null = null
  if (lineaElegida && esLineaValida(lineaElegida)) linea = lineaElegida
  else linea = deducirNaviera((g as { naviera?: string }).naviera, bl)
  if (!linea) {
    return { ok: false, error: "No se pudo determinar la naviera. Selecciónala e inténtalo de nuevo." }
  }

  let llamadas = 0
  try {
    // 1) BL → lista de contenedores.
    const bol = await consultarBol(bl, linea)
    llamadas += 1
    const numeros = bol.associated_container_numbers ?? []

    // 2) Detalle de cada contenedor.
    const detalles: ContainerResponse[] = []
    for (const n of numeros) {
      detalles.push(await consultarContenedor(n, linea))
      llamadas += 1
    }

    const primero = detalles[0]
    const payload = { bol, contenedores: detalles }
    const fila = {
      gestion_id: gestionId,
      bl,
      shipping_line: linea,
      consultado_por: usuario.id,
      ok: true,
      error: null,
      llamadas,
      payload,
      contenedores: bol.associated_containers ?? numeros.length,
      estado: primero?.container_status ?? null,
      ubicacion: primero?.last_location ?? null,
      proximo_destino: primero?.next_location ?? null,
      puerto_carga: primero?.loading_port ?? null,
      puerto_descarga: primero?.discharging_port ?? null,
      origen: primero?.shipped_from ?? null,
      destino: primero?.shipped_to ?? null,
      vessel: primero?.current_vessel_name ?? primero?.last_vessel_name ?? null,
      atd_origen: fechaApi(primero?.atd_origin),
      eta_destino: fechaApi(primero?.eta_final_destination),
      ultimo_movimiento: fechaApi(primero?.last_movement_timestamp),
      api_last_updated: primero?.last_updated ?? bol.last_updated ?? null,
    }
    const { data: ins, error } = await sb.from("tracking_consultas").insert(fila).select("*").single()
    if (error) return { ok: false, error: `No se pudo guardar la consulta: ${error.message}` }
    invalidarSaldo() // se gastaron llamadas: el próximo saldo se refresca
    revalidatePath(`/g/${gestionId}`)
    return { ok: true, consulta: ins as ConsultaTracking }
  } catch (e) {
    const msg = e instanceof TrackingError ? e.message : (e as Error).message
    // Registra el intento fallido (con las llamadas ya gastadas) para trazabilidad.
    await sb.from("tracking_consultas").insert({
      gestion_id: gestionId, bl, shipping_line: linea, consultado_por: usuario.id,
      ok: false, error: msg, llamadas,
    })
    if (llamadas > 0) invalidarSaldo() // se gastaron llamadas antes de fallar
    revalidatePath(`/g/${gestionId}`)
    return { ok: false, error: msg }
  }
}

export interface SaldoTracking {
  plan: string
  total: number
  usadas: number
  disponibles: number
}

export type ResultadoSaldo =
  | { ok: true; saldo: SaldoTracking }
  | { ok: false; error: string }

// Caché en memoria del saldo: el endpoint de stats no gasta cuota, pero se
// consulta al abrir el modal, así que evitamos llamadas repetidas seguidas.
let saldoCache: { valor: SaldoTracking; ts: number } | null = null
const SALDO_TTL_MS = 5 * 60 * 1000

// Descarta el saldo cacheado (tras gastar llamadas) para forzar su relectura.
function invalidarSaldo() {
  saldoCache = null
}

// Saldo de consultas del plan (endpoint de stats; NO gasta cuota de tracking).
// Solo para la agencia. Cacheado 5 minutos; forzar=true lo refresca.
export async function saldoTracking(forzar = false): Promise<ResultadoSaldo> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return { ok: false, error: "Sesión no válida." }
  if (!esAgencia(usuario.rol)) return { ok: false, error: "Solo la agencia puede ver el saldo." }
  if (!process.env.JSONCARGO_API_KEY) {
    return { ok: false, error: "El tracking no está configurado (falta JSONCARGO_API_KEY en el servidor)." }
  }
  if (!forzar && saldoCache && Date.now() - saldoCache.ts < SALDO_TTL_MS) {
    return { ok: true, saldo: saldoCache.valor }
  }
  try {
    const s = await consultarStats()
    const saldo: SaldoTracking = {
      plan: s.plan,
      total: s.requests_total,
      usadas: s.requests_made,
      disponibles: s.requests_available,
    }
    saldoCache = { valor: saldo, ts: Date.now() }
    return { ok: true, saldo }
  } catch (e) {
    const msg = e instanceof TrackingError ? e.message : (e as Error).message
    return { ok: false, error: msg }
  }
}
