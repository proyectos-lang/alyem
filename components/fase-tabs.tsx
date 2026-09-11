"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

// Sub-pestaña de fase del proceso: En proceso / Finalizadas / Todas. Controla el
// parámetro `fase` de la URL, que la página aplica con filtrarGestiones.
export function FaseTabs({ enProceso, finalizadas }: { enProceso: number; finalizadas: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const actual = params.get("fase") ?? ""

  const TABS = [
    { value: "proceso", label: "En proceso", count: enProceso },
    { value: "finalizadas", label: "Finalizadas", count: finalizadas },
    { value: "", label: "Todas", count: enProceso + finalizadas },
  ]

  const ir = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set("fase", value)
    else p.delete("fase")
    // Al cambiar de fase, un filtro de estado puntual puede quedar incoherente.
    p.delete("estado")
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {TABS.map((t) => {
        const on = actual === t.value
        return (
          <button
            key={t.value || "todas"}
            type="button"
            onClick={() => ir(t.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              on
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
