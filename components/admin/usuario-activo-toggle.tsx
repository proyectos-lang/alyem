"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleUsuarioActivo } from "@/lib/actions/admin"

export function UsuarioActivoToggle({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      title={activo ? "Desactivar" : "Activar"}
      onClick={() =>
        startTransition(async () => {
          await toggleUsuarioActivo(id, !activo)
          router.refresh()
        })
      }
    >
      <Power className={activo ? "text-emerald-600" : "text-muted-foreground"} />
    </Button>
  )
}
