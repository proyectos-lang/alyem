"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { avanzarEtapa } from "@/lib/actions/gestiones"

export function AvanzarEtapa({ gestionId, deshabilitado }: { gestionId: string; deshabilitado?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={pending || deshabilitado}
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
        {pending ? "Avanzando…" : "Avanzar etapa"} <ArrowRight />
      </Button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  )
}
