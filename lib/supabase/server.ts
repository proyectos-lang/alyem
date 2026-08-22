import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Cliente Supabase para uso EXCLUSIVO en el servidor (RSC y server actions).
// Usa el service role key: no hay RLS, el aislamiento se aplica en el código.
// No importar desde componentes cliente.

let cached: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Copia .env.example a .env.local y define " +
        "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    )
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: process.env.SUPABASE_SCHEMA ?? "aylem" },
  })
  return cached
}

export const ADJUNTOS_BUCKET = process.env.SUPABASE_BUCKET ?? "aylem"
export const LOGOS_BUCKET = process.env.SUPABASE_LOGOS_BUCKET ?? "alyem-logos"

// Devuelve una URL firmada temporal para un archivo del bucket privado.
export async function urlFirmada(path: string | null, segundos = 3600): Promise<string | null> {
  if (!path) return null
  const sb = getSupabase()
  const { data } = await sb.storage.from(ADJUNTOS_BUCKET).createSignedUrl(path, segundos)
  return data?.signedUrl ?? null
}
