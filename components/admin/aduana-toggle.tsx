"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleAduana } from "@/lib/actions/aduanas"

export function AduanaToggle({ id, activo }: { id: string; activo: boolean }) {
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
          await toggleAduana(id, !activo)
          router.refresh()
        })
      }
    >
      <Power className={activo ? "text-emerald-600" : "text-muted-foreground"} />
    </Button>
  )
}
