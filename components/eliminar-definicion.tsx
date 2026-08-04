"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { eliminarDefinicion } from "@/lib/actions/reportes"

export function EliminarDefinicion({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      title="Eliminar definición"
      onClick={() =>
        startTransition(async () => {
          await eliminarDefinicion(id)
          router.refresh()
        })
      }
    >
      <Trash2 />
    </Button>
  )
}
