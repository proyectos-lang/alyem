import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Cliente Supabase para el NAVEGADOR. Usa la anon key pública (nunca la service
// role). Solo se emplea para suscripciones en tiempo real (Realtime) de
// notificaciones; toda la escritura sigue pasando por el servidor.
// Devuelve null si no hay anon key configurada (degradación elegante).

export const SUPABASE_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "aylem"

let cached: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SUPABASE_SCHEMA },
  })
  return cached
}
