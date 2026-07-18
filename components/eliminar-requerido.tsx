"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { X } from "lucide-react"
import { eliminarRequerido } from "@/lib/actions/documentos"

export function EliminarRequerido({ id, gestionId }: { id: string; gestionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      title="Quitar de la lista"
      onClick={() =>
        startTransition(async () => {
          await eliminarRequerido(id, gestionId)
          router.refresh()
        })
      }
      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
    >
      <X className="size-3.5" />
    </button>
  )
}
