"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

// División por tipo de operación (importación / exportación / …). Controla el
// parámetro `tipo` de la URL, que la página aplica con filtrarGestiones.
const TABS = [
  { value: "", label: "Todas" },
  { value: "importacion", label: "Importación" },
  { value: "exportacion", label: "Exportación" },
  { value: "transito", label: "Tránsito" },
  { value: "duca_f", label: "DUCA F" },
  { value: "transito_rapido", label: "Tránsito Rápido" },
]

export function TipoOperacionTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const actual = params.get("tipo") ?? ""

  const ir = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set("tipo", value)
    else p.delete("tipo")
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {TABS.map((t) => {
        const on = actual === t.value
        return (
          <button
            key={t.value || "todas"}
            type="button"
            onClick={() => ir(t.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
