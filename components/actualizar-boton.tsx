"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

// Refresca los datos del servidor (Server Components) sin recargar toda la
// página. Disponible en la barra superior, así cubre todas las vistas.
export function ActualizarBoton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const actualizar = () => startTransition(() => router.refresh())

  return (
    <button
      type="button"
      onClick={actualizar}
      disabled={pending}
      title="Actualizar datos"
      aria-label="Actualizar datos"
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60 print:hidden"
    >
      <RefreshCw className={cn("size-4.5", pending && "animate-spin")} />
    </button>
  )
}
