// Cliente de la API de tracking de contenedores JSONCargo.
// Doc: consulta por BL (endpoint 2) → contenedores, luego detalle por contenedor
// (endpoint 1). La API EXIGE https (la doc muestra http pero responde 308).
// Cada request cuenta como 1 llamada de la cuota (BL + N contenedores).

const BASE = "https://api.jsoncargo.com/api/v1"

// Líneas navieras soportadas por la API (nombre exacto que exige el parámetro
// shipping_line). El value es lo que se envía; el label, lo que ve el usuario.
export const NAVIERAS = [
  { value: "MAERSK", label: "Maersk" },
  { value: "HAPAG_LLOYD", label: "Hapag-Lloyd" },
  { value: "HMM", label: "HMM (Hyundai)" },
  { value: "ONE", label: "ONE (Ocean Network Express)" },
  { value: "EVERGREEN", label: "Evergreen" },
  { value: "MSC", label: "MSC" },
  { value: "CMA_CGM", label: "CMA CGM" },
  { value: "COSCO", label: "COSCO" },
  { value: "ZIM", label: "ZIM" },
  { value: "YANG_MING", label: "Yang Ming" },
  { value: "PIL", label: "PIL" },
] as const

export type LineaNaviera = (typeof NAVIERAS)[number]["value"]

// Prefijos de contenedor/BL frecuentes por naviera (primeras 4 letras del BL o
// contenedor). Ayuda a deducir la línea desde el propio número de BL.
const PREFIJOS: Record<string, LineaNaviera> = {
  MAEU: "MAERSK", MRKU: "MAERSK", MSKU: "MAERSK", MRSU: "MAERSK",
  HLCU: "HAPAG_LLOYD", HLXU: "HAPAG_LLOYD",
  HDMU: "HMM", HMMU: "HMM",
  ONEY: "ONE", ONEU: "ONE",
  EGLV: "EVERGREEN", EISU: "EVERGREEN", EMCU: "EVERGREEN",
  MEDU: "MSC", MSCU: "MSC", MSDU: "MSC",
  CMAU: "CMA_CGM", CGMU: "CMA_CGM", CXDU: "CMA_CGM",
  COSU: "COSCO", CBHU: "COSCO", CCLU: "COSCO",
  ZIMU: "ZIM", ZMOU: "ZIM",
  YMLU: "YANG_MING", YMMU: "YANG_MING",
  PCIU: "PIL", PILU: "PIL",
}

// Palabras clave del texto libre del campo "naviera" de la operación → línea API.
const ALIAS: { re: RegExp; linea: LineaNaviera }[] = [
  { re: /maersk|sealand|safmarine/i, linea: "MAERSK" },
  { re: /hapag|lloyd/i, linea: "HAPAG_LLOYD" },
  { re: /\bhmm\b|hyundai/i, linea: "HMM" },
  { re: /\bone\b|ocean network/i, linea: "ONE" },
  { re: /evergreen/i, linea: "EVERGREEN" },
  { re: /\bmsc\b|mediterranean/i, linea: "MSC" },
  { re: /cma|cgm/i, linea: "CMA_CGM" },
  { re: /cosco/i, linea: "COSCO" },
  { re: /\bzim\b/i, linea: "ZIM" },
  { re: /yang\s*ming|yangming/i, linea: "YANG_MING" },
  { re: /\bpil\b|pacific international/i, linea: "PIL" },
]

// Deduce la línea naviera a partir del texto de la naviera y/o del BL.
// Devuelve null si no hay coincidencia clara (el usuario deberá elegirla).
export function deducirNaviera(naviera?: string | null, bl?: string | null): LineaNaviera | null {
  const pref = (bl ?? "").trim().slice(0, 4).toUpperCase()
  if (pref && PREFIJOS[pref]) return PREFIJOS[pref]
  const txt = (naviera ?? "").trim()
  if (txt) {
    for (const a of ALIAS) if (a.re.test(txt)) return a.linea
  }
  return null
}

export function esLineaValida(v: string): v is LineaNaviera {
  return NAVIERAS.some((n) => n.value === v)
}

export function etiquetaNaviera(v?: string | null): string {
  return NAVIERAS.find((n) => n.value === v)?.label ?? v ?? "—"
}

// --- Tipos de la respuesta de la API (campos que usamos; todo puede ser null) ---
export interface BolResponse {
  bill_of_lading: string
  shipping_line_name?: string
  shipping_line_id?: string
  associated_containers?: number
  associated_container_numbers?: string[]
  last_updated?: string
}

export interface ContainerResponse {
  container_id: string
  container_type?: string | null
  container_status?: string | null
  shipping_line_name?: string | null
  tare?: string | number | null
  shipped_from?: string | null
  shipped_from_terminal?: string | null
  shipped_to?: string | null
  shipped_to_terminal?: string | null
  atd_origin?: string | null
  eta_final_destination?: string | null
  last_location?: string | null
  last_location_terminal?: string | null
  next_location?: string | null
  next_location_terminal?: string | null
  atd_last_location?: string | null
  eta_next_destination?: string | null
  timestamp_of_last_location?: string | null
  last_movement_timestamp?: string | null
  loading_port?: string | null
  discharging_port?: string | null
  customs_clearance?: string | null
  bill_of_lading?: string | null
  last_vessel_name?: string | null
  last_voyage_number?: string | null
  current_vessel_name?: string | null
  current_voyage_number?: string | null
  last_updated?: string | null
}

export class TrackingError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

function apiKey(): string {
  const k = process.env.JSONCARGO_API_KEY
  if (!k) throw new TrackingError("Falta la variable de entorno JSONCARGO_API_KEY.")
  return k
}

async function pedir<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "x-api-key": apiKey() },
      // La respuesta de la API cambia con el tiempo: nunca cachear.
      cache: "no-store",
    })
  } catch (e) {
    throw new TrackingError(`No se pudo contactar la API de tracking: ${(e as Error).message}`)
  }
  if (res.status === 404) throw new TrackingError("BL o contenedor no encontrado en la naviera indicada.", 404)
  if (res.status === 429) throw new TrackingError("Se alcanzó el límite de consultas del plan (429).", 429)
  if (!res.ok) throw new TrackingError(`La API respondió ${res.status}.`, res.status)
  const json = (await res.json()) as { data?: T; error?: { title?: string } }
  if (json.error) throw new TrackingError(json.error.title ?? "Error de la API de tracking.")
  if (!json.data) throw new TrackingError("La API no devolvió datos.")
  return json.data
}

// Endpoint 2: contenedores asociados a un BL. Cuesta 1 llamada.
export function consultarBol(bl: string, linea: LineaNaviera): Promise<BolResponse> {
  const q = `?shipping_line=${encodeURIComponent(linea)}`
  return pedir<BolResponse>(`/containers/bol/${encodeURIComponent(bl)}${q}`)
}

// Endpoint 1: detalle de un contenedor. Cuesta 1 llamada.
export function consultarContenedor(numero: string, linea: LineaNaviera): Promise<ContainerResponse> {
  const q = `?shipping_line=${encodeURIComponent(linea)}`
  return pedir<ContainerResponse>(`/containers/${encodeURIComponent(numero)}${q}`)
}

// Saldo de la cuota (endpoint 10). NO gasta llamadas de tracking.
export interface ApiStats { plan: string; requests_total: number; requests_made: number; requests_available: number }
export function consultarStats(): Promise<ApiStats> {
  return pedir<ApiStats>(`/api_key/stats`)
}
