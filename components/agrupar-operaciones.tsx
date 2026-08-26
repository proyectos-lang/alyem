"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"

// Control "Agrupar por" para la lista de operaciones (querystring `group`).
const OPCIONES = [
  { value: "", label: "Sin agrupar" },
  { value: "operador", label: "Operador" },
  { value: "cliente", label: "Cliente" },
  { value: "operador_cliente", label: "Operador y cliente" },
]

export function AgruparOperaciones() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const actual = params.get("group") ?? ""

  const ir = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set("group", value)
    else p.delete("group")
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Layers className="size-3.5" /> Agrupar por
      </span>
      {OPCIONES.map((o) => {
        const on = actual === o.value
        return (
          <button
            key={o.value || "none"}
            type="button"
            onClick={() => ir(o.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
