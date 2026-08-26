"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Encabezado de grupo colapsable (patrón de Usuarios y permisos): título + conteo
// + chevron; el contenido se expande/contrae. Reutilizable en cualquier nivel.
export function SeccionColapsable({
  titulo,
  icon,
  count,
  resumen,
  defaultOpen = true,
  children,
}: {
  titulo: string
  icon?: ReactNode
  count?: number
  resumen?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [abierta, setAbierta] = useState(defaultOpen)
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          {icon}
          <span className="truncate">{titulo}</span>
          {count != null && <Badge variant="muted">{count}</Badge>}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
          {resumen}
          <ChevronDown className={cn("size-4 transition-transform duration-200", !abierta && "-rotate-90")} />
        </span>
      </button>
      {abierta && <div className="mt-2">{children}</div>}
    </div>
  )
}
