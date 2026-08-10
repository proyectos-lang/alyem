"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowRight, TriangleAlert, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { avanzarEtapa } from "@/lib/actions/gestiones"

// Botón para avanzar a la siguiente etapa desde la tarjeta de la etapa actual.
// Se pone VERDE cuando la etapa está totalmente diligenciada; si falta algún
// campo, se deshabilita y muestra una alerta indicando cuál(es).
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

  const completo = faltantes.length === 0

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      {!completo && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Falta diligenciar para avanzar: <strong>{faltantes.map((f) => f.label).join(", ")}</strong>.
          </span>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        {error && <span className="text-[11px] text-destructive">{error}</span>}
        {completo && <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Etapa diligenciada</span>}
        <Button
          size="sm"
          disabled={pending || !completo}
          className={completo ? "bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-600 dark:hover:bg-emerald-600/80" : undefined}
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
          {completo && <Check />}
          {pending ? "Avanzando…" : "Avanzar a la siguiente etapa"} <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
