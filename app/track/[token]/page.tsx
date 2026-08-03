import { notFound } from "next/navigation"
import { Timeline } from "@/components/timeline"
import { EstadoChip } from "@/components/estado-chip"
import { Logo } from "@/components/logo"
import { getSupabase } from "@/lib/supabase/server"
import { getConfig } from "@/lib/config"
import { estadosActuales } from "@/lib/data/gestiones"
import { fecha } from "@/lib/format"
import type { Evento, Gestion } from "@/lib/types"

export const dynamic = "force-dynamic"

const TIPO = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" } as const

// Enlace público de seguimiento: SOLO timeline, sin datos internos, sin login.
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = getSupabase()

  const { data: g } = await sb
    .from("gestiones")
    .select("*, aduana:aduanas(nombre, codigo)")
    .eq("public_token", token)
    .maybeSingle()
  if (!g) notFound()
  const gestion = g as Gestion

  const [{ data: ev }, estados, agencia] = await Promise.all([
    sb
      .from("eventos")
      .select("*, estado:estados_catalogo(*)")
      .eq("gestion_id", gestion.id)
      .eq("interno", false)
      .order("fecha_evento", { ascending: false }),
    estadosActuales([gestion.id]),
    getConfig("agencia_nombre"),
  ])
  const eventos = (ev as Evento[]) ?? []
  const estado = estados.get(gestion.id)

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-4">
          <Logo size="md" />
          <span className="sr-only">{agencia ?? "Seguimiento aduanero"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-semibold">{gestion.referencia}</h1>
            <EstadoChip nombre={estado?.nombre} color={estado?.color} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span>{TIPO[gestion.tipo_operacion]}</span>
            {gestion.aduana && <span>{gestion.aduana.nombre}</span>}
            {gestion.naviera && <span>{gestion.naviera}</span>}
            <span>ETA {fecha(gestion.eta)}</span>
          </p>
          {gestion.descripcion_carga && (
            <p className="mt-2 text-sm text-foreground">{gestion.descripcion_carga}</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Seguimiento</h2>
          <Timeline eventos={eventos} />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Enlace de seguimiento público · No muestra montos ni documentos.
        </p>
      </main>
    </div>
  )
}
