"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowRight, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { avanzarEtapa } from "@/lib/actions/gestiones"

// Botón para avanzar a la siguiente etapa desde la pestaña del proceso.
// Solo se habilita si la etapa actual está diligenciada; si falta algún campo,
// muestra una alerta indicando cuál(es).
export function AvanzarEtapaPaso({
  gestionId,
  faltantes,
  puedeAvanzar,
}: {
  gestionId: string
  faltantes: { name: string; label: string }[]
  puedeAvanzar: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!puedeAvanzar) return null

  const incompleto = faltantes.length > 0

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      {incompleto && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Falta diligenciar para avanzar: <strong>{faltantes.map((f) => f.label).join(", ")}</strong>.
          </span>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        {error && <span className="text-[11px] text-destructive">{error}</span>}
        <Button
          size="sm"
          disabled={pending || incompleto}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              try {
                await avanzarEtapa(gestionId)
                router.refresh()
              } catch (e) {
                setError((e as Error).message)
              }
            })
          }
        >
          {pending ? "Avanzando…" : "Avanzar a la siguiente etapa"} <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
