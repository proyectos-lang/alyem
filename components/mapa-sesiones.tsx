"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

export interface PuntoSesion {
  lat: number
  lng: number
  label: string
}

// Mapa OpenStreetMap (Leaflet) con marcadores de los inicios de sesión.
export function MapaSesiones({ puntos }: { puntos: PuntoSesion[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelado || !ref.current || mapRef.current) return

      const inicio: [number, number] = puntos[0] ? [puntos[0].lat, puntos[0].lng] : [15, -86]
      const map = L.map(ref.current, { scrollWheelZoom: false }).setView(inicio, puntos.length ? 4 : 2)
      mapRef.current = map

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#f48029;border:2px solid #fff;box-shadow:0 0 0 3px rgba(244,128,41,.35)"></span>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const coords: [number, number][] = []
      for (const p of puntos) {
        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(p.label)
        coords.push([p.lat, p.lng])
      }
      if (coords.length > 1) map.fitBounds(coords, { padding: [30, 30], maxZoom: 8 })
    })()

    return () => {
      cancelado = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [puntos])

  return <div ref={ref} className="h-[420px] w-full overflow-hidden rounded-xl border border-border" />
}
