import { Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { fecha as fmtFecha, fechaHora } from "@/lib/format"
import type { EstadoCatalogo, Evento } from "@/lib/types"
import { cn } from "@/lib/utils"

// Stepper horizontal de trazabilidad. Renderiza las etapas del catálogo (tal cual,
// normal+final en orden) y deriva completada/en curso/pendiente del estado actual
// y los eventos. Verde ✓ completada, ámbar la actual, gris pendiente.
export function StepperTrazabilidad({
  estados,
  eventos,
  estadoActualId,
}: {
  estados: EstadoCatalogo[]
  eventos: Evento[]
  estadoActualId: string | null | undefined
}) {
  const etapas = estados
    .filter((e) => e.tipo === "normal" || e.tipo === "final")
    .sort((a, b) => a.orden - b.orden)

  // Fecha del último evento por estado.
  const fechaPorEstado = new Map<string, string>()
  for (const ev of eventos) {
    if (ev.tipo === "estado" && ev.estado_id && !fechaPorEstado.has(ev.estado_id)) {
      fechaPorEstado.set(ev.estado_id, ev.fecha_evento)
    }
  }

  const currentIndex = etapas.findIndex((e) => e.id === estadoActualId)
  const ultimoConFecha = etapas.reduce((acc, e, i) => (fechaPorEstado.has(e.id) ? i : acc), -1)
  const reached = currentIndex >= 0 ? currentIndex : ultimoConFecha
  const total = etapas.length
  const etapaNum = (reached >= 0 ? reached : 0) + 1
  const actualizado = currentIndex >= 0 ? fechaPorEstado.get(etapas[currentIndex]?.id ?? "") : undefined

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Trazabilidad de la operación</h2>
          <p className="text-xs text-muted-foreground">
            Etapa {etapaNum} de {total}
            {actualizado ? ` · actualizado ${fechaHora(actualizado)}` : ""}
          </p>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max">
            {etapas.map((e, i) => {
              const completada = currentIndex >= 0 ? i < currentIndex : i <= reached && fechaPorEstado.has(e.id)
              const enCurso = currentIndex >= 0 && i === currentIndex
              const leftDone = i <= reached
              const rightDone = i < reached
              const f = fechaPorEstado.get(e.id)

              return (
                <div key={e.id} className="flex w-28 shrink-0 flex-col items-center">
                  <div className="flex w-full items-center">
                    <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : leftDone ? "bg-emerald-500" : "bg-border")} />
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                        completada && "border-emerald-500 bg-emerald-500 text-white",
                        enCurso && "border-amber-500 bg-amber-500/10 text-amber-600",
                        !completada && !enCurso && "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {completada ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={cn("h-0.5 flex-1", i === total - 1 ? "opacity-0" : rightDone ? "bg-emerald-500" : "bg-border")} />
                  </div>
                  <p
                    className={cn(
                      "mt-2 px-1 text-center text-[11px] leading-tight",
                      enCurso ? "font-semibold text-foreground" : completada ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {e.nombre}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{f ? fmtFecha(f) : "—"}</p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
