// Formateo de fechas y montos. Fechas se muestran en la zona de la agencia.

const TZ = "America/Tegucigalpa"

const SIMBOLO: Record<string, string> = { HNL: "L", USD: "$", EUR: "€" }

export function moneda(monto: number, mon = "HNL"): string {
  const simbolo = SIMBOLO[mon] ?? ""
  const n = new Intl.NumberFormat("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto ?? 0)
  return `${simbolo} ${n}`.trim()
}

export function fecha(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(d)
}

export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d)
}

// "hace 3 días", "hoy", etc.
export function haceCuanto(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(valor)
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (dias <= 0) return "hoy"
  if (dias === 1) return "ayer"
  return `hace ${dias} días`
}

// Días restantes hasta una fecha (para el contador de días libres).
export function diasHasta(valor: string | null | undefined): number | null {
  if (!valor) return null
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}
