"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { PackageCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { marcarRecibido } from "@/lib/actions/gestiones"

export function MarcarRecibido({ gestionId }: { gestionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            try {
              await marcarRecibido(gestionId)
              router.refresh()
            } catch (e) {
              setError((e as Error).message)
            }
          })
        }
      >
        <PackageCheck /> {pending ? "Confirmando…" : "Confirmar recepción"}
      </Button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  )
}
