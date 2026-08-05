"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { correrTareasDiarias } from "@/lib/actions/tareas"

// Dispara manualmente las tareas diarias (escalamiento SLA + resumen). Admin.
export function CorrerTareasBoton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const r = await correrTareasDiarias()
            toast.success(`Tareas ejecutadas · ${r.escalados} escalamiento(s) de SLA.`)
            router.refresh()
          } catch (e) {
            toast.error((e as Error).message)
          }
        })
      }
    >
      <PlayCircle /> {pending ? "Ejecutando…" : "Correr tareas ahora"}
    </Button>
  )
}
