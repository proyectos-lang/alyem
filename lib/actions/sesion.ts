"use server"

import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Guarda la ubicación PRECISA (permiso del navegador) en el último inicio de
// sesión del usuario y en su perfil. Hace reverse-geocoding con OpenStreetMap
// (Nominatim) para obtener ciudad/país. Resiliente si algo falla.
export async function guardarUbicacionSesion(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
  const usuario = await getUsuarioActivo()
  if (!usuario) return

  let ciudad: string | null = null
  let pais: string | null = null
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
      headers: { "User-Agent": "AlyemCustoms/1.0 (auditoria)" },
      cache: "no-store",
    })
    const j = await r.json()
    const a = j?.address ?? {}
    ciudad = a.city ?? a.town ?? a.village ?? a.county ?? null
    pais = a.country ?? null
  } catch {
    /* sin reverse geocoding */
  }

  try {
    const sb = getSupabase()
    await sb
      .from("usuarios")
      .update({ ultima_lat: lat, ultima_lng: lng, ultima_ciudad: ciudad, ultima_pais: pais })
      .eq("id", usuario.id)

    const { data: ultima } = await sb
      .from("auditoria_sesiones")
      .select("id")
      .eq("usuario_id", usuario.id)
      .order("creado", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (ultima) {
      const sid = (ultima as { id: number }).id
      await sb.from("auditoria_sesiones").update({ lat, lng, ciudad, pais }).eq("id", sid)
      try {
        await sb.from("auditoria_sesiones").update({ precisa: true }).eq("id", sid)
      } catch {
        /* columna `precisa` inexistente aún */
      }
    }
  } catch {
    /* columnas/tabla inexistentes */
  }
}
