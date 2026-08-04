"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface OpAtencion {
  id: string
  referencia: string
  empresa?: string | null
  estadoNombre: string | null
  estadoColor: string | null
  salud: "amarillo" | "rojo"
  razones: { texto: string; tono: "warning" | "danger" }[]
}

// Banner tipo carrusel: recorre cada operación que requiere atención del cliente
// y permite entrar a procesarla. Auto-avanza y se puede navegar manualmente.
export function BanerAtencion({ operaciones }: { operaciones: OpAtencion[] }) {
  const [i, setI] = useState(0)
  const pausa = useRef(false)

  const n = operaciones.length
  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => {
      if (!pausa.current) setI((prev) => (prev + 1) % n)
    }, 6000)
    return () => clearInterval(t)
  }, [n])

  if (n === 0) return null
  const idx = i % n
  const op = operaciones[idx]
  const rojo = op.salud === "rojo"

  const mover = (delta: number) => setI((prev) => (prev + delta + n) % n)

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
        rojo ? "border-destructive/40 bg-destructive/5" : "border-amber-300/60 bg-amber-500/5",
      )}
      onMouseEnter={() => (pausa.current = true)}
      onMouseLeave={() => (pausa.current = false)}
    >
      <Link href={`/g/${op.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              rojo ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600",
            )}
          >
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requiere atención</span>
              <span className="font-semibold">{op.referencia}</span>
              {op.empresa && <span className="text-sm text-muted-foreground">· {op.empresa}</span>}
              {op.estadoNombre && (
                <span className="text-sm text-muted-foreground">· {op.estadoNombre}</span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {op.razones.map((r, k) => (
                <Badge key={k} variant={r.tono === "danger" ? "danger" : "warning"}>{r.texto}</Badge>
              ))}
            </div>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
            rojo ? "bg-destructive" : "bg-amber-500",
          )}
        >
          Procesar <ArrowRight className="size-4" />
        </span>
      </Link>

      {/* Navegación del carrusel */}
      {n > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
          <div className="flex items-center gap-1.5">
            {operaciones.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Ir a la operación ${k + 1}`}
                onClick={() => setI(k)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  k === idx ? "w-5 bg-foreground/70" : "w-1.5 bg-foreground/25 hover:bg-foreground/40",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{idx + 1} / {n}</span>
            <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className="rounded-md border border-border p-1 hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className="rounded-md border border-border p-1 hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
