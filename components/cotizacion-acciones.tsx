"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { aprobarCotizacion, rechazarCotizacion } from "@/lib/actions/cotizaciones"

export function CotizacionAcciones({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const gid = await aprobarCotizacion(id)
            if (gid) router.push(`/g/${gid}`)
            else router.refresh()
          })
        }
      >
        <Check /> Aprobar → gestión
      </Button>
      <Button
        size="xs"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await rechazarCotizacion(id)
            router.refresh()
          })
        }
      >
        <X /> Rechazar
      </Button>
    </div>
  )
}
