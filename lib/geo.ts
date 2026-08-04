import { headers } from "next/headers"

const PRIVADA = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/i

export interface GeoInfo {
  ip: string | null
  lat: number | null
  lng: number | null
  ciudad: string | null
  pais: string | null
  userAgent: string | null
}

const num = (v: string | null) => {
  const n = v ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

// Captura IP + ubicación aproximada de la petición actual.
// En Vercel usa las cabeceras de geolocalización; si no, geolocaliza la IP
// pública vía ip-api.com. En local (IP privada) queda sin coordenadas.
export async function capturarGeo(): Promise<GeoInfo> {
  const h = await headers()
  let ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim() || null
  const userAgent = h.get("user-agent") ?? null

  // En local (IP privada/loopback) obtenemos la IP pública real vía ipify, para
  // que el registro tenga una IP significativa. En producción la IP ya es pública.
  if (!ip || PRIVADA.test(ip)) {
    try {
      const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" })
      const j = await r.json()
      if (j.ip) ip = j.ip
    } catch {
      /* sin IP pública */
    }
  }

  let lat = num(h.get("x-vercel-ip-latitude"))
  let lng = num(h.get("x-vercel-ip-longitude"))
  const ciudadV = h.get("x-vercel-ip-city")
  let ciudad = ciudadV ? decodeURIComponent(ciudadV) : null
  let pais = h.get("x-vercel-ip-country")

  if ((lat == null || lng == null) && ip && !PRIVADA.test(ip)) {
    try {
      const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`, { cache: "no-store" })
      const j = await r.json()
      if (j.status === "success") {
        lat = j.lat
        lng = j.lon
        ciudad = ciudad ?? j.city
        pais = pais ?? j.country
      }
    } catch {
      /* sin geolocalización */
    }
  }

  return { ip, lat, lng, ciudad, pais, userAgent }
}
